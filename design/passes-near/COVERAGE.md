# "Your train passes near…": coverage

Every stretch of railway in England between neighbouring stations, worked through in John's order
(November 22nd 2026): the Great Western routes first, then the South West, the South East, London,
East Anglia (the East of England), the East Midlands, the West Midlands, Yorkshire and the Humber, the
North West and the North East. One item per stretch. Start each session with: "Read
design/passes-near/COVERAGE.md and do the next batch."

<!-- counts: made by coverage.py -->

80 of 2376 stretches done.

1. Great Western routes: 75 of 271 done (next).
2. South West: 0 of 30 done.
3. South East: 1 of 384 done.
4. London: 4 of 421 done.
5. East of England (East Anglia): 0 of 237 done.
6. East Midlands: 0 of 140 done.
7. West Midlands: 0 of 191 done.
8. Yorkshire and The Humber: 0 of 238 done.
9. North West: 0 of 396 done.
10. North East: 0 of 68 done.

Next stretch in the order: LTS-SER (Lelant Saltings to St Erth).

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

1. Read `README.md` here (John's decisions and the house style of the items) and the newest few items in
   `passes-near.json`, so the new ones read the same way.
2. Make the candidates for the next 40 stretches still to do:
   `python3 -I design/passes-near/candidates.py --next 40 design/passes-near/batches/NN` (NN the batch's
   number, 01 first). It needs `pip install shapely pyproj numpy` and the hosts `services-eu1.arcgis.com`
   and `en.wikipedia.org` (both allowed on John's environment since November 22nd 2026). If it says
   Wikipedia refused, run it again later: what it fetched is kept in `cache/` (not committed).
3. For each stretch, choose one item from `candidates.md` (or anything better you know of near the
   line: a bridge or viaduct the train crosses, a river, a county boundary where nothing else is near).
   Prefer something a passenger would find interesting, and true without hedging.
4. **Check every fact against a source** (the Historic England list entry, Wikipedia, the National
   Trust, the owner's own site). Leave out anything doubtful. Put the source's address in `source`.
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
8. Commit straight to `main` (notes, house style §10): `batches/NN/` (candidates and items), the
   data, this file. Add a line to the log below and to `CLAUDE.md`'s log; update the tracker's line
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
- **Stretches from the old lines that changed:** Reading West to Mortimer is now Reading West to
  Reading Green Park and Mortimer to Reading Green Park (the station opened in 2023). Its item, the site
  of Elm Park, is under `unplaced` for John to decide where it goes; `check.py` fails until then.
- **A new station opening** splits a stretch: rebuild the network (below) and move the item.

## Rebuilding the network

From a fresh UK extract (download.openstreetmap.fr, as for the platform table: check the checksum)
and the ONS boundaries (`build_stretches.py` says which and where):
`python3 -I design/passes-near/build_stretches.py uk.osm.pbf countries.geojson regions.geojson out/`,
copy `stretches.json` and `stretches-report.md` here, then `to_network.py` and `check.py`. Items whose
stretch has gone end up under `unplaced`, for a person to place.

## Log

- November 22nd 2026 (Claude Code): set up. 2,376 stretches; the 81 items of the first five lines put on
  them (80 placed; the Elm Park item waits for John, above).
