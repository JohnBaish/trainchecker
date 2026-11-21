# Handover: "over the footbridge" (how platforms connect)

Written November 21st 2026 by Claude Code, at John's request, for a later session to pick up.
An idea for later: nothing is built, and John hasn't agreed to build it. Start by asking him
whether he wants it now.

## 1. What John wants

In "Connections" (see §2), the answer tells you the platform you're coming into and the one you
want. John would like it to say how to get from one to the other. His example, word for word
(November 21st 2026):

> "You're coming into platform 3 and you'll be wanting platform 1, over the footbridge, where
> the Bristol Temple Meads train will be showing on the departure board with its final
> destination of York."

He said: "Ideally it also tells you not just the platform of the connecting train but where it
is in relation to the platform you're coming into. (This may need a fresh database.)"

## 2. Where Connections stands

- A prototype on branch `claude/gracious-mendel-emq471`, **not merged** on November 21st 2026.
  John will say when to merge. Check `CLAUDE.md`'s log and `git branch -r` for where it is now.
- `api/connect.ts`: the stations with a train from the changing station, the trains onward, and
  the platform your train comes into (`arrPlatform`, null when your train ends there).
- `src/lib/connection.ts`: `answer()` builds every sentence. The platform sentences are near
  the end of the main branch of that function: "You're coming into platform 3 and you'll want
  platform 1…", "…leaves from the same platform…", and nothing at all about your platform when
  it isn't known (John's rule). This is where "over the footbridge" would go.
- `scripts/check-connection.ts`: the agreed answers, word for word, on real boards.
- `src/components/Connection.tsx`: the "Connections" card.

Platform labels come from the live board as text: "3", "9B", "12B", "15A", and "A" or "B" on
the Elizabeth Line at Paddington. Any table of platforms has to cope with these (9B is part of
platform 9).

## 3. What was looked for, and found

Web searches on November 21st 2026 found **no ready-made national source** of how platforms
connect. What exists:

1. **Knowledgebase Stations feed** (John subscribes; `scripts/build-stations.ts` has its
   address). Tried: see §4.
2. **OpenStreetMap.** Tried: see §5.
3. **Network Rail's lifts and escalators feed** ("Stations Experience API"): which lifts exist
   and whether they work. Not layout. Not tried.
4. **TfL's station structure data**: how a station's parts connect, London only (Underground,
   Elizabeth line, Overground). Not tried.
5. **National Rail's station plans**: pictures, the Rail Delivery Group's copyright. No data
   behind them was found.

Pages read: the OpenStreetMap forum thread "Can I use Rail Delivery Group open station data"
(community.openstreetmap.org/t/139640), the OpenStreetMap wiki's "Tag:railway=platform" and
"Railway stations in the United Kingdom", and the Open Rail Data wiki's "Stations Experience
API" and "Lift and Escalator API" (search summaries only: that wiki has blocked this
environment before).

## 4. The Knowledgebase Stations feed: tried on six stations

- Address: `https://api1.raildata.org.uk/1010-knowlegebase-stations-xml-feed1_1/4.0/stations-{TOC}.xml`
  with the Knowledgebase Stations key in `x-apikey`. **The files arrive gzipped** (save, then
  gunzip). GW has 202 stations. Each station has `Latitude` and `Longitude`.
- The useful field: `Accessibility/StepFreeAccess/Annotation/Note`. Real notes:
  - Newton Abbot: "Step Free Category A Station - This station has step free access to all
    platforms via lifts and an overbridge from platform 3."
  - Twyford: "…step free access to all platforms via a liftbridge"
  - Oxford: "…via lifts and an overbridge to access platform 4."
  - Reading: "platforms can be reached via lift and bridge, ticket office is step free."
  - Bristol Temple Meads: "Lifts to all platforms and facilities…" (its subway is named only
    under Toilets: "…located in the Passenger Subway")
  - Clapham Junction: "…step free access to the footbridge which has lifts to all platforms."
- Other notes hint at platforms that share an island: "On platforms 1/2 and 3" (Newton Abbot),
  "Platform 5/7 and on Platform 13/15" (Bristol), "platforms 1, 9/10 and 13/14" (Clapham).
- **Verdict:** it says how a station as a whole is crossed (bridge, subway, lifts), in free
  text, not which platforms are together. Useful as a cross-check and perhaps for the word
  ("footbridge" or "subway"), not as the source.
- **Not done:** the licence for showing this text hasn't been read (`design/licences-2026-11-17.md`
  covers the other feeds). The forum thread above suggests the terms are unclear.
- Script: `design/platform-links-trial/kbread.py` (give it the unpacked files and station codes).

## 5. OpenStreetMap: tried on six stations

- Fetched from `https://api.openstreetmap.org/api/0.6/map?bbox=west,south,east,north`, a box of
  about 0.007° by 0.004° round each station (1 to 4 MB each). `overpass-api.de` is on the
  environment's allowed list but dropped every connection that day.
- **All six stations** (Newton Abbot, Twyford, Oxford, Reading, Bristol Temple Meads, Clapham
  Junction) have every platform drawn with its number, and footbridges, subways, steps and lifts.
- How Newton Abbot is drawn (real tags):
  - the station: a node, `railway=station`, `ref:crs=NTA`, `platforms=3`
  - each platform: a way, `railway=platform`, `ref=1` (and 2, 3), `area=yes`
  - the footbridge: a way, `highway=footway`, `bridge=yes`, `layer=1`
  - its stairs: two ways, `highway=steps`, `step_count=28`
  - two lifts: nodes, `highway=elevator`
- Elsewhere: subways are `highway=footway` or `corridor` with `tunnel=yes`; some bridges are
  `highway=steps` with `bridge=yes`; a platform can be a relation; an island platform may be one
  shape with `ref=1;2`, or two shapes.
- Counts (`design/platform-links-trial/osmread.py`): Reading 15 platforms, 3 bridges, 1 tunnel,
  12 lifts; Bristol 14 platforms (no 14), 1 bridge, 8 tunnel ways, 7 lifts; Clapham Junction 17
  platforms, bridges and tunnels both.
- **A crude test** (`islands.py`): two platforms are together if a straight line between their
  middles crosses no track. Results:
  - Newton Abbot: 1/2 | 3. Right (matches the Knowledgebase's "platforms 1/2 and 3").
  - Twyford: 1 | 2/3 | 4/5. Looks right; not checked.
  - Reading: 1/2 | 3/7 | 4 | 5/6 | 8/9 | 10/11 | 12/13 | 14/15. The islands 8 to 15 look right;
    the bay platforms 1 to 7 are muddled (they're all reached on the level, as far as Claude
    knows; not checked).
  - Oxford: 1 | 2 | 3 | 4. Wrong, Claude believes: the bay platforms 1 and 2 are on the level
    with platform 3.
  - Bristol Temple Meads: 1 | 2 | 3 | 4 | 5/6 | 7 | 8 | 9/11 | 10/12 | 13/15. Not checked.
  - Clapham Junction: 1/2 | 3/4 | 5/6 | 7 | 8 | 9/10 | 11/12 | 13/14 | 15/16 | 17. Not checked.
- **Verdict:** the map has what's needed, but the straight-line test isn't good enough. Bay
  platforms fool it. None of this was checked at the stations themselves.

## 6. A proposed way to do it properly

Not agreed with John; Claude's proposal.

1. **Follow the drawn paths.** For each station, build a walking network from the map: platform
   shapes, and every `highway=footway`, `steps`, `corridor`, `pedestrian`, `path` and
   `elevator` near them, joined where they share points or touch a platform's edge. For each
   pair of platforms, find the shortest way. Then say what it uses:
   - no bridge, tunnel or steps: "on the level" (the same island, or a bay beside it);
   - a `bridge=yes` way: "over the footbridge";
   - a `tunnel=yes` way: "through the subway";
   - no way found: say nothing.
   Expect gaps: where the map's paths don't quite join a platform, the route can't be found,
   and that station (or pair) gets nothing.
2. **Do it once, offline, for every station**, with a script like `scripts/build-stations.ts`,
   and save a small table bundled with the page (as `src/data/stations.json` is), so nothing is
   asked of OpenStreetMap while a visitor waits. A possible shape, by station code: groups of
   platforms on the level with each other, and the kind of crossing between groups:
   `{"NTA": {"level": [["1","2"],["3"]], "cross": "bridge"}}`. Stations with both a bridge and a
   subway need the crossing per pair of groups.
3. **Getting the map data for about 2,600 stations.** Options, none tried at that scale:
   - `api.openstreetmap.org/api/0.6/map`, one box per station, slowly. Read OpenStreetMap's API
     usage policy first: it isn't meant for bulk downloading.
   - Overpass (`overpass-api.de`), one query for all of Britain's platforms and footways, if it
     works from the environment by then; or another Overpass server John allows.
   - A Great Britain extract from Geofabrik (`download.geofabrik.de`, not on the allowed list;
     a large file, size not checked) and a tool to filter it.
   Station positions: the Knowledgebase Stations feed has `Latitude` and `Longitude`, and
   OpenStreetMap's own station nodes carry `ref:crs`.
4. **Match platform labels.** "9B" on the live board is platform 9 on the map; "A" and "B" at
   Paddington's Elizabeth Line need checking. Where a label can't be matched, say nothing.
5. **Say something only when sure.** As with the platform you come into: where the table has no
   answer, the sentence is as it is now.
6. **Check before trusting.** A list for John of what the table says at 20 or so stations he
   knows, for him to mark right or wrong; and the Knowledgebase's step-free notes as a
   cross-check (a station whose note says "overbridge" shouldn't come out as "subway").
7. **`npm run check`**: the table's answers for the stations John has confirmed, word for word.

## 7. Wording still to draft with John

Nothing here is agreed. Cases to set out for him, as real examples:

1. A footbridge: his example above.
2. A subway.
3. The same island ("just across the platform"?), and the same platform face (9 and 9B). John
   said on November 21st 2026 not to add a "9 and 9B are the same platform" sentence "for now".
4. A bay platform on the level.
5. A long walk at a big station (Reading's bridge, Clapham Junction): whether to say anything
   about how long it takes. No source for walking times was found.
6. Lifts: whether to mention them, and whether Network Rail's feed of lifts out of order is
   worth adding.
7. Whether the minutes for "fine", "tight" and "unlikely" (six or more; five, four or three; two
   or one) should change when the platforms are far apart. The railway publishes a minimum
   connection time for each station, which journey planners use; Claude believes it's in the
   timetable data, not in any feed John subscribes to. Not looked into.

## 8. Licences: read before building

1. **OpenStreetMap** is under the Open Database Licence. It needs a visible credit ("©
   OpenStreetMap contributors") and has share-alike terms for a database made from it. Read the
   terms for a derived table before publishing one. The repo is public, which may be enough;
   not checked.
2. **Knowledgebase Stations**: read its licence before showing or relying on its text.
3. A credit line would go in "About these figures" (`src/components/Tail.tsx`), agreed with John.

## 9. Practical points

1. **One Rail Data Marketplace key at a time** is saved in the cloud environment (one per
   address). On November 21st 2026 it was left as Knowledgebase Stations. Ask John to swap it
   through the secure form when the live board is needed. Never write a key anywhere.
2. Network: `api.openstreetmap.org` worked; `overpass-api.de` is allowed but dropped
   connections; `download.geofabrik.de` isn't allowed. Ask John to allow what's needed.
3. This is a visible change, so a branch, a preview and John's word before merging (house
   style §10). Notes and this handover can go straight to `main`.
4. The trial's scripts and findings: `design/platform-links-trial/` (`README.md`, `kbread.py`,
   `osmread.py`, `islands.py`). The map files themselves weren't kept (16 MB).
5. When this starts or is decided against, update the tracker (`trainchecker.md`, "Ideas for
   later" item 1, and its `INDEX.md` line).

## 10. A suggested order of work

1. Ask John whether he wants this now, and show him §5's results.
2. Read the two licences (§8) and tell him what they require.
3. Write the path-following script for the same six stations and show him what it says, pair by
   pair, beside the crude test's answers.
4. If he's happy, choose how to fetch every station (§6.3), build the table, and give him the
   list to check (§6.6).
5. Draft the sentences on real boards (§7) for him to edit.
6. Build it into `answer()`, with checks; preview; his word; merge.

## Prompt for John to paste into the new session

```
This is Trainchecker. I'd like to pick up the "over the footbridge" idea for Connections: saying
how to get from the platform you arrive at to the one you want. Please read
design/handover-platform-links-2026-11-21.md first and follow it, starting by showing me what
was found and asking whether I want to go ahead.
```
