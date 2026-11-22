"""Copy what the page needs from passes-near.json into src/data/passes-near.json.

  python3 -I design/passes-near/to_site.py

The page needs every stretch ([a, b, metres], to find a journey's stretches) and the items, keyed by
stretch, with only the fields it shows or uses. `unplaced` and `skipped` are left out. Run it after
each batch that should reach the page, then `npm run check`.
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'src', 'data', 'passes-near.json')
d = json.load(open(os.path.join(HERE, 'passes-near.json')))
keep = ('a', 'b', 'kind', 'side', 'text', 'textReverse')
items = {k: {f: v[f] for f in keep if v.get(f) is not None} for k, v in sorted(d['items'].items())}
out = {'about': "Made by design/passes-near/to_site.py from design/passes-near/passes-near.json: every stretch "
                 "between neighbouring stations with any of it in England ([a, b, metres]) and one item per stretch. "
                 "The network is from OpenStreetMap (see passes-near-LICENCE.md).",
       'stretches': d['network']['stretches'], 'items': items}
json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out['stretches']), 'stretches,', len(items), 'items ->', os.path.relpath(OUT), os.path.getsize(OUT), 'bytes')
