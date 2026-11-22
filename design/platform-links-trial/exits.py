"""Exits trial (November 22nd 2026): where each station's ways out are, and how each platform
reaches them, from OpenStreetMap.

From each platform, walk along build_table.py's walking graph (footways, steps, subways,
bridges, lifts) until a road is reached; road points joined by road within 80 metres, or within 60 metres in a straight line,
are one way out. A station building beside a platform (not over it)
and beside a road also counts as a way out, even where no path is drawn through it (Newton
Abbot). For each platform: its nearest way out, and any other within 80 metres or half as far
again. A way out is "by" the platforms that reach it on the level within 10 metres of the
shortest walk.

  python3 -I exits.py one  design/platform-links-trial CRS file.osm out-dir   (one station's map)
  python3 -I exits.py all  design/platform-links-trial uk.osm.pbf out-dir      (every station)

"all" writes out-dir/exits.json and out-dir/exits-report.txt. Derived from OpenStreetMap, so
under the Open Database Licence (© OpenStreetMap contributors)."""
import sys, math, heapq, collections, json, os

mode, here, src, out = sys.argv[1], sys.argv[2], sys.argv[-2] if sys.argv[1] == 'one' else sys.argv[3], sys.argv[-1]
sys.path.insert(0, here)
only = sys.argv[3] if mode == 'one' else None
sys.argv = ['build_table', src, out] + ([only] if only else [])
import build_table as bt

NAMES = {'b': 'bridge', 's': 'subway', 'x': 'across the tracks', 'u': 'over or under'}


def how(used):
    tot = collections.Counter()
    for k, dd in used:
        for ch in set(k):
            if ch in NAMES:
                tot[ch] += dd
    return [NAMES[k] for k, v in tot.most_common() if v > 3] or ['level']


def exits_of(L, buildings):
    N, G, attach, roadn = L.N, L.G, L.attach, L.roadn
    md = lambda p, q: math.hypot((p[0] - q[0]) * L.kx, (p[1] - q[1]) * L.ky)
    dist = lambda a, b: md(N[a], N[b])
    # Station buildings beside (not over) a platform and beside a road.
    for k, out_ in enumerate(buildings):
        if not out_:
            continue
        if any(bt.inside(N[n], out_) for a in attach.values() for n in a):
            continue
        near = lambda n, lim: min(md(N[n], p) for p in out_) <= lim
        pl = [n for a in attach.values() for n in a if near(n, 10)]
        rd = [n for n in roadn if n in N and near(n, 12)]
        if pl and rd:
            b = f'building{k}'
            N[b] = (sum(p[0] for p in out_) / len(out_), sum(p[1] for p in out_) / len(out_))
            for n in pl:
                G[b].append((n, 15.0, None, 'bldg')); G[n].append((b, 15.0, None, 'bldg'))
            for n in rd:
                G[b].append((n, 10.0, None, 'bldg')); G[n].append((b, 10.0, None, 'bldg'))

    def reach(src):
        best = {n: 0.0 for n in attach[src]}
        h = [(0.0, n, (), False) for n in attach[src]]
        got = {}
        while h:
            d, n, used, bl = heapq.heappop(h)
            if d > best.get(n, 1e18):
                continue
            if n in roadn and n not in attach[src]:
                got.setdefault(n, (d, used, bl))
                continue
            for m, dd, k, wid in G.get(n, ()):
                u2 = used + ((k, dd),) if k else used
                if d + dd < best.get(m, 1e18):
                    best[m] = d + dd
                    heapq.heappush(h, (d + dd, m, u2, bl or wid == 'bldg'))
        return got

    refs = sorted((r for r in attach if attach[r]), key=bt.num)
    pts = collections.defaultdict(list)
    for p in refs:
        for n, (d, u, bl) in reach(p).items():
            if d <= 400:
                pts[n].append((d, p, how(u), bl))

    def road_near(a):
        best = {a: 0.0}; h = [(0.0, a)]
        while h:
            d, n = heapq.heappop(h)
            if d > best[n]:
                continue
            for m, dd, k, wid in G.get(n, ()):
                if m in roadn and n in roadn and d + dd <= 80 and d + dd < best.get(m, 1e18):
                    best[m] = d + dd; heapq.heappush(h, (d + dd, m))
        return set(best)
    clusters = []
    for n in sorted(pts, key=lambda n: min(x[0] for x in pts[n])):
        for c in clusters:
            if n in c[1] or dist(n, c[0][0]) < 60:
                c[0].append(n); break
        else:
            clusters.append(([n], road_near(n)))
    clusters = [c[0] for c in clusters]

    # Each platform: its ways out, nearest first, within 80 m or half as far again of the nearest.
    per = {}
    for p in refs:
        cand = []
        for i, c in enumerate(clusters):
            b = min((x for n in c for x in pts[n] if x[1] == p), key=lambda x: x[0], default=None)
            if b:
                cand.append((b[0], i, b[2], b[3]))
        cand.sort()
        if cand:
            lim = max(cand[0][0] + 80, cand[0][0] * 1.5)
            per[p] = [c for c in cand if c[0] <= lim][:3]
    used = sorted({i for v in per.values() for _, i, _, _ in v})
    num = {i: k for k, i in enumerate(used)}
    exits = []
    for i in used:
        c = clusters[i]
        allx = [x for n in c for x in pts[n]]
        d0 = min(x[0] for x in allx)
        by = sorted({x[1] for x in allx if x[0] <= d0 + 10 and x[2] == ['level']}, key=bt.num)
        names = sorted({str(roadn[n]) for n in c if roadn[n] not in ('service', None)})
        lon, lat = N[c[0]]
        exits.append({'street': names, 'by': by, 'building': any(x[3] for x in allx if x[0] <= d0 + 10),
                      'at': [round(lat, 5), round(lon, 5)]})
    plat = {p: [[num[i], round(d), h] for d, i, h, _ in v] for p, v in per.items()}
    return {'exits': exits, 'platforms': plat}


def report(crs, name, r):
    lines = [f"{crs} {name}: {len(r['exits'])} way(s) out"]
    for k, e in enumerate(r['exits']):
        st = ', '.join(e['street']) or 'an unnamed road'
        lines.append(f"  {k + 1}. onto {st}{' (by the station building)' if e['building'] else ''}, "
                     f"by platform(s) {', '.join(e['by']) or '–'}  [{e['at'][0]},{e['at'][1]}]")
    for p, v in sorted(r['platforms'].items(), key=lambda x: bt.num(x[0])):
        lines.append(f"     {p:>4}: " + '; '.join(f"{i + 1} {d} m {'+'.join(h)}" for i, d, h in v))
    return '\n'.join(lines)


if mode == 'one':
    import xml.etree.ElementTree as ET
    bt.main()
    root = ET.parse(src).getroot()
    tg = lambda e: {x.get('k'): x.get('v') for x in e.findall('tag')}
    NN = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.iter('node')}
    bl = [[NN[x.get('ref')] for x in w.findall('nd') if x.get('ref') in NN]
          for w in root.iter('way') if tg(w).get('building') == 'train_station']
    print(report(only, '', exits_of(bt.LAST, bl)))
else:
    table, rep = {}, []

    def hook(crs, name, bpts):
        try:
            r = exits_of(bt.LAST, [[(p[1], p[2]) for p in pts] for pts in bpts])
        except Exception as e:      # one station's odd map shouldn't stop the run
            rep.append(f'{crs} {name}: failed ({e})'); return
        table[crs] = r
        rep.append(report(crs, name, r))
    bt.HOOK = hook
    bt.main()
    with open(os.path.join(out, 'exits.json'), 'w') as fh:
        json.dump(table, fh, separators=(',', ':'), sort_keys=True)
    with open(os.path.join(out, 'exits-report.txt'), 'w') as fh:
        fh.write('\n\n'.join(rep) + '\n')
    print(f'{len(table)} stations with exits', file=sys.stderr)
