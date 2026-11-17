"""Stage 1 trial: apply the draft verdict and "badly disrupted" rules
(SPEC.md §7, answers 4, 5 and 9) to real live-board data for a few
journeys. Not part of the app. (The service refuses Python's default
User-Agent with 403, so one is set.) Needs the Live Departure Board key, sent in
the x-apikey header (here it is added by the cloud session's proxy).

Usage: python3 scripts/try-rules.py RDG:PAD PAD:RDG ...
"""
import json, sys, urllib.request, datetime

BASE = "https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120"

def get(path):
    req = urllib.request.Request(f"{BASE}/{path}", headers={"x-apikey": "proxy-injected", "User-Agent": "trainchecker-trial"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)

def mins(t):
    h, m = map(int, t.split(":"))
    return h * 60 + m

def late_by(sched, actual, now_m=None):
    """Minutes late, from a scheduled 'HH:MM' and 'On time'/'HH:MM'/other."""
    if actual in (None, "", "On time"):
        return 0 if actual == "On time" else None
    if ":" not in actual:
        return None  # "Delayed", "Cancelled" etc.
    d = mins(actual) - mins(sched)
    if d < -600: d += 1440   # past midnight
    if d > 600: d -= 1440
    return d

def services(origin, dest, offset, window):
    d = get(f"GetDepBoardWithDetails/{origin}?numRows=150&filterCrs={dest}&filterType=to"
            f"&timeOffset={offset}&timeWindow={window}")
    out = []
    for s in d.get("trainServices") or []:
        cps = [c for g in (s.get("subsequentCallingPoints") or []) for c in g.get("callingPoint", [])]
        p = next((c for c in cps if c.get("crs") == dest), {})
        out.append({
            "std": s["std"], "etd": s.get("etd"), "op": s.get("operator"),
            "platform": s.get("platform"), "cancelled": bool(s.get("isCancelled")),
            "reason": s.get("cancelReason") or s.get("delayReason"),
            "sta": p.get("st"), "eta": p.get("et"), "ata": p.get("at"),
        })
    return d.get("locationName"), d.get("filterLocationName"), out

def run(origin, dest):
    seen = {}
    for off, win in [(-120, 60), (-60, 60), (0, 60), (60, 60), (119, 120)]:
        a, b, ss = services(origin, dest, off, win)
        for s in ss:
            seen[(s["std"], s["op"], s["sta"])] = s
    allsv = sorted(seen.values(), key=lambda s: mins(s["std"]))
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(0)))  # GMT in November
    now_m = now.hour * 60 + now.minute
    rel = lambda s: (mins(s["std"]) - now_m + 720) % 1440 - 720
    past = [s for s in allsv if rel(s) < 0]
    ahead = [s for s in allsv if 0 <= rel(s) <= 240]

    # Last two hours: arrivals within 3 minutes.
    arrived = [s for s in past if s["ata"] and s["sta"]]
    lates = [(s, late_by(s["sta"], s["ata"])) for s in arrived]
    within3 = sum(1 for _, d in lates if d is not None and d <= 3)
    worst = max(lates, key=lambda x: x[1] or 0) if lates else None
    past_cancelled = [s for s in past if s["cancelled"]]

    # Next four hours.
    canc = [s for s in ahead if s["cancelled"]]
    delayed = [(s, late_by(s["std"], s["etd"])) for s in ahead if not s["cancelled"]]
    late5 = [(s, d) for s, d in delayed if d is not None and d > 5]
    unknown = [s for s, d in delayed if d is None]

    # Badly disrupted (answer 9).
    next3 = ahead[:3]
    two_of_three = sum(1 for s in next3 if s["cancelled"]) >= 2
    sched_first = next((s for s in ahead if s["sta"]), None)
    running = [s for s in ahead if not s["cancelled"] and s["sta"]]
    def from_now(t):
        # Minutes after now, so times after midnight sort after evening ones.
        return (mins(t) - now_m) % 1440
    def exp_arr(s):
        e = s["eta"] or s["ata"]
        if e in (None, "On time"): return from_now(s["sta"])
        return from_now(e) if ":" in e else None
    best = min((exp_arr(s) for s in running if exp_arr(s) is not None), default=None)
    # Signed difference, wrapped to -12h..+12h; an earlier late train that
    # still beats the next scheduled arrival gives a negative gap: not late.
    gap = (best - from_now(sched_first["sta"])) if (best is not None and sched_first) else None
    if gap is not None and gap < 0:
        gap = 0
    no_trains = bool(ahead) and not running
    badly = two_of_three or (gap is not None and gap >= 45) or no_trains

    if badly or len(canc) >= 3:
        verdict = "Be prepared"
    elif canc or late5 or unknown:
        verdict = "It's a mixed bag"
    else:
        verdict = "Good news"

    print(f"\n## {a} to {b} ({origin}–{dest}), checked {now:%H:%M} GMT")
    print(f"- Next four hours: {len(ahead)} trains; {len(canc)} cancelled; "
          f"{len(late5)} expected more than 5 minutes late; {len(unknown)} 'Delayed' with no time.")
    for s, d in late5[:5]:
        print(f"  - {s['std']} {s['op']}: expected {s['etd']} ({d} min late){' – ' + s['reason'] if s['reason'] else ''}")
    for s in canc[:5]:
        print(f"  - {s['std']} {s['op']}: cancelled{' – ' + s['reason'] if s['reason'] else ''}")
    plats = {}
    for s in ahead:
        if s["platform"]: plats[s["platform"]] = plats.get(s["platform"], 0) + 1
    print(f"- Platforms known so far: {dict(sorted(plats.items(), key=lambda x: -x[1]))} "
          f"({sum(plats.values())} of {len(ahead)} trains)")
    if worst:
        print(f"- Last two hours: {within3} of {len(arrived)} arrivals within 3 minutes; "
              f"worst {worst[0]['std']} ({worst[1]} min late); {len(past_cancelled)} cancelled.")
    print(f"- Badly disrupted? two of next three cancelled: {two_of_three}; "
          f"turn up now and arrive {gap} min after the timetable: {gap is not None and gap >= 45}; "
          f"no trains running: {no_trains} → {badly}")
    print(f"- Draft verdict: {verdict}")

if __name__ == "__main__":
    for pair in sys.argv[1:]:
        o, d = pair.split(":")
        try:
            run(o, d)
        except Exception as e:
            print(f"\n## {o}–{d}: failed ({e})")
