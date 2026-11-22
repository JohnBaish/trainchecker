# Wikipedia's article locations, for "Your train passes near…"

Made on November 22nd 2026 by `wiki_dump.py` from English Wikipedia's database dumps of the
**20261101** run (`https://dumps.wikimedia.org/enwiki/20261101/`), every file checked against that run's
`md5sums.txt`. Committed so that a session needs no download.

- `gb-articles.tsv.gz` (3.3 MB): the 105,329 articles with a primary coordinate in a box round Great
  Britain (not redirects or disambiguation pages): page id, title, latitude, longitude, length in
  bytes, short description. `candidates.py` uses it by default.
- `gb-index.tsv.gz` (2 MB): where 105,312 of them sit in the run's
  `pages-articles-multistream.xml.bz2` (block start, next block start, page id, title); 17 newer pages
  aren't in that file. `wiki_text.py` uses it to fetch an article's block by byte range.
- `gb-redirects.tsv.gz` (1.7 MB): the 132,308 redirects to those articles (redirect title, article
  title), so `wiki_text.py` finds them by other names too ("Clifton Lido" → "The Lido, Bristol").

Articles without coordinates (Goss Moor, Cornwall Railway viaducts) aren't here: `wiki_text.py --dumps`
reaches them with the full index (see its notes).

**To remake from a newer run** (now and then; articles written since November 1st 2026 aren't here):
download `geo_tags.sql.gz`, `page.sql.gz`, `page_props.sql.gz`, `redirect.sql.gz` and
`pages-articles-multistream-index.txt.bz2` (saved as `articles-index.txt.bz2`) of one run into a
folder outside the repo, about 3.4 GB; check each against the run's `md5sums.txt`; run
`python3 -I design/passes-near/wiki_dump.py THAT-FOLDER design/passes-near/wiki` (about ten
minutes); change the run above and `RUN` in `wiki_text.py`. `dumps.wikimedia.org` is allowed on John's
environment.

**Licence.** Wikipedia's text, including the short descriptions and titles here, is under the Creative
Commons Attribution-ShareAlike 4.0 licence (CC BY-SA 4.0), © Wikipedia contributors; these files are a
selection from it, under the same licence. They are working notes for choosing items, not shown on the
page; each item's own sentence is written afresh and names its source article.
