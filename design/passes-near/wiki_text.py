"""An article's wikitext from Wikipedia's multistream articles dump, fetched by byte range: for checking
facts when Wikipedia's own pages refuse (they answer 429 after a few reads from a cloud session).

  python3 -I wiki_text.py "Title one" "Title two" ...              prints each article's wikitext
  python3 -I wiki_text.py --save DIR "Title" ...                    or saves each as DIR/Title.txt
  python3 -I wiki_text.py --dumps DUMPS --save DIR "Title" ...      any article, with the full index

Without --dumps it looks titles up in wiki/gb-index.tsv.gz (committed: the 105,000 or so articles with
coordinates in Great Britain, which covers the candidates) and wiki/gb-redirects.tsv.gz (other names
for them), so nothing needs downloading. For any other
article (one with no coordinates, a redirect's title), give --dumps DUMPS, a folder holding the run's
`enwiki-<run>-pages-articles-multistream-index.txt.bz2` saved as articles-index.txt.bz2 (about 290 MB;
check it against md5sums.txt); the first use unpacks it to articles-index.txt (about 1.2 GB).

Either way only each article's block (about 100 articles, a few hundred KB) of
`enwiki-<run>-pages-articles-multistream.xml.bz2` is fetched from dumps.wikimedia.org, by HTTP Range,
and kept in PN_BLOCKS (default /tmp/pn-wiki-blocks). Redirects are followed when the target can be
found. The run is in wiki/README.md (PN_DUMP_RUN overrides it). The text is as of that run.
"""
import sys, os, bz2, re, gzip, subprocess, urllib.request, html

HERE = os.path.dirname(os.path.abspath(__file__))
GB_INDEX = os.path.join(HERE, 'wiki', 'gb-index.tsv.gz')
GB_REDIRECTS = os.path.join(HERE, 'wiki', 'gb-redirects.tsv.gz')
RUN = os.environ.get("PN_DUMP_RUN", "20261101")   # the run in wiki/README.md
URL = f'https://dumps.wikimedia.org/enwiki/{RUN}/enwiki-{RUN}-pages-articles-multistream.xml.bz2'
AGENT = os.environ.get('PN_AGENT') or 'TraincheckerPassesNear/1.0 (https://trainchecker.baish.net/)'
BLOCKS = os.environ.get('PN_BLOCKS', '/tmp/pn-wiki-blocks')
_gb = None
_red = {}


def gb_offsets(title):
    global _gb
    if _gb is None:
        _gb = {}
        with gzip.open(GB_INDEX, 'rt', encoding='utf-8') as f:
            for ln in f:
                if ln.startswith('#'):
                    continue
                start, nxt, _pid, t = ln.rstrip('\n').split('\t', 3)
                _gb[t] = (int(start), int(nxt) if nxt else None)
        if os.path.exists(GB_REDIRECTS):
            with gzip.open(GB_REDIRECTS, 'rt', encoding='utf-8') as f:
                for ln in f:
                    if not ln.startswith('#'):
                        red, target = ln.rstrip('\n').split('\t')
                        if red not in _gb and target in _gb:
                            _gb[red] = _gb[target]   # the block holds the target, found by redirect name below
                            _red[red] = target
    return _gb.get(title)


def full_index(d):
    txt = os.path.join(d, 'articles-index.txt')
    if not os.path.exists(txt):
        with bz2.open(os.path.join(d, 'articles-index.txt.bz2'), 'rb') as f, open(txt + '.part', 'wb') as out:
            while True:
                b = f.read(1 << 24)
                if not b:
                    break
                out.write(b)
        os.rename(txt + '.part', txt)
    return txt


def full_offsets(d, title):
    """(block start, next block start) from the full index (lines: offset:pageid:title)."""
    txt = full_index(d)
    r = subprocess.run(['grep', '-n', '-m', '20', '-F', ':' + title, txt], capture_output=True, text=True)
    for line in r.stdout.splitlines():
        num, rest = line.split(':', 1)
        off, _pid, t = rest.split(':', 2)
        if t == title:
            start = int(off)
            nxt = subprocess.run(f"tail -n +{int(num)} '{txt}' | awk -F: '$1 != {start} {{print $1; exit}}'",
                                 shell=True, capture_output=True, text=True).stdout.strip()
            return start, (int(nxt) if nxt else None)
    return None


def block(start, end):
    os.makedirs(BLOCKS, exist_ok=True)
    path = os.path.join(BLOCKS, f'{RUN}-{start}.xml')
    if not os.path.exists(path):
        rng = f'bytes={start}-{end - 1}' if end else f'bytes={start}-'
        req = urllib.request.Request(URL, headers={'User-Agent': AGENT, 'Range': rng})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        open(path, 'wb').write(bz2.decompress(data))
    return open(path, encoding='utf-8').read()


def text(title, dumps=None, hops=0):
    title = title.replace('_', ' ').strip()
    title = title[:1].upper() + title[1:]
    where = gb_offsets(title)
    if where and title in _red:
        return text(_red[title], dumps, hops + 1)
    where = where or (full_offsets(dumps, title) if dumps else None)
    if not where:
        return None
    xml = block(*where)
    for page in re.findall(r'<page>.*?</page>', xml, flags=re.S):
        if f'<title>{html.escape(title, quote=False)}</title>' in page:
            m = re.search(r'<text[^>]*>(.*?)</text>', page, flags=re.S)
            t = html.unescape(m.group(1)) if m else ''
            red = re.match(r'#REDIRECT\s*\[\[([^\]#|]+)', t, flags=re.I)
            if red and hops < 3:
                return text(red.group(1), dumps, hops + 1)
            return t
    return None


def main():
    args = sys.argv[1:]
    save = dumps = None
    while args[:1] in (['--save'], ['--dumps']):
        if args[0] == '--save':
            save = args[1]
        else:
            dumps = args[1]
        args = args[2:]
    if not args:
        sys.exit(__doc__)
    for title in args:
        t = text(title, dumps)
        if t is None:
            print('not found:', title, '' if dumps else '(not in wiki/gb-index.tsv.gz: try --dumps)')
        elif save:
            os.makedirs(save, exist_ok=True)
            open(os.path.join(save, title.replace(' ', '_').replace('/', '%2F') + '.txt'), 'w').write(t)
            print('saved', title, len(t))
        else:
            print(f'===== {title}\n{t}\n')


if __name__ == '__main__':
    main()
