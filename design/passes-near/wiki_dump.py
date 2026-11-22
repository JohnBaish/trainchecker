"""Wikipedia's article locations for Great Britain, from the database dumps, in one file.

  python3 -I wiki_dump.py DUMP-DIR OUT-DIR

DUMP-DIR holds three files from https://dumps.wikimedia.org/enwiki/ (one run, e.g. 20261101; check
them against that run's md5sums.txt):
  geo_tags.sql.gz     every article's coordinates (about 54 MB)
  page.sql.gz         page ids, titles and lengths (about 2.4 GB)
  page_props.sql.gz   short descriptions and disambiguation marks (about 490 MB)

and, optionally, articles-index.txt.bz2: the run's pages-articles-multistream index (about 290 MB),
and redirect.sql.gz (about 190 MB): every redirect's target.

Writes OUT-DIR/gb-articles.tsv.gz: one line per article in namespace 0 with a primary coordinate on Earth inside a box round
Great Britain, not a redirect or disambiguation page: page id, title, lat, lon, length in bytes, short
description (tab-separated, gzipped). `candidates.py` finds nearby articles in this file instead of
Wikipedia's search API, which refuses most requests from a cloud session. With the index, also
OUT-DIR/gb-index.tsv.gz: where each of those articles sits in the multistream articles dump (block
start, next block start, page id, title), so `wiki_text.py` can fetch any of them by byte range without
the full index. With the redirects, also OUT-DIR/gb-redirects.tsv.gz: every redirect to one of those
articles (redirect title, article title), so other names for them can be looked up too. The files are
committed in `wiki/` (with the run in wiki/README.md), so a session
needs no download; remake them from a newer run now and then. Keep the dumps themselves out of git.
"""
import sys, os, gzip, bz2, re

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


def gb_index(path, want, out):
    """Index lines (offset:pageid:title) for the wanted page ids, each with the next block's start."""
    keep, prev_off, pending = 0, None, []
    with bz2.open(path, 'rt', encoding='utf-8') as f, gzip.open(out, 'wt', encoding='utf-8') as o:
        o.write('# start\tnext\tpageid\ttitle\n')
        for line in f:
            off, pid, title = line.rstrip('\n').split(':', 2)
            off = int(off)
            if off != prev_off:
                for p in pending:
                    o.write(f'{p[0]}\t{off}\t{p[1]}\t{p[2]}\n')
                pending, prev_off = [], off
            if int(pid) in want:
                pending.append((off, pid, title))
                keep += 1
        for p in pending:
            o.write(f'{p[0]}\t\t{p[1]}\t{p[2]}\n')
    return keep


def redirects(redirect_path, page_path, titles, out):
    """Redirect pages whose target is one of the titles: (redirect title, target title)."""
    want = {t.replace(' ', '_').encode() for t in titles}
    target = {}
    pat = re.compile(rb"^(\d+),0,'((?:[^'\\]|\\.)*)',")
    for r in rows(redirect_path):
        m = pat.match(r)
        if m and m.group(2) in want:
            target[int(m.group(1))] = unescape(m.group(2)).replace('_', ' ')
    tpat = re.compile(rb"^(\d+),0,'((?:[^'\\]|\\.)*)',1,")
    n = 0
    with gzip.open(out, 'wt', encoding='utf-8') as o:
        o.write('# redirect\ttarget\n')
        for r in rows(page_path):
            i = r.find(b',')
            pid = int(r[:i])
            if pid in target:
                m = tpat.match(r)
                if m:
                    o.write(unescape(m.group(2)).replace('_', ' ') + '\t' + target[pid] + '\n')
                    n += 1
    return n


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    d, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, 'gb-articles.tsv.gz')
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
    idx = os.path.join(d, 'articles-index.txt.bz2')
    if os.path.exists(idx):
        want = {pid for pid in p if pid not in disamb}
        k = gb_index(idx, want, os.path.join(outdir, 'gb-index.tsv.gz'))
        print('wrote', k, 'index lines to', os.path.join(outdir, 'gb-index.tsv.gz'))
    red = os.path.join(d, 'redirect.sql.gz')
    if os.path.exists(red):
        titles = [title for pid, (title, _) in p.items() if pid not in disamb]
        k = redirects(red, os.path.join(d, 'page.sql.gz'), titles, os.path.join(outdir, 'gb-redirects.tsv.gz'))
        print('wrote', k, 'redirects to', os.path.join(outdir, 'gb-redirects.tsv.gz'))


if __name__ == '__main__':
    main()
