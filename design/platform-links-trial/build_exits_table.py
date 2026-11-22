"""The table behind "Station exits" (November 22nd 2026): one entry per station, from the station
maps read by eye where we have them, otherwise from OpenStreetMap (exits.py).

  python3 -I build_exits_table.py exits.json strict-dir out.json

exits.json: exits.py's national run. strict-dir: the station maps' readings in the strict shape
(maps-strict-*.json: exits with names and the platforms they're by, each platform's ways to them,
a kind). Out: {CRS: {"x": [[name, [platforms], building?]], "p": {platform: [[exit, via, down]]},
"k": kind, "h": {exit: hours}, "m": 1 if from a station map}}, where via is l (level), b
(footbridge), s (subway), x (level crossing), c (concourse) or u (up or down), and down is the
platform a walk over a footbridge or through a subway comes down by, where known.

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
    for e in r['exits']:
        names = [n for n in e['street'] if n not in ROADWORDS]
        xs.append([names[0] if names else None, e['by'], 1 if e.get('building') else 0])
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


def downs(hand, osm):
    """A footbridge or subway's way down from the map data, for a station read from its map: the
    OpenStreetMap walk from the same platform, the same way, to an exit by any of the same
    platforms."""
    if not osm:
        return
    for pl, rs in hand['p'].items():
        for r in rs:
            if r[1] not in 'bs':
                continue
            by = set(hand['x'][r[0]][1])
            for i, d, how, down in osm['platforms'].get(pl, []):
                if VIA.get(how[0]) == r[1] and down and by & set(osm['exits'][i]['by']):
                    r[2] = down
                    break


def main():
    osm = json.load(open(sys.argv[1]))
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
            downs(e, osm.get(crs))
            # John (November 22nd 2026): Southend Airport's exit is by platform 1; nothing more is
            # known, so no routes.
            if crs == 'SIA':
                e['x'] = [[e['x'][0][0] if e['x'] else None, ['1'], 0]]
                e['p'] = {}
        else:
            e = from_osm(osm[crs])
            if not e:
                continue
        out[crs] = e
    with open(sys.argv[3], 'w') as fh:
        json.dump(out, fh, separators=(',', ':'), sort_keys=True, ensure_ascii=False)
    print(f"{len(out)} stations; {sum(1 for v in out.values() if v.get('m'))} from station maps", file=sys.stderr)


if __name__ == '__main__':
    main()
