"""Shared helpers for "Your train passes near…": the network, sides, and the order of the work.

Used by to_network.py, candidates.py, check.py and coverage.py. Needs shapely, pyproj and numpy.
"""
import os, json, re, collections
import numpy as np
from shapely.geometry import LineString, Point
from shapely.ops import nearest_points
from pyproj import Transformer

HERE = os.path.dirname(os.path.abspath(__file__))
STRETCHES = os.path.join(HERE, 'stretches.json')
DATA = os.path.join(HERE, 'passes-near.json')
TO_GRID = Transformer.from_crs('EPSG:4326', 'EPSG:27700', always_xy=True)
TO_LL = Transformer.from_crs('EPSG:27700', 'EPSG:4326', always_xy=True)
ON_TRACK = 15.0   # metres: a thing this close to the track is on it (no side)

# The order John chose (November 22nd 2026): the Great Western routes, then England's regions.
GREAT_WESTERN = 'Great Western routes'
REGIONS = ['South West', 'South East', 'London', 'East of England', 'East Midlands', 'West Midlands',
           'Yorkshire and The Humber', 'North West', 'North East']
PHASES = [GREAT_WESTERN] + REGIONS
REGION_WORDS = {'East of England': 'East of England (East Anglia)'}


def sid(a, b):
    return '-'.join(sorted((a, b)))


def load_network():
    return json.load(open(STRETCHES))


def load_data():
    return json.load(open(DATA))


def grid(lon, lat):
    x, y = TO_GRID.transform(lon, lat)
    return float(x), float(y)


def track_line(st):
    """The stretch's track in grid metres, from a to b."""
    lo = np.array([p[0] for p in st['track']])
    la = np.array([p[1] for p in st['track']])
    x, y = TO_GRID.transform(lo, la)
    return LineString(list(zip(x, y)))


def side_of_point(line, x, y):
    """('left' | 'right' | None, distance in metres) for a point, travelling along the line."""
    p = Point(x, y)
    d = line.distance(p)
    if d <= ON_TRACK:
        return None, d
    s = line.project(p)
    a = line.interpolate(max(0.0, s - 5))
    b = line.interpolate(min(line.length, s + 5))
    q = line.interpolate(s)
    dx, dy = b.x - a.x, b.y - a.y
    cross = dx * (y - q.y) - dy * (x - q.x)
    return ('left' if cross > 0 else 'right'), d


def side_of_shape(line, geom):
    """The same for an area: None if the track runs through it."""
    if geom.geom_type == 'Point':
        return side_of_point(line, geom.x, geom.y)
    if line.intersects(geom):
        return None, 0.0
    p, _ = nearest_points(geom, line)
    side, _ = side_of_point(line, p.x, p.y)
    return side, line.distance(geom)


def phase_of(st):
    if any('Great Western' in op for op in st.get('operators', [])):
        return GREAT_WESTERN
    return st.get('region')


def ordered(stretches):
    """Stretches in the order of the work: by phase, and within a phase along the lines (each run
    of the network walked depth first from its most westerly stretch), so a batch is a run of
    neighbouring stretches."""
    by_phase = collections.defaultdict(list)
    for st in stretches:
        by_phase[phase_of(st)].append(st)
    out = []
    for ph in PHASES:
        # Possible avoiding lines (marked `past`) last: each is to be looked at first.
        group = sorted(by_phase.get(ph, []), key=lambda s: bool(s.get('past')))
        at = collections.defaultdict(list)
        for st in group:
            at[st['a']].append(st)
            at[st['b']].append(st)
        done = set()

        def west(st):
            return min(st['track'][0][0], st['track'][-1][0])

        for start in sorted(group, key=lambda s: (bool(s.get('past')), west(s))):
            if start['id'] in done:
                continue
            stack = [start]
            while stack:
                st = stack.pop()
                if st['id'] in done:
                    continue
                done.add(st['id'])
                out.append(st)
                nxt = []
                for c in (st['a'], st['b']):
                    nxt.extend(o for o in at[c] if o['id'] not in done and bool(o.get('past')) == bool(st.get('past')))
                stack.extend(sorted(nxt, key=lambda o: -west(o)))
    return out


# House wording (the checks that can be made by a script).
SMALL = re.compile(r'(?<![\d.,:/-])\b([1-9])\b(?![\d.,:/-]|st\b|nd\b|rd\b|th\b)')
NUMBER_WORDS = r'(?:\d|a (?:hundred|thousand|million|dozen|mile|year|decade|century)|an hour|half|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|a dozen)'
# "under" or "over" for a quantity ("over 100 years"); "under the engineer" and "over the river" are fine.
UNDER_OVER = re.compile(r'\b(under|over)\s+' + NUMBER_WORDS, re.I)


def wording_problems(text):
    out = []
    for m in SMALL.finditer(text):
        out.append(f'"{m.group(1)}" in figures (one to nine in words)')
    for m in UNDER_OVER.finditer(text):
        out.append(f'"{m.group(0).strip()}" (house style: "less than" or "more than")')
    if "'" in text and '’' in text:
        out.append('straight and curly apostrophes mixed')
    return out
