"""The table behind "Station exits" (November 22nd 2026): one entry per station, from the station
maps read by eye where we have them, otherwise from OpenStreetMap (exits.py).

  python3 -I build_exits_table.py exits.json strict-dir out.json platform-links.json

exits.json: exits.py's national run. strict-dir: the station maps' readings in the strict shape
(maps-strict-*.json: exits with names and the platforms they're by, each platform's ways to them,
a kind). Out: {CRS: {"x": [[name, [platforms, nearest first], building?, near]], "p": {platform: [[exit, via, down]]},
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


def from_osm(r):
    xs = []
    near = {}
    for pl, routes in r['platforms'].items():
        for i, d, how, down in routes:
            near.setdefault(i, {})[pl] = min(d, near.get(i, {}).get(pl, 1e9))
    for k, e in enumerate(r['exits']):
        names = [n for n in e['street'] if n not in ROADWORDS]
        by = sorted(e['by'], key=lambda pl: (near.get(k, {}).get(pl, 1e9), num(pl)))
        xs.append([names[0] if names else None, by, 1 if e.get('building') else 0])
    p = {}
    for pl, routes in r['platforms'].items():
        out = []
        for i, d, how, down in routes:
            v = VIA.get(how[0], 'u')
            if v == 'x':          # a path meeting a track may be a barrow crossing: never say it
                continue
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
    return {'x': xs, 'p': p, 'k': kind}


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
            if r[1] not in 'bs':
                continue
            by = hand['x'][r[0]][1]
            for i, d, how, down in osm['platforms'].get(pl, []):
                if VIA.get(how[0]) != r[1] or not down:
                    continue
                if (by and down in lv(by)) or (not by and down not in others(r[0])):
                    r[2] = down
                    break


def main():
    osm = json.load(open(sys.argv[1]))
    links = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else {}
    hand = {}
    for f in sorted(glob.glob(os.path.join(sys.argv[2], 'maps-strict-*.json'))):
        hand.update(json.load(open(f)))
    out = {}
    for crs in sorted(set(osm) | set(hand)):
        if crs in SKIP or hand.get(crs, {}).get('skip'):
            continue
        if crs in hand:
            h = hand[crs]
            e = {'x': [[x['name'], x['by'], 0] for x in h['exits']],
                 'p': {pl: [[i, v, None] for i, v in rs if 0 <= i < len(h['exits'])] for pl, rs in h['platforms'].items()},
                 'k': h['kind'], 'm': 1}
            if h.get('hours'):
                e['h'] = h['hours']
            downs(e, osm.get(crs), links.get(crs, {}).get('g', []))
        else:
            e = from_osm(osm[crs])
            if not e:
                continue
        # An exit by no platform: the platform people come down by on the way to it, if any.
        for k, x in enumerate(e['x']):
            if not x[1]:
                ds = [w[2] for rs in e['p'].values() for w in rs if w[0] == k and w[2]]
                x.append(max(set(ds), key=ds.count) if ds else None)
            else:
                x.append(None)
        out[crs] = e
    # John's own corrections, applied last (exits-overrides.json beside this script).
    ov = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exits-overrides.json')))
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
        for old, ps in o.get('by', {}).items():
            e['x'][names.index(old)][1] = ps
        if o.get('no_routes'):
            e['p'] = {}
        for bad in o.get('no_exit', []):
            if any(bad.lower() in (x[0] or '').lower() for x in e['x']):
                sys.exit(f'{crs}: an exit "{bad}" is in the table, but John says there is none')
    with open(sys.argv[3], 'w') as fh:
        json.dump(out, fh, separators=(',', ':'), sort_keys=True, ensure_ascii=False)
    print(f"{len(out)} stations; {sum(1 for v in out.values() if v.get('m'))} from station maps", file=sys.stderr)


if __name__ == '__main__':
    main()
