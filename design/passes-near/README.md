# "Your train passes near…"

*John's idea, researched in a Claude chat on Sunday November 22nd 2026. This folder holds the data and how
it was made; John will say how it looks on the page.*

## What it is

One interesting thing near each stretch of line between two neighbouring stations, with which side of the
train it's on. A journey covers one or more stretches; the page picks one item at random from them on each
visit, and refreshing gives another. England only. The thing needn't be visible from the train, just near
it (within 1 km).

## John's decisions (November 22nd 2026)

1. England only.
2. "Your train passes near…": the thing needn't be visible.
3. One item per stretch; refresh for another (from the journey's other stretches).
4. Random on each visit, not one a day.
5. Left and right are the train's, as it is going: "on the train's left". The card says once:
   "Left and right are as the train is going. Facing backwards? Look the other way."
6. Where nothing is near, a county boundary is fine ("…passes from Buckinghamshire into Berkshire").
7. All 26 pilot items kept as written; more lines to be added to the same file. Later lines' items are kept
   without John checking each one (his word, November 22nd 2026).

## Lines covered

1. London Paddington to Bristol Temple Meads via Bath (the pilot, 26 stretches; `pilot_items.py`).
2. Reading to Penzance via Newbury, Westbury, Taunton, Exeter and Plymouth (45 stretches).
3. Didcot Parkway to Oxford (four stretches).
4. Reading to Basingstoke (four stretches).
5. Twyford to Henley-on-Thames (three stretches).

Lines 2 to 5 are in `more_items.py`, added November 22nd 2026. Reading to Reading West is on lines 2 and 4
and has one item. 81 stretches, 81 items. `pilot_items.py` and `more_items.py` are the record of how these
were written; the items now live in `passes-near.json` itself (don't run `pilot_items.py`: it writes the
old form of the file).

Since the evening of November 22nd 2026 the items sit on the whole network instead of the five lines
(below, "Working through all of England"). 80 of the 81 fitted a stretch as they were; the site of Elm Park
(Reading West to Mortimer) is now on Reading West to Reading Green Park (John), as Reading Green Park
station (2023) stands between them.

## The data: `passes-near.json`

- `network`: what the page needs to find a journey's stretches. `stations`: every station code in the
  network with its name. `stretches`: every stretch with any of it in England, as `[a, b, length in
  metres]` (from `stretches.json`). A stretch is a pair of stations with no other station between them
  along the track, whether or not trains stop. A journey's stretches come from its train's calling
  points: for each pair of calling points in a row, the shortest way between them through the network
  (by length). A fast train from Reading to Swindon covers Reading–Tilehurst, …, Didcot Parkway–Swindon.
- `items`: one per stretch, keyed by the stretch's id: its two codes in alphabetical order (`AML-PAD`).
  - `a`, `b`: the stretch, written in the direction the research was done.
  - `kind`: `near`, `crosses` (a bridge, viaduct or river the train crosses), `boundary`, or `station`
    (the station itself is the interesting thing: Mortimer, whose stretch had nothing else).
  - `side`: `left` or `right` when travelling from `a` to `b`, facing forwards; swap for `b` to `a`.
    `null` for crossings, boundaries and stations.
  - `text`: the sentence; `{side}` stands for `left` or `right`.
  - `textReverse`: where present, the sentence for `b` to `a` (boundaries).
  - `name`, `lat`, `lon`, `distanceM` (metres from the track, rounded), `source` (where the facts were
    checked).
- `unplaced`: items whose two stations aren't a stretch (left for a person to place; `check.py` fails
  while there are any). `skipped`: stretches that need no item, each with its reason.
- Every sentence follows the house wording rules (British spelling; one to nine in words; no "under/over").

## How it was made

- **Track:** an OpenStreetMap route relation for the service (`osmRelation` on each line), fetched whole
  from `api.openstreetmap.org/api/0.6/relation/<id>/full.json` and joined end to end.
- **Stations:** Nominatim, matched on `ref:crs`, then placed on the track in order.
- **Candidates within 1 km:** Historic England's National Heritage List (Grade I and II* listed buildings,
  scheduled monuments, parks and gardens, World Heritage Sites; Open Government Licence) and Wikipedia's
  geotagged articles. The list's open map service:
  `https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer`
  (layers: 0 listed buildings, 6 scheduled monuments, 7 parks and gardens, 8 battlefields, 10 World
  Heritage Sites; British National Grid, `inSR=27700`). Wikipedia: `en.wikipedia.org/w/api.php`
  (`list=geosearch`, up to 10 km round a point, 500 results).
- **Side:** the nearest point on the track and the sign of the cross product of the track's direction and
  the line to the thing.
- **Choosing:** one per stretch, by hand; every fact checked against its source; doubtful claims left out.
- The cloud session could reach only GitHub and package registries, so the data came through the browser
  pane on John's Mac. overpass-api.de refused; the main OpenStreetMap API and Nominatim worked.

## Credits

The track positions come from OpenStreetMap (already credited in About). Listed-building facts come from
Historic England's list under the Open Government Licence: "Contains Historic England data © Historic
England [year]". The sentences are written afresh, not copied from Wikipedia.

## Prompt for Claude Code

Rewritten on November 22nd 2026 for the network (John hadn't run the earlier one, which used the five
lines).

```
Read design/passes-near/README.md in JohnBaish/trainchecker. Build the data side of "Your train
passes near…" from design/passes-near/passes-near.json, following John's decisions there: copy the
network and the items into src/data (loaded only when needed; leave out `unplaced` and `skipped`;
the network is from OpenStreetMap, so add a licence note as src/data/platform-links-LICENCE.md does),
work out a journey's stretches from the stops api/live.ts already sends (the train with the most
stops): for each pair of calling points in a row, the shortest way between them through the
network's stretches, by length (a stretch is [a, b, metres]). Pick one item at random from those
stretches on each visit, with a way to get another; swap left and right when the train goes from
the item's b to its a (use textReverse where there is one); add the one-line note about facing
backwards. Show nothing on a journey none of whose stretches has an item. Add checks to npm run
check on real saved boards (Reading to Paddington both ways, a fast Paddington to Bristol, a journey
with no items; if no saved board has one, a made-up list of stops for Paddington to Plymouth, which
runs through Reading, Westbury and Exeter). Before building anything visible, ask me how I want it
presented on the page, and show me options at computer and phone widths. Add the Historic England
credit to About as a draft for me, and say that the network comes from OpenStreetMap (already
credited there). Items are being added region by region (COVERAGE.md), so nothing should be specific
to any line or region.
```

## Working through all of England (John, November 22nd 2026)

John wants every stretch in England covered, worked through in a fixed order. The plan:

1. **Every stretch listed first**, from the UK OpenStreetMap extract (as used for Exits), as a network of
   stretches between neighbouring stations, grouped by region. This replaces the separate `lines`: lines
   overlap and leave gaps, and with the whole network the page can find any journey's stretches itself.
2. **A coverage file**, `COVERAGE.md`: every region, how many stretches are done, and what's next.
3. **Region by region:** the Great Western routes first, then the South West, the South East, London,
   East Anglia, the East Midlands, the West Midlands, Yorkshire and the Humber, the North West and the
   North East.
4. **Each batch:** a script finds and ranks the candidates within 1 km and works out the side; Claude
   chooses one per stretch and checks every fact against a source; John doesn't check each one.

Estimate (not yet counted): about 2,000 to 2,500 stretches, a few dozen sessions.

**Set up on November 22nd 2026 (Claude Code):** 2,376 stretches with any of them in England (the files
below); the work goes on in `COVERAGE.md`.

- `build_stretches.py` → `stretches.json` (each stretch's track, length, region, train companies) and
  `stretches-report.md` (counts, stations not found, long stretches, possible avoiding lines).
- `to_network.py`: puts the items on the network, and adds a batch's items.
- `candidates.py`: a batch's candidates, ranked, with distance and side.
- `wiki_dump.py`: Wikipedia's article locations in Great Britain from its database dumps, for
  `candidates.py --wiki-dump` (since November 22nd 2026, as the search API refuses most requests).
- `check.py`: the checks, before every commit.
- `coverage.py`: the counts in `COVERAGE.md`.
- `pn.py`: shared by the four above.

### Prompt for Claude Code: setting it up

```
Read design/passes-near/README.md in JohnBaish/trainchecker, all of it, then set up the work of covering
every stretch of railway in England (John's plan, "Working through all of England"). Notes and scripts
only, straight to main (house style §10); nothing on the page.

1. Try whether this session can reach services-eu1.arcgis.com (Historic England's list, the URL in "How
   it was made" below) and en.wikipedia.org (geosearch and extracts). If not, ask me to add them to the
   environment's allowed list, as for the OpenStreetMap sites on November 21st 2026.
2. From a fresh UK extract (see design/platform-links-trial/build_table.py and
   src/data/platform-links-LICENCE.md for how the last one was fetched), build the network: National Rail
   stations (matched to src/data/stations.json by code), and the track between them (railway=rail in
   use, Elizabeth Line included; Underground, trams and heritage lines left out). A stretch is a pair of
   stations with no other station between them along the track, whether or not trains stop. Keep a
   stretch if any of it is in England; mark the ones that cross into Wales or Scotland (their items must
   be in England). Give each its region (England's nine regions) and its track, simplified, for working
   out sides. Write design/passes-near/stretches.json and the script that makes it.
3. Fit the 81 items in passes-near.json to the stretches (the pilot's lines were built from route
   relations, so some pairs may differ); list any that don't fit for me, without guessing. Change the
   data to items keyed by stretch, with the network instead of lines, and update the README's prompt for
   the page so it uses the network (I haven't run that one yet).
4. A candidates script for one region or a list of stretches: Historic England's Grade I and II* listed
   buildings, scheduled monuments, parks and gardens and World Heritage Sites within 1 km, and
   Wikipedia's geotagged articles, each with distance and side (left or right from a to b), ranked, saved
   for the batch. And a check script: every item on a real stretch, the side recomputed from its point,
   "{side}" in the text exactly when there is a side, house wording (one to nine in words, no
   "under/over"), no stretch with two items.
5. COVERAGE.md: the regions in the order above, the number of stretches in each, how many are done, and
   a short "How to do the next batch" for a later session (choose, check every fact against a source,
   write the sentence in the house style of the existing items, run the check, commit, update coverage).
6. Tell me the real total and the count per region, how long a batch is likely to take, and anything that
   didn't fit. Update CLAUDE.md's log and the tracker (baish.net-directory) as usual.
```

After that, each session starts with: "Read design/passes-near/COVERAGE.md and do the next batch."
