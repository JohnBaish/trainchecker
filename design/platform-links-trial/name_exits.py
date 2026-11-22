"""Name exits by what's near them (John, November 22nd 2026). A trial, after landmarks.py.

  python3 -I name_exits.py landmarks.json exits.json out.json [CRS ...]

For a station with two or more exits, a landmark names the exit it is clearly nearer to: at least a
quarter nearer, and at least 80 metres nearer, than to any other exit. In order of preference:

  the town or city centre (a place=town|city point, or the town hall)  "the town centre exit"
  a bus station, ferry terminal, hospital, university, shopping centre or stadium within 800 m
                                                                         "the bus station exit"
  a car park within 60 m of one exit and not the others (only for an exit with no street name)
                                                                         "the car park exit"

Writes {CRS: {exit number in exits.json: name}} and prints a report."""
import sys, json, math

lm, ex = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
only = set(sys.argv[4:])
ROADWORDS = {'unclassified', 'track', 'primary', 'secondary', 'tertiary', 'residential', 'service', 'living_street',
             'trunk', 'road', 'primary_link', 'secondary_link', 'tertiary_link', 'trunk_link', 'motorway', 'None'}


def metres(a, b):
    return math.hypot((a[1] - b[1]) * 111320 * math.cos(math.radians(a[0])), (a[0] - b[0]) * 110540)


def clearly_nearest(exits, at, ratio=0.75, gap=80):
    ds = sorted((metres(e, at), i) for i, e in enumerate(exits))
    (d0, i0), (d1, _) = ds[0], ds[1]
    return i0 if d0 <= d1 * ratio and d1 - d0 >= gap else None


OTHER = {'bus station': 'the bus station exit', 'ferry terminal': 'the ferry terminal exit', 'hospital': 'the hospital exit',
         'university': 'the university exit', 'shopping centre': 'the shopping centre exit', 'stadium': 'the stadium exit'}
out, report = {}, []
for crs, r in sorted(lm.items()):
    if only and crs not in only:
        continue
    exits = r['exits']
    names = {}
    near = r['near']
    # The town or city centre: the nearest centre point (or town hall) to the station.
    centres = [f for f in near if f['k'] in ('city centre', 'town centre', 'townhall')]
    if centres:
        c = min(centres, key=lambda f: metres(exits[0], (f['lat'], f['lon'])))
        i = clearly_nearest(exits, (c['lat'], c['lon']))
        if i is not None:
            names[i] = 'the city centre exit' if c['k'] == 'city centre' else 'the town centre exit'
    # The nearest of each other kind within 800 m.
    for k, label in OTHER.items():
        fs = [f for f in near if f['k'] == k and min(metres(e, (f['lat'], f['lon'])) for e in exits) <= 800]
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
        if ds[i] <= 60 and all(d > 120 for j, d in enumerate(ds) if j != i) and i not in names and not streets[i]:
            names[i] = 'the car park exit'
    if names:
        out[crs] = {str(i): n for i, n in sorted(names.items())}
    report.append(f"{crs}: " + '; '.join(f"{i + 1} ({', '.join(streets[i]) or 'no name'}) -> {names.get(i, '-')}" for i in range(len(exits))))
json.dump(out, open(sys.argv[3], 'w'), indent=1, sort_keys=True)
print('\n'.join(report))
print(f"\n{len(out)} stations with at least one exit named", file=sys.stderr)
