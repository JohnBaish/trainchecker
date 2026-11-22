"""Checks passes-near.json against the network. Run before every commit of new items.

  python3 -I check.py

Fails (exit 1) on: an item not on a real stretch, or not keyed by its own stretch; anything left in
`unplaced`; a side that doesn't match the side worked out from the item's point and the stretch's
track (a to b); "{side}" in the text when there's no side, or missing when there is; a kind or
side that isn't allowed; textReverse on an item with a side; a stretch with no part in England;
the network part out of step with stretches.json; and the house wording: one to nine in figures,
"under" or "over". Warns (doesn't fail) when the point is more than 1 km from the track, or when
the stated distance is far from the worked-out one. Two items on one stretch can't happen: the
items are keyed by stretch, and to_network.py keeps a second one apart under `unplaced`.
"""
import sys
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import pn  # noqa: E402

KINDS = {'near', 'crosses', 'boundary', 'station'}
# Accepted on purpose: wording the house rules allow, by item and phrase.
ALLOW = {}


def main():
    net, data = pn.load_network(), pn.load_data()
    by = {s['id']: s for s in net['stretches']}
    errors, warnings = [], []
    want = sorted([s['a'], s['b'], s['lengthM']] for s in net['stretches'])
    have = sorted(data.get('network', {}).get('stretches', []))
    if want != have:
        errors.append('the network in passes-near.json is out of step with stretches.json: run to_network.py')
    for it in data.get('unplaced', []):
        errors.append(f'{it["a"]}-{it["b"]} ({it["name"]}): not on a stretch (in "unplaced")')
    for key, why in data.get('skipped', {}).items():
        if key not in by:
            errors.append(f'skipped {key}: not a stretch')
        if key in data.get('items', {}):
            errors.append(f'skipped {key}: has an item too')
        if not why:
            errors.append(f'skipped {key}: no reason given')
    items = data.get('items', {})
    if not isinstance(items, dict):
        sys.exit('passes-near.json is in the old form: run to_network.py')
    for key, it in items.items():
        tag = f'{key} ({it.get("name")})'
        if pn.sid(it['a'], it['b']) != key:
            errors.append(f'{tag}: keyed under the wrong stretch')
            continue
        st = by.get(key)
        if not st:
            errors.append(f'{tag}: not a stretch')
            continue
        if st.get('region') is None:
            errors.append(f'{tag}: the stretch is not in England')
        if it.get('kind') not in KINDS:
            errors.append(f'{tag}: kind "{it.get("kind")}"')
        side, text = it.get('side'), it.get('text', '')
        if side not in ('left', 'right', None):
            errors.append(f'{tag}: side "{side}"')
        if ('{side}' in text) != (side is not None):
            errors.append(f'{tag}: "{{side}}" in the text {"without" if side is None else "is missing, with"} a side')
        if side is not None and it.get('textReverse'):
            errors.append(f'{tag}: textReverse with a side (the side swaps by itself)')
        if '{side}' in it.get('textReverse', ''):
            errors.append(f'{tag}: "{{side}}" in textReverse')
        line = pn.track_line(st)
        if st['a'] != it['a']:
            line = type(line)(list(line.coords)[::-1])
        x, y = pn.grid(it['lon'], it['lat'])
        got, dist = pn.side_of_point(line, x, y)
        if dist > 1000:
            warnings.append(f'{tag}: its point is {dist:.0f} m from the track')
        if side is not None:
            if got is None:
                warnings.append(f'{tag}: its point is on the track ({dist:.0f} m), but the item has a side')
            elif got != side:
                errors.append(f'{tag}: side "{side}", but its point is on the {got} going from {it["a"]} to {it["b"]}')
        stated = it.get('distanceM')
        if isinstance(stated, (int, float)) and abs(stated - dist) > max(150, 0.5 * dist):
            warnings.append(f'{tag}: distanceM {stated}, worked out {dist:.0f}')
        for field in ('text', 'textReverse'):
            for p in pn.wording_problems(it.get(field, '')):
                if p not in ALLOW.get(key, ()):
                    errors.append(f'{tag}: {field}: {p}')
    for w in warnings:
        print('warning:', w)
    for e in errors:
        print('ERROR:', e)
    print(f'{len(items)} items, {len(errors)} errors, {len(warnings)} warnings')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
