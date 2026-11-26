# "Find my train from my location" (idea, being looked into; nothing built)

## What John wants (November 26th 2026)

- A button at the top of the train list in Connections and in Exits ("Check directions from your
  train"), inside the fold: **"Find my train from my location"** (John's wording).
- Its only job: narrow down which train you're on, so it's easier to choose the right one. Not to
  show where you are on the line.
- When two trains are too close to tell apart, offer both and let you choose (John: yes).

## The idea, as proposed (Claude's, for John to agree in detail)

1. Shown only when at least one train in the list has already left A (when none has, location
   can't help).
2. The phone asks permission only when the button is tapped. The position is used on the phone
   only and never sent anywhere.
3. Your position is placed along the journey by the stations' map positions.
4. Each train's position now is estimated from its times at the stops between A and B: actual
   times at stops passed, expected times at stops ahead (National Rail's boards give both;
   `api/live.ts` keeps only A's and B's times today, so it would need to keep these too).
5. The nearest train is picked and answered as if tapped; two too close to tell apart are both
   offered; still at A, or nowhere near the line, is said rather than guessed.

Known limits: no GPS underground (the central Elizabeth Line) or in long tunnels; trains a few
minutes apart on busy lines; positions between stations are estimates.

## Station positions: checked November 26th 2026

The Knowledgebase Stations feed (the same files as `scripts/build-stations.ts`) gives a
`<Latitude>` and `<Longitude>` for every station: all 2,616 in `src/data/stations.json`, in
England, Wales and Scotland. Compared with the station ends of the OpenStreetMap track
(`design/passes-near/stretches.json`, 2,026 stations in England): half within 39 metres, nine in
ten within 113 metres, 99 in 100 within 320 metres. The files arrive gzip-compressed
(`curl --compressed`; Node's fetch unpacks them itself).

Wrong in the feed, to correct if this is built:

1. Burnham-on-Crouch (BUU): 51.838, 2.308, in the North Sea, about 105 km out. The track says
   51.633, 0.812.
2. Canary Wharf (Elizabeth line) (CWX): longitude 0.01578, should be -0.016 (sign wrong), about
   2.3 km out.

Further out than the rest, perhaps worth taking from the map instead: Hawarden Bridge (about
1.3 km), Euxton Balshaw Lane (1.2 km), Kings Heath (830 m), Beaulieu Park (620 m), Okehampton
(580 m), Kirkstall Forge (570 m). Not looked into why.

## Next

Not decided: build the matching first and check it on saved boards with a pretend position,
then mock-ups; the real test is John on a journey.
