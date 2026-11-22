"""Candidates for a batch of stretches: what's within 1 km, ranked, with the side of the train.

  python3 -I candidates.py --next 40 out-dir           the next 40 stretches still to do, in order
  python3 -I candidates.py --region "South West" out-dir  every stretch still to do in a region
  python3 -I candidates.py --stretches AML-PAD,EAL-WEA out-dir   these (done or not)

Writes out-dir/candidates.json and out-dir/candidates.md, and keeps the answers it fetched in
out-dir/cache/ (so running it again costs nothing). Sources:
- Historic England's National Heritage List for England (Open Government Licence), from its open
  map service: listed buildings of Grade I and II*, scheduled monuments, registered parks and
  gardens, registered battlefields and World Heritage Sites.
- Wikipedia's geotagged articles (geosearch along the track), with each article's short
  description, length and first sentences.
Side is the train's side going from a to b, facing forwards (swap for b to a); None means the
track runs through it or within 15 metres. The ranking is only a guide: choosing is by hand.
"""
import sys, os, json, time, hashlib, argparse, urllib.parse, urllib.request
import numpy as np
from shapely.geometry import Polygon, MultiPolygon, Point
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import pn  # noqa: E402

HE = ('https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/'
      'National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer')
WIKI = 'https://en.wikipedia.org/w/api.php'
# Wikimedia asks automated clients to name a contact in the user agent; a generic one may be refused
# ("You are making too many requests"). Set PN_AGENT to one with a contact John has agreed to.
AGENT = os.environ.get('PN_AGENT') or 'heritage-near-track-research/1.0 (one-off research script)'
NEAR = 1000.0
LAYERS = [  # (layer, kind, where, score)
    (0, 'listed building', "Grade IN ('I','II*')", None),
    (6, 'scheduled monument', '1=1', 55),
    (7, 'park and garden', '1=1', None),
    (8, 'battlefield', '1=1', 70),
    (10, 'World Heritage Site', '1=1', 95),
]
LB_SCORE = {'I': 85, 'II*': 50}
PARK_SCORE = {'I': 75, 'II*': 60, 'II': 35}
WIKI_DOWN = [('list of', 45), ('season', 45), ('constituency', 45), ('ceremonial county', 40), ('county of england', 40),
             ('learned society', 30), ('company', 25), ('railway station', 40), ('railway line', 25), ('railway', 15), ('electoral', 30), ('ward', 25),
             ('village', 15), ('town', 15), ('civil parish', 15), ('suburb', 15), ('hamlet', 15),
             ('district', 15), ('area of', 15), ('neighbourhood', 15), ('school', 10), ('road', 10)]


class Fetcher:
    def __init__(self, cache):
        self.cache = cache
        os.makedirs(cache, exist_ok=True)
        self.last = 0.0
        self.dead = set()   # services that refused: not asked again in this run

    def get(self, url, params):
        if url in self.dead:
            return {}
        q = url + '?' + urllib.parse.urlencode(params)
        path = os.path.join(self.cache, hashlib.sha1(q.encode()).hexdigest() + '.json')
        if os.path.exists(path):
            return json.load(open(path))
        for attempt in range(5):
            wait = 1.0 - (time.time() - self.last)
            if wait > 0:
                time.sleep(wait)
            self.last = time.time()
            try:
                req = urllib.request.Request(q, headers={'User-Agent': AGENT})
                with urllib.request.urlopen(req, timeout=60) as r:
                    body = r.read()
                if body.startswith(b'You are making too many requests'):
                    raise IOError('rate limited')
                data = json.loads(body)
                if 'error' in data and 'ratelimited' in json.dumps(data['error']):
                    raise IOError('rate limited')
                json.dump(data, open(path, 'w'))
                return data
            except Exception as e:  # noqa: BLE001 (network trouble: try again, more slowly)
                print('  retry', attempt + 1, e, file=sys.stderr)
                time.sleep(3 * (attempt + 1))
        if url == WIKI:
            print('  Wikipedia refused: carrying on without it', file=sys.stderr)
            self.dead.add(url)
            return {}
        raise IOError('could not fetch ' + q)


def he_things(f, line):
    x0, y0, x1, y1 = line.bounds
    box = f'{x0 - NEAR:.0f},{y0 - NEAR:.0f},{x1 + NEAR:.0f},{y1 + NEAR:.0f}'
    out = []
    for layer, kind, where, score in LAYERS:
        offset = 0
        while True:
            params = {'where': where, 'geometry': box, 'geometryType': 'esriGeometryEnvelope', 'inSR': 27700,
                      'outSR': 27700, 'spatialRel': 'esriSpatialRelIntersects', 'outFields': '*',
                      'returnGeometry': 'false' if layer == 0 else 'true', 'maxAllowableOffset': 10,
                      'resultOffset': offset, 'f': 'json'}
            d = f.get(f'{HE}/{layer}/query', params)
            for ft in d.get('features', []):
                a = ft['attributes']
                if layer == 0:
                    geom = Point(a['Easting'], a['Northing'])
                else:
                    rings = (ft.get('geometry') or {}).get('rings') or []
                    polys = [Polygon(r) for r in rings if len(r) >= 4]
                    geom = MultiPolygon(polys).buffer(0) if polys else Point(a['Easting'], a['Northing'])
                side, dist = pn.side_of_shape(line, geom)
                if dist > NEAR:
                    continue
                grade = a.get('Grade')
                s = score if score is not None else (LB_SCORE if layer == 0 else PARK_SCORE).get(grade, 30)
                x, y = (geom.x, geom.y) if geom.geom_type == 'Point' else (a['Easting'], a['Northing'])
                lon, lat = pn.TO_LL.transform(x, y)
                out.append({'source': 'Historic England', 'kind': kind, 'grade': grade, 'name': a['Name'],
                            'listEntry': a['ListEntry'], 'url': a['hyperlink'], 'distanceM': int(round(dist)),
                            'side': side, 'lat': round(lat, 5), 'lon': round(lon, 5), 'base': s})
            if not d.get('exceededTransferLimit'):
                break
            offset += len(d.get('features', []))
    return out


def wiki_things(f, line):
    pages = {}
    n = max(2, int(line.length // 1500) + 2)
    for i in range(n):
        p = line.interpolate(i / (n - 1), normalized=True)
        lon, lat = pn.TO_LL.transform(p.x, p.y)
        d = f.get(WIKI, {'action': 'query', 'list': 'geosearch', 'gscoord': f'{lat:.5f}|{lon:.5f}',
                         'gsradius': 1400, 'gslimit': 500, 'gsprimary': 'primary', 'format': 'json'})
        for g in d.get('query', {}).get('geosearch', []):
            pages[g['pageid']] = g
    out = []
    for g in pages.values():
        x, y = pn.grid(g['lon'], g['lat'])
        side, dist = pn.side_of_point(line, x, y)
        if dist > NEAR:
            continue
        out.append({'source': 'Wikipedia', 'kind': 'article', 'name': g['title'], 'pageid': g['pageid'],
                    'url': 'https://en.wikipedia.org/wiki/' + urllib.parse.quote(g['title'].replace(' ', '_')),
                    'distanceM': int(round(dist)), 'side': side, 'lat': round(g['lat'], 5), 'lon': round(g['lon'], 5)})
    ids = [c['pageid'] for c in out]
    info = {}
    for i in range(0, len(ids), 50):
        d = f.get(WIKI, {'action': 'query', 'pageids': '|'.join(map(str, ids[i:i + 50])),
                         'prop': 'description|info', 'format': 'json'})
        info.update(d.get('query', {}).get('pages', {}))
    for c in out:
        p = info.get(str(c['pageid']), {})
        c['description'] = p.get('description', '')
        c['length'] = p.get('length', 0)
        s = 40 + min(30, c['length'] / 1500)
        low = c['description'].lower() + (' list of' if c['name'].startswith('List of') else '')
        for word, minus in WIKI_DOWN:
            if word in low:
                s -= minus
                break
        c['base'] = s
    return out


def extracts(f, cands):
    ids = [c['pageid'] for c in cands if c['source'] == 'Wikipedia']
    got = {}
    for i in range(0, len(ids), 20):
        d = f.get(WIKI, {'action': 'query', 'pageids': '|'.join(map(str, ids[i:i + 20])), 'prop': 'extracts',
                         'exintro': 1, 'explaintext': 1, 'exsentences': 2, 'exlimit': 20, 'format': 'json'})
        for k, p in d.get('query', {}).get('pages', {}).items():
            got[int(k)] = (p.get('extract') or '').replace('\n', ' ').strip()
    for c in cands:
        if c['source'] == 'Wikipedia':
            c['extract'] = got.get(c['pageid'], '')


def rank(cands):
    for c in cands:
        c['score'] = round(c['base'] - 15 * c['distanceM'] / NEAR, 1)
    # A Wikipedia article about the same thing as a list entry: keep the entry and note the article.
    he = [c for c in cands if c['source'] == 'Historic England']
    keep = []
    for c in cands:
        if c['source'] == 'Wikipedia':
            words = {w for w in c['name'].lower().replace(',', ' ').split() if len(w) > 3}
            twin = next((h for h in he if abs(h['lat'] - c['lat']) < 0.002 and abs(h['lon'] - c['lon']) < 0.003
                         and words & {w for w in h['name'].lower().replace(',', ' ').split() if len(w) > 3}), None)
            if twin and 'wikipedia' not in twin:
                twin['wikipedia'] = c['url']
                twin['score'] += 10
                continue
        keep.append(c)
    return sorted(keep, key=lambda c: -c['score'])


def choose(net, data, args):
    done = (set(data['items']) if isinstance(data.get('items'), dict) else set()) | set(data.get('skipped', {}))
    stretches = net['stretches']
    if args.stretches:
        want = args.stretches.split(',')
        by = {s['id']: s for s in stretches}
        missing = [w for w in want if w not in by]
        if missing:
            sys.exit('not stretches: ' + ', '.join(missing))
        return [by[w] for w in want]
    todo = [s for s in pn.ordered(stretches) if s['id'] not in done]
    if args.region:
        todo = [s for s in todo if pn.phase_of(s) == args.region]
    return todo[:args.next] if args.next else todo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--next', type=int)
    ap.add_argument('--region')
    ap.add_argument('--stretches')
    ap.add_argument('--top', type=int, default=15, help='candidates kept per stretch')
    args = ap.parse_args()
    net, data = pn.load_network(), pn.load_data()
    batch = choose(net, data, args)
    if not batch:
        sys.exit('nothing to do')
    f = Fetcher(os.path.join(args.out, 'cache'))
    names = {c: v['name'] for c, v in net['stations'].items()}
    result = {}
    for k, st in enumerate(batch):
        print(f'{k + 1}/{len(batch)} {st["id"]}', flush=True)
        line = pn.track_line(st)
        cands = rank(he_things(f, line) + wiki_things(f, line))[:args.top]
        extracts(f, cands)
        for c in cands:
            c.pop('base', None)
        result[st['id']] = {'a': st['a'], 'b': st['b'], 'aName': names[st['a']], 'bName': names[st['b']],
                            'lengthM': st['lengthM'], 'region': st['region'], 'crosses': st.get('crosses', []),
                            'operators': st['operators'], 'candidates': cands}
    if WIKI in f.dead:
        print('NOTE: Wikipedia refused this run; its articles are missing. Run again later (the answers so far are kept).')
    json.dump(result, open(os.path.join(args.out, 'candidates.json'), 'w'), indent=1, ensure_ascii=False)
    md = ['# Candidates', '', 'Made by `candidates.py`. Side: the train\'s, going from the first station to the '
          'second (swap for the other way); "on the line" means the track runs through it or within 15 metres. '
          'The ranking is only a guide. Every fact still has to be checked against a source.', '']
    if WIKI in f.dead:
        md += ['**Wikipedia refused some requests in this run, so its articles are missing or incomplete.** '
               'Run the script again later: what it has already fetched is kept.', '']
    for s_id, r in result.items():
        extra = f'; also in {", ".join(r["crosses"])}' if r['crosses'] else ''
        md += [f'## {s_id}: {r["aName"]} to {r["bName"]}', '',
               f'{r["lengthM"] / 1000:.1f} km, {r["region"]}{extra}. '
               f'{", ".join(r["operators"]) or "No train company on the map"}.', '']
        for i, c in enumerate(r['candidates'], 1):
            side = c['side'] or 'on the line'
            what = c['kind'] + (f' Grade {c["grade"]}' if c.get('grade') else '')
            if c['source'] == 'Wikipedia':
                what = c.get('description') or 'Wikipedia article'
            line = f'{i}. **{c["name"]}** ({what}): {c["distanceM"]} m, {side}. {c["url"]}'
            if c.get('wikipedia'):
                line += f' (and {c["wikipedia"]})'
            if c.get('extract'):
                line += f'\n   {c["extract"]}'
            md.append(line)
        if not r['candidates']:
            md.append('Nothing within 1 km: think of a crossing, a boundary or the station itself.')
        md.append('')
    open(os.path.join(args.out, 'candidates.md'), 'w').write('\n'.join(md))
    print('wrote', len(result), 'stretches to', args.out)


if __name__ == '__main__':
    main()
