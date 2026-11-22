# "Your train passes near…": coverage

Every stretch of railway in England between neighbouring stations, worked through in John's order
(November 22nd 2026): the Great Western routes first, then the South West, the South East, London,
East Anglia (the East of England), the East Midlands, the West Midlands, Yorkshire and the Humber, the
North West and the North East. One item per stretch. Start each session with: "Read
design/passes-near/COVERAGE.md and do the next batch."

<!-- counts: made by coverage.py -->

281 of 2376 stretches done.

1. Great Western routes: 271 of 271 done (done).
2. South West: 5 of 30 done (next).
3. South East: 1 of 384 done.
4. London: 4 of 421 done.
5. East of England (East Anglia): 0 of 237 done.
6. East Midlands: 0 of 140 done.
7. West Midlands: 0 of 191 done.
8. Yorkshire and The Humber: 0 of 238 done.
9. North West: 0 of 396 done.
10. North East: 0 of 68 done.

Next stretch in the order: AXM-HON (Axminster to Honiton).

<!-- end of counts -->

## What counts where

- **The stretches** are in `stretches.json` (2,376 with any of them in England, from the OpenStreetMap
  extract of November 21st 2026; `build_stretches.py`, report in `stretches-report.md`).
- **Great Western routes:** any stretch that a Great Western Railway service uses on the map (its
  OpenStreetMap routes cover at least half of it), wherever it is. Then each region takes the rest,
  by the region with most of the stretch's length.
- **Within each part,** `pn.ordered()` walks along the lines, so a batch is a run of neighbouring
  stretches. Possible avoiding lines (marked `past`, below) come last in each part.
- **Done** means an item in `passes-near.json`, or the stretch listed under `skipped` there with a
  reason.

## How to do the next batch

**Batch size** (John agreed, November 22nd 2026): 40 stretches a batch, as since the set-up. A session
may do two or three batches in a row, committing and pushing after each, so each finished batch is safe.
What limits a batch is how much a session can hold while checking well (the candidates and the articles it
reads), not the downloads, which take minutes now. Bigger batches risk weaker checking, not a crash.

1. Read `README.md` here (John's decisions and the house style of the items) and the newest few items in
   `passes-near.json`, so the new ones read the same way.
2. Make the candidates for the next 40 stretches still to do:
   `python3 -I design/passes-near/candidates.py --next 40 design/passes-near/batches/NN` (NN the batch's
   number). It needs `pip install shapely pyproj numpy` and the hosts `services-eu1.arcgis.com` and
   `en.wikipedia.org`. Nothing to download: Wikipedia's nearby articles, their short descriptions and
   lengths come from the committed `wiki/gb-articles.tsv.gz` (see `wiki/README.md`), and only each
   chosen article's wikitext is fetched (`/wiki/Title?action=raw`) for its first sentences: about four
   minutes for 40 stretches. Those pages answer 429 after a few hundred quick requests (sometimes
   after a few): the script waits as asked and never keeps an error page. It names
   trainchecker.baish.net as its contact, as Wikipedia asks (John's word). The first sentences are a
   rough guide made from wikitext: check facts against the article itself. `--wiki-api` uses
   Wikipedia's search API instead (about one request every 40 seconds from a cloud session).
   What it fetched is kept in `cache/` (not committed).
3. For each stretch, choose one item from `candidates.md` (or anything better you know of near the
   line: a bridge or viaduct the train crosses, a river, a county boundary where nothing else is near).
   Prefer something a passenger would find interesting, and true without hedging.
4. **Check every fact against a source** (the Historic England list entry, Wikipedia, the National
   Trust, the owner's own site). Leave out anything doubtful. Put the source's address in `source`.
   Wikipedia's own pages refuse after a few reads, so read articles with
   `python3 -I design/passes-near/wiki_text.py --save ARTICLES "Title" "Title" …`: it finds them in the
   committed index (`wiki/gb-index.tsv.gz` and `gb-redirects.tsv.gz`), fetches just the blocks of the
   articles dump that hold them (by byte range from dumps.wikimedia.org, no limit seen) and saves their
   wikitext. An article with no coordinates isn't in that index: give `--dumps FOLDER` with the run's
   full index (`wiki_text.py`'s notes say how). Look out for two things in the candidates: a Wikipedia
   link beside a list entry is a guess by name and position,
   and is sometimes wrong (Taunton Castle's pointed at the bus station); and for a park or garden the
   distance is to the park's edge while `lat`/`lon` is its middle or the house, so `check.py` warns
   when they differ: write about the park and give the nearest point of its edge, or choose another.
5. Write the sentence in the house style of the existing items: "Your train passes near …, on the
   train's {side}, …"; British spelling; one to nine in words; "less than"/"more than", never
   "under"/"over" for amounts; written afresh, not copied. Give `name`, `lat`, `lon` (of the thing),
   `distanceM` and `side` from the candidates (the side is for `a` to `b`: write the item's `a` and `b`
   in the same order as the stretch, or swap the side). `kind` is `near`, `crosses`, `boundary` or
   `station`; `side` is null for the last three, and a boundary has `textReverse` for the other way.
6. Save the batch's items as a list in `batches/NN/items.json`, then
   `python3 -I design/passes-near/to_network.py design/passes-near/batches/NN/items.json`.
7. Run `python3 -I design/passes-near/check.py` and fix everything it lists (warnings: look, and fix if
   wrong). Then `python3 -I design/passes-near/coverage.py` to update the counts above.
8. **Put the new facts on the website** (John, November 22nd 2026): the page's "Fact of the Journey"
   reads `src/data/passes-near.json`, not this folder, so run
   `python3 -I design/passes-near/to_site.py`, then `npm ci` (once per session) and `npm run check`
   (its last part, `check-facts`, must pass) and `npm run build`. Without this step the batch's facts
   never reach the page. A fact shows only on a journey with a train in the next four hours.
9. Commit straight to `main` (John's standing word for these batches): `batches/NN/` (candidates and
   items), the data, `src/data/passes-near.json`, this file. That push makes the new facts live. Add a line to the log below and to `CLAUDE.md`'s log; update the tracker's line
   (baish.net-directory) when a part is finished.

## Things to look out for

- **Possible avoiding lines** (`past` in `stretches.json`, listed in `stretches-report.md`): a stretch
  that runs past another station both its ends connect to. Some are lines round a big station's
  platforms that passenger trains don't use (York, Didcot, Norwich, Leeds, Newcastle); others are real
  lines beside a station (Reading to Tilehurst passes Reading West; Bristol to Keynsham, Lawrence
  Hill; Clapham Junction to London Victoria). Look at each on a map and at a timetable (Realtime
  Trains, say): if no passenger train uses it, add it to `skipped` with the reason; otherwise do it.
- **No train company on the map** (166 stretches, `operators` empty): often just a gap in
  OpenStreetMap's routes (Grantham to Peterborough is the East Coast Main Line), sometimes a freight
  line between two stations (South Wigston to Tamworth, 70 km). The same: skip it, with the reason,
  only once you're sure no passenger train uses it.
- **Into Wales or Scotland** (16 stretches, `crosses`): the item must be in England.
- **A new station opening** splits a stretch: rebuild the network (below) and move the item.

## Rebuilding the network

From a fresh UK extract (download.openstreetmap.fr, as for the platform table: check the checksum)
and the ONS boundaries (`build_stretches.py` says which and where):
`python3 -I design/passes-near/build_stretches.py uk.osm.pbf countries.geojson regions.geojson out/`,
copy `stretches.json` and `stretches-report.md` here, then `to_network.py` and `check.py`. Items whose
stretch has gone end up under `unplaced`, for a person to place.

## Log

- November 22nd 2026 (Claude Code): batch 05, 40 stretches from Digby & Sowton to Polsloe Bridge through
  to Feniton to Honiton (the Exmouth branch, Southampton to Portsmouth by Netley and Fareham, the Greenford
  branch, Gatwick to Horley, the possible avoiding lines left in the Great Western part (Westbury, Didcot,
  Bristol, Worcestershire Parkway), then the first five South West stretches east of Exeter). This
  finishes the Great Western routes (271 of 271). Every fact checked against the article in `source`
  (`wiki_text.py`). Neighbours already used got another item: St Budeaux Victoria Road to Saltash has the
  Tamar Bridge (the Royal Albert Bridge is on St Budeaux Ferry Road to Saltash); Pilning to Severn Tunnel
  Junction has Severn Beach (the tunnel is on its other stretch; the Prince of Wales Bridge's point is
  mid-estuary, perhaps in Wales); Pinhoe to St James Park has Exeter's underground passages; Appleford to
  Swindon has Priory Cottages, Steventon. The avoiding lines were given items, as in batch 03, not skipped.
  For A la Ronde, Croome Court and Titchfield Abbey the point is the nearest edge of the listed area
  (A la Ronde's house is 1 km away, Croome Court's 2 km); Hilsea Lines is `crosses`, the railway passing
  through a gap 4 m from the scheduled area. Greenford is a `station`. Step 8 done: 281 facts in
  `src/data/passes-near.json`; `npm run check` (check-facts 24 of 24) and `npm run build` pass.
- November 22nd 2026 (Claude Code): batch size written down above (40, two or three a session), at
  John's word.
- November 22nd 2026 (Claude Code): batch 04, 40 stretches from Ashchurch for Tewkesbury to Cheltenham
  Spa through to Polsloe Bridge to St James Park (more Great Western routes: the stretches round
  Cheltenham and Gloucester, Westbury to Salisbury and Romsey, Reading to Guildford and Redhill (the North
  Downs Line), the Marlow and Windsor branches, and Exeter). Every fact checked against the article in
  `source` (`wiki_text.py`). Stretches whose obvious item was already used nearby got another: Reading
  West to Tilehurst (Elm Park is on Reading West to Reading Green Park) has the Reading Festival bridge;
  Mortimer to Reading Green Park (Mortimer station is on Bramley to Mortimer) has Reading Green Park
  station; Earley to Reading (Reading Abbey is on Reading to Twyford) has the siege of 1643. The Loddon
  Viaduct collapse of 1972 (three killed) was passed over for Earley to Winnersh Triangle, as was the
  Charfield crash in batch 03, as not something to greet a passenger with. Chilworth gunpowder mills'
  point is the nearest edge of the scheduled area. Step 8 done: `to_site.py` put all 241 items in
  `src/data/passes-near.json`; `npm run check` (check-facts 24 of 24) and `npm run build` pass.
- November 22nd 2026 (Claude Code): batch 03, 40 stretches from Nailsea & Backwell to Yatton through to
  Ashchurch for Tewkesbury to Worcestershire Parkway (Yatton to Weston-super-Mare and Highbridge, the Severn
  Tunnel and Bristol's north side, Bristol Parkway to Gloucester and Cheltenham, the Golden Valley line to
  Kemble and Swindon, and the Cotswold Line from Oxford to Hereford). No downloads: candidates from the
  committed `wiki/` files (six minutes), every fact checked against the article in `source`, read with
  `wiki_text.py`. Seven items are `crosses` (Gipsy Patch Lane Bridge, the Severn Tunnel, Huckford Viaduct,
  the Roman town at Dorn, the Colwall and Ledbury tunnels) and one a `station` (Adlestrop, closed in 1966,
  Edward Thomas's poem). For Blenheim, Dorn and the Evesham battlefield the point is the nearest edge of
  the area (from Historic England's shapes), so `check.py` agrees with the distance; the train only grazes
  Cornbury Park (six metres of track inside it), so that item says "along the edge" and its point is the
  house. Cheltenham Spa to Stonehouse is the curve round Gloucester: the live board at Stroud (9.30pm)
  showed its trains to Cheltenham calling at Gloucester, so probably no regular passenger train uses it;
  given an item anyway (it does no harm), not skipped. Cam & Dursley to Cheltenham Spa is used: CrossCountry
  trains from Bristol Parkway to Birmingham run to Cheltenham without calling at Gloucester.
- November 22nd 2026 (Claude Code): nothing to download any more. Wikipedia's article locations
  (`wiki/gb-articles.tsv.gz`), a cut-down index of where those articles sit in the articles dump
  (`gb-index.tsv.gz`) and their redirects (`gb-redirects.tsv.gz`) are committed, 7 MB in all, from the
  20261101 run (`wiki/README.md`: how they were made, the licence, how to remake them).
  `candidates.py` and `wiki_text.py` use them by default; 72 of the 74 sources of batches 01 and 02 are
  found without any download (the other two have no coordinates).
- November 22nd 2026 (Claude Code): batch 02, 40 stretches from Chapelton to Umberleigh through to
  Nailsea & Backwell to Parson Street (the Tarka Line's end, Exeter, Bridgwater to Taunton, the Heart of
  Wessex Line to Weymouth, Bruton to Westbury, Bath to Trowbridge, Chippenham to Trowbridge, Bristol
  Parkway to Swindon, and Bristol's local lines to Severn Beach). The first batch with Wikipedia from the
  dumps (step 2); every fact checked against the article in `source`, read from the articles dump
  (`wiki_text.py`, new), as Wikipedia's pages refused after eight reads. Four items are `crosses`
  (Poundbury Camp's tunnel, Avoncliff Aqueduct, Abona at Sea Mills; none is a station). Badminton House
  was dropped for Bristol Parkway to Swindon: the line passes 13 m from its park, not through it, and
  3.5 km from the house; the Health Hydro in Swindon instead. Tyntesfield's point is the edge of its park.
- November 22nd 2026 (Claude Code): Wikipedia from its database dumps. The search API refused most of
  batch 01's requests, so `wiki_dump.py` (new) turns three files of the 20261101 dumps (checksums
  checked) into one file of 105,329 articles with coordinates in Great Britain, and `candidates.py
  --wiki-dump` takes the nearby articles from it (same ranking, distances and sides; first sentences
  from each article's wikitext). Batch 01 run again (`batches/01/rerun/`): 223 Wikipedia candidates, four
  minutes. Its weakest items looked at again (eight stations, not nine as written below, and Roche's
  holy well): three replaced, each fact checked against its article: FMT-PNM Penmere station → the
  National Maritime Museum Cornwall; COP-MRD Morchard Road station → the church at Down St Mary (its
  churchyard cross once used as a paving slab); PMA-UMB Portsmouth Arms station → Brightley Barton and its
  moat walls. Kept: St Erth, St Columb Road, Coombe Junction, St Keyne Wishing Well and Kings Nympton
  stations, and Roche's holy well (the new candidates there are only hamlets; the River Mole at
  KGN-PMA was left, as where it meets the Taw couldn't be checked).
- November 22nd 2026 (Claude Code): batch 01, 40 stretches in Cornwall and Devon (Lelant Saltings to
  St Erth through to Portsmouth Arms to Umberleigh: the Falmouth, Newquay, Looe, St Ives, Gunnislake,
  Paignton, Okehampton and Barnstaple branches). Wikipedia's search refused most requests, so the
  candidates are mostly Historic England's; every fact was checked against the Wikipedia article in
  `source` (Historic England's own pages refuse automated reading, even through a fetch agent; only the
  name and grade from its list data were used without an article, for Roche's holy well). Nine items are
  stations (`kind` station), where the station was the most interesting thing that could be checked.
  SBF-SBV (51 m) is the 1941 link between the two St Budeaux lines, which Gunnislake trains use.

- November 22nd 2026 (Claude Code): set up. 2,376 stretches; the 81 items of the first five lines put on
  them (80 placed; the Elm Park item waits for John, above).
- November 22nd 2026 (Claude Code): John placed Elm Park on Reading West to Reading Green Park. All 81
  on the network. Wikipedia given trainchecker.baish.net as the contact; it was still refusing this
  session's requests an hour later.
