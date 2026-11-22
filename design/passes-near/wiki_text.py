"""An article's wikitext from Wikipedia's multistream dump, fetched by byte range: for checking facts
when Wikipedia's own pages refuse (they answer 429 after a few hundred quick requests).

  python3 -I wiki_text.py DUMPS "Title one" "Title two" ...      prints each article's wikitext
  python3 -I wiki_text.py --save DIR DUMPS "Title" ...            or saves each as DIR/Title.txt

DUMPS holds articles-index.txt.bz2: the run's `enwiki-<run>-pages-articles-multistream-index.txt.bz2`
(about 290 MB; check it against md5sums.txt). The first use unpacks it to articles-index.txt (about
1.2 GB). The articles themselves stay on dumps.wikimedia.org: for each title only its block (about 100
articles, a few hundred KB) of `enwiki-<run>-pages-articles-multistream.xml.bz2` is fetched, by HTTP
Range, and kept in DUMPS/blocks/. Redirects are followed. Set PN_DUMP_RUN to the run (default 20261101).
The text is as of that run, so a fact that might have changed since is still worth a look at the live
article when it can be had.
"""
import sys, os, bz2, re, subprocess, urllib.request, html

RUN = os.environ.get('PN_DUMP_RUN', '20261101')
URL = f'https://dumps.wikimedia.org/enwiki/{RUN}/enwiki-{RUN}-pages-articles-multistream.xml.bz2'
AGENT = os.environ.get('PN_AGENT') or 'TraincheckerPassesNear/1.0 (https://trainchecker.baish.net/)'


def index_file(d):
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


def offsets(txt, title):
    """(block start, next block start) for a title, from the index (lines: offset:pageid:title)."""
    # grep for ":title" at the end of a line (the offset and page id come first)
    r = subprocess.run(['grep', '-n', '-m', '20', '-F', ':' + title, txt], capture_output=True, text=True)
    for line in r.stdout.splitlines():
        num, rest = line.split(':', 1)
        off, pid, t = rest.split(':', 2)
        if t == title:
            start = int(off)
            nxt = subprocess.run(f"tail -n +{int(num)} '{txt}' | awk -F: '$1 != {start} {{print $1; exit}}'",
                                 shell=True, capture_output=True, text=True).stdout.strip()
            return start, (int(nxt) if nxt else None)
    return None


def block(d, start, end):
    os.makedirs(os.path.join(d, 'blocks'), exist_ok=True)
    path = os.path.join(d, 'blocks', f'{start}.xml')
    if not os.path.exists(path):
        rng = f'bytes={start}-{end - 1}' if end else f'bytes={start}-'
        req = urllib.request.Request(URL, headers={'User-Agent': AGENT, 'Range': rng})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        open(path, 'wb').write(bz2.decompress(data))
    return open(path, encoding='utf-8').read()


def text(d, title, hops=0):
    title = title.replace('_', ' ')
    title = title[:1].upper() + title[1:]
    where = offsets(index_file(d), title)
    if not where:
        return None
    xml = block(d, *where)
    for page in re.findall(r'<page>.*?</page>', xml, flags=re.S):
        if f'<title>{html.escape(title, quote=False)}</title>' in page:
            m = re.search(r'<text[^>]*>(.*?)</text>', page, flags=re.S)
            t = html.unescape(m.group(1)) if m else ''
            red = re.match(r'#REDIRECT\s*\[\[([^\]#|]+)', t, flags=re.I)
            if red and hops < 3:
                return text(d, red.group(1), hops + 1)
            return t
    return None


def main():
    args = sys.argv[1:]
    save = None
    if args[:1] == ['--save']:
        save, args = args[1], args[2:]
    if len(args) < 2:
        sys.exit(__doc__)
    d = args[0]
    for title in args[1:]:
        t = text(d, title)
        if save:
            os.makedirs(save, exist_ok=True)
            if t is None:
                print('not found:', title)
            else:
                open(os.path.join(save, title.replace(' ', '_').replace('/', '%2F') + '.txt'), 'w').write(t)
                print('saved', title, len(t))
        else:
            print(f'===== {title}\n{t if t is not None else "(not found)"}\n')


if __name__ == '__main__':
    main()
