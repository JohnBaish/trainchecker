"""Puts passes-near.json on the network: items keyed by stretch, with the stretches from stretches.json.

  python3 -I to_network.py                       re-sync the network after a new stretches.json
  python3 -I to_network.py batches/01/items.json  and add a batch's items (a list of items)

Run after build_stretches.py makes a new stretches.json, and once to turn the old file (with `lines`)
into the new one. The network part of passes-near.json is what the page needs to find a journey's
stretches: every station code with its name, and every stretch as [a, b, length in metres]. Items keep
`a` and `b` as researched (the side is for a to b). An item whose two stations aren't a stretch is
kept under `unplaced` and listed: never moved to a guessed stretch. `skipped` (kept as it is) holds
stretches that need no item, each with the reason: one no passenger train uses, say.
"""
import json, sys
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import pn  # noqa: E402

ABOUT = ("Trainchecker 'Your train passes near…'. One item per stretch between neighbouring stations, keyed by "
         "the stretch's id (its two station codes in alphabetical order). network holds every station and "
         "every stretch with any of it in England, as [a, b, length in metres], from stretches.json (OpenStreetMap, "
         "© OpenStreetMap contributors, Open Database Licence). In an item, a and b are the stretch in the "
         "direction the research was done; side is the side of the train when travelling from a to b (facing "
         "forwards): swap left and right for b to a. text has {side} for 'left' or 'right'; textReverse, where "
         "present, replaces text for b to a. England only. Every fact checked against its source.")


def main():
    net = pn.load_network()
    data = pn.load_data()
    old = data.get('items', {})
    items = list(old.values()) if isinstance(old, dict) else list(old)
    items += data.get('unplaced', [])
    have = {pn.sid(it['a'], it['b']) for it in items}
    for path in sys.argv[1:]:
        for it in json.load(open(path)):
            k = pn.sid(it['a'], it['b'])
            if k in have:
                sys.exit(f'{k}: there is already an item for this stretch ({path})')
            have.add(k)
            items.append(it)
    ids = {s['id'] for s in net['stretches']}
    placed, unplaced = {}, []
    for it in items:
        k = pn.sid(it['a'], it['b'])
        if k in ids and k not in placed:
            placed[k] = it
        else:
            unplaced.append(it)
    order = [s['id'] for s in pn.ordered(net['stretches'])]
    out = {'about': ABOUT,
           'network': {'stations': {c: v['name'] for c, v in sorted(net['stations'].items())},
                       'stretches': [[s['a'], s['b'], s['lengthM']] for s in net['stretches']]},
           'items': {k: placed[k] for k in order if k in placed}}
    if unplaced:
        out['unplaced'] = unplaced
    skipped = data.get('skipped', {})
    with open(pn.DATA, 'w') as f:
        f.write('{\n "about": ' + json.dumps(out['about'], ensure_ascii=False) + ',\n "network": {\n  "stations": ')
        f.write(json.dumps(out['network']['stations'], ensure_ascii=False, separators=(',', ':')))
        f.write(',\n  "stretches": [\n')
        f.write(',\n'.join('   ' + json.dumps(s, separators=(',', ':')) for s in out['network']['stretches']))
        f.write('\n  ]\n },\n "items": ')
        f.write(json.dumps(out['items'], ensure_ascii=False, indent=1).replace('\n', '\n '))
        if unplaced:
            f.write(',\n "unplaced": ' + json.dumps(unplaced, ensure_ascii=False, indent=1).replace('\n', '\n '))
        f.write(',\n "skipped": ' + json.dumps(skipped, ensure_ascii=False, indent=1).replace('\n', '\n '))
        f.write('\n}\n')
    print(len(placed), 'items on stretches;', len(unplaced), 'not on a stretch')
    for it in unplaced:
        print(f'  {it["a"]}-{it["b"]}: {it["name"]}')


if __name__ == '__main__':
    sys.exit(main())
