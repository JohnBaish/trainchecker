"""John's corrections to the platform links table (links-overrides.json beside this script), applied to
src/data/platform-links.json in place. Run it after copying a fresh build_table.py output into src/data/.
Running it twice changes nothing.   python3 -I apply_links_overrides.py ../../src/data/platform-links.json"""
import sys, json, os

here = os.path.dirname(os.path.abspath(__file__))
ov = json.load(open(os.path.join(here, 'links-overrides.json')))
path = sys.argv[1]
t = json.load(open(path))
for crs, o in ov.items():
    if crs.startswith('_'):
        continue
    st = t[crs]
    if 'islands' in o:
        want = {p for isl in o['islands'] for p in isl}
        for g, grp in enumerate(st['g']):
            have = {p for isl in grp for p in isl}
            if have & want:
                if have != want:
                    sys.exit(f'{crs}: the islands given ({sorted(want)}) are not one level group in the table ({sorted(have)})')
                st['g'][g] = o['islands']
    if 'w' in o:
        st['w'] = o['w']
with open(path, 'w') as fh:
    json.dump(t, fh, separators=(',', ':'), sort_keys=True, ensure_ascii=False)
print('corrections applied:', ', '.join(c for c in ov if not c.startswith('_')), file=sys.stderr)
