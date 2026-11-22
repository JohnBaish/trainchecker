"""Exits trial (November 22nd 2026): from each platform, walk along build_table.py's graph until a
road is reached; nearby points joined by road are one way out. Usage (one station's map file, from
api.openstreetmap.org/api/0.6/map, and a scratch folder):
  python3 -I exits.py design/platform-links-trial CRS file.osm out-dir"""
import sys, math, heapq, collections
sys.path.insert(0, sys.argv[1])
crs, src, out = sys.argv[2], sys.argv[3], sys.argv[4]
sys.argv = ['bt', src, out, crs]
import build_table as bt
bt.main()
L = bt.LAST
N, G, attach, roadn = L.N, L.G, L.attach, L.roadn
dist = lambda a, b: math.hypot((N[a][0]-N[b][0])*L.kx, (N[a][1]-N[b][1])*L.ky)
onplat = {n: r for r, a in attach.items() for n in a}
# A station building beside a platform and beside a road is a way out, even where no path is
# drawn through it (Newton Abbot).
import xml.etree.ElementTree as ET
root = ET.parse(src).getroot()
tg = lambda e: {x.get('k'): x.get('v') for x in e.findall('tag')}
NN = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.iter('node')}
md = lambda p, q: math.hypot((p[0]-q[0])*L.kx, (p[1]-q[1])*L.ky)
BUILDING = []
for w in root.iter('way'):
    t = tg(w)
    if t.get('building') != 'train_station': continue
    out = [NN[x.get('ref')] for x in w.findall('nd') if x.get('ref') in NN]
    if not out: continue
    bid = 'bldg' + w.get('id')
    N[bid] = (sum(p[0] for p in out)/len(out), sum(p[1] for p in out)/len(out))
    near = lambda n, lim: min(md(N[n], p) for p in out) <= lim
    # Over the platforms (a train shed, a canopy): not a building beside them.
    if any(bt.inside(N[n], out) for a in attach.values() for n in a): continue
    pl = [(r, n) for r, a in attach.items() for n in a if near(n, 10)]
    rd = [n for n in roadn if n in N and near(n, 12)]
    if pl and rd:
        BUILDING.append(bid)
        for r, n in pl: G[bid].append((n, 15.0, None, 'b')); G[n].append((bid, 15.0, None, 'b'))
        for n in rd: G[bid].append((n, 10.0, None, 'b')); G[n].append((bid, 10.0, None, 'b'))
        print(f"   (station building {w.get('id')} joins platforms {sorted({r for r, _ in pl})} to {len(rd)} road points)", file=sys.stderr)
def reach(src):
    best = {n: 0.0 for n in attach[src]}; h = [(0.0, n, ()) for n in attach[src]]; got = {}
    while h:
        d, n, used = heapq.heappop(h)
        if d > best.get(n, 1e18): continue
        if n in roadn and n not in attach[src]:
            got.setdefault(n, (d, used)); continue
        for m, dd, k, wid in G.get(n, ()):
            u2 = used + ((k, dd),) if k else used
            if d + dd < best.get(m, 1e18): best[m] = d + dd; heapq.heappush(h, (d + dd, m, u2))
    return got
def how(used):
    tot = collections.Counter()
    for k, dd in used:
        for ch in set(k): tot[ch] += dd
    tot.pop('r', None); tot.pop('R', None)
    if not tot: return 'level'
    names = {'b': 'bridge', 's': 'subway', 'x': 'across the tracks', 'u': 'over or under'}
    return ' + '.join(names.get(k, k) for k, v in tot.most_common() if v > 3) or 'level'
refs = sorted((r for r in attach if attach[r]), key=bt.num)
res = {p: reach(p) for p in refs}
pts = collections.defaultdict(list)
for p, o in res.items():
    for n, (d, u) in o.items():
        if d <= 350: pts[n].append((d, p, how(u)))
# Points joined by road within 80 m are one way out (so opposite sides of the line stay apart).
def road_near(a):
    best = {a: 0.0}; h = [(0.0, a)]
    while h:
        d, n = heapq.heappop(h)
        if d > best[n]: continue
        for m, dd, k, wid in G.get(n, ()):
            if m in roadn and n in roadn and d + dd <= 80 and d + dd < best.get(m, 1e18):
                best[m] = d + dd; heapq.heappush(h, (d + dd, m))
    return set(best)
clusters = []
for n in sorted(pts, key=lambda n: min(x[0] for x in pts[n])):
    for c in clusters:
        if n in c[1]: c[0].append(n); break
    else: clusters.append(([n], road_near(n)))
clusters = [c[0] for c in clusters]
# Each platform's nearest way out; keep only ways out that are someone's nearest.
best_for = {}
for p in refs:
    cand = [(min((x for n in c for x in pts[n] if x[1] == p), key=lambda x: x[0], default=None), i) for i, c in enumerate(clusters)]
    cand = [(b, i) for b, i in cand if b]
    if cand: best_for[p] = min(cand, key=lambda z: z[0][0])
keep = sorted({i for _, i in best_for.values()})
print(f"\n== {crs}: platforms {', '.join(refs)}; {len(clusters)} way(s) out found, {len(keep)} nearest for some platform")
for i in keep:
    c = clusters[i]
    allx = [x for n in c for x in pts[n]]
    d0 = min(x[0] for x in allx)
    by = sorted({x[1] for x in allx if x[0] <= d0 + 10 and x[2] == 'level'} or {min(allx)[1]}, key=bt.num)
    names = sorted({str(roadn[n]) for n in c})
    lat, lon = N[c[0]][1], N[c[0]][0]
    print(f"  way out {i+1}: onto {', '.join(names)} ({lat:.5f},{lon:.5f}), by platform(s) {', '.join(by)}")
for p in refs:
    if p not in best_for: print(f"    platform {p}: no way out found"); continue
    (d, _, h), i = best_for[p]
    print(f"    platform {p}: way out {i+1}, {d:.0f} m, {h}")
