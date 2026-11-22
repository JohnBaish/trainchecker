"""Rewrites the counts in COVERAGE.md from stretches.json and passes-near.json.

  python3 -I coverage.py

Only the part between the two "counts" markers changes; the rest of COVERAGE.md is written by hand.
"""
import re, collections
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import pn  # noqa: E402

START, END = '<!-- counts: made by coverage.py -->', '<!-- end of counts -->'


def main():
    net, data = pn.load_network(), pn.load_data()
    done = set(data['items']) | set(data.get('skipped', {}))
    total, got = collections.Counter(), collections.Counter()
    for st in net['stretches']:
        ph = pn.phase_of(st)
        total[ph] += 1
        got[ph] += st['id'] in done
    todo = [s for s in pn.ordered(net['stretches']) if s['id'] not in done]
    nxt = todo[0] if todo else None
    lines = [START, '', f'{len(done)} of {len(net["stretches"])} stretches done.', '']
    for i, ph in enumerate(pn.PHASES, 1):
        word = pn.REGION_WORDS.get(ph, ph)
        mark = 'done' if total[ph] and got[ph] == total[ph] else ('next' if nxt and pn.phase_of(nxt) == ph else '')
        lines.append(f'{i}. {word}: {got[ph]} of {total[ph]} done' + (f' ({mark})' if mark else '') + '.')
    if nxt:
        names = net['stations']
        lines += ['', f'Next stretch in the order: {nxt["id"]} ({names[nxt["a"]]["name"]} to {names[nxt["b"]]["name"]}).']
    lines += ['', END]
    text = open(pn.HERE + '/COVERAGE.md').read()
    text = re.sub(re.escape(START) + '.*?' + re.escape(END), '\n'.join(lines), text, flags=re.S)
    open(pn.HERE + '/COVERAGE.md', 'w').write(text)
    print('\n'.join(lines[2:-2]))


if __name__ == '__main__':
    main()
