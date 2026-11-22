"""Every stretch of railway between neighbouring stations, for "Your train passes near…".

Reads a United Kingdom extract from OpenStreetMap (a .osm.pbf file from download.openstreetmap.fr, as
for the platform table) and the boundaries of the UK's countries and England's regions (ONS, Open
Government Licence), and writes design/passes-near/stretches.json and stretches-report.md.

  python3 -I build_stretches.py uk.osm.pbf countries.geojson regions.geojson out-dir

Needs pyosmium, shapely, pyproj and numpy (pip install osmium shapely pyproj numpy), and about 8 GB of
memory. The boundaries are ONS's "Countries (December 2025) Boundaries UK BGC" and "Regions (December
2025) Boundaries EN BGC", fetched as GeoJSON in British National Grid (outSR=27700) from
services1.arcgis.com/ESMARspQHYMw9BZ9.

How it works:
- Stations: National Rail stations in src/data/stations.json, found on the map by their code
  (`ref:crs`).
- Track: `railway=rail` in use, the Elizabeth Line included (it is drawn as `rail`); left out are
  sidings, yards and spurs, heritage, industrial, military and test lines, and freight-only lines.
  The Underground (`railway=subway`), trams and light railways aren't `rail`, so they're left out.
- Each station's own track: every bit of track beside one of its platforms (within 25 metres and
  running the same way), so the through lines of a four-track station count as passing it even
  where only the slow lines have platforms. Where no platform is drawn, the track within about 60
  metres of where the station is on the map.
- Stretches: from each station, the track is followed outwards (never turning more than 50 degrees
  at a junction, so never reversing) until it reaches another station's track. Each station
  reached is a neighbour: a stretch is a pair of stations with no other station between them
  along the track, whether or not trains stop. If there are two ways between them, the shorter.
- Each stretch keeps its track (simplified to within 5 metres), its length, the countries it is
  in, its region (where most of its length in England is) and the train companies whose
  OpenStreetMap routes use most of it. A stretch is kept if any of it is in England.
"""
import sys, os, json, math, heapq, pickle, collections, datetime
import numpy as np
import osmium
import shapely
from shapely.geometry import shape, LineString, Point
from shapely.strtree import STRtree
from pyproj import Transformer

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
BAD_USAGE = {'industrial', 'military', 'tourism', 'test', 'freight'}
BAD_SERVICE = {'siding', 'yard', 'spur'}
STEP = 20.0          # metres: track is cut into pieces no longer than this
PLATFORM_NEAR = 25.0  # metres: track this close to a platform, running the same way, is the station's
PARALLEL = 35.0      # degrees
TURN = 50.0          # degrees: the sharpest turn allowed at a junction
PLATFORM_STATION = 500.0  # metres: a platform belongs to the nearest station within this
MAX_SEARCH = 120000.0     # metres: the longest stretch looked for
SIMPLIFY = 5.0       # metres
PAST = 1000.0        # metres: see the possible avoiding lines in build()
PAST_EXTRA = 2500.0

TO_GRID = Transformer.from_crs('EPSG:4326', 'EPSG:27700', always_xy=True)
TO_LL = Transformer.from_crs('EPSG:27700', 'EPSG:4326', always_xy=True)


def is_platform(t):
    if t.get('railway') == 'platform':
        pass
    elif t.get('public_transport') == 'platform' and (t.get('train') == 'yes' or t.get('railway') == 'platform'):
        pass
    else:
        return False
    if t.get('subway') == 'yes' or t.get('tram') == 'yes' or t.get('bus') == 'yes' or t.get('light_rail') == 'yes':
        return t.get('train') == 'yes'
    return True


def is_track(t):
    if t.get('railway') != 'rail':
        return False
    if t.get('usage') in BAD_USAGE or t.get('service') in BAD_SERVICE:
        return False
    if t.get('railway:preserved') == 'yes' or t.get('railway:traffic_mode') == 'freight':
        return False
    return True


def read(pbf, codes):
    """Two passes over the extract; returns stations, tracks, platforms and route operators."""
    route_ops = collections.defaultdict(set)    # way id -> operators of train routes using it
    plat_rel_ways = set()
    fp = osmium.FileProcessor(pbf, osmium.osm.RELATION).with_filter(osmium.filter.KeyFilter('route', 'railway', 'public_transport'))
    for r in fp:
        t = dict(r.tags)
        if t.get('type') in ('route', None) and t.get('route') == 'train':
            op = t.get('operator') or t.get('network')
            if op:
                for m in r.members:
                    if m.type == 'w':
                        route_ops[m.ref].add(op)
        elif is_platform(t):
            for m in r.members:
                if m.type == 'w':
                    plat_rel_ways.add(m.ref)
    print('pass 1:', len(route_ops), 'route ways,', len(plat_rel_ways), 'platform relation ways', flush=True)

    stations = {}       # crs -> (lon, lat, name, how)
    tracks = []          # (way id, [(node id, lon, lat)])
    plats = []           # [(lon, lat)]
    fp = (osmium.FileProcessor(pbf, osmium.osm.NODE | osmium.osm.WAY).with_locations()
          .with_filter(osmium.filter.KeyFilter('railway', 'public_transport', 'ref:crs')))
    for o in fp:
        t = dict(o.tags)
        if o.is_node():
            crs = (t.get('ref:crs') or '').strip().upper()
            if crs in codes and (t.get('railway') in ('station', 'halt') or t.get('public_transport') == 'station'):
                rank = 0 if t.get('railway') in ('station', 'halt') else 1
                if crs not in stations or rank < stations[crs][3]:
                    stations[crs] = (o.location.lon, o.location.lat, t.get('name', ''), rank)
            continue
        try:
            pts = [(n.ref, n.lon, n.lat) for n in o.nodes]
        except osmium.InvalidLocationError:
            continue
        if is_track(t):
            tracks.append((o.id, pts))
        elif is_platform(t) or o.id in plat_rel_ways:
            plats.append([(p[1], p[2]) for p in pts])
        crs = (t.get('ref:crs') or '').strip().upper()
        if crs in codes and crs not in stations and (t.get('railway') in ('station', 'halt') or t.get('public_transport') == 'station'):
            xs = [p[1] for p in pts]
            ys = [p[2] for p in pts]
            stations[crs] = (sum(xs) / len(xs), sum(ys) / len(ys), t.get('name', ''), 2)
    print('pass 2:', len(stations), 'stations,', len(tracks), 'track ways,', len(plats), 'platforms', flush=True)
    return stations, tracks, plats, dict(route_ops)


def heading(ax, ay, bx, by):
    return math.degrees(math.atan2(by - ay, bx - ax))


def turn(h1, h2):
    d = abs(h1 - h2) % 360
    return min(d, 360 - d)


def build(stations, tracks, plats, route_ops):
    # Every track node, in British National Grid metres.
    ids = {}
    lon, lat = [], []
    for wid, pts in tracks:
        for nid, x, y in pts:
            if nid not in ids:
                ids[nid] = len(lon)
                lon.append(x)
                lat.append(y)
    X, Y = TO_GRID.transform(np.array(lon), np.array(lat))
    X, Y = list(X), list(Y)
    # Segments, cut into pieces of at most STEP metres; each remembers its way.
    adj = collections.defaultdict(list)   # node -> [(other node, way id)]
    seen = set()
    for wid, pts in tracks:
        seq = [ids[p[0]] for p in pts]
        for u, v in zip(seq, seq[1:]):
            if u == v or (u, v) in seen or (v, u) in seen:
                continue
            seen.add((u, v))
            L = math.hypot(X[v] - X[u], Y[v] - Y[u])
            k = int(L // STEP)
            prev = u
            for i in range(1, k + 1):
                f = i / (k + 1)
                n = len(X)
                X.append(X[u] + f * (X[v] - X[u]))
                Y.append(Y[u] + f * (Y[v] - Y[u]))
                adj[prev].append((n, wid))
                adj[n].append((prev, wid))
                prev = n
            adj[prev].append((v, wid))
            adj[v].append((prev, wid))
    del seen
    N = len(X)
    X, Y = np.array(X), np.array(Y)
    print('graph:', N, 'nodes', flush=True)

    # Stations in grid metres.
    codes = sorted(stations)
    sx, sy = TO_GRID.transform(np.array([stations[c][0] for c in codes]), np.array([stations[c][1] for c in codes]))
    spos = {c: (sx[i], sy[i]) for i, c in enumerate(codes)}
    stree = STRtree([Point(spos[c]) for c in codes])

    # Platforms: each to the nearest station within PLATFORM_STATION metres; their pieces, with headings.
    seg_geoms, seg_head, seg_st = [], [], []
    for p in plats:
        gx, gy = TO_GRID.transform(np.array([q[0] for q in p]), np.array([q[1] for q in p]))
        cx, cy = float(np.mean(gx)), float(np.mean(gy))
        i, d = stree.query_nearest(Point(cx, cy), return_distance=True)
        if len(i) == 0 or d[0] > PLATFORM_STATION:
            continue
        st = codes[int(i[0])]
        for k in range(len(gx) - 1):
            if gx[k] == gx[k + 1] and gy[k] == gy[k + 1]:
                continue
            seg_geoms.append(LineString([(gx[k], gy[k]), (gx[k + 1], gy[k + 1])]))
            seg_head.append(heading(gx[k], gy[k], gx[k + 1], gy[k + 1]))
            seg_st.append(st)
    ptree = STRtree(seg_geoms)
    pts = shapely.points(X, Y)
    node_i, seg_i = ptree.query(pts, predicate='dwithin', distance=PLATFORM_NEAR)
    zone = [None] * N
    zdist = [1e9] * N
    for n, s in zip(node_i, seg_i):
        n = int(n)
        nb = adj[n]
        if not nb:
            continue
        o = nb[0][0]
        h = heading(X[n], Y[n], X[o], Y[o])
        t = turn(h, seg_head[s]) % 180
        if min(t, 180 - t) > PARALLEL:
            continue
        d = seg_geoms[s].distance(pts[n])
        if d < zdist[n]:
            zdist[n], zone[n] = d, seg_st[s]
    with_plat = set(z for z in zone if z)
    # Stations with no platform drawn: the track near where the station is.
    ntree = STRtree(pts)
    for c in codes:
        if c in with_plat:
            continue
        p = Point(spos[c])
        i, d = ntree.query_nearest(p, return_distance=True)
        if len(i) == 0 or d[0] > 400:
            continue
        r = min(300.0, d[0] + 60.0)
        for n in ntree.query(p, predicate='dwithin', distance=r):
            n = int(n)
            if zone[n] is None:
                zone[n] = c
    print('stations with platforms drawn:', len(with_plat), '; on the track at all:', len(set(z for z in zone if z)), flush=True)

    # Links: runs of pieces between junctions (or where a station's track starts or ends).
    def seg_zone(u, v):
        return zone[u] if zone[u] == zone[v] else None

    key = [len(adj[n]) != 2 or seg_zone(n, adj[n][0][0]) != seg_zone(n, adj[n][1][0]) for n in range(N)]
    links = []        # (nodes, zone, length, ways)
    done = set()
    for s in range(N):
        if not key[s]:
            continue
        for v, wid in adj[s]:
            if (s, v) in done:
                continue
            seq, ways = [s, v], collections.Counter()
            ways[wid] += math.hypot(X[v] - X[s], Y[v] - Y[s])
            z = seg_zone(s, v)
            prev, cur = s, v
            while not key[cur]:
                nxt = [(a, w) for a, w in adj[cur] if a != prev]
                if not nxt:
                    break
                a, w = nxt[0]
                ways[w] += math.hypot(X[a] - X[cur], Y[a] - Y[cur])
                prev, cur = cur, a
                seq.append(cur)
                if cur == s:
                    break
            done.add((s, v))
            done.add((seq[-1], seq[-2]))
            L = sum(math.hypot(X[b] - X[a], Y[b] - Y[a]) for a, b in zip(seq, seq[1:]))
            links.append((seq, z, L, ways))
    print('links:', len(links), flush=True)

    # Moves between links at each node: no sharper turn than TURN degrees, never back.
    at_start = collections.defaultdict(list)   # node -> [(link, dir)] leaving it
    for li, (seq, z, L, w) in enumerate(links):
        at_start[seq[0]].append((li, 0))
        at_start[seq[-1]].append((li, 1))

    def nodes_of(li, d):
        s = links[li][0]
        return s if d == 0 else s[::-1]

    def out_head(li, d):
        s = nodes_of(li, d)
        return heading(X[s[0]], Y[s[0]], X[s[1]], Y[s[1]])

    def in_head(li, d):
        s = nodes_of(li, d)
        return heading(X[s[-2]], Y[s[-2]], X[s[-1]], Y[s[-1]])

    moves = {}
    for li in range(len(links)):
        for d in (0, 1):
            end = nodes_of(li, d)[-1]
            h = in_head(li, d)
            moves[(li, d)] = [(lj, e) for lj, e in at_start[end] if not (lj == li and e != d)
                              and lj != li and turn(h, out_head(lj, e)) <= TURN]

    by_zone = collections.defaultdict(list)
    for li, l in enumerate(links):
        if l[1]:
            by_zone[l[1]].append(li)

    def search(c):
        """The nearest way to each neighbouring station: {other: (cost, [(link, dir)], last node)}."""
        px, py = spos[c]
        best, parent, found = {}, {}, {}
        heap = []
        for li in by_zone[c]:
            for d in (0, 1):
                s = nodes_of(li, d)[0]
                cost = math.hypot(X[s] - px, Y[s] - py) + links[li][2]
                if cost < best.get((li, d), 1e18):
                    best[(li, d)] = cost
                    parent[(li, d)] = None
                    heapq.heappush(heap, (cost, li, d))
        while heap:
            cost, li, d = heapq.heappop(heap)
            if cost > best.get((li, d), 1e18) or cost > MAX_SEARCH:
                continue
            z = links[li][1]
            if z and z != c:
                # In a neighbour's own track: note the way to the point nearest its middle, and go on
                # only within its track (never out the other side).
                s = nodes_of(li, d)
                tx, ty = spos[z]
                left = 0.0
                for k in range(len(s) - 1, -1, -1):
                    fin = cost - left + math.hypot(X[s[k]] - tx, Y[s[k]] - ty)
                    if fin < found.get(z, (1e18,))[0]:
                        path, q = [], (li, d)
                        while q:
                            path.append(q)
                            q = parent[q]
                        found[z] = (fin, path[::-1], k)
                    if k:
                        left += math.hypot(X[s[k]] - X[s[k - 1]], Y[s[k]] - Y[s[k - 1]])
                for nxt in moves[(li, d)]:
                    if links[nxt[0]][1] == z:
                        nc = cost + links[nxt[0]][2]
                        if nc < best.get(nxt, 1e18):
                            best[nxt] = nc
                            parent[nxt] = (li, d)
                            heapq.heappush(heap, (nc, nxt[0], nxt[1]))
                continue
            for nxt in moves[(li, d)]:
                nc = cost + links[nxt[0]][2]
                if nc < best.get(nxt, 1e18):
                    best[nxt] = nc
                    parent[nxt] = (li, d)
                    heapq.heappush(heap, (nc, nxt[0], nxt[1]))
        return found

    found = {}
    for k, c in enumerate(codes):
        if by_zone[c]:
            found[c] = search(c)
        if k % 200 == 0:
            print('search', k, c, flush=True)

    def coords(path, a, end):
        """The track of a path, from the node of its first link nearest a's middle to node `end` of its last."""
        out = []
        for i, (li, d) in enumerate(path):
            s = nodes_of(li, d)
            if i == len(path) - 1:
                s = s[:end + 1]
            if i == 0:
                ax, ay = spos[a]
                k = min(range(len(s)), key=lambda j: (X[s[j]] - ax) ** 2 + (Y[s[j]] - ay) ** 2)
                s = s[k:] if len(path) > 1 else s[min(k, len(s) - 2):]
            out.extend((X[n], Y[n]) for n in (s if not out else s[1:]))
        return out

    stretches = {}
    for a in found:
        for b, (cost, path, end) in found[a].items():
            if a > b:
                continue
            back = found.get(b, {}).get(a)
            geom = coords(path, a, end)
            if len(geom) < 2:
                geom = coords(path, a, len(nodes_of(*path[-1])) - 1)
            # Train companies: those whose routes use at least half the track between the stations.
            between = collections.Counter()
            total = 0.0
            for li, d in path:
                if links[li][1]:
                    continue
                for w, L in links[li][3].items():
                    total += L
                    for op in route_ops.get(w, ()):
                        between[op] += L
            ops = sorted(op for op, L in between.items() if total and L >= 0.5 * total)
            stretches[(a, b)] = {'geom': geom, 'ops': ops, 'cost': cost, 'oneway': not back}
    print('stretches:', len(stretches), flush=True)

    # Possible avoiding lines: a stretch A–C that runs within PAST metres of station B, where A–B and
    # B–C are stretches too and together at most PAST_EXTRA metres longer. Some are lines round B's
    # platforms that a train passing B wouldn't use (York's, Didcot's, Norwich's); others are real lines
    # beside B (Reading–Tilehurst passes Reading West; Bristol–Keynsham, Lawrence Hill). The map can't
    # tell them apart, so they're kept and marked `past`, to be looked at when their batch comes up.
    nb = collections.defaultdict(set)
    for a, b in stretches:
        nb[a].add(b)
        nb[b].add(a)

    def length(a, b):
        return LineString(stretches[tuple(sorted((a, b)))]['geom']).length

    dropped = {}
    for (a, c), s in stretches.items():
        line = LineString(s['geom'])
        for b in sorted(nb[a] & nb[c]):
            if line.distance(Point(spos[b])) <= PAST and length(a, b) + length(b, c) <= line.length + PAST_EXTRA:
                dropped[(a, c)] = b
                break
    for k, b in dropped.items():
        stretches[k]['past'] = b
    print('possible avoiding lines:', len(dropped), flush=True)
    return stretches, spos, codes, set(c for c in codes if by_zone[c]), dropped


def classify(stretches, countries_file, regions_file):
    def load(path, key):
        d = json.load(open(path))
        return [(f['properties'][key], shape(f['geometry'])) for f in d['features']]
    C = load(countries_file, 'CTRY25NM')
    R = load(regions_file, 'RGN25NM')
    for _, g in C + R:
        shapely.prepare(g)

    def which(areas, xs, ys):
        """The area each point is in; a point in none (the sea, an estuary) goes to the nearest."""
        out = np.full(len(xs), -1)
        for i, (_, g) in enumerate(areas):
            out[(out < 0) & shapely.contains_xy(g, xs, ys)] = i
        for j in np.where(out < 0)[0]:
            p = Point(xs[j], ys[j])
            out[j] = min(range(len(areas)), key=lambda i: areas[i][1].distance(p))
        return out

    for k, s in stretches.items():
        line = LineString(s['geom'])
        L = max(line.length, 1.0)
        n = max(2, int(L // 200) + 1)
        samples = shapely.line_interpolate_point(line, np.linspace(0, 1, n), normalized=True)
        xs, ys = shapely.get_x(samples), shapely.get_y(samples)
        per = L / n
        clen, rlen = collections.Counter(), collections.Counter()
        ci = which(C, xs, ys)
        for c in ci:
            clen[C[c][0]] += per
        eng = ci == [i for i, (nm, _) in enumerate(C) if nm == 'England'][0]
        if eng.any():
            for r in which(R, xs[eng], ys[eng]):
                rlen[R[r][0]] += per
        s['countries'] = [c for c, _ in clen.most_common()]
        s['region'] = rlen.most_common(1)[0][0] if rlen else None
        s['regions'] = [r for r, _ in rlen.most_common()]


def main():
    pbf, countries_file, regions_file, out = sys.argv[1:5]
    names = dict(json.load(open(os.path.join(REPO, 'src', 'data', 'stations.json'))))
    cache = os.path.join(out, 'read.pickle')
    if os.path.exists(cache):
        stations, tracks, plats, route_ops = pickle.load(open(cache, 'rb'))
    else:
        stations, tracks, plats, route_ops = read(pbf, set(names))
        pickle.dump((stations, tracks, plats, route_ops), open(cache, 'wb'))
    stretches, spos, codes, on_track, _ = build(stations, tracks, plats, route_ops)
    classify(stretches, countries_file, regions_file)

    kept = {k: s for k, s in stretches.items() if 'England' in s['countries']}
    used = sorted(set(c for k in kept for c in k))
    lls = {}
    xs = [spos[c][0] for c in used]
    ys = [spos[c][1] for c in used]
    lo, la = TO_LL.transform(np.array(xs), np.array(ys))
    for i, c in enumerate(used):
        lls[c] = (round(float(lo[i]), 5), round(float(la[i]), 5))

    rows = []
    for (a, b), s in sorted(kept.items()):
        g = LineString(s['geom']).simplify(SIMPLIFY)
        gx, gy = zip(*g.coords)
        lo, la = TO_LL.transform(np.array(gx), np.array(gy))
        row = {'id': f'{a}-{b}', 'a': a, 'b': b, 'lengthM': int(round(LineString(s['geom']).length)),
               'region': s['region']}
        if len(s['regions']) > 1:
            row['regions'] = s['regions']
        others = [c for c in s['countries'] if c != 'England']
        if others:
            row['crosses'] = others
        row['operators'] = s['ops']
        if s.get('past'):
            row['past'] = s['past']
        row['track'] = [[round(float(x), 5), round(float(y), 5)] for x, y in zip(lo, la)]
        rows.append(row)

    made = datetime.date.today().isoformat()
    about = ("Every stretch of railway between neighbouring National Rail stations with any of it in England, "
             "from the OpenStreetMap United Kingdom extract of November 21st 2026 (download.openstreetmap.fr), "
             "made by build_stretches.py on " + made + ". A stretch is a pair of stations with no other station "
             "between them along the track, whether or not trains stop. id is the two codes in alphabetical "
             "order, a and b likewise; track runs from a to b ([longitude, latitude], simplified to within 5 "
             "metres). region is England's region with most of the stretch; crosses lists the other countries "
             "it runs into. operators are the train companies whose OpenStreetMap routes use at least half of "
             "it (incomplete). past, where present, names a station the stretch runs past: it may be an avoiding "
             "line that passenger trains don't use (see stretches-report.md). Derived from OpenStreetMap, so under the Open Database Licence, "
             "© OpenStreetMap contributors; boundaries: ONS, Open Government Licence.")
    stations_out = {c: {'name': names[c], 'lon': lls[c][0], 'lat': lls[c][1]} for c in used}
    path = os.path.join(out, 'stretches.json')
    with open(path, 'w') as f:
        f.write('{\n "about": ' + json.dumps(about, ensure_ascii=False) + ',\n "stations": {\n')
        f.write(',\n'.join(f'  {json.dumps(c)}: {json.dumps(v, ensure_ascii=False)}' for c, v in stations_out.items()))
        f.write('\n },\n "stretches": [\n')
        f.write(',\n'.join('  ' + json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in rows))
        f.write('\n ]\n}\n')

    # The report.
    missing = sorted(c for c in names if c not in stations)
    off_track = sorted(c for c in stations if c not in on_track)
    in_any = set(c for k in stretches for c in k)
    alone = sorted(c for c in on_track if c not in in_any)
    per_region = collections.Counter(r['region'] for r in rows)
    long_ = sorted((r for r in rows if r['lengthM'] > 40000), key=lambda r: -r['lengthM'])
    oneway = sorted(f'{a}-{b}' for (a, b), s in kept.items() if s['oneway'])
    lines = ['# Stretches: the build report', '',
             f'Made by `build_stretches.py` on {made} from the OpenStreetMap UK extract of November 21st 2026.', '',
             f'- Stations in `src/data/stations.json`: {len(names)}; found on the map by code: {len(stations)}; '
             f'on the track: {len(on_track)}.',
             f'- Stretches in the UK: {len(stretches)}; with any of it in England (kept): {len(rows)}; '
             f'stations in them: {len(used)}.',
             f'- Crossing into Wales or Scotland: {sum(1 for r in rows if "crosses" in r)}.', '',
             '## Per region', '']
    for r, n in per_region.most_common():
        lines.append(f'- {r}: {n}')
    lines += ['', '## Stations not found on the map by their code', '',
              ', '.join(f'{c} ({names[c]})' for c in missing) or 'None.', '',
              '## Stations found but not beside any track used', '',
              ', '.join(f'{c} ({names[c]})' for c in off_track) or 'None.', '',
              '## Stations on the track but in no stretch', '',
              ', '.join(f'{c} ({names[c]})' for c in alone) or 'None.', '',
              '## Stretches longer than 40 km (to look at)', '']
    lines += [f'- {r["id"]} ({names[r["a"]]} to {names[r["b"]]}): {r["lengthM"] / 1000:.1f} km' for r in long_] or ['None.']
    lines += ['', '## Possible avoiding lines (marked `past`; look at each when its batch comes up)', '',
              'Each runs past the station named, and the stretches to and from that station are together hardly '
              'longer. Some are lines round its platforms that passenger trains passing it don\'t use (York, Didcot, '
              'Norwich); others are real lines beside it (Reading to Tilehurst, Bristol to Keynsham, Clapham '
              'Junction to London Victoria). Only those with any of it in England are listed.', '']
    lines += [f'- {r["id"]} ({names[r["a"]]} to {names[r["b"]]}), past {r["past"]} ({names[r["past"]]})' for r in rows if r.get('past')] or ['None.']
    lines += ['', '## Stretches found from one end only', '', ', '.join(oneway) or 'None.', '']
    open(os.path.join(out, 'stretches-report.md'), 'w').write('\n'.join(lines))
    print('wrote', path, len(rows), 'stretches')


if __name__ == '__main__':
    main()
