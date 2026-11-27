"""The table behind "Station exits" (November 22nd 2026): one entry per station, from the station
maps read by eye where we have them, otherwise from OpenStreetMap (exits.py).

  python3 -I build_exits_table.py exits.json strict-dir out.json platform-links.json

exits.json: exits.py's national run. strict-dir: the station maps' readings in the strict shape
(maps-strict-*.json: exits with names and the platforms they're by, each platform's ways to them,
a kind), and exit-names.json beside exits.json (name_exits.py: exits named by what's near them,
which take the place of a street name). Out: {CRS: {"x": [[name, [platforms, nearest first], building?, near]], "p": {platform: [[exit, via, down]]},
"k": kind, "h": {exit: hours}, "m": 1 if from a station map}}, where via is l (level), b
(footbridge), s (subway), x (level crossing), c (concourse) or u (up or down), and down is the
platform a walk over a footbridge or through a subway comes down by, where known; near:
for an exit by no platform, the platform people usually come down by on the way to it.

Derived partly from OpenStreetMap, so under the Open Database Licence (© OpenStreetMap
contributors)."""
import sys, json, glob, os

ROADWORDS = {'unclassified', 'track', 'primary', 'secondary', 'tertiary', 'residential', 'service', 'living_street',
             'trunk', 'road', 'primary_link', 'secondary_link', 'tertiary_link', 'trunk_link', 'motorway', 'None'}
VIA = {'level': 'l', 'bridge': 'b', 'subway': 's', 'across the tracks': 'x', 'over or under': 'u'}
# Unresolved after reading their maps (John, November 22nd 2026: the cautious approach): no section.
SKIP = {'KIH', 'LTT', 'MIS', 'GNB', 'HLR', 'ENC', 'SWN', 'BDG', 'GNH', 'HMC', 'BUO', 'MTN', 'BMN', 'GRP', 'NEH',
        'EBT', 'CSB'}
num = lambda s: (int(''.join(c for c in s if c.isdigit()) or 999), s)


def from_osm(r, labels=None):
    xs = []
    near = {}
    for pl, routes in r['platforms'].items():
        for i, d, how, down in routes:
            near.setdefault(i, {})[pl] = min(d, near.get(i, {}).get(pl, 1e9))
    for k, e in enumerate(r['exits']):
        names = [n for n in e['street'] if n not in ROADWORDS]
        if labels and str(k) in labels:          # named by what's near it (name_exits.py)
            names = [labels[str(k)]]
        by = sorted(e['by'], key=lambda pl: (near.get(k, {}).get(pl, 1e9), num(pl)))
        xs.append([names[0] if names else None, by, 1 if e.get('building') else 0])
    p = {}
    dist = {}
    for pl, routes in r['platforms'].items():
        out = []
        for i, d, how, down in routes:
            v = VIA.get(how[0], 'u')
            if v == 'x':          # a path meeting a track may be a barrow crossing: never say it
                continue
            if not out:
                dist[pl] = d       # how far the nearest way out is, in metres along the map's paths
            out.append([i, v, down if v in 'bs' else None])
        if out:
            p[pl] = out
    used = sorted({i for v in p.values() for i, _, _ in v} | {i for i, e in enumerate(xs) if e[1]})
    if not used:
        return None
    # Renumber, keeping only exits someone can reach.
    new = {i: k for k, i in enumerate(used)}
    xs = [xs[i] for i in used]
    p = {pl: [[new[i], v, d] for i, v, d in rs if i in new] for pl, rs in p.items()}
    kind = 'by' if any(e[1] for e in xs) else 'mixed'
    out = {'x': xs, 'p': p, 'k': kind}
    # An unnamed exit by no platform: the platform it's nearest on foot, so it can be called "the entrance
    # nearest platform 2" rather than "the other entrance" (John, November 24th 2026).
    nw = {}
    for old_i, k in new.items():
        if xs[k][0] is None and not xs[k][1] and old_i in near:
            nw[str(k)] = min(near[old_i].items(), key=lambda kv: (kv[1], num(kv[0])))[0]
    if nw:
        out['nw'] = nw
    out['_d'] = {pl: dd for pl, dd in dist.items() if pl in p}
    return out


def downs(hand, osm, groups):
    """A footbridge or subway's way down from the map data, for a station read from its map: the
    OpenStreetMap walk from the same platform, the same way, that comes down on the level with the
    exit's platforms (Reading: the bridge comes down by platform 7, level with 1 for Station Hill);
    for an exit by no platform, one that comes down away from every other exit's platforms (Reading's
    car park, by platform 15)."""
    if not osm:
        return
    level = {}
    for g in groups:
        flat = [p for isl in g for p in isl]
        for p in flat:
            level[p] = set(flat)
    lv = lambda ps: set().union(*(level.get(p, {p}) for p in ps)) if ps else set()
    others = lambda i: lv([p for k, x in enumerate(hand['x']) if k != i for p in x[1]])
    for pl, rs in hand['p'].items():
        for r in rs:
            if r[1] not in 'bs' or r[2]:      # John's own reading says where already
                continue
            by = hand['x'][r[0]][1]
            for i, d, how, down in osm['platforms'].get(pl, []):
                if VIA.get(how[0]) != r[1] or not down:
                    continue
                if (by and down in lv(by)) or (not by and down not in others(r[0])):
                    r[2] = down
                    break


def merge_twins(e):
    """Two exits with the same name by the same platform (or both by none) are one exit drawn twice on the
    map (Abergavenny's two Station Roads, both by platform 1: "turn either way: to Station Road, or to
    Station Road"). Keep the first; its platforms gain the other's; routes to the other point at it, once.
    Same-named exits by different platforms stay apart, and the sentences say which platform each is by."""
    keep, into = [], {}
    for k, x in enumerate(e['x']):
        anchor = (x[1][0] if x[1] else x[3])
        twin = next((j for j in keep if x[0] and e['x'][j][0] == x[0] and (e['x'][j][1][0] if e['x'][j][1] else e['x'][j][3]) == anchor), None)
        if twin is None:
            into[k] = len(keep); keep.append(k)
        else:
            into[k] = into[twin]
            for pl in x[1]:
                if pl not in e['x'][twin][1]:
                    e['x'][twin][1].append(pl)
    if len(keep) == len(e['x']):
        return
    e['x'] = [e['x'][k] for k in keep]
    for pl, rs in e['p'].items():
        seen, new = set(), []
        for r in rs:
            r[0] = into[r[0]]
            if r[0] not in seen:
                seen.add(r[0]); new.append(r)
        e['p'][pl] = new
    for key in ('h', 'nw'):
        if e.get(key):
            e[key] = {str(into[int(k)]): v for k, v in e[key].items()}


def main():
    osm = json.load(open(sys.argv[1]))
    # Exits named by what's near them ("the town centre exit"), from name_exits.py, beside exits.json.
    nf = os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), 'exit-names.json')
    near = json.load(open(nf)) if os.path.exists(nf) else {}
    links = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else {}
    updown = json.load(open(os.path.join(sys.argv[2], 'u-directions.json')))
    hand = {}
    for f in sorted(glob.glob(os.path.join(sys.argv[2], 'maps-strict-*.json'))):
        hand.update(json.load(open(f)))
    # John's own corrections (exits-overrides.json beside this script). A station's "reading" is his
    # corrected version of the station map's reading, in the same shape (Reading, November 24th 2026).
    ov = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exits-overrides.json')))
    hand.update({c: o['reading'] for c, o in ov.items() if not c.startswith('_') and 'reading' in o})
    out = {}
    for crs in sorted(set(osm) | set(hand)):
        if crs in SKIP or hand.get(crs, {}).get('skip'):
            continue
        if crs in hand:
            h = hand[crs]
            e = {'x': [[x['name'], x['by'], 1 if x.get('building') else 0] for x in h['exits']],
                 'p': {pl: [[r[0], r[1], r[2] if len(r) > 2 else None] for r in rs if 0 <= r[0] < len(h['exits'])] for pl, rs in h['platforms'].items()},
                 'k': h['kind'], 'm': 1}
            if h.get('hours'):
                e['h'] = h['hours']
            downs(e, osm.get(crs), links.get(crs, {}).get('g', []))
        else:
            e = from_osm(osm[crs], near.get(crs))
            if not e:
                continue
        # An exit by no platform: the platform people come down by on the way to it, if any.
        for k, x in enumerate(e['x']):
            if not x[1]:
                ds = [w[2] for rs in e['p'].values() for w in rs if w[0] == k and w[2]]
                x.append(min(set(ds), key=lambda d: (-ds.count(d), num(d))) if ds else None)  # ties: the lower platform
            else:
                x.append(None)
        # Up or down for the station maps' 'u' routes (u-directions.json, from the readers' notes).
        for pl, rs in e['p'].items():
            d = updown.get(crs, {})
            for r in rs:
                if r[1] == 'u' and (pl in d or '*' in d):
                    r[2] = d.get(pl, d.get('*'))
        merge_twins(e)
        out[crs] = e
    # The rest of John's corrections, applied last.
    for crs, o in ov.items():
        if crs.startswith('_'):
            continue
        e = out[crs]
        names = [x[0] for x in e['x']]
        for old, new in o.get('names', {}).items():
            e['x'][names.index(old)][0] = new      # a name that isn't there stops the build
        for old, words in o.get('here', {}).items():
            e.setdefault('here', {})[str(names.index(old))] = words
        if o.get('bridge'):
            e['w'] = o['bridge']
        for x in o.get('add_exits', []):
            e['x'].append([x.get('name'), x['by'], 0, None])
            names.append(x.get('name'))
        if o.get('level_crossing'):
            e['lc'] = 1
        if o.get('say'):
            e['say'] = o['say']
        if o.get('line'):
            e['sl'] = o['line']
        if o.get('mention_other'):
            e['other'] = 1
        for old, ps in o.get('by', {}).items():
            e['x'][names.index(old)][1] = ps
        # Exits people come out of but wouldn't go in by (Reading's Apex Plaza): never offered as a way in.
        for name in o.get('exit_only', []):
            e.setdefault('eo', []).append(names.index(name))
        # Routes the strict reading lost, from the by-eye readings' notes (maps-read-*.json): an exit reached the
        # same way from every platform (New Street's Navigation Street footbridge; Liverpool Street's balcony exits).
        for name, via in o.get('add_routes', {}).items():
            k = names.index(name)
            for rs in e['p'].values():
                if not any(r[0] == k for r in rs):
                    rs.append([k, via, None])
        # An exit reached exactly as its neighbour is, from the station map (Nottingham's step-free Station Street
        # as Carrington Street; St Pancras's Eurostar taxi drop-off as Midland Road (south)).
        for name, like in o.get('same_as', {}).items():
            k, n = names.index(name), names.index(like)
            for rs in e['p'].values():
                for r in [r for r in rs if r[0] == n]:
                    if not any(q[0] == k for q in rs):
                        rs.append([k, r[1], r[2]])
        if o.get('no_routes'):
            e['p'] = {}
        for bad in o.get('no_exit', []):
            if any(bad.lower() in (x[0] or '').lower() for x in e['x']):
                sys.exit(f'{crs}: an exit "{bad}" is in the table, but John says there is none')
    # A walk along the platforms to an exit by another platform, on the level: how far, so the sentence can say
    # "a short walk along" over 60 metres and "a walk along" over 120, rather than "right there" (John, November
    # 27th 2026). Only from the map data's measured paths; kept to the nearest metre, only where it's over 60.
    for e in out.values():
        d = e.pop('_d', None)
        if not d or e.get('m'):
            continue
        far = {}
        for pl, rs in e['p'].items():
            if rs and rs[0][1] == 'l' and pl in d and d[pl] > 60:
                by = e['x'][rs[0][0]][1]
                if by and pl not in by:
                    # The platform has an exit of its own: that one is "right there", whatever the measured walk to
                    # the other (Bramley's platform 1 and Century Fields; the walks are measured from one point on
                    # a long platform), so it goes first and no distance is kept.
                    mine = next((k for k, x in enumerate(e['x']) if pl in x[1]), None)
                    if mine is not None:
                        rs[:] = [[mine, 'l', None]] + [r for r in rs if r[0] != mine]
                    else:
                        far[pl] = round(d[pl])
        if far:
            e['far'] = far
    with open(sys.argv[3], 'w') as fh:
        json.dump(out, fh, separators=(',', ':'), sort_keys=True, ensure_ascii=False)
    print(f"{len(out)} stations; {sum(1 for v in out.values() if v.get('m'))} from station maps", file=sys.stderr)


if __name__ == '__main__':
    main()
