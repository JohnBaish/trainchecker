"""Landmarks near stations, for naming exits by what's near them (John, November 22nd 2026: "the
town centre exit", "the exit for the bus station"). A trial.

  python3 -I landmarks.py uk.osm.pbf exits.json out.json

Reads the United Kingdom extract (OpenStreetMap) for: town and city centres (place=city|town, and
town halls), bus stations, hospitals, universities, shopping centres, stadiums, ferry terminals and
car parks; keeps those within 2 km of a station that has two or more exits in exits.json (the
national run of exits.py, which records each exit's position). Writes, for each such station, its
exits' positions and the landmarks near it, for name_exits.py to choose from.
Derived from OpenStreetMap: Open Database Licence (© OpenStreetMap contributors)."""
import sys, json, math, collections
import osmium

src, exits_file, out = sys.argv[1:4]
ex = json.load(open(exits_file))
CELL = 0.02
cell = lambda lon, lat: (int(math.floor(lon / CELL)), int(math.floor(lat / CELL)))
want = {}
for crs, r in ex.items():
    if len(r['exits']) < 2:
        continue
    lat, lon = r['exits'][0]['at']
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            want.setdefault((cell(lon, lat)[0] + dx, cell(lon, lat)[1] + dy), set()).add(crs)


def kind(t):
    p, a = t.get('place'), t.get('amenity')
    if p == 'city':
        return 'city centre'
    if p == 'town':
        return 'town centre'
    if a == 'townhall':
        return 'townhall'
    if a == 'bus_station':
        return 'bus station'
    if a == 'hospital':
        return 'hospital'
    if a == 'university':
        return 'university'
    if t.get('shop') == 'mall':
        return 'shopping centre'
    if t.get('leisure') == 'stadium':
        return 'stadium'
    if a == 'ferry_terminal':
        return 'ferry terminal'
    if a == 'parking' and t.get('access', 'yes') in ('yes', 'customers', 'public', 'permissive'):
        return 'car park'
    return None


class H(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.found = []

    def keep(self, t, lon, lat, osm_id):
        k = kind(t)
        if k and cell(lon, lat) in want:
            self.found.append({'k': k, 'name': t.get('name'), 'lat': round(lat, 6), 'lon': round(lon, 6), 'id': osm_id})

    def node(self, n):
        if n.tags:
            self.keep(n.tags, n.location.lon, n.location.lat, f'n{n.id}')

    def area(self, a):
        t = a.tags
        if not kind(t):
            return
        try:
            pts = [(n.lon, n.lat) for ring in a.outer_rings() for n in ring]
        except Exception:
            return
        if pts:
            self.keep(t, sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts), f'a{a.id}')


h = H()
h.apply_file(src, locations=True, idx='sparse_mem_array')
by = collections.defaultdict(list)
for f in h.found:
    c = cell(f['lon'], f['lat'])
    for crs in want.get(c, ()):
        lat, lon = ex[crs]['exits'][0]['at']
        d = math.hypot((f['lon'] - lon) * 111320 * math.cos(math.radians(lat)), (f['lat'] - lat) * 110540)
        if d <= 2000:
            by[crs].append(f)
json.dump({crs: {'exits': [e['at'] for e in ex[crs]['exits']], 'near': v} for crs, v in by.items()}, open(out, 'w'))
print(f"{len(h.found)} landmarks; {len(by)} stations with some", file=sys.stderr)
