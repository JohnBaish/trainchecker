"""Wikipedia's article locations for Great Britain, from the database dumps, in one file.

  python3 -I wiki_dump.py DUMP-DIR OUT.tsv.gz

DUMP-DIR holds three files from https://dumps.wikimedia.org/enwiki/ (one run, e.g. 20261101; check
them against that run's md5sums.txt):
  geo_tags.sql.gz     every article's coordinates (about 54 MB)
  page.sql.gz         page ids, titles and lengths (about 2.4 GB)
  page_props.sql.gz   short descriptions and disambiguation marks (about 490 MB)

Writes OUT: one line per article in namespace 0 with a primary coordinate on Earth inside a box round
Great Britain, not a redirect or disambiguation page: page id, title, lat, lon, length in bytes, short
description (tab-separated, gzipped). `candidates.py --wiki-dump OUT` then finds nearby articles from
this file instead of Wikipedia's search API, which refuses most requests from a cloud session.
Keep the dumps and OUT out of git (they're large, and remade from the dumps in about half an hour).
"""
import sys, os, gzip, re

BOX = (49.8, 56.0, -6.5, 2.0)   # lat min, lat max, lon min, lon max: England and a margin
ESC = {b'0': b'\0', b'n': b'\n', b'r': b'\r', b't': b'\t', b'Z': b'\x1a'}


def unescape(s):
    return re.sub(rb'\\(.)', lambda m: ESC.get(m.group(1), m.group(1)), s).decode('utf-8', 'replace')


def rows(path):
    """The data lines of a dump (one row per line in these dumps), as bytes, without the brackets."""
    with gzip.open(path, 'rb') as f:
        for line in f:
            if line.startswith(b'('):
                yield line.rstrip().rstrip(b',;').rstrip(b')')[1:]


def geo(path):
    out = {}
    pat = re.compile(rb"^\d+,(\d+),'earth',1,(-?[\d.]+),(-?[\d.]+),")
    for r in rows(path):
        m = pat.match(r)
        if not m:
            continue
        lat, lon = float(m.group(2)), float(m.group(3))
        if BOX[0] <= lat <= BOX[1] and BOX[2] <= lon <= BOX[3]:
            out.setdefault(int(m.group(1)), (lat, lon))
    return out


def pages(path, want):
    out = {}
    pat = re.compile(rb"^(\d+),0,'((?:[^'\\]|\\.)*)',(\d),\d,[^,]+,'\d*',(?:'\d*'|NULL),\d+,(\d+),")
    for r in rows(path):
        i = r.find(b',')
        if int(r[:i]) not in want:
            continue
        m = pat.match(r)
        if m and m.group(3) == b'0':
            out[int(m.group(1))] = (unescape(m.group(2)).replace('_', ' '), int(m.group(4)))
    return out


def props(path, want):
    desc, disamb = {}, set()
    pat = re.compile(rb"^(\d+),'([^']*)','((?:[^'\\]|\\.)*)',")
    for r in rows(path):
        i = r.find(b',')
        if int(r[:i]) not in want:
            continue
        m = pat.match(r)
        if not m:
            continue
        pid, name = int(m.group(1)), m.group(2)
        if name == b'wikibase-shortdesc':
            desc[pid] = unescape(m.group(3))
        elif name == b'disambiguation':
            disamb.add(pid)
    return desc, disamb


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    d, out = sys.argv[1], sys.argv[2]
    g = geo(os.path.join(d, 'geo_tags.sql.gz'))
    print(len(g), 'coordinates in the box', flush=True)
    p = pages(os.path.join(d, 'page.sql.gz'), g)
    print(len(p), 'articles', flush=True)
    desc, disamb = props(os.path.join(d, 'page_props.sql.gz'), p)
    n = 0
    with gzip.open(out, 'wt', encoding='utf-8') as f:
        f.write('# pageid\ttitle\tlat\tlon\tlength\tdescription\n')
        for pid, (title, length) in sorted(p.items()):
            if pid in disamb:
                continue
            lat, lon = g[pid]
            clean = [str(pid), title, f'{lat:.6f}', f'{lon:.6f}', str(length), desc.get(pid, '')]
            f.write('\t'.join(c.replace('\t', ' ').replace('\n', ' ') for c in clean) + '\n')
            n += 1
    print('wrote', n, 'articles to', out)


if __name__ == '__main__':
    main()
