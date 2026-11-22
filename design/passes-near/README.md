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
7. All 26 pilot items kept as written; more lines to be added to the same file.

## The data: `passes-near.json`

- `lines`: each a list of station codes in order along the track, every station counted whether or not a
  train stops. A journey's stretches come from its train's calling points: for each pair of calling points
  in a row, take the slice of a line that holds both, in order. A fast train from Reading to Swindon covers
  Reading–Tilehurst, …, Didcot Parkway–Swindon.
- `items`: one per stretch.
  - `a`, `b`: the stretch, written in the direction the research was done.
  - `kind`: `near`, `crosses` (a bridge, viaduct or river the train crosses) or `boundary`.
  - `side`: `left` or `right` when travelling from `a` to `b`, facing forwards; swap for `b` to `a`.
    `null` for crossings and boundaries.
  - `text`: the sentence; `{side}` stands for `left` or `right`.
  - `textReverse`: where present, the sentence for `b` to `a` (boundaries).
  - `name`, `lat`, `lon`, `distanceM` (metres from the track, rounded), `source` (where the facts were
    checked).
- Every sentence follows the house wording rules (British spelling; one to nine in words; no "under/over").

## How it was made

- **Track:** an OpenStreetMap route relation for the service (`osmRelation` on each line), fetched whole
  from `api.openstreetmap.org/api/0.6/relation/<id>/full.json` and joined end to end.
- **Stations:** Nominatim, matched on `ref:crs`, then placed on the track in order.
- **Candidates within 1 km:** Historic England's National Heritage List (Grade I and II* listed buildings,
  scheduled monuments, parks and gardens, World Heritage Sites; Open Government Licence) and Wikipedia's
  geotagged articles.
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

```
Read design/passes-near/README.md in JohnBaish/trainchecker. Build the data side of "Your train
passes near…" from design/passes-near/passes-near.json, following John's decisions there: copy the
data into src/data (loaded only when needed), work out a journey's stretches from the stops api/live.ts
already sends (the train with the most stops) and the lines in the file, pick one item at random on each
visit with a way to get another, swap left and right for the other direction (use textReverse where
there is one), and add the one-line note about facing backwards. Show nothing on a journey none of
whose stretches has an item. Add checks to npm run check on real saved boards (Reading to Paddington
both ways, a fast Paddington to Bristol, a journey with no items). Before building anything visible,
ask me how I want it presented on the page, and show me options at computer and phone widths. Add the
Historic England credit to About as a draft for me. More lines will be added to the same file later, so
nothing should be specific to Paddington to Bristol.
```
