"""How the platforms connect, for every station: a prototype (handover §6.2).

Reads a United Kingdom extract from OpenStreetMap (a .osm.pbf file, e.g. from
download.openstreetmap.fr) and, for each station with a three-letter code (`ref:crs`), follows the
drawn footways, steps, subways, corridors, paths and lifts between each pair of its platforms, as
paths.py does for six stations. Writes a JSON table and a plain report.

  python3 -I build_table.py uk.osm.pbf out-dir [CRS …]

Needs pyosmium (pip install osmium) and about 6 GB of memory. The table is derived from
OpenStreetMap, so it is under the Open Database Licence (© OpenStreetMap contributors).

For each station the table holds the platforms in groups that are on the level with each other
(each group split into islands: platforms whose shapes touch on the map, or are one shape),
and for each pair of groups how the shortest walk crosses the line:
  b  a bridge (bridge=yes or layer 1 or more)
  s  a subway (tunnel=yes or layer -1 or less)
  x  across the line on the level (a path meeting a railway track)
  e  either a bridge or a subway (both used, about as often)
  u  over or under the line, but the map doesn't say which
  r  out of the station: along a road for more than 25 metres, or across the line on a road
  B, S, E  as b, s, e, but a walk on the level of at most 500 metres (round through a concourse,
     say) is there too
  ?  no walk found
A walk using both a bridge and a subway counts as whichever it uses for longer."""
import sys, os, json, pickle, types, math, heapq, itertools, collections
import osmium

WALK = {'footway', 'steps', 'corridor', 'path', 'pedestrian', 'elevator', 'platform', 'cycleway'}
NO_ENTRY = {'private', 'no'}
DEBUG = os.environ.get('DEBUG')
ROADS = {'service', 'residential', 'unclassified', 'tertiary', 'secondary', 'primary', 'living_street', 'track',
         'tertiary_link', 'secondary_link', 'primary_link'}
SNAP = 8               # metres: a path ending this close to a platform's edge joins it
LEVEL_EXTRA = 500       # metres: a level walk at most this long is also worth knowing about
RAIL = {'rail', 'light_rail', 'narrow_gauge'}
NEAR = 0.008            # degrees: how far round a station to keep things (about 550 to 900 metres)
PLATFORM_MAX = 650      # metres: a platform further than this from every station is ignored
CELL = 0.01


def cell(lon, lat):
    return (int(math.floor(lon / CELL)), int(math.floor(lat / CELL)))


def is_platform(t):
    if t.get('railway') == 'platform':
        pass
    elif t.get('public_transport') == 'platform' and (t.get('train') == 'yes' or t.get('railway') == 'platform'):
        pass
    else:
        return False
    # Leave out Underground, tram and bus platforms.
    if t.get('subway') == 'yes' or t.get('tram') == 'yes' or t.get('bus') == 'yes' or t.get('light_rail') == 'yes':
        return t.get('train') == 'yes'
    return True


def refs_of(t):
    r = t.get('ref') or t.get('local_ref')
    if not r:
        return []
    return [x.strip() for x in r.replace(',', ';').split(';') if x.strip()]


class Stations(osmium.SimpleHandler):
    """First pass: stations' positions, and the ways inside platform relations."""
    def __init__(self):
        super().__init__()
        self.st = {}
        self.rel_ways = set()

    def node(self, n):
        t = n.tags
        if 'ref:crs' in t and (t.get('railway') in ('station', 'halt') or t.get('public_transport') == 'station'):
            crs = t['ref:crs'].strip().upper()
            if len(crs) == 3 and crs not in self.st:
                self.st[crs] = (n.location.lon, n.location.lat, t.get('name', ''))

    def relation(self, r):
        if is_platform({k: v for k, v in r.tags}):
            for m in r.members:
                if m.type == 'w':
                    self.rel_ways.add(m.ref)


class Things(osmium.SimpleHandler):
    """Second pass, with node positions: everything near a station that the walk needs."""
    def __init__(self, cells, rel_ways):
        super().__init__()
        self.cells, self.rel_ways = cells, rel_ways
        self.ways = {}       # id -> (kind, tags, [(node id, lon, lat)])
        self.lifts = {}      # node id -> (lon, lat)
        self.rels = []       # (tags, [way ids])

    def near(self, lon, lat):
        return cell(lon, lat) in self.cells

    def node(self, n):
        if n.tags.get('highway') == 'elevator' and self.near(n.location.lon, n.location.lat):
            self.lifts[n.id] = (n.location.lon, n.location.lat)

    def way(self, w):
        t = w.tags
        hw, rw = t.get('highway'), t.get('railway')
        tags = None
        if rw in RAIL and t.get('service') not in ('siding', 'yard', 'spur'):
            kind = 'rail'
        elif is_platform({k: v for k, v in t}):
            kind = 'platform'
        elif hw in WALK or w.id in self.rel_ways:
            kind = 'walk' if hw in WALK else 'member'
        elif hw in ROADS:
            kind = 'road'
        elif t.get('building') == 'train_station':
            kind = 'building'   # for exits.py: a station building beside a platform
        else:
            return
        try:
            pts = [(nd.ref, nd.lon, nd.lat) for nd in w.nodes]
        except osmium.InvalidLocationError:
            return
        if not pts or not any(self.near(p[1], p[2]) for p in pts[:: max(1, len(pts) // 8)] + [pts[-1]]):
            return
        tags = {k: v for k, v in t if k in ('highway', 'railway', 'ref', 'local_ref', 'bridge', 'tunnel', 'layer',
                                            'access', 'foot', 'public_transport', 'train', 'subway', 'level', 'indoor', 'name', 'building')}
        self.ways[w.id] = (kind, tags, pts)

    def relation(self, r):
        t = {k: v for k, v in r.tags}
        if is_platform(t) and refs_of(t):
            self.rels.append((t, [m.ref for m in r.members if m.type == 'w']))


def kind_of(t):
    try:
        layer = float((t.get('layer') or '0').split(';')[0])
    except ValueError:
        layer = 0
    if t.get('bridge', 'no') != 'no' or layer >= 1:
        return 'b'
    if t.get('tunnel', 'no') != 'no' or layer <= -1:
        return 's'
    return None


def seg_dist(p, a, b, kx, ky):
    px, py = p[0] * kx, p[1] * ky
    ax, ay, bx, by = a[0] * kx, a[1] * ky, b[0] * kx, b[1] * ky
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def inside(p, poly):
    x, y = p
    c = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def num(s):
    d = ''.join(c for c in s if c.isdigit())
    return (int(d) if d else 999, s)


def crosses(p, q, a, b):
    def o(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    return o(p, q, a) * o(p, q, b) < 0 and o(a, b, p) * o(a, b, q) < 0


def solve(crs, st, plats, walks, lifts, rails, rail_segs=()):
    """plats: ref -> list of [(id, lon, lat)] shapes; walks: list of (tags, pts)."""
    lat0 = st[1]
    kx, ky = 111320 * math.cos(math.radians(lat0)), 110540
    N = {}
    for shapes in plats.values():
        for s in shapes:
            for i, x, y in s:
                N[i] = (x, y)
    for _, pts in walks:
        for i, x, y in pts:
            N[i] = (x, y)
    N.update(lifts)

    def dist(a, b):
        return math.hypot((N[a][0] - N[b][0]) * kx, (N[a][1] - N[b][1]) * ky)

    G = collections.defaultdict(list)

    def edge(a, b, d, k, wid=None):
        G[a].append((b, d, k, wid))
        G[b].append((a, d, k, wid))

    flat = set()
    for t, pts in walks:
        if t.get('access') in NO_ENTRY or t.get('foot') in NO_ENTRY:
            continue
        base = kind_of(t)
        crossing_way = False
        k = base or ('r' if t.get('_road') else None)
        ids = [p[0] for p in pts]
        for a, b in zip(ids, ids[1:]):
            # A walk or road that meets a railway track crosses the line on the level.
            on_track = (a in rails or b in rails) and not (a in flat_plat_nodes or b in flat_plat_nodes)
            kk = 'x' if on_track and base is None else k
            # A path drawn across a track without meeting it goes over or under it, even if the
            # map doesn't say so: how is unknown.
            if kk in (None, 'r'):
                hit = [over for r1, r2, over in rail_segs if crosses(N[a], N[b], r1, r2)]
                if hit:
                    # Under a railway bridge is a subway. A road crossing a track it doesn't meet
                    # goes over it on a bridge; a footpath could go either way, so unknown.
                    kk = ('rR' if kk == 'r' else '') + ('s' if any(hit) else ('b' if kk == 'r' else 'u'))
                    crossing_way = True
            edge(a, b, dist(a, b), kk, t.get('_id'))
        # Roads join platforms only through footpaths: a road under or beside a station
        # would otherwise join platforms it doesn't serve.
        if base is None and not crossing_way and not t.get('_road'):
            flat.update(ids)
    flat.update(lifts)

    attach = {}
    for ref, shapes in plats.items():
        a = set()
        for s in shapes:
            ids = [p[0] for p in s]
            a.update(ids)
            if len(ids) > 3 and ids[0] == ids[-1]:
                poly = [N[x] for x in ids[:-1]]
                xs, ys = [p[0] for p in poly], [p[1] for p in poly]
                for n in flat:
                    p = N[n]
                    if min(xs) <= p[0] <= max(xs) and min(ys) <= p[1] <= max(ys) and inside(p, poly):
                        a.add(n)
        attach[ref] = a
    # Paths that stop just short of a platform's edge join the nearest platform (and another
    # just as near, as on an island drawn as two lines), never one across the tracks.
    near_p = collections.defaultdict(list)
    for ref, shapes in plats.items():
        for s_ in shapes:
            ids = [p[0] for p in s_]
            xs = [N[i][0] for i in ids]
            ys = [N[i][1] for i in ids]
            pad = 0.00015
            for n in flat:
                p = N[n]
                if not (min(xs) - pad <= p[0] <= max(xs) + pad and min(ys) - pad <= p[1] <= max(ys) + pad):
                    continue
                dmin = min(seg_dist(p, N[u], N[v], kx, ky) for u, v in zip(ids, ids[1:]))
                if dmin <= SNAP:
                    near_p[n].append((dmin, ref))
    for n, cands in near_p.items():
        if any(n in attach[r] for _, r in cands):
            continue
        d0 = min(c[0] for c in cands)
        for dd, ref in cands:
            if dd <= d0 + 2:
                attach[ref].add(n)
    for ref, a in attach.items():
        for x, y in itertools.combinations(a, 2):
            edge(x, y, dist(x, y), None)

    if DEBUG:
        owner = {}
        for t, pts in walks:
            for p in pts:
                owner.setdefault(p[0], []).append((t.get('_id'), t.get('highway')))
        for x, y in itertools.combinations(sorted(attach), 2):
            both = attach[x] & attach[y]
            if both:
                print(f'    {x} and {y} share {len(both)}: {[owner.get(n, "platform/lift") for n in list(both)[:4]]}', file=sys.stderr)

    def walk(src, dst, level_only=False):
        best = {n: 0.0 for n in attach[src]}
        h = [(0.0, n, ()) for n in attach[src]]
        prev = {}
        while h:
            d, n, used = heapq.heappop(h)
            if d > best.get(n, 1e18):
                continue
            if n in attach[dst]:
                if DEBUG:
                    route, x = [], n
                    while x in prev:
                        x, w = prev[x]
                        if w and (not route or route[-1] != w):
                            route.append(w)
                    print(f'    {src}-{dst} {"level" if level_only else "any"} {d:.0f} m via ways {route[::-1]}', file=sys.stderr)
                return d, used
            for m, dd, k, wid in G.get(n, ()):
                if level_only and k:
                    continue
                u2 = used + ((k, dd),) if k else used
                if d + dd < best.get(m, 1e18):
                    best[m] = d + dd
                    prev[m] = (n, wid)
                    heapq.heappush(h, (d + dd, m, u2))
        return None

    global LAST
    roadn = {}
    for t, pts in walks:
        if t.get('_road') and t.get('access') not in NO_ENTRY:
            for p in pts: roadn.setdefault(p[0], t.get('name') or t.get('highway'))
    LAST = types.SimpleNamespace(G=G, attach=attach, N=N, kx=kx, ky=ky, roadn=roadn, walks=walks)
    refs = sorted((r for r in attach if attach[r]), key=num)
    pair = {}
    for a, b in itertools.combinations(refs, 2):
        w = walk(a, b)
        if w is None:
            pair[(a, b)] = ('?', None)
        else:
            d, used = w
            if not used:
                pair[(a, b)] = ('-', d)
            else:
                tot = collections.Counter()
                for k, dd in used:
                    for ch in set(k):
                        tot[ch] += dd
                # A crossing of the tracks counts first: it is what a person would notice. A walk
                # that goes along roads for more than a short way leaves the station.
                known = {x: v for x, v in tot.items() if x in 'bs'}
                if DEBUG:
                    print(f"    {a}-{b} totals {dict(tot)}", file=sys.stderr)
                if 'x' in tot:
                    k = 'x'
                elif 'u' in tot and not known:
                    k = 'u'
                elif 'R' in tot or tot.get('r', 0) > 25:
                    k = 'r'
                else:
                    k = max(known, key=known.get) if known else '-'
                if k in 'bse':
                    lv = walk(a, b, True)
                    if lv is not None and lv[0] <= LEVEL_EXTRA:
                        k = k.upper()
                pair[(a, b)] = (k, d)
    # Groups on the level.
    par = {r: r for r in refs}

    def f(x):
        while par[x] != x:
            x = par[x]
        return x
    for (a, b), (k, _) in pair.items():
        if k == '-':
            par[f(a)] = f(b)
    groups = collections.defaultdict(list)
    for r in refs:
        groups[f(r)].append(r)
    gl = sorted(groups.values(), key=lambda g: num(g[0]))
    gi = {r: i for i, g in enumerate(gl) for r in g}
    cross = {}
    for (a, b), (k, d) in pair.items():
        i, j = sorted((gi[a], gi[b]))
        if i == j:
            continue
        cross.setdefault((i, j), collections.Counter())[k] += 1
    def letter(c):
        # Both a bridge and a subway, used about as often: either will do.
        lower = collections.Counter()
        upper = sum(v for k, v in c.items() if k.isupper())
        for k, v in c.items():
            lower[k.lower()] += v
        if lower.get('b') and lower.get('s') and min(lower['b'], lower['s']) * 2 >= max(lower['b'], lower['s']):
            k = 'e'
        else:
            k = lower.most_common(1)[0][0]
        # Upper case: a level walk round (through a concourse, say) is also there for most pairs.
        return k.upper() if k in 'bse' and upper * 2 > sum(c.values()) else k
    xs = ''.join(letter(cross[(i, j)]) for i, j in itertools.combinations(range(len(gl)), 2))
    mixed = [(i, j, dict(c)) for (i, j), c in cross.items() if len(c) > 1]
    return gl, xs, pair, mixed


flat_plat_nodes = set()
HOOK = None   # exits.py sets this to look at each station after solve()


def main():
    src, out = sys.argv[1], sys.argv[2]
    only = set(sys.argv[3:])
    os.makedirs(out, exist_ok=True)
    cache = os.path.join(out, 'cache.pickle')
    if os.path.exists(cache):
        with open(cache, 'rb') as fh:
            st, ways, lifts, rels = pickle.load(fh)
        th = types.SimpleNamespace(ways=ways, lifts=lifts, rels=rels)
    else:
        s = Stations()
        s.apply_file(src)
        st = s.st
        cells = set()
        for lon, lat, _ in st.values():
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    cells.add(cell(lon + dx * NEAR, lat + dy * NEAR))
        th = Things(cells, s.rel_ways)
        th.apply_file(src, locations=True, idx='sparse_mem_array')
        with open(cache, 'wb') as fh:
            pickle.dump((st, th.ways, th.lifts, th.rels), fh)
    print(f'{len(st)} stations with a code', file=sys.stderr)
    print(f'{len(th.ways)} ways, {len(th.lifts)} lifts, {len(th.rels)} platform relations', file=sys.stderr)

    # Station index by cell.
    by_cell = collections.defaultdict(list)
    for crs, (lon, lat, _) in st.items():
        by_cell[cell(lon, lat)].append(crs)

    def metres(a, b, lat):
        return math.hypot((a[0] - b[0]) * 111320 * math.cos(math.radians(lat)), (a[1] - b[1]) * 110540)

    def nearest(lon, lat):
        c = cell(lon, lat)
        best = None
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for crs in by_cell.get((c[0] + dx, c[1] + dy), ()):
                    d = metres((lon, lat), st[crs][:2], lat)
                    if best is None or d < best[0]:
                        best = (d, crs)
        return best

    # Platforms: each to the nearest station.
    plat_shapes = collections.defaultdict(lambda: collections.defaultdict(list))
    platform_items = [(t, [pts]) for kind, t, pts in th.ways.values() if kind == 'platform' and refs_of(t)]
    for t, members in th.rels:
        shapes = [th.ways[m][2] for m in members if m in th.ways]
        if shapes:
            platform_items.append((t, shapes))
    for t, shapes in platform_items:
        allp = [p for s in shapes for p in s]
        lon = sum(p[1] for p in allp) / len(allp)
        lat = sum(p[2] for p in allp) / len(allp)
        nb = nearest(lon, lat)
        if nb and nb[0] <= PLATFORM_MAX:
            for r in refs_of(t):
                plat_shapes[nb[1]][r].extend(shapes)
    # Walks and rails by cell, for quick lookup.
    walk_cells = collections.defaultdict(list)
    rail_nodes = set()
    rail_cells = collections.defaultdict(list)
    for wid, (kind, t, pts) in th.ways.items():
        if kind in ('walk', 'road'):
            for c in {cell(p[1], p[2]) for p in pts}:
                walk_cells[c].append(wid)
        elif kind == 'rail':
            rail_nodes.update(p[0] for p in pts)
            for u, v in zip(pts, pts[1:]):
                rail_cells[cell(u[1], u[2])].append(((u[1], u[2]), (v[1], v[2]), kind_of(t) == 'b'))
    bcells = collections.defaultdict(list)
    for wid, (kind, t, pts) in th.ways.items():
        if kind == 'building':
            for c in {cell(p[1], p[2]) for p in pts}:
                bcells[c].append(wid)
    lift_cells = collections.defaultdict(list)
    for i, (x, y) in th.lifts.items():
        lift_cells[cell(x, y)].append(i)

    table, report = {}, []
    for crs in sorted(st):
        if only and crs not in only:
            continue
        plats = {r: [[(p[0], p[1], p[2]) for p in sh] for sh in shapes] for r, shapes in plat_shapes.get(crs, {}).items()}
        name = st[crs][2]
        if len(plats) < 2:
            report.append(f'{crs} {name}: {len(plats)} platform(s) on the map')
            continue
        lon, lat = st[crs][:2]
        c0 = cell(lon, lat)
        cs = {(c0[0] + dx, c0[1] + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
        wids = {w for c in cs for w in walk_cells.get(c, ())}
        walks = [(dict(th.ways[w][1], _road=th.ways[w][0] == 'road', _id=w), th.ways[w][2]) for w in wids]
        lifts = {i: th.lifts[i] for c in cs for i in lift_cells.get(c, ())}
        global flat_plat_nodes
        flat_plat_nodes = {p[0] for shapes in plats.values() for sh in shapes for p in sh}
        segs = [sg for c in cs for sg in rail_cells.get(c, ())]
        gl, xs, pair, mixed = solve(crs, st[crs], plats, walks, lifts, rail_nodes, segs)
        if HOOK:
            # exits.py: the station's walking graph is in LAST; its station buildings' outlines.
            bw = {w for c in cs for w in bcells.get(c, ())}
            HOOK(crs, name, [th.ways[w][2] for w in bw])
        # Within each group, islands: platforms whose shapes touch or are the same shape.
        pts_of = {r: {p[0] for sh in shapes for p in sh} for r, shapes in plats.items()}
        isl = []
        for g in gl:
            ip = {r: r for r in g}

            def fi(x):
                while ip[x] != x:
                    x = ip[x]
                return x
            for x, y in itertools.combinations(g, 2):
                if pts_of[x] & pts_of[y]:
                    ip[fi(x)] = fi(y)
            parts = collections.defaultdict(list)
            for r in g:
                parts[fi(r)].append(r)
            isl.append(sorted(parts.values(), key=lambda q: num(q[0])))
        table[crs] = {'g': isl, 'x': xs}
        line = f"{crs} {name}: {' | '.join('/'.join(g) for g in gl)}  [{xs}]"
        if '?' in xs:
            line += '  (some pairs: no walk found)'
        if mixed:
            line += f'  mixed: {mixed}'
        report.append(line)
    with open(os.path.join(out, 'platform-links.json'), 'w') as fh:
        json.dump(table, fh, separators=(',', ':'), sort_keys=True)
    with open(os.path.join(out, 'report.txt'), 'w') as fh:
        fh.write('\n'.join(report) + '\n')
    print(f'{len(table)} stations in the table', file=sys.stderr)


if __name__ == '__main__':
    main()
