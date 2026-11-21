"""Follow the drawn footpaths between platforms (handover §6.1). A trial on map files saved from
api.openstreetmap.org/api/0.6/map, one per station. Usage: python3 -I paths.py NTA.osm …

For each pair of platforms, finds the shortest walk along footways, steps, corridors, paths and
lifts, and across platforms, and says what it uses: on the level, a bridge, a subway, or none
found. Also says whether a walk on the level exists at all, and how long it is."""
import sys, math, heapq, itertools, xml.etree.ElementTree as ET

WALK = {'footway', 'steps', 'corridor', 'path', 'pedestrian', 'elevator', 'platform', 'cycleway'}
NO_ENTRY = {'private', 'no'}


def num(s):
    d = ''.join(c for c in s if c.isdigit())
    return (int(d) if d else 999, s)


def kind_of(t):
    """'bridge', 'tunnel' or None for one way's tags."""
    try:
        layer = float((t.get('layer') or '0').split(';')[0])
    except ValueError:
        layer = 0
    if t.get('bridge', 'no') != 'no' or layer >= 1:
        return 'bridge'
    if t.get('tunnel', 'no') != 'no' or layer <= -1:
        return 'tunnel'
    return None


def inside(p, poly):
    x, y = p
    c = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def run(path):
    r = ET.parse(path).getroot()
    N = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in r.iter('node')}
    lat0 = sum(p[1] for p in N.values()) / len(N)
    kx, ky = 111320 * math.cos(math.radians(lat0)), 110540

    def dist(a, b):
        return math.hypot((N[a][0] - N[b][0]) * kx, (N[a][1] - N[b][1]) * ky)

    tags = lambda e: {x.get('k'): x.get('v') for x in e.findall('tag')}
    W = {w.get('id'): w for w in r.iter('way')}
    nds = lambda w: [x.get('ref') for x in w.findall('nd') if x.get('ref') in N]

    # Platforms: ref -> list of node lists (one per shape).
    plats = {}

    def add_plat(t, shapes):
        if not (t.get('railway') == 'platform' or (t.get('public_transport') == 'platform' and t.get('train') == 'yes')):
            return
        refs = t.get('ref') or t.get('local_ref')
        if not refs:
            return
        for ref in refs.replace(',', ';').split(';'):
            plats.setdefault(ref.strip(), []).extend(shapes)

    for w in W.values():
        add_plat(tags(w), [nds(w)])
    for rel in r.iter('relation'):
        add_plat(tags(rel), [nds(W[m.get('ref')]) for m in rel.findall('member')
                             if m.get('type') == 'way' and m.get('ref') in W])

    # Walking graph.
    G = {}

    def edge(a, b, d, k):
        G.setdefault(a, []).append((b, d, k))
        G.setdefault(b, []).append((a, d, k))

    flat_nodes = set()      # nodes on ways that aren't bridge or tunnel: may land on a platform
    for w in W.values():
        t = tags(w)
        if t.get('highway') not in WALK and t.get('railway') != 'platform':
            continue
        if t.get('access') in NO_ENTRY or t.get('foot') in NO_ENTRY:
            continue
        k = kind_of(t)
        ns = nds(w)
        for a, b in zip(ns, ns[1:]):
            edge(a, b, dist(a, b), (k, t.get('highway') == 'steps'))
        if k is None:
            flat_nodes.update(ns)
    for n in r.iter('node'):
        if tags(n).get('highway') == 'elevator':
            flat_nodes.add(n.get('id'))

    # Each platform: its own nodes, plus walking nodes on the level inside its shape.
    attach = {}
    for ref, shapes in plats.items():
        a = set()
        for s in shapes:
            a.update(s)
            if len(s) > 3 and s[0] == s[-1]:
                poly = [N[x] for x in s[:-1]]
                xs, ys = [p[0] for p in poly], [p[1] for p in poly]
                for n in flat_nodes:
                    p = N[n]
                    if min(xs) <= p[0] <= max(xs) and min(ys) <= p[1] <= max(ys) and inside(p, poly):
                        a.add(n)
        attach[ref] = a
        for x, y in itertools.combinations(a, 2):   # walking along or across the platform
            edge(x, y, dist(x, y), (None, False))

    def walk(src, dst, level_only):
        best = {n: 0 for n in attach[src]}
        h = [(0, n, frozenset()) for n in attach[src]]
        used = {n: frozenset() for n in attach[src]}
        while h:
            d, n, u = heapq.heappop(h)
            if d > best.get(n, 1e18):
                continue
            if n in attach[dst]:
                return d, u
            for m, dd, (k, steps) in G.get(n, []):
                if level_only and (k or steps):
                    continue
                u2 = u | ({k} if k else set()) | ({'steps'} if steps else set())
                if d + dd < best.get(m, 1e18):
                    best[m] = d + dd
                    used[m] = u2
                    heapq.heappush(h, (d + dd, m, u2))
        return None

    refs = sorted((k for k in attach if attach[k]), key=num)
    print(f"\n{path.split('/')[-1].split('.')[0]}: platforms {', '.join(refs)}")
    for a, b in itertools.combinations(refs, 2):
        any_ = walk(a, b, False)
        lvl = walk(a, b, True)
        if any_ is None:
            say = 'no way found'
        else:
            d, u = any_
            what = ' and '.join(x for x in ('bridge', 'tunnel') if x in u) or 'on the level'
            say = f"{what}{' (steps)' if 'steps' in u and what == 'on the level' else ''}, {d:.0f} m"
        if lvl is not None and any_ is not None and lvl[0] > any_[0] + 1:
            say += f"; also on the level, {lvl[0]:.0f} m"
        print(f"  {a:>4} – {b:<4} {say}")


for f in sys.argv[1:]:
    run(f)
