"""Name exits by what's near them (John, November 22nd 2026). A trial, after landmarks.py.

  python3 -I name_exits.py landmarks.json exits.json out.json [CRS ...]

For a station with two or more exits, a landmark names the exit it is clearly nearer to: nearer than every
other exit by at least half the distance between the two exits (so it lies in that exit's
direction, however far away) and by at least 40 metres. In order of preference:

  the town or city centre (a town point within 600 m or a city point within 1.2 km, the station
  named after it)
                                                                         "the town centre exit"
  a bus station, hospital, university, shopping centre or stadium within 400 m
                                                                         "the bus station exit"
  a car park within 60 m of one exit, and at least twice as far (and 60 m more) from the others, (only for an exit with no street name)
                                                                         "the car park exit"

A name given to two exits at one station is dropped. Writes {CRS: {exit number in exits.json: name}} and prints a report."""
import sys, json, math, re, os

lm, ex = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
only = set(sys.argv[4:])
STN = dict(json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../src/data/stations.json'))))
ROADWORDS = {'unclassified', 'track', 'primary', 'secondary', 'tertiary', 'residential', 'service', 'living_street',
             'trunk', 'road', 'primary_link', 'secondary_link', 'tertiary_link', 'trunk_link', 'motorway', 'None'}


def metres(a, b):
    return math.hypot((a[1] - b[1]) * 111320 * math.cos(math.radians(a[0])), (a[0] - b[0]) * 110540)


def clearly_nearest(exits, at, share=0.5, gap=40):
    """The one exit that faces the landmark: against every other exit, it is nearer by at least
    half the distance between the two exits (so the landmark lies roughly in its direction, however
    far away it is) and by at least 40 metres."""
    ds = [metres(e, at) for e in exits]
    for i in range(len(exits)):
        if all(ds[j] - ds[i] >= max(gap, share * metres(exits[i], exits[j])) for j in range(len(exits)) if j != i):
            return i
    return None


OTHER = {'bus station': 'the bus station exit', 'hospital': 'the hospital exit',
         'university': 'the university exit', 'shopping centre': 'the shopping centre exit', 'stadium': 'the stadium exit'}
out, report = {}, []
for crs, r in sorted(lm.items()):
    if only and crs not in only:
        continue
    exits = r['exits']
    names = {}
    near = r['near']
    # The town or city centre: the nearest town point within 600 m or city point within 1.2 km, and
    # only where the station is named after that place (John, November 22nd 2026: otherwise, as at
    # Claygate (Esher) or Tooting (a kilometre off), the street name is more use).
    centres = [f for f in near if f['k'] in ('city centre', 'town centre')
               and min(metres(e, (f['lat'], f['lon'])) for e in exits) <= (1200 if f['k'] == 'city centre' else 600)
               and f.get('name') and re.search(r'\b' + re.escape(f['name'].lower()) + r'\b', STN.get(crs, '').lower())]
    if centres:
        c = min(centres, key=lambda f: min(metres(e, (f['lat'], f['lon'])) for e in exits))
        i = clearly_nearest(exits, (c['lat'], c['lon']))
        if i is not None:
            names[i] = f"the {c['k']} exit"
    # The nearest of each other kind within 400 m (a bus "station" that is really a stop left out).
    for k, label in OTHER.items():
        fs = [f for f in near if f['k'] == k and min(metres(e, (f['lat'], f['lon'])) for e in exits) <= 400
              and not re.search(r'end of route|\bstop\b|\bstand\b|coach park', f.get('name') or '', re.I)]
        if not fs:
            continue
        f = min(fs, key=lambda f: min(metres(e, (f['lat'], f['lon'])) for e in exits))
        i = clearly_nearest(exits, (f['lat'], f['lon']))
        if i is not None and i not in names:
            names[i] = label
    # A car park beside one exit only, for an exit with no street name.
    streets = [[n for n in e['street'] if n not in ROADWORDS] for e in ex[crs]['exits']]
    for f in (f for f in near if f['k'] == 'car park'):
        ds = [metres(e, (f['lat'], f['lon'])) for e in exits]
        i = min(range(len(ds)), key=ds.__getitem__)
        if ds[i] <= 60 and all(d >= max(2 * ds[i], ds[i] + 60) for j, d in enumerate(ds) if j != i) and i not in names and not streets[i]:
            names[i] = 'the car park exit'
    # A name has to pick out one exit: any name given to two exits is dropped from both.
    twice = {n for n in names.values() if list(names.values()).count(n) > 1}
    names = {i: n for i, n in names.items() if n not in twice}
    if names:
        out[crs] = {str(i): n for i, n in sorted(names.items())}
    report.append(f"{crs}: " + '; '.join(f"{i + 1} ({', '.join(streets[i]) or 'no name'}) -> {names.get(i, '-')}" for i in range(len(exits))))
json.dump(out, open(sys.argv[3], 'w'), indent=1, sort_keys=True)
print('\n'.join(report))
print(f"\n{len(out)} stations with at least one exit named", file=sys.stderr)
