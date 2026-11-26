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

## The matching, built and checked (November 26th 2026, branch `claude/happy-darwin-mmnd4m`; nothing on the page yet)

John: "Yes please" to building the matching first. What's there:

- `scripts/build-positions.ts` makes `src/data/station-pos.json` (all 2,616 stations, 67 KB,
  28 KB compressed; to be loaded only when the button is tapped). Where the feed and the track
  differ by more than 500 metres the track's position is used: the eight stations above.
- `api/live.ts` now keeps each train's times at its stops between A and B (`calls`: code,
  timetabled, actual or expected). The answer grows by about 1 KB compressed (Reading to
  Paddington: 1.9 KB to 3.2 KB). Nothing on the page uses it yet.
- `src/lib/findTrain.ts`: `findTrain()` answers `far`, `atA` (with the next train), `one`,
  `two` or `none`. Each train is drawn through the route's stations (the train with the most
  stops), so a fast train follows the track's bends too; stations it passes without stopping get
  a time by distance. A train counts as yours within four minutes (`TOL`), a little more when the
  phone is unsure. "At A" is within 400 metres, or the phone's uncertainty if more. "Off the
  line" is more than 2 km off it, or 1.5 times the phone's uncertainty, or 15% of a long
  stretch (drawn straight between stations). All these figures are Claude's, to tune on journeys.
- `scripts/check-find.ts` (in `npm run check`; `-v` prints the sweep): 76 checks. By hand, from
  the boards' times: still at Reading (the 9pm next), near Reading with the phone unsure,
  Birmingham and 5 km north of Maidenhead (off the line), Heald Green at 6.24pm (the 6.04pm),
  Gatley to Heald Green, Taunton at 7.48pm (the 6.03pm), Exeter St Davids with no train near,
  Hungerford to Bedwyn (the stopping 6.36pm, not the fast 6.03pm), Dunbar in Scotland at 10.08pm,
  Doncaster at 7.39pm (the 6pm, not the 6.30pm passing through), Pewsey at 8.14am. Then a sweep
  of every train between stations when each of the 16 boards was saved, placed where its times
  put it: 63 trains, all offered; 34 alone, 29 with one other train.

**For John:** the sweep's second trains were all within four minutes of you, most within two and
a half: Reading to Paddington's fast and slower trains, and Liverpool Street to Stratford's, run
that close, so "one of these two" will be common on busy lines and rare elsewhere (Euston to
Manchester, Kings Cross to Edinburgh, Tiverton Parkway: always one). The sweep places you
exactly where the times say, so it shows the sums work, not how a real phone on a real train
does; that needs a journey.

## On the page, for John to look at (November 26th 2026, same branch; not merged)

Built into the real page (`src/components/FindMyTrain.tsx`, in both `Connection.tsx` and
`Exits.tsx`), between the question and the list of trains. Shown only when at least one train in
the list has already left A and the browser can give a location. Pictures in
`design/previews/find-my-train/` (`shoot.mjs`: saved boards, the page's clock set to when each
was saved, a pretend location given to the browser): every answer at 390px light, and the first
three at 390px dark and 1200px light too.

What happens: tapping the button asks for the location (only then), loads the station positions,
and works out the answer. With one train, that train is chosen, as if tapped, and its answer
appears under it. With two, both are edged in a dashed accent line and you choose. Still at A,
the next train is chosen.

**Wording, all Claude's drafts:**

1. The button: "Find my train from my location" (John's).
2. Under it before tapping: "Your location stays on this device."
3. While finding: "Finding where you are…"
4. One: "From where you are, you’re probably on the 5.53pm."
5. Two: "From where you are, you’re probably on the 8.42pm or the 8.47pm, which are close
   together just now. Please choose one below." (In time order.)
6. At A: "You seem to be at Reading still, so here’s the next train, the 9pm." (With no train
   still to leave: "You seem to be at Reading still. Please choose the train you’re planning to
   take.")
7. Off the line: "You don’t seem to be near the line from Reading to London Paddington just now,
   so please choose your train below."
8. No train near: "None of these trains seems to be near you just now, so please choose yours
   below."
9. Not allowed: "Trainchecker wasn’t allowed to see where you are. You can change that in your
   browser’s settings, or choose your train below."
10. No location found: "Your location couldn’t be found just now. Please try again, or choose
    your train below."

**Found while taking the pictures:** at 2.55pm on Twyford to Reading no train had left Twyford,
so the button rightly stays hidden; the Connections pictures set the clock to 3.11pm
(illustration only). Twyford to Reading takes about eight minutes, so trains four minutes apart
give "one of these two" there. The saved boards predate the arrival board, so for Exits the
pictures make one up from the departures (illustration only).

**Not done yet:** About doesn't mention it (it says nothing is sent; the location isn't either,
but a sentence about it may be wanted); not tried on a real phone or on a real train.
