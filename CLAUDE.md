# Trainchecker: working notes

"How's this train line doing." A baish.net tool that tells someone, in
plain English and gently, how their train journey from A to B looks: the
next four hours, the platforms, the last week, the days ahead, and another
way round if needed.

**Project tracker:** when something significant changes (a stage
finished, a decision made, something goes live or is parked), update
`trainchecker.md` and its line in `INDEX.md` in
`JohnBaish/baish.net-directory`, following that repo's README, straight
to its `main` (John's standing permission, even when this session was
given its own branch). Before committing there, run
`node site/check-tracker.mjs` in that repo and fix anything it lists.

## Read these first

0. Next: the rest of stage 5 (`design/handover-stage-5-2026-11-18.md`): the baish.net card (Search Console done); search work live
   at trainchecker.baish.net since November 18th 2026. The fresh look is done (November 18th
   2026, `SPEC.md` §11). The agreed wording: `SPEC.md` §8 to §11.
1. `design/handover-2026-11-17.md`: John's brief, in his own words.
2. `SPEC.md`: what the tool does, with the open questions.
3. `PLAN.md`: the stages.
4. `HOUSE-STYLE.md`: the shared design and ways of working.
5. `SEO-HANDOVER.md`: when search work comes up (stage 5).
6. `design/handover-platform-links-2026-11-21.md`: "over the footbridge" (how platforms connect,
   for Connections), live since November 21st 2026; the trial and build in
   `design/platform-links-trial/`.

## Key points

- Nothing visible is built until John has answered the spec's questions
  and agreed stage 1.
- Never write a key or token into a file, log or commit. Keys live in
  Vercel's settings as "Secret" variables (house style §9). The Rail
  Data Marketplace's key goes in an `x-apikey` header; its "consumer
  secret" isn't used.
- `vercel.json` sets the functions' region (`lhr1`) and time limits. Automatic deployments
  are on again since stage 3 was merged (November 17th 2026): `main` is the live site at
  trainchecker-alpha.vercel.app, each branch gets a preview: `https://trainchecker-git-<branch>-john-baish.vercel.app/`,
  the branch name with "/" as "-" (e.g. `trainchecker-git-claude-quirky-feynman-l9a8pb-john-baish.vercel.app`,
  John, November 20th 2026). Vercel shortens names over 63 characters, so a long branch name
  won't fit this pattern: then use the commit's Vercel "Details" link on GitHub.
- **The app (stage 3):** Vite, React and TypeScript, parts copied from Riverwatcher
  (`organic.css`, `theme.ts`, `ThemeSwitch.tsx`, `responsive.ts`, `words.ts`) and the
  agreed mock-ups' styles (`src/styles/global.css`). Four Vercel functions: `api/live.ts`
  (the live board, five windows), `api/week.ts` (the history, one half hour), `api/days.ts`
  (stage 4: the incidents feed, live to the end of Sunday; matched in the page by
  `src/lib/incidents.ts`) and `api/connect.ts` (Connections: the stations and trains onward from
  the changing station; its sums and sentences in `src/lib/connection.ts`). The rules in
  `src/lib/analyse.ts`, every sentence in `src/lib/sentences.ts`. `npm run dev` and `vite
  preview` serve the functions too (`vite.config.ts`); from a cloud session run them with
  `NODE_USE_ENV_PROXY=1 RDM_LDB_KEY=proxy-injected RDM_HSP_KEY=proxy-injected RDM_KB_KEY=proxy-injected`
  (only the key saved here works). `npm run check`: `scripts/check-rules.ts`, `scripts/check-api.ts`,
  `scripts/check-days.ts` and `scripts/check-connection.ts`, on the real snapshots.
  Browser checks: `design/previews/stage3/sweep.cjs` and `try.cjs` (preview on port 4620).
- Functions run in London (`lhr1`): the incidents licence allows UK use
  only.
- Every figure on the page comes from real data. Examples in documents
  are marked "illustration only".
- Copied from `JohnBaish/clockwheel` at commit `372c03c` (November 17th
  2026): `HOUSE-STYLE.md`, `SEO-HANDOVER.md`, `.claude/skills/fresh-look/`
  and `.github/workflows/tidy-branches.yml`. Clockwheel holds the master
  copies.

## Log

### November 22nd 2026: exits named by what's near them; live (branch `claude/dreamy-dijkstra-swkirc`, merged the same day; Claude Code)

- **John:** name exits by what's near them; the name replaces a street name (option b); a town
  centre only where it suits (from 14 London examples: the station named after the place, and near).
- **Built:** `design/platform-links-trial/landmarks.py` (town and city points, bus stations,
  hospitals, universities, shopping centres, stadiums and car parks within 2 km of 1,195 stations,
  from the UK extract) and `name_exits.py` (the one exit that faces a landmark: nearer than every
  other by half the distance between them, and 40 m; a town point within 600 m or a city point within
  1.2 km, the station named after it; others within 400 m; a car park beside one unnamed exit; a
  name fitting two exits dropped). Output `exits-2026-11-22/exit-names.json`, read by
  `build_exits_table.py`; its tie-break made fixed (the lower platform). `toName()`/`hereName()` read
  "the … exit" before the street rule. Ivybridge's Hazel Lane is the town centre exit (John).
- 430 map-data stations gain a name (162 town centre, 174 car park, 41 bus station, 29 university,
  26 shopping centre, 25 hospital, 18 city centre, 14 stadium). For John: Stirling (Goosecroft Road as
  the city centre exit), Twyford (a car park exit by platform 4 beside an unnamed one).
- **Then (John):** a train ending at B is no longer offered in Exits (its platform can't be seen);
  no question when none is left. Stirling keeps Goosecroft Road (both exits suit the city centre).
  Twyford's four exits (John: the long-term car park from platform 3 only; the exit between 4 and 5
  on the level from both; platform 4 the town side) in the corrections file, sentences Claude's draft.
- **John:** "Brilliant. Yes please": merged into `main` (fast-forward); checks 273 + 57 + 79 + 40 + 54,
  `tsc -b`, lint and build clean first.
- **Checked:** `npm run check` 273 + 57 + 79 + 40 + 52; `tsc -b`, lint, build; the build without the
  names matches the live table except Birmingham Curzon Street's tie (not open yet).

### November 22nd 2026: "Exits" heading; Southampton Central and Ivybridge in John's words; live (`main`; Claude Code)

- **John:** the heading and first line repeated the station ("Station exits at Southampton Central" / "At
  Southampton Central, …"): heading now "Exits" ("Exit" for one), the sentences unchanged. Ivybridge:
  "There are two exits there: one by the footbridge, which is closest to the car park and buses, and
  one further along, which is quicker on foot to the town." (platform 1, John; platform 2's "Cross the
  footbridge to platform 1, where…" Claude's draft from it). Southampton Central: "the Blechynden
  Terrace exit near the Mayflower and the BBC" and "the town centre exit"; from platform 1 "…is right
  there, or you can go over the footbridge for the town centre exit", platform 4 the reverse.
  Corrections file: `say` (a platform's own words) and `mention_other` (the other exit over the
  bridge or through the subway); table fields `say` and `other`. Straight to `main` at John's word.
- **For John:** the "or you can go over the footbridge for …" pattern would apply at 598 stations
  (994 platforms; both exits named at 445); only Southampton has it for now. He thinks two-exit
  stations may need more work to be truly useful.
- **Checked:** `npm run check` 273 + 57 + 79 + 40 + 44; `tsc -b`, lint, build.
- **John:** switch the other exit on everywhere, "even if we only have street names", so people can
  check a map. Done on branch `claude/dreamy-dijkstra-swkirc` for him to see (633 platform answers;
  `mention_other` now unused); not merged. He also thinks naming exits by what's near them (the
  town centre, a bus station) is worth doing: not started.
- **John:** "better than nothing" for "the exit by platform 4"; trap names that read oddly
  (`toName()`, `hereName()` in `exits.ts`: a place from a station map takes "the … exit", "the car
  park" takes "The exit to …", "the A82"; map-data names are always streets, left as they are);
  Ivybridge's informant's new platform 1 sentence ("one via the platform gate to the car park and
  buses, and one via the footbridge exit, which is quicker on foot to the town"), platform 2 Claude's
  draft from it. Merged and live at his word, with the other exit everywhere. Next: naming exits by
  what's near them.

### November 22nd 2026: "Station exits" built and merged the same day (branch `claude/dreamy-dijkstra-swkirc`; Claude Code)

- **John:** a section under Arrivals, "Station exit(s) at Reading": "At Reading, the exits are by
  platforms 1, 4 and 15.", then "Which train are you on?" and the way out from its platform;
  either way off a footbridge, saying which platform each comes down by; the station maps' names
  where read; footbridge, subway or level only; left off where the exits aren't known; the
  cautious approach for the 18 still in doubt (Southend Airport: by platform 1 only; Chislehurst:
  no north car park exit). Trial and decisions: `design/platform-links-trial/exits-results-2026-11-22.md`.
- **Built:** `design/platform-links-trial/build_exits_table.py` makes `src/data/exits.json` (1,914
  stations, 112 from station maps read by eye into a strict shape, `exits-2026-11-22/maps-strict-*.json`;
  the rest from OpenStreetMap; 40 KB compressed, loaded only with the section; licence in
  `src/data/exits-LICENCE.md`); `src/lib/exits.ts` (the sentences; new ones marked Draft);
  `src/components/Exits.tsx`; `api/connect.ts` `only=platform` (`fetchArrPlatform()` in `load.ts`);
  the credit in About extended (draft). Barrow crossings never used; level crossings from the map
  data left out (they can't be told from barrow crossings).
- **Checked:** `npm run check` 273 + 57 + 79 + 40 + 20 (new `scripts/check-exits.ts`: John's
  sentences on the real table, the stations he knows, the left-out list, every route valid); `tsc
  -b`, lint, build; Paddington to Reading's saved board with the platform lookup answered 8 and 4,
  1200px light and 390px dark with touch (`design/previews/exits/`): no errors, no sideways scroll,
  train buttons 65px. Not checked: live trains, Vercel's preview, a real phone.
- **John's corrections file** (`design/platform-links-trial/exits-overrides.json`, applied last by
  the build): Reading's names "the town centre and Station Hill" and "the north exit by the car
  park on the Caversham side", and "the bridge" (it has shops on it), not "the footbridge". New
  table fields `w` (the word for the bridge) and `here` (a renamed exit's "is right there"); a name
  in the file that isn't in the table stops the build. Checks 273 + 57 + 79 + 40 + 22.
- Southend Airport and Chislehurst moved into the same file (`by`, `no_routes`, `no_exit`); the
  table comes out the same. Raised by John: "Trainchecker doesn't know the way out from there"
  breaks the show-what-we-know rule; now "Your train is due into platform 1. The exit is by platform
  2." (the station's own sentence; John agreed). Checks 273 + 57 + 79 + 40 + 25.
- **Midgham (John):** exits from both platforms, either side of the level crossing (platform 1
  for Newbury, 2 for Reading, from National Rail's live board at 2.59pm). Agreed: a general rule
  "At Dean, there's an exit by each platform." where every platform's way out is on the level (574
  stations); "either side of the level crossing" and "…right there, by the level crossing." only
  where John has confirmed it (`level_crossing` in the corrections file, starting with Midgham,
  whose platform 1 exit was added with `add_exits`); a "(platform 1)" bracket dropped from your own
  platform's exit. Checks 273 + 57 + 79 + 40 + 31.
- **John (the preview, Newton Abbot to Ivybridge at 3.17pm):** Arrivals said nothing due in the next
  hour while Station exits offered the 4.20pm and 5.15pm and asked "Which train are you on?".
  Agreed: the question fits the list (`whichTrain()` in `connection.ts`, used by Connections too):
  "Which train are you planning to take?" when none has left A, "…on?" when all have, "…on, or
  planning to take?" otherwise (a late train counts by its new time; "Delayed" hasn't left);
  Arrivals adds "The next one is due at 4.20pm." after "No direct trains … in the next hour." (draft);
  "At Ivybridge, both exits are by platform 1." ("all the exits" for three or more). Ivybridge's
  second exit (an unnamed road about 65 metres along) for John to check. Checks 273 + 57 + 79 + 40 + 38;
  Paddington to Reading (all left: "on") and Reading to Midgham ("on, or planning to take") in the
  browser at 390px dark and 1200px light: no errors, no sideways scroll.
- **John:** "Let's merge this version to Main." Checks 273 + 57 + 79 + 40 + 38, `tsc -b`, lint and
  build clean first; fast-forwarded into `main` with this note. Still open, for this thread:
  Ivybridge's second exit (John is asking a friend). Still Claude's drafts, live as they are: the
  sentences marked Draft in `src/lib/exits.ts`, "The next one is due at …" in Arrivals, and the
  extended credit in About.

### November 22nd 2026: exits, a trial on six stations (notes and trial scripts, straight to `main`; Claude Code)

- **John:** an "Exits" section under Arrivals: "The exits are by platforms 17 and 5", then, for the
  train you're on, the way to the exit. Tried on the six stations of the platform trial.
- **Done:** `design/platform-links-trial/exits.py` (on `build_table.py`, which now also keeps road
  names and leaves its walking graph in `LAST`); results and method in
  `exits-results-2026-11-22.md`. The map's own entrance tags are mostly shop and office doors, so
  ways out are where the station's paths meet a road. Nothing on the page; not checked at the
  stations.

### November 22nd 2026: engineering work about a train that has gone; live (`main`; Claude Code)

- **John (Paddington to Reading at 8.23am):** "The days ahead" still showed the 12.34am's amended
  item and "The 6.38am … will not run". Agreed (`SPEC.md` §12.27): `goneSingle()` (used in
  `forJourney()`, which now takes `now`) and the summary skipping a gone train's sentence (`gist()`
  takes the item's `end`) in `incidents.ts`. The day-long item stays, as its work runs all day.
- **Checked:** `npm run check` 273 + 57 + 79 + 40 (new, on the live feed saved at 8.26am,
  `design/mockups/snapshots/20261122-0826-days.json.gz`: before and after 12.34am, the 6.38am and
  6.20am dropped from the summary at 8.23am, a train starting elsewhere kept, an earlier day of the
  item kept; two older checks given the feed's own date, as they had used the real clock); `tsc -b`,
  lint, build. Not checked in a browser or on a phone. Pushed first to `claude/dreamy-dijkstra-swkirc`
  for John, then to `main` at his word.

### November 22nd 2026: Connections, a long wait; live (`main`; Claude Code)

- **John (live trains, Paddington to Reading for Midgham at 7.18am):** a 91-minute gap read "you
  should be fine. You'll have 91 minutes to change trains." Agreed: more than 40 minutes opens "The
  next connecting train to Midgham is the 9.43am, which is going to give you quite a wait at
  Reading.", "between trains", words from 70 minutes, "currently expected", and the cases in
  `SPEC.md` §13.16. Straight to `main`.
- **Built:** `answer()` in `connection.ts` (`long`, `isNext`).
- **Checked:** `npm run check` 273 + 57 + 73 + 40 (new: the next train, the same train chosen, a
  later one chosen, 45 minutes in digits, a late onward train, 36 minutes unchanged, on the saved
  Newton Abbot boards); `tsc -b`, lint. Not checked in a browser (the answer is one paragraph of
  text) or on live trains.

### November 22nd 2026: earlier trains with no platform yet; live (`main`; Claude Code)

- **John (iPhone, Paddington to Reading at 7.10am):** Platforms said "Trains are currently going from
  platform B" and listed 8.15am first, but trains at 7.36, 7.38, 7.50, 7.51 and 7.53 had no platform
  yet (platform B is the Elizabeth Line's, shown early). Agreed: the "So far" sentence and option A,
  a line above the list; straight to `main`. `SPEC.md` §12.26.
- **Built:** `earlierNoPlatform()`, `earlierLine()`, `soFarLater()` in `sentences.ts`; `before` on
  the platforms picture (`share.ts` draws it above the rows); `.tbefore` in `global.css`.
- **Checked:** `npm run check` 273 + 57 + 73 + 34 (new: Paddington to Reading with only B announced,
  Bath to Bristol with the first two trains' platforms removed, no line on any saved board); `tsc -b`,
  lint, build; the fold at 390px dark and 1200px light on those boards, and the picture read back from
  the clipboard: no errors, no sideways scroll. Not checked: live trains, a real iPhone.

### November 21st 2026: "over the footbridge" picked up: following the drawn paths (notes and trial scripts, straight to `main`; Claude Code)

- **John:** pick up the idea from the handover. Step 3 done: `design/platform-links-trial/paths.py`
  follows the map's footways, steps, subways and lifts between every pair of platforms at the six
  stations; results in `paths-results-2026-11-21.md`. Oxford now comes out 1/2/3 | 4 and Reading's
  bays 1 to 7 all on the level (both wrong in the crude test); Newton Abbot and Twyford unchanged;
  Bristol all by the subway; Clapham Junction by subway or bridge per pair. None checked at the
  stations: for John, Reading, Twyford and Oxford.
- **Licences (step 2):** not read at first (sites blocked). Then, at John's word ("ask me
  yourself"), the environment allows `www.openstreetmap.org`, `osmfoundation.org`,
  `wiki.openstreetmap.org`, `operations.osmfoundation.org`, `download.geofabrik.de`,
  `download.openstreetmap.fr` and two Overpass servers. Read and quoted in
  `licence-notes-2026-11-21.md`: credit "OpenStreetMap" linked to its copyright page; the table
  is a Derivative Database, so under the Open Database Licence with a notice; the editing API isn't
  for bulk reading, so extracts instead. The Knowledgebase Stations licence still isn't public.
- **John:** Reading, Twyford, Oxford and Bristol Temple Meads all right; carry on.
- **Every station:** `build_table.py` from the UK extract of November 21st 2026
  (download.openstreetmap.fr; Geofabrik and overpass-api.de drop every connection from here).
  1,889 of 2,616 stations have two or more platforms on the map, 1,676 with every pair answered.
  Fixed on the way: paths stopping short of line-drawn platforms (Exeter), subways drawn without a
  tunnel tag and a road under the station (Maidenhead, Bath Spa), a walk via a road under the
  line (Reading West: "out of the station"). Results in `paths-results-2026-11-21.md`; 29
  stations for John to check in `check-list-2026-11-21.md`. Nothing on the page yet.
- **John:** the ones he knows all look right (he offered Redhill too: 0 | 1/2 | 3, by subways);
  the drafts (`wording-drafts-2026-11-21.md`) "just as I would write them", to see in context; the
  island and the longer level walk told apart; no lifts; the credit "The directions between
  platforms in the Connections section come from OpenStreetMap."
- **Built** on branch `claude/brave-fermat-yk5elq` (not merged): `src/data/platform-links.json`
  (the 1,889 stations in the list; 9.5 KB compressed, loaded only when Connections opens) with
  `platform-links-LICENCE.md` (Open Database Licence); `src/lib/platformLinks.ts` (`howToGet()`,
  9B as the map's 9 where 9B isn't drawn, nothing for 9A to 9B); `answer()` takes `links`; the
  credit in "About these figures" (`Tail.tsx`). `build_table.py` now splits each level group into
  islands (shapes that touch).
- **Checked:** `npm run check` 267 + 57 + 73 + 34 (new: the three real answers with "over the
  footbridge", the same platform unchanged, every kind on the real table, pairs in order); `tsc
  -b`, lint, build. Browser: at 10.57pm live boards gave no answer naming both platforms, so the
  page was fed the 2.55pm boards with its clock set then (`design/previews/connection/footbridge.mjs`):
  Ivybridge–Newton Abbot–Torquay, Twyford–Reading–Swindon and –Paddington, 1200px light and 390px
  dark with touch: the drafts word for word, no errors, no sideways scroll; the credit links to
  openstreetmap.org/copyright. Not checked: Vercel's preview, a real phone.
- **John (the preview):** "This looks great … please merge it to Main", tweaks from there. Checks
  267 + 57 + 73 + 34, `tsc -b`, lint and build clean first; merged with this note in the same push.
  Live now; to try on live trains in the daytime. To rebuild the table later: download a fresh UK
  extract and run `build_table.py`, then copy the stations in the list into `src/data/` (see
  `src/data/platform-links-LICENCE.md`).

### November 21st 2026: Connections ("Check my connection"), built and merged the same day (branch `claude/gracious-mendel-emq471`; Claude Code)

- **John:** a button under the quote of the day. It takes B as the changing station, asks for the next
  destination (ideally only stations with a train from B in the next two hours), then which train you're
  on, and answers in a sentence ("You should be fine. You'll have 11 minutes to change trains…"), with
  both platforms and, if possible, how to get between them. Nothing built or agreed yet.
- **Tested at 2.55pm** (real boards in `design/mockups/snapshots/20261121-1455-connection/`):
  - A train's id starts with the same eight digits on every station's board (`10918949IVYBDGE_` at
    Ivybridge, `10918949NABT____` at Newton Abbot), so the train you're on can be found on B's board,
    with its platform there (Ivybridge's 3.04pm: platform 3 at Newton Abbot).
  - A train that ends at B isn't on B's departure board (Twyford to Reading's stopping trains), so its
    arrival platform can't be had. Later stops on a board carry no platform.
  - A board gives 25 rows at most, whatever `numRows` asks: Reading's whole board reached only 40
    minutes ahead. Two hours as eight 15-minute pieces at once: Reading 67 trains, 144 stations, all
    with platforms; Clapham Junction still cut short (25 in most pieces, 191 trains seen, 260 stations).
    Sixteen requests at once took 1.9 seconds.
  - Newton Abbot's whole board: 17 trains in two hours, 52 stations, one request, 0.8 seconds.
- **John's answers:** tight is five, four or three minutes; "looks unlikely" two or one; "You won't make
  this" none or less. The answer opens "If you're planning to get the 3.39pm to Torquay, you should be
  fine", with a way to ask about a different train (he wants to see it). In place under the button, not a
  pop-up. The drafts "great", with: "expected to arrive on time" (not "in on time"); "You'd only have";
  nothing said when the platform you come into isn't known; "worth checking again later"; "It may make up
  time, so don't count on it" when the change only works because the onward train is late; "showing as"
  dropped when the final destination is the one asked for; the next train after "fine" too, as "The one
  after that is…"; the closing line when your train is more than 30 minutes from B.
- **Built, a prototype for John to try (not merged):** `api/connect.ts` (the stations with a train from B
  in two hours, as eight pieces; the trains from B to C for four hours; your arrival platform from B's
  board asked only for trains that came from A, which worked: `filterType=from`); `src/lib/connection.ts`
  (the bands, `answer()`); `Connection.tsx` under the quote; `StationBox` exported, `suggest()` prefers
  the stations served but takes any. Still Claude's drafts: the questions and headings, "got in at", "a
  little early", "N minutes after the … train is due to leave", the delayed and no-train messages, "The
  3.45pm to York has been cancelled. If you're planning to get the … instead". Not built: "over the
  footbridge", the railway's minimum connection times, a Share.
- **Checked:** `npm run check` 267 + 57 + 73 + 15 (new `scripts/check-connection.ts`: the four answers
  word for word on the 2.55pm boards, same platform, no change needed, cancelled); `tsc -b`, lint, build;
  Chromium against live trains at 3.12pm (`design/previews/connection/try.cjs`), Twyford to Reading for
  Oxford and Ivybridge to Newton Abbot for Torquay, 1200px light and 390px dark with touch: answers in
  0.8 to 1.8 seconds, no sideways scroll, nothing under 44px on the phone; the only errors were "The days
  ahead" (its key isn't the one saved here). **Not checked:** Vercel's preview, a real phone, Safari.
- **John (the preview):** "This looks great." Two faults: a second "Check my connection" box that didn't
  work, and the panel staying at the top after a change of journey. One cause: `Connection` had the same
  `key` as `LastWeek` beside it, and with two children of one key React left the old panel on the page.
  The key removed (`JourneyView` is itself keyed by the journey). Laid out as Arrivals is, at his
  suggestion: a card headed "Connections", a line (Claude's draft: "Changing trains at Reading? See
  whether you'll make your next one."), and a fold "Check trains leaving Reading"; the button and Close
  gone. And when the next train is unlikely too: "The next connection which looks comfortable is the 3.48
  from platform 9B, which would give you a 34-minute wait." (also after "tight too": Claude's draft).
  Checked: `npm run check` 267 + 57 + 73 + 15, `tsc -b`, lint, build; `try.cjs` again at 1200px and 390px
  with touch, now changing journey afterwards: one card, folded, for the new journey; no sideways scroll.
- **John:** no line under the "Connections" heading, to try (removed); the comfortable-connection
  sentence stays after "tight too" as well. The train list offers a train that got in within
  the last three minutes (John; it was five), no longer.
- **"Over the footbridge" looked into (John; web search only, nothing tested):** no ready-made national
  source of how platforms connect was found. Leads: the Knowledgebase Stations feed John already has
  (accessibility notes in words, per station; its fields not seen yet); OpenStreetMap (platforms,
  footbridges, subways and steps drawn as map shapes; coverage unknown; its query service is blocked
  from this session); Network Rail's lifts and escalators feed (lifts only); TfL's station structure
  data (London only); National Rail's station plans (pictures, Rail Delivery Group's copyright).
  Proposed: try the first two on six stations before deciding.
- **Then tried on six stations** (`design/platform-links-trial/`): the Knowledgebase's step-free note
  says how a station is crossed ("via lifts and an overbridge from platform 3"), not which platforms
  are together. OpenStreetMap has every platform, footbridge, subway and lift drawn at all six; a crude
  straight-line test got the island platforms right but the bay platforms wrong (Oxford, Reading).
  Following the drawn footpaths would be the proper way: a piece of work of its own. John: no "9 and 9B
  are the same platform" wording for now. `overpass-api.de` is allowed but dropped every connection;
  `api.openstreetmap.org` worked.
- **Handover written** at John's request: `design/handover-platform-links-2026-11-21.md` (with the
  trial's scripts, straight to `main` too, as notes: house style §10); "Read these first" points to
  it; the tracker's first idea for later names it. John will say when to merge Connections.
- **John (the preview, Midgham to Reading for Paddington):** it treats every Paddington train alike.
  Found on the 2.55pm boards: "The one after that is the 3.29 from platform 14" was the Elizabeth Line
  train (Paddington 4.25pm), with a Great Western 3.29 from 11A getting there at 3.55; two "3.29pm"s in
  the row; no arrival time anywhere. **Agreed:** slower trains stay in, as people may be booked on them;
  the answer says when you'd get there (expected, else timetabled); a later train that gets there sooner
  is pointed out. **Built:** `Onward.operator`; `speeds()` (the page's fast, slower and Elizabeth Line
  rule), `reaches()`, `chipLabel()` in `connection.ts`; "the 3.29pm Elizabeth Line train to London
  Paddington", "It's expected to get there at 4.25.", "The 3.29 fast train from platform 11A leaves at the
  same time but gets there sooner, at 3.55." (or "leaves later"); the row reads "3.29pm Elizabeth Line,
  arrives 4.25". Claude's choice, told to John: the trains it suggests itself ("the next one", "the one
  after that") skip a train that a later one overtakes; the first answer and anything chosen don't.
  Checked: `npm run check` 267 + 57 + 73 + 21, `tsc -b`, lint, build; `try.cjs` live at 5.18pm, Midgham
  to Reading for Paddington, 1200px and 390px with touch: no sideways scroll, nothing under 44px.
- **John:** "…is expected to leave on time at 3.29, getting there at 4.25." in one sentence; "you'll
  want platform 10 for the 3.27" where trains are being told apart, and with a quicker train both
  platforms: "platform 14 for the 3.29 Elizabeth Line train, or platform 11A for the 3.29 fast train."
  Done in `answer()`. Claude's drafts from it: where the platform you come into isn't known, "…at 3.14
  from platform 7, getting there at 3.38. It'll be showing on the departure board as the Manchester
  Piccadilly train."; with two trains, "The 3.29 Elizabeth Line train will be showing on the departure
  board as the Abbey Wood train."
- **Share for the answer (John):** a picture of the box, in the dark colours as the lists are, its edge
  in the answer's colour, headed "Changing at Reading for London Paddington" (`answerImage()` in
  `share.ts`; "Share this answer" / "Copy this answer" in `Connection.tsx`). The sentence sent with it
  is Claude's draft: "Here's how my change at Reading for London Paddington looks on Trainchecker.",
  with the journey's link. Checked: `npm run check` 267 + 57 + 73 + 21, `tsc -b`, lint, build;
  `design/previews/connection/share.cjs` at 1200px on live trains at 5.27pm: copied, read back from the
  clipboard (`share-picture.png`), both fonts loaded, no errors. Not checked: a phone's share sheet.
- **John:** the share sentence "is perfect" (agreed); the picture's heading is "Changing at Reading for
  London Paddington from the 5.25pm Midgham train" (done).
- **John (the preview on his phone, Midgham to Reading for Coventry):** a wait of an hour or more to
  the nearest quarter of an hour, "almost" or "more than" whichever is closer: 94 minutes is "a wait of
  more than an hour and a half" (it said "more than an hour"). `longWait()`; checks 267 + 57 + 73 + 23.
- **John (Earley to Reading for Oxford):** "The one after that is two minutes later, the 6.47 from
  platform 9B, which would give you a 23-minute wait." Done after "fine", when the second train leaves
  less than ten minutes after the first (the limit is Claude's, for John to confirm).
- **John:** "this is all great work now. Let's merge it to Main." The agreed wording is in `SPEC.md`
  §13. Checks 267 + 57 + 73 + 23, `tsc -b`, lint and build clean first; merged with this note in the
  same push. Still Claude's drafts, live as they are: the two questions in the fold, "got in at", "a
  little early", the delayed and no-train messages, the cancelled opening, "arrives" in the row of
  trains. Not built: "over the footbridge" (handover above), the railway's minimum connection times,
  a mention of Connections in "About these figures".
- **Checked live** at trainchecker.baish.net a few minutes after merging: the new build is served, and
  `/api/connect` answers (Newton Abbot's stations; Reading to London Paddington, 48 trains with their
  companies and platforms). Branch tidied: "Delete merged branches" trial run 44932555906, then the
  real run; `git ls-remote --heads origin` shows only `main`. Tracker updated (Connections live; next,
  the baish.net overview). Not checked: the card itself on the live site in a browser, a real phone's
  share sheet.
- Key saved here now: Live Departure Board.

### November 20th 2026: next weekend's full closures, an idea for Monday (notes only; Claude Code)

- **John** (who'd mixed up the weekends: National Rail's "no trains to / from London Paddington" page is for
  November 28th and 29th, not this Sunday) liked the idea of also showing the following weekend's whole-line
  closures. **Tried on the saved feed of November 18th 6.35am** (nothing built): to this Sunday 97 items, to the
  next 172; only 14 of the extra are whole-line closures ("no trains" / "buses replace trains", not night work),
  about a fifth more to download. Matching: Reading and Maidenhead to Paddington catch Dolphin Junction; Midgham
  and Bath to Bristol nothing; Victoria to Brighton wrongly catches "No Southeastern trains … London Victoria";
  Reading to Slough misses it (the headline names only Paddington).
- **For John on Monday, in this thread:** (1) the wording, draft "Looking further ahead: there will be no trains
  to or from London Paddington on Saturday November 28th and Sunday November 29th (Dolphin Junction upgrade).",
  National Rail's advice folded; (2) count a closure naming a train company only when that company runs the
  journey's trains (recommended); (3) accept headline-only matching for now. Kept apart from the verdict and the
  list to Sunday.

### November 20th 2026: the big time is the one to act on (branch `claude/quirky-feynman-l9a8pb`, merged the same day; Claude Code)

- **John (the live site, Reading to Paddington):** "12.59pm, the 12.35pm, Fast, arriving 11 minutes late" looked like a
  13-minute journey: 12.59 was the timetabled arrival (§12.17, a misunderstanding on November 19th: he meant the
  timetabled departure from A to be shown); and "12.53pm … six minutes late" under Platforms could read as leaving at
  12.59. Agreed: in both boards and pictures the bold time is when the train is expected, with "was due 12.47, running
  late"; headings "EXPECTED TO LEAVE" (John's choice over "Expected off" or "Now leaving") and "EXPECTED IN". `SPEC.md` §12.21.
- **Built:** `dueSay()`, `runningLate()`, `PicRow.lateBy` (the boards' sentence counts from it) in `sentences.ts`;
  arrivals in expected order; the sentences' notes; `.bhead` heading on one line and `.blate .nw` in `global.css`.
  `design/previews/stage5-boards.mjs` (the boards close up, with their headings measured).
- **Checked:** `npm run check` 265 + 57 + 73 (new: "pm" once, kept across midday and on the hour; the headings; the
  expected order); `tsc -b`, lint, build; Reading to Paddington's saved boards at 390px dark and light and 1200px
  light: headings on one line, no errors, no sideways scroll; both pictures read back from the clipboard at 1200px.
- **John (the preview on his iPhone):** "The changes on this branch are excellent." Tighter: Platforms "was due 1.42"
  alone; Arrivals "running 15 minutes late" instead of "was due …". `SPEC.md` §12.22. Checks 267 + 57 + 73 (new: one
  minute, the first train in the sentence); `tsc -b`, lint, build; Reading to Paddington at 390px dark and both
  pictures at 1200px: no errors, no sideways scroll. Preview:
  trainchecker-git-claude-quirky-feynman-l9a8pb-john-baish.vercel.app.
- **John:** keep lateness on its own line on a phone (measured: "Fast · was due 2.19" would share the line on
  most phones, Elizabeth Line trains and arrivals wouldn't); "was due to go at 2.19" rather than "was due to leave
  at", which missed by a few pixels at 390px. `SPEC.md` §12.23. Checks 267 + 57 + 73; `tsc -b`, lint, build;
  both Reading to Paddington boards at 375, 390, 393, 402, 430 and 1200px: every note on one line, no errors,
  no sideways scroll.
- **John:** Arrivals still left it unclear that the big time includes the lateness. Four mock-ups on a saved board
  (`design/board-options/arrivals-lateness-options.png` and `.mjs`: A "was due in at", B "later than planned", C under
  the time, D an arrow); **John: D**. Built: `PicRow.arrow`, `minutesLate()` in `sentences.ts`; `Icon` "left";
  `.blate .barrow` in `global.css`; the arrow drawn on the canvas in `share.ts`. `SPEC.md` §12.24. Checks 267 + 57
  + 73; `tsc -b`, lint, build; Reading to Paddington at 390px dark, 375px light and 1200px light, and the arrivals
  picture: no errors, no sideways scroll. (Figtree, as loaded, has no "←", so the arrow is the icon, not a character.)
- **John:** in the shared picture the arrow pointed at the train, not the time (mock-up
  `design/board-options/picture-arrow-options.png`); the lateness now has its own line everywhere for arrivals
  (`.blate.own`; taller rows in `share.ts`). `SPEC.md` §12.25. "That's it now … merge it straight to main." Checks
  267 + 57 + 73, `tsc -b`, lint and build clean first; Reading to Paddington at 390px dark and 1200px light, and both
  pictures: no errors, no sideways scroll. Merged with this note in the same push.

### November 19th 2026: the lists on the page as boards (branch `claude/beautiful-allen-xir4rp`, merged the same day; Claude Code)

- **John:** the share pictures now look better than the page; could the folds look better while still
  speaking to you? Two prototypes on real code (`?mock=A`, a sentence inside the fold; `?mock=B`, the
  sentence above it), pictures in `design/board-options/`. **John:** B, with "FROM READING" lined up, and a
  simple one-platform list as a line of times with dots, "am" once.
- **Built:** `Board` in `JourneyView.tsx` (from `platformsPicture()`/`arrivalsPicture()`), `onceAmPm()`,
  `boardSummary()` in `sentences.ts`; the old `TimeList` gone; `.board`, `.bhead`, `.brow`, `.bline`,
  `.badge` in `global.css`. `SPEC.md` §12.20.
- **Checked:** `npm run check` 263 + 57 + 73; `tsc -b`, lint (no warnings), build; saved boards (Bath to
  Bristol, Tiverton Parkway to Paddington, Reading to Paddington) at 390px dark and 1200px light: no errors,
  no sideways scroll.
- **John (the preview):** Arrivals' fold back to "At Reading from Midgham"; for a one-platform list, three
  layouts tried (`design/board-options/simple-options.png`: A even columns, B tiles, C a big badge beside
  the times); B on a phone and A on a computer, "merge straight to main". The `?mock=` and `?simple=`
  switches removed. Checks 263 + 57 + 73, `tsc -b`, lint, build; Bath to Bristol at 390px dark, Tiverton
  Parkway at 1200px light, Reading to Paddington's board and arrivals at 390px: no errors, no sideways
  scroll. Merged with this note in the same push.

### November 19th 2026: "The next ten trains"; the two lists shared as pictures (branch `claude/beautiful-allen-xir4rp`, merged the same day; Claude Code)

- **John:** no sentence about the trains after the first ten with platforms; the list starts "The next ten
  trains are leaving at:" instead. Done in `platformTrains()`; grouped lists (Reading to Paddington) start
  "The next ten trains:" then the groups, and their Share words "Of the next ten trains, fast ones…" (draft,
  for John). `SPEC.md` §12.16.
- **Checked:** `npm run check` 246 + 57 + 73 (new: Bath Spa to Bristol's ten of more, and the grouped lead);
  `tsc -b`, lint, build; the fold at 390px dark (Bath to Bristol) and 1200px light (Reading to Paddington):
  no errors, no sideways scroll.
- **John asked:** could the two lists' Share send a picture of the panel, perhaps in the dark colours?
  Mock-ups in `design/share-picture-options/` (`data.ts` takes the real lists from saved boards,
  `options.html` lays them out, `picture.cjs` photographs them; fonts checked): A, the panel as on the page,
  dark; B, a row per train with the platform as a badge, dark; C, A in the light colours. Nothing built.
- **John:** B in dark; grouped lists start "The next ten trains" in bold, no colon (done; checks 246 + 57 + 73,
  the fold at 390px dark). The pictures to show timetabled times, lateness in words: B1 (platforms "TRAIN",
  "leaving three minutes late"; arrivals "DUE IN" then "the 8.47pm" from A, "arriving three minutes late")
  and B2 (arrivals "TRAIN" then "DUE IN"). Share words to start "The next ten trains…" when there are more.
- **John:** timetabled times for arrivals only; platforms keep the times they're leaving (option B). Arrivals
  B1 chosen. Asked for: a layout when all ten leave from one platform (`option-Bs1`, the platform once in the
  heading row; `option-Bs2`, a badge and "All ten trains are leaving from platform 1", times in two columns,
  read down), and "The next ten trains" in a shade as well as bold (`page-heading-options.png`: A accent, B
  grey, C small capitals as "The days ahead" uses). Nothing built.
- **John:** 3.1 and 4C; build it. **Built:** `.thead` in `global.css`; `platformsPicture()` and
  `arrivalsPicture()` in `sentences.ts`; `listImage()` and `listFileName()` in `share.ts` (canvas,
  1080 wide at 2×, dark colours); `ListShare` sends the picture, the words alone when there's no list.
  `SPEC.md` §12.17 and §12.18. **Checked:** `npm run check` 257 + 57 + 73 (new: rows, kinds, lateness,
  one platform, timetabled order, the words, a long journey's note, a delayed train); `tsc -b`, lint,
  build; Chromium at 1200px: Copy puts the picture on the clipboard (read back for four saved boards,
  `design/share-picture-options/built-*.png`); at 390px with touch: no share sheet in this browser, so
  it saves the picture ("Saved as a picture"); no errors, no sideways scroll. **Not checked:** a real
  phone's share sheet (WhatsApp, Messages), Safari's clipboard.
- **John (the preview, 9.15am):** "The changes are excellent." Delayed trains with no time: "?" in the time
  box, the explanation beside it, at the bottom; orange not red; the kind of train on arrivals too.
  `SPEC.md` §12.19. **Checked:** `npm run check` 259 + 57 + 73 (new: "?" and "was due", the delayed ones
  last, the rest in order, a delayed platforms row keeps its badge); `tsc -b`, lint, build; the pictures
  read back from the clipboard with two trains made "Delayed" in a saved board (illustration only,
  `design/share-picture-options/built-*-delayed-illustration.png`).
- **John:** "Please merge it to main." Checks 259 + 57 + 73, `tsc -b`, lint and build clean first; merged
  with this note in the same push (one deployment). Still to try on a real iPhone: the share sheet.

### November 18th 2026: "Delayed" trains out of the lists; live (`main`; Claude Code)

- **John (the live site, Oxford to Reading at 10.19pm):** a train "delayed with no time given yet" isn't expected at its
  timetabled time. Agreed: out of both lists, a sentence of its own, the reason when there is one (`SPEC.md` §12.15);
  "make that live tonight … straight to main". The only "Delayed" train in the saved boards had no reason.
- **Built:** `arrivals()` and `platformTrains()` in `sentences.ts` (the delayed sentence in `after` and in the Share
  words); leads that stay true with delayed trains too.
- **Checked:** `npm run check` 244 + 57 + 73 (new: all delayed, one of three, one alone with a reason, a delayed train
  in the platforms list); `tsc -b`, lint, build; the page at 390px dark and 1200px light: no errors, no sideways scroll.

### November 18th 2026: the lists laid out, "pm" once, the late trains as a range; Share for each list (branch `claude/laughing-hawking-8d2b6w`, merged the same day; Claude Code)

- **John (the live site, Stoke-on-Trent to Manchester, Oxford to Reading):** `SPEC.md` §12.10 to §12.14: "(or look like
  they will reach)"; the late trains as a range ("mostly about 23" was the middle figure, and "the latest was 78" said
  "was" for a train not yet in); "expected" once, then "set to be"; "next four hours" in Share; "am"/"pm" once in a list,
  "9pm" kept; option D of four layouts (bold times, coloured dots); a Share for each list.
- **Built:** `lastTwoLines()`, `shareWords()`, `clockSay()`, `platformTrains()` and `arrivals()` (now a `Listing`: the
  sentence, the lead and rows, the note after), `listShareWords()` in `sentences.ts`; `TimeList` and `ListShare` in
  `JourneyView.tsx`; `.tlist`, `.tline`, `.tdot` in `global.css`.
- **Checked:** `npm run check` 240 + 57 + 73 (new: the ranges, "were, or are set to be,", "set to be" after "expected",
  "am" once and "7pm" kept, the rows, the Share words; the mock-up comparison now only where neither new rule applies);
  `tsc -b`, lint, build; Reading to Paddington at 390px dark and Bath to Bristol at 1200px light: folds 44px, no errors,
  no sideways scroll. Earlier: the previous branch tidied after merging (trial run, then the real run; only `main` left).
- **John (the preview):** "These changes are all excellent. Please merge them." The Share drafts agreed with them. Merged
  with this note in the same push (one deployment).

### November 18th 2026: the trains with platforms, and Arrivals (branch `claude/laughing-hawking-8d2b6w`, merged the same day; Claude Code)

- **John:** a fold under Platforms, "Show the trains with platforms": "There are trains leaving at 3.12pm (platform 2),
  3.34pm (four minutes later than planned, platform 3) …", the next ten with a platform, then "We're only showing you the
  next ten departures, there are another 19 running later which also have platforms showing already."; cancelled ones
  and trains with no platform left out; lateness from one minute; "delayed, no time given yet". After the last week,
  "Arrivals", folded under "At Oxford from Reading": the next hour, up to 10, brackets in sequence ("the one due to
  leave Reading at 2.40pm", "the 3pm from Reading", "the 3.15pm"; "arriving four minutes later than planned"), "and more
  after that"; one train, none, and "The one due in at 3.14pm was cancelled.". `SPEC.md` §12.8 and §12.9.
- **Found (Claude's draft, for John):** the board looks back only two hours, so on journeys of two hours or more trains
  already on their way can be missing; there the sentence says so, and never "none expected". Platforms in the order
  trains are expected to leave (a late train had come first).
- **Built:** `platformTrains()` and `arrivals()` in `sentences.ts`; `PlatformTrains` and `Arrivals` in `JourneyView.tsx`;
  `scripts/dump-new.ts`; `design/previews/stage5-folds.mjs` (the page fed a saved board, its clock set to then).
- **Checked:** `npm run check` 232 + 57 + 73 (new: each case on the real boards; switching off the long-journey rule made
  one fail); `tsc -b`, lint, build; Reading to Paddington at 1200px light, Midgham and Plymouth at 390px with touch: folds
  44px, no errors, no sideways scroll.
- **Then (John):** "already" dropped; the long-journey drafts agreed; one platform for all, or two for three or more
  trains, said once at the start; About adds the arrivals. Fast and slower trains in the list: wording shown to John
  first. Checks 235 + 57 + 73.
- **Then (John):** fast, slower and Elizabeth Line trains apart, as drafted; 10A as 10 where 10 is in use; the limit
  across them all. `SPEC.md` §12.8. Checks 237 + 57 + 73; Reading to Paddington at 390px: no errors, no sideways scroll.
- **John:** with one kind of train on three or more platforms, the list stays in time order, each train with its
  platform (Liverpool Street to Stratford), rather than grouped by platform. "The branch looks really good."
- **John:** arrivals say the hour up front ("The first ten trains in the next hour…", "The trains arriving in the next
  hour…", "There are two trains…", "The only train…"); "and more after that" dropped. Long journeys: "Trainchecker can
  see three trains arriving in the next hour…" (Claude's draft, agreed by John). Checks 241 + 57 + 73.
- **Vercel turned two pushes away** (a341deb and 75bae38, about 3.35pm to 3.40pm): red crosses on GitHub, and neither
  appears in Vercel's Deployments list, so no build was started; a fresh clone built cleanly here. Most likely the free
  plan's daily deployment limit (about 100 a day across the account; not confirmed, the message wasn't found). Notes now
  go up with real changes rather than on their own. Retried at 5.35pm with this commit.
- **The retry built** (faff619, Ready; John saw "The only train arriving in the next hour…" on the preview). **John:**
  "merge to main whilst we've got the chance". Merged with this note in the same push (one deployment).

### November 18th 2026: the sharing picture's words in bold; merged and live (Claude Code)

- **John:** bold rather than semi-bold or regular (three mock-ups); "make it live". `design/og-trainchecker.html`
  loads Figtree 700 instead of 400; `og-shoot.cjs` checks the 700 weight; `public/og-trainchecker.png` remade
  (identical to the mock-up). `SPEC.md` §12.7.
- Merged into `main` with the new sharing wording (the branch's earlier commit). Checks, `tsc -b`, lint and build
  clean first. Apps keep their own copy of a link's preview for a while, so a chat where the link hasn't been sent
  before shows the new card soonest.
- **Checked live:** the picture at trainchecker.baish.net is the new bold one (byte for byte), and both text tags have the
  new sentence. Branch tidied: trial run 44326379849 (one merged, nothing unmerged), then the real run; only `main` left.

### November 18th 2026: new wording for sharing a link (branch `claude/laughing-hawking-8d2b6w`, merged the same day; Claude Code)

- **John:** for the link preview, "Check how the trains are doing, with gentle, natural-sounding answers and a
  fragment of inspiration."; option A of two mock-ups (three lines, broken at the commas). `SPEC.md` §12.7.
  On baish.net (clockwheel's branch): "Are the trains OK? (With gentle, natural answers.)", and "Near you"
  reordered Refueller, Trainchecker, Roadteller, Riverwatcher.
- **Built:** `design/og-trainchecker.html` (the name and words centred as a block); `public/og-trainchecker.png`
  remade (`node design/og-shoot.cjs`, both fonts loaded; identical to the mock-up); `og:description` and
  `twitter:description` in `index.html`.
- **For John:** the preview's `og:image` names trainchecker.baish.net, so a branch preview shows the new words
  with the old picture; the card can only be tried in full once merged. WhatsApp shows about 80 characters of
  the text.

### November 18th 2026: stage 5's search work and wording merged; live at trainchecker.baish.net (Claude Code)

- **John:** "Let's merge all that"; trainchecker.baish.net added in Vercel (John). Checks 222 + 57 + 73,
  `tsc -b`, lint and build clean first; `claude/laughing-hawking-8d2b6w` fast-forwarded into `main` (0069ce1).
- **Checked live** at trainchecker.baish.net: robots.txt and sitemap.xml right (step 16); the title,
  description, canonical and preview tags in the page; the preview picture (200); `/api/live` (Midgham to
  Reading) and `/api/days` answer.
- Branch tidied: "Delete merged branches" trial run 44301047770 (one merged branch, nothing unmerged), then
  the real run; `git ls-remote --heads origin` shows only `main`.
- **Search Console:** done (John, the same day).
- **Still to do:** the baish.net card
  (in clockwheel, on `claude/laughing-hawking-8d2b6w`; John: later today or tomorrow, with its NEW date set to
  that day); the tracker and the baish.net overview once it's on.

### November 18th 2026: "expected to be on time"; the last week as we'd say it (branch `claude/laughing-hawking-8d2b6w`; Claude Code)

- **John:** "They're all expected to be on time." and the rest; the last week "On the weekdays from last
  Wednesday until yesterday, all five trains leaving Midgham … got to Reading within three minutes of their
  planned time." Every case set out; his answers in `SPEC.md` §12.4 to §12.6 (no dates; "From last Monday to
  Friday" on a Monday; "38 of the 40"; the line under the hours with its bracket a sentence of its own).
- **Built:** `nextFour()`, `lastTwoLines()`, `lastWeekText()`, `kindLine()` in `sentences.ts`.
- **Checked:** `npm run check` 222 + 57 + 73 (new: the days for a Monday, a Wednesday and a Sunday, all and
  both, the only train on time and late, "38 of the 40", the lines under the hours, the only train with
  cancellations; the mock-up comparison translated; breaking the Monday rule made one fail); `tsc -b`, lint,
  build; the saved boards' last two hours unchanged from the previous round (none has cancellations among
  trains still on their way); the page fed Reading to Midgham at 390px: no errors, no sideways scroll.

### November 18th 2026: the last two hours, share first (branch `claude/laughing-hawking-8d2b6w`; Claude Code)

- **John (the preview, Midgham to Reading):** "All of the trains that left Midgham … have reached Reading (or
  are expected to do so) within three minutes of their planned time." Every case set out; his answers in
  `SPEC.md` §12.2 and §12.3 ("leaving" except "None … that left"; "on this route" kept; "that ran on this
  route" and "Two more" with cancellations; "The only train … got to"; "planned time" in Share too).
- **Built:** `lastTwoLines()` and `shareWords()` in `sentences.ts`. Found and fixed: one late train alone
  read "They was six minutes late." New `scripts/dump-last-two.ts` prints the sentences on every saved
  board, for before-and-after comparisons.
- **Checked:** `npm run check` 216 + 57 + 73 (new: each share, tense, one train, cancellations; the mock-up
  comparison now starts at the second sentence; breaking the singular made one fail); `tsc -b`, lint, build;
  the 16 saved boards before and after: only the intended sentences changed; the page fed Tiverton Parkway
  and Manchester boards at 1200px dark and 390px light: no errors, no sideways scroll. Not checked live (the
  key saved here is the history one). Not touched: the last week's "within three minutes of the timetable".

### November 18th 2026: stage 5 begun: search tags, robots.txt and sitemap; the baish.net card (branch `claude/laughing-hawking-8d2b6w`; Claude Code)

- **John (from drafts, three of each):** title "Trainchecker – free train delays and disruption checker" (1c);
  description "Free live train delays between any two stations in Great Britain, in plain English: the next four
  hours, platforms, the last week and engineering work." (2c, 151 characters; "engineering work" kept); preview
  tags the name and tagline with `og-trainchecker.png`; the tab goes back to the full title after a journey;
  no more first-visit text (the introduction is enough); on baish.net, "Near you", with the tagline as its
  line, and the hub description "…fuel prices, rivers, roads and trains." (148). No search-volume figures were
  found; the drafts used the words National Rail, the train companies and Trainline use.
- **Built:** `index.html` (title, description, canonical `https://trainchecker.baish.net/`, `og:` and
  `twitter:` tags, the comment); `JourneyView.tsx`'s `HOME_TITLE`; `public/robots.txt`, `public/sitemap.xml`.
  In clockwheel, the card on the same branch name (see its `CLAUDE.md`); `SEO-HANDOVER.md` re-copied.
- **Checked:** `npm run check` 207 + 57 + 73, `tsc -b`, lint, build; Chromium against `vite preview` at 1200px
  and 390px with touch: every tag, the tab title before, during and after a journey, robots.txt and sitemap.xml
  served (200), no errors, no sideways scroll.
- **Still to do:** John's word to merge; John adds trainchecker.baish.net in Vercel and its DNS record; check
  robots.txt and sitemap.xml live; Search Console; then the card on baish.net, the tracker and the overview.

### November 18th 2026: the fresh look, and every change from it, live (`main`; Claude Code)

- **Review** of `main` at 58b8a5d (no changes made during it): 16 saved boards at 1200px, 390px,
  844×390 and 667×320 with touch, light and dark, the saved incidents feeds, made-up boards for
  unusual cases, the last week live. Report and PDF sent. Findings: 2.1 "zero are cancelled"; 2.2
  "badly disrupted" from late arrivals or "Delayed" trains, unexplained; 2.3 every train cancelled;
  2.4 "this morning"/"tomorrow" after midnight; 2.5 three cancellations on busy lines; 3.1 the last
  train gone hid the page; 3.2 no-direct journeys in Recent; 4.1 phone suggestions covering "Show
  trains"; 4.2 "King's Cross"; 4.3 Return in From; 5.1 repeated "after midnight"; 5.2 slashes in the
  two-sentence summaries; 5.3 ":." lists; 6.1 Check again wiping the last week; 6.2 the Elizabeth
  Line note out of place; 6.3 shares mixed with counts; 7.1 printing; 7.2 tab title; 7.3 the
  introduction. Left alone: 8.1 to 8.8.
- **John:** all accepted; 2.2 option b, 3.1 option a, 2.5 option b; 5.3 a short list joined, a long
  one cut at the colon; and a new rule: a start date already passed is left out ("are running").
  The introduction full width. Straight to `main`, without asking again.
- **Built:** `analyse.ts` (Delayed trains at their timetabled time in the 45-minute rule, `arrLate`,
  one in 20); `sentences.ts` (`preparedCounts`, `arrivingNow`, "tonight", platforms when all
  cancelled, merged single services, counts up to 20); `incidents.ts` (`slashes`, `sincePast`, date
  ranges, colon lists); `stations.ts` (apostrophes, `complete`); `Chooser.tsx` (Return moves on);
  `JourneyView.tsx` (Check again keeps the page, one list of sections, Recent, tab title, the note);
  `LastWeek.tsx`, `Tail.tsx`, `global.css` (print, full-width introduction). `SPEC.md` §11.
- **Checked:** `npm run check` 207 + 57 + 73 (new checks for each case); `tsc -b`, lint (no
  warnings), build; the sweep again (16 boards, four sizes: no errors, no sideways scroll); probes for
  each fix; every sentence on the 16 boards compared before and after (only the intended changes).
  Not checked: Safari, a real iPhone, the live site (blocked here).

### November 18th 2026: handovers for the fresh look and stage 5 (Claude Code)

- **John:** a note and a prompt for a new session to run the fresh look, and the same for the
  next stage. `design/handover-fresh-look-2026-11-18.md` and `design/handover-stage-5-2026-11-18.md`
  written (each ends with the prompt to paste); "Read these first" points to them; `PLAN.md`
  updated; tracker: next, the fresh look.

### November 18th 2026: the last week's late trains as counts; live (`main`; Claude Code)

- **John (Totnes to Paddington, 8am to 9am):** "the rest" was one train. Cases set out for him;
  agreed as proposed, "One more" for a first band of one; "make it live straight away".
  `lastWeekOthers()` rewritten for fewer than 10 not on time (`SPEC.md` §10.42); `tenAfterWords()`
  leaves "10 to 30" alone (it had made "ten to 30").
- **Checked:** `npm run check` 200 + 57 + 68 (every case); `tsc -b`, lint, build. Straight to
  `main` at John's word.

### November 18th 2026: stage 4 merged into `main` (Claude Code)

- **John:** "so for those" in the Elizabeth Line line; happy with everything on the branch; merge to
  `main` and move on. Checks 193 + 57 + 68, `tsc -b`, lint and build clean first;
  `claude/inspiring-pascal-h96tqk` fast-forwarded into `main`, so trainchecker-alpha.vercel.app
  has stage 4. `PLAN.md`: stage 4 done.
- **For John:** `RDM_KB_KEY` must be ticked for Production in Vercel (as for Preview) for "The days
  ahead" on the live site; the Disruptions API isn't used (his call whether to end it: a month's
  notice). Not checked on a real iPhone: the cross in the station boxes.
- Branch tidied: "Delete merged branches" trial run 44269189633 (one merged branch, nothing
  unmerged), then the real run; `git ls-remote --heads origin` shows only `main`. Tracker updated
  (stage 4 merged; next, stage 5).
- Key saved here now: Historical Service Performance.

### November 18th 2026: Elizabeth Line and other trains in the last week (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John:** Twyford to Paddington, 8am to 9am, read oddly ("the rest more than half an hour
  late"). Found: the record has the Great Western trains and one stray Elizabeth Line run at
  Paddington; the rest of the Elizabeth Line only as far as Ealing Broadway
  (`design/data-trial-2026-11-17.md` §12).
- **Built:** `api/week.ts` takes `only` (the service's `toc_filter`) and `skip` (left out of
  `count()`); `api/live.ts`'s `stops` from the train with the most stops; `lastWeekText()` can name
  the trains (`noun`); `standInMixedLine()`; `LastWeek` asks for one or two parts at once.
  `SPEC.md` §10.41.
- **Checked:** `npm run check` 193 + 57 + 68; `tsc -b`, lint, build; iPhone 13 emulation, Twyford to
  Paddington with a made-up two-train board and the real history for 8am to 9am
  (`design/previews/stage4/stand-in-mixed.ts`): two paragraphs, 31 seconds, no errors, no sideways
  scroll.

### November 18th 2026: the last week to Ealing Broadway for Bond Street (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John:** yes to measuring Elizabeth Line journeys to Ealing Broadway where the record leaves
  Bond Street out. History key saved here (secure form).
- **Found** (`design/data-trial-2026-11-17.md` §11): Bond Street none, Ealing Broadway and Tottenham
  Court Road complete; trains with no times carry cancellation codes, so they were cancelled.
- **Built:** `api/live.ts` sends `stops` (the first train's stations in order, with names);
  `standIn()` and `standInLine()` in `sentences.ts`; `LastWeek` asks for the stand-in end and says
  so above the hours. `SPEC.md` §10.40.
- **Checked:** `npm run check` 191 + 56 + 68; `tsc -b`, lint, build; iPhone 13 emulation, Reading to
  Bond Street with the 6.24pm board's Elizabeth Line trains and the real history for 8am to 9am
  (`design/previews/stage4/stand-in.ts`): asked Reading to Ealing Broadway in two halves, answered
  "about three quarters of the 15 trains … Five more were cancelled."; no errors, no sideways scroll.
- Key saved here now: Historical Service Performance.

### November 18th 2026: Tiverton Parkway explained; Ivybridge's suggestions (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **Tiverton Parkway to Paddington** (live board saved at 8.22am, Live Departure Board key swapped
  in through the secure form): no fault. Earlier, the 07:58 (2 hours 31 minutes, via Castle Cary,
  Frome, Westbury, Pewsey and Hungerford) was in the next four hours with three two-hour trains,
  so it was rightly counted slower; the only fault was the repeated "platform 2", fixed earlier.
  Saved `20261118-0822-TVP-PAD.json` and `-RDG-MDG.json`; the checks now compare them too (the
  mock-up code taught "both").
- **Ivybridge (John, iPhone):** the suggestions vanished at "Ivy" and came back at "Ivyb": "Ivy" is
  Ivybridge's code, counted as a finished entry. `complete()` in `stations.ts` now closes the list
  only for a full name. `SPEC.md` §10.39.
- **Checked:** `npm run check` 186 + 56 + 68; `tsc -b`, lint, build; iPhone 13 emulation typing
  "Ivybridge" a letter at a time (`design/previews/stage4/type-ivybridge.cjs`): offered from "Iv"
  to "Ivybridg", closed at the full name.
- Key saved here now: Live Departure Board.

### November 18th 2026: "ten", one platform, the new tagline (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John:** "ten" when it closely follows a spelt number; "has only been announced" for one
  platform; tagline "How the trains are doing, written the way we speak."; yes to the Ealing
  Broadway idea; Tiverton Parkway to Paddington has no slower trains (1h58, 1h58, 2h00), to debug.
  `SPEC.md` top and §10.36 to §10.38.
- **Built:** `tenAfterWords()` on every generated sentence; the preview picture remade from a new
  source (`design/og-trainchecker.html`, `design/og-shoot.cjs`; the old option A loaded Google's
  fonts).
- **Checked:** `npm run check` 167 + 50 + 68; `tsc -b`, lint; the picture looked at (both fonts
  loaded, the script stops if not).

### November 18th 2026: cancellations, tenses, platforms, the last week, no record, a cross in the boxes (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John (the preview):** "which weren't cancelled" and "didn't run at all"; digits for "19 in 20";
  the own tense for one late train; Tiverton Parkway's "platform 2 … platform 2"; the last week
  counting a cancelled train as having left; "please try another"; a blunt no-record message for
  Bond Street; a clear cross on a phone. Tagline idea: "Summaries of the train situation, written
  the way we speak." `SPEC.md` §10.29 to §10.35.
- **Built:** `lastTwoLines()` rewritten (with `lateArrived` in `analyse.ts`); shares in digits;
  `platforms()` and `platformsByKind()` fall back; `lastWeekText()` counts the trains that ran;
  `LastWeek`'s `noRecord`; `Chooser`'s cross (`Icon` "clear", `.station .clear`).
- **Checked:** `npm run check` 166 + 50 + 68 (new: Liverpool Street and Manchester's cancellations,
  one late train not yet arrived, one platform for all, Tiverton's figures, all cancelled, "both");
  `tsc -b`, lint, build; iPhone 13 emulation: the cross empties From, keeps the cursor, 44 by 44
  pixels, suggestions follow; Reading to Bond Street (the 6.24pm board's Elizabeth Line trains)
  shows the no-record message (`design/previews/stage4/clear-cross-390.png`,
  `no-record-RDG-BDS-390.png`); no errors, no sideways scroll.
- **Not checked:** Tiverton Parkway to Paddington's groups (no saved board; the live board's key
  isn't the one saved here); Ealing Broadway as a stand-in for Bond Street in the last week (the
  history's key needed).

### November 18th 2026: "mostly using", "on this route", the line before possible changes; what might affect tightened (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John (iPhone, the preview at 7.37am, Basingstoke to Southampton Central):** "mostly using";
  "on this route"; the possible-changes sentence reworded, in the planned line's type; and the
  Southampton to Bournemouth work shown though its advice says trains continue to run between
  Reading and Southampton Central. `SPEC.md` §10.25 to §10.28.
- **Built:** `api/live.ts`'s `route` is now the stations before B only; `mayAffect()` leaves out
  items whose advice says the trains carry on, and otherwise looks for a sentence about trains
  between A and B that stop there; `mayIntro()` reworded (`.may-intro`).
- **Checked:** `npm run check` 163 + 50 + 68 (new: Southampton dropped for Basingstoke, Haywards
  Heath kept for Victoria, Westbury buses kept and Weston dropped for Bath, Blackpool dropped for
  the Airport; the new sentences); `tsc -b`, lint, build; the section for Reading to Paddington
  (390px) and Bath to Bristol (1200px, dark) (`design/previews/stage4/days-v3-*`): no errors, no
  sideways scroll.

### November 18th 2026: "an hour" throughout, dates as people say them, platforms by kind of train (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John:** approved the last round's drafts; "an hour" after every group; "ON SUNDAY (November
  22nd)"; platforms by kind of train, "accurate but not all that precise". `SPEC.md` §10.21 to §10.24.
- **Built:** `trainsAnHour()` with "an hour" each time; `speedGroups()` now keeps its trains;
  `platformsByKind()`; `whenLabel()` returns the words and the date (`DaysAhead`'s `When`, the date
  in ordinary type, `.when-date`).
- **Checked:** `npm run check` 163 + 50 + 64 (four mock-up platform comparisons now skipped where
  the new sentence applies, with the new sentence checked instead); `tsc -b`, lint, build; whole
  page as at 6.06am (`design/previews/stage4/page-*`), 1200px light and 390px dark: no errors, no
  sideways scroll.

### November 18th 2026: trains an hour, the train list, "this weekend", summaries in the house style (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John:** agreed the principles for trains an hour (one "an hour", one "and", journey times for
  the middle groups), the train list with the reason and company after the status, "this weekend"
  with no date and "National Rail isn't listing any…", summaries reworded, "slower";
  "Elizabeth Line" with a capital L as National Rail shows it (told TfL's own style is a small l).
  `SPEC.md` §10.16 to §10.20.
- **Built:** `speedGroups()`, `trainsAnHour()`, `companyName()`, `why()` in `sentences.ts`; the
  list in `JourneyView.tsx`; `plainSummary()` and `houseStyle()` in `incidents.ts`.
- **Found:** Euston to Milton Keynes's companies are mixed on the real board (a 32-minute London
  Northwestern train, Avanti trains of 55 to 58 minutes in the evening), so neither is named there;
  the board's "LNR & WMR" is two brands under one code.
- **Checked:** `npm run check` 166 + 50 + 62 (the sentences on every saved board; the summaries,
  including Limehouse's date after a time kept); `tsc -b`, lint, build; whole page fed the 6.24pm
  board and the 6.35am feed as at 6.06am (`design/previews/stage4/page-*`), 1200px and 390px: no
  errors, no sideways scroll.
- Key saved here now: Knowledgebase Incidents (swapped back).

### November 18th 2026: John's notes on Reading to Paddington at 6.42am; first changes (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John:** the three drafts agreed; a gradual pass to make the page read naturally, some points
  changing earlier decisions. Done now (`SPEC.md` §10.14, §10.15): "currently" for platforms; "the
  train" in summaries; "This might affect" for one entry (`entries()`); numbers in words in National
  Rail's sentences (`wordNumbers()`). For discussion: trains an hour, fast and slow, companies
  named; the train list's layout; "to the end of this weekend"; National Rail's summaries reworded.
- **Found** (the 6.24pm boards): Reading to Paddington's 49 trains are 31 fast (about 24 minutes),
  9 slower Great Western (about 40) and 9 Elizabeth line (about 54, shown to Abbey Wood); Bath to
  Bristol and Manchester to the Airport have no real split; Liverpool Street to Stratford's three
  companies all take about seven minutes; Euston to Milton Keynes: Avanti about 32, London
  Northwestern about 66.
- **Checked:** `npm run check` 161 + 50 + 60; `tsc -b`, lint.

### November 18th 2026: summaries, single services grouped, the route check; the Disruptions API compared (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John:** option A (National Rail's own sentences), without "throughout"; single services grouped
  under his sentence ("If you're travelling before 6am between now and Friday or after 11pm on
  Saturday you may be affected – see more details."), with National Rail's advice in the fold;
  leave out what can't affect the journey. `SPEC.md` §10.10 to §10.13.
- **Built:** `gist()`, `adviceLines()` (joins "will:" lists), `singleTrain()`, `earlyOrLate()`,
  `mayAffect()` with the route; `singlesLine()`; `api/live.ts` sends `route` (every station the
  trains call at after A); `DaysAhead.tsx` shows the summaries and the grouped entry.
- **The Disruptions API** (key saved here at 6.40am, secure form): the same four live disruptions
  as the feed of 6.35am, same ids and words, unplanned only; it also lists stations along the route
  (Cardiff for Ebbw Vale), as the feed's "Routes affected" does. `design/data-trial-2026-11-17.md`
  §10; answers in `design/mockups/snapshots/20261118-0640-disruptions/`.
- **Checked:** `npm run check` 158 + 50 + 58 (new: the summaries word for word, two sentences at
  most, "throughout" (breaking it made one fail), the route, the grouped sentence); `tsc -b`, lint,
  build; the page fed the 6.24pm boards and the 6.35am feed as at 6.06am
  (`design/previews/stage4/gist-*`), 1200px and 390px, light and dark: no errors, no sideways scroll.
- Key saved here now: NationalRail Disruptions API (the incidents one to swap back).

### November 18th 2026: John's answers; arrows; the line closed today (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John (tried the preview at 6.06am, Reading to Paddington):** the two drafts agreed; the
  line-closed and disruption-advice verdicts agreed as worded; arrows on the folds. Asked for
  options: a two-sentence summary of National Rail's advice above the fold; single early or late
  trains grouped; leaving out what can't affect the journey (Reading to Basingstoke for Reading to
  Paddington). `SPEC.md` §10.6 to §10.9.
- **Built:** the arrows (`Icon` "down", turned when open); `closedNow()` and `closedVerdict()`
  (buses all day count; "late night", "before 06:30" and the like don't); the disruption line;
  JourneyView now fetches the incidents with the trains and passes them to `DaysAhead`.
- **Checked:** `npm run check` 158 + 50 + 45 (new: Derby to Matlock closed, Corby and Swindon
  not, Victoria on Sunday only, the words); `tsc -b`, lint, build; Derby to Matlock in the browser
  with no trains and the real feed at 6.20am (`design/previews/stage4/closed-*`), 1200px and 390px:
  no errors, no sideways scroll; the arrow close up, folded and open.

### November 17th 2026: "The days ahead" built (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John:** for incidents the rule leaves out but that name one of the stations, a friendly
  sentence conveying the possibility: option 2 ("These might affect some trains from A to B too,
  as they involve B:", not folded). `mayAffect()`; `SPEC.md` §10.4 and §10.5.
- **`api/days.ts`** (new, self-contained): fetches the incidents feed (`RDM_KB_KEY`, `x-apikey`),
  keeps the incidents live to the end of Sunday with National Rail's advice cleaned to simple HTML
  (`cleanAdvice()`: p, b, lists, https links only), and sends them all (about 30 KB compressed),
  kept by Vercel's servers for five minutes (`s-maxage=300`). The page matches its own journey
  (`forJourney()` in `src/lib/incidents.ts`), as it holds the station list: so one cached answer
  serves every journey, and the function imports nothing. (The handover suggested matching on the
  server; this is why not.) In `vercel.json` and `vite.config.ts`.
- **`DaysAhead.tsx`**, between "The last two hours" and "The last week", as on the mock-ups:
  heading, "Now" items first, "Planned engineering work … to the end of Sunday November 22nd:" or
  the agreed no-work sentence, each item's when and summary, National Rail's advice folded with
  "More on National Rail's website"; then the "might affect" items. Drafts (Claude's): the loading
  line and the message when the feed can't be reached.
- **Checked:** `npm run check` 158 + 50 + 38 (new: the when labels, including a year and summer
  time; the sentences; Victoria to Brighton's split; board names; the advice made safe from a
  hostile example, and only simple tags in all 104 real items); `tsc -b`, lint, build. Browser,
  the live board from the 6.24pm snapshots and the real feed at 11pm (`design/previews/stage4/
  days-*`), 1200px and 390px, light and dark: no errors, no sideways scroll, advice links open in
  a new tab.
- **Not yet:** the verdict ("Be prepared" when engineering work closes the line today; National
  Rail's advice when badly disrupted), to agree with John first; the Disruptions API comparison
  (tomorrow); Vercel itself (`RDM_KB_KEY` must be ticked for Preview too).

### November 17th 2026: the days ahead: matching tested on the real feed (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- Knowledgebase Incidents key saved here (secure form); feed fetched at 10.23pm (937 incidents,
  104 live to the end of Sunday), saved as `design/mockups/snapshots/20261117-2223-incidents.xml.gz`.
- **Found:** one date range per incident (night-only and weekend work has the whole span; the
  summary says which nights); cleared disruption is flagged (`ClearedIncident`), and called-off
  work begins "CANCELLED:"; the feed's names differ from the station list ("Swindon", "Gillingham
  (Kent)", "Kings Lynn"); six live incidents name no station.
- `src/lib/incidents.ts`: reading the feed, station names in the feed's words (longest name wins,
  no guessing between two Newports), John's rule plus "to / from", "at / through / in the … area"
  and "via" (new, for John), the end of Sunday in GMT and BST. `scripts/try-incidents.ts` makes the
  report `design/incidents-trial-2026-11-17.md` (56 journeys, what counts and what's left out).
- **Checked:** `npm run check` now 158 + 50 + 21 (`scripts/check-days.ts`: the end of Sunday in
  winter, summer and both clock-change weeks; names; the saved feed's matches); breaking the BST
  sum made three fail. `tsc -b`, lint.
- Key saved here now: Knowledgebase Incidents.

### November 17th 2026: stage 4 begun: the page's order, "leaving on time", Share moved up (branch `claude/inspiring-pascal-h96tqk`; Claude Code)

- **John:** the quote of the day before "The last two hours" (computer and iPhone); after "Good
  news … leaving on time" the last two hours back in their own box, so only "leaving" for
  "running" differs; then, the same after "It's a mixed bag" (so the last two hours are never in
  the verdict, and always have their box); Share higher up, "below the last thing it quotes". Done:
  `QuoteCard` shown by `JourneyView` (and by `Tail` only on the first visit); Share straight under
  the verdict. `SPEC.md` §10.
- **Checked:** `npm run check` 158 + 50 (the leaving-on-time and mixed-bag verdicts now one line, the box always shown);
  `tsc -b`, lint, build; pictures from the saved answers (`design/previews/stage4/order-*`, 1200px
  and 390px, light and dark): no errors, no sideways scroll.

### November 17th 2026: stage 3 merged into `main`; handover for stage 4 (Claude Code)

- **John:** "Merge please", and a handover and prompt for stage 4. `design/handover-stage-4-2026-11-17.md`
  written. Checks, `tsc -b`, lint and build clean first; `claude/epic-wright-wlwhvp`
  fast-forwarded into `main`, so `main` now builds on Vercel (automatic deployments on again)
  and trainchecker-alpha.vercel.app shows the page.
- Branch tidied: "Delete merged branches" trial run 44183221021 (one merged branch, nothing
  unmerged), then the real run 44183310110; `git ls-remote --heads origin` shows only `main`.
  Key saved here: Knowledgebase Stations.

### November 17th 2026: every stage 3 draft agreed (Claude Code)

- **John:** "All approved!" (question 3, a to e: the last train gone, platforms with one or
  two known, the error and waiting messages, the last week's less usual cases, Copy a link).
  Recorded in `SPEC.md` §9 (new: everything agreed while trying stage 3); the code's comments
  no longer call them drafts. Stage 3 waits only for John's word to merge.

### November 17th 2026: John's answers: iPhone fix, the quote picture, the last week's speed (Claude Code)

- **John:** the iPhone fix works (tapping a station suggestion chooses it); the quote's Share
  picture "is great" (agreed, SPEC §8.13); the last week for Reading to Basingstoke took about
  25 seconds on the preview, "which is fine" (the history end to end on Vercel: works).
- Drafts (question 3, a to e) sent to John again, numbered, for his answers.

### November 17th 2026: tapping a station suggestion on an iPhone (branch `claude/epic-wright-wlwhvp`; Claude Code)

- **John (iPhone, the preview):** tapping a suggestion under "From" didn't choose it; the box
  kept "Read". Likely cause: Safari takes the cursor out of the box during the tap, and the list
  closed at once, before the tap arrived. Now the suggestion stops the cursor leaving
  (`mousedown`, which Safari sends for taps, not only `pointerdown`), and leaving the box closes
  the list 300 milliseconds later (`Chooser.tsx`).
- **Checked:** `tsc -b`, lint, checks; `design/previews/stage3/tap-station.cjs` (Chromium as
  an iPhone 13, real taps) chooses "Reading West" with the new code, but did with the old code
  too, so it can't show Safari's behaviour: **not checked on a real iPhone** (WebKit isn't
  installed here). John to try again.

### November 17th 2026: John's first look at the preview; the last train gone (branch `claude/epic-wright-wlwhvp`; Claude Code)

- **Vercel:** the keys now reach the preview (John ticked Preview and redeployed); John tried
  Reading to Cardiff Central and Cardiff Central to Reading at about 9.30pm.
- **John's points, done:** (1) the gap beside "The last two hours" on a computer: it now runs
  across the full width under "The next four hours" and "Platforms", which are the same height
  (SPEC §8.1 said under Platforms); (2) "Both are expected on time", and "both" wherever two of
  two would be "all" (`share()`); (3) the Mac smoothing: already in (dark mode only, house style
  §2); (4) "Copy a link to this journey" quieter: the notes' grey, in the body font.
- **The last train gone (John):** with no train in the next four hours but trains in the last
  two, after 6pm or before 4am: "The last direct train from A to B seems to have gone: the
  latest left at 7.33pm, and there isn't another in the next four hours." / "Trainchecker looks
  four hours ahead, so check again later for the first trains tomorrow."; in the day: "The
  latest direct train from A to B left at …" / "…so check again later." Share words to match.
  With no train either way, the agreed wording stays (it can't tell "none tonight" from "no
  direct trains at all" when the last one left more than two hours ago). Claude's drafts.
- **Platforms with one or two known (Claude's drafts):** "At the moment, the train is going
  from platform 15."; "one train … and the other from platform 9"; "both trains are going from
  platform 8"; and when more trains are running than have platforms: "So far, a platform has
  been announced for one train: platform 3." (was "most trains are going from platform 3").
- **Checked:** `npm run check` 157 + 50 (new: both, two on time, one platform of many, the last
  train gone on Kings Cross to Edinburgh at 8.59pm, none either way on Reading to Cambridge);
  `tsc -b`, lint; pictures from the real saved answers (`design/previews/stage3/
  from-snapshots.mjs`, as the key saved here is the stations one): `layout-*`,
  `last-train-gone-*`, 1200px and 390px, light and dark: no errors, no sideways scroll.

### November 17th 2026: the full station list; a clue for Vercel's preview (branch `claude/epic-wright-wlwhvp`; Claude Code)

- **Stations:** John subscribed to Knowledgebase Stations and gave its key (secure form) and its
  address, `…/1010-knowlegebase-stations-xml-feed1_1/4.0/stations-{TOC}.xml`: one file per
  company that runs stations. Every two-letter code tried once: 34 have stations, 2,616 in all,
  including Network Rail's own (NR: Reading, Paddington), the Elizabeth line's central stations
  (LT) and Southend Airport (XS). `scripts/build-stations.ts` makes `src/data/stations.json`
  (names and codes, 58 KB, bundled, so typing sends nothing); the stand-in script removed. All
  273 stand-in stations are in it; 22 names differ slightly from the live board's ("Bond Street
  (Elizabeth line)", "Langley (Berks)"); the page's headings keep the board's names.
- **Vercel preview:** John thinks the keys aren't reaching Preview. Claude can't see his Chrome
  from a cloud session; Vercel's current help (read here) says Preview settings apply to every
  branch but the production one, and changes apply only to new deployments (Redeploy). The
  functions now say which setting is missing (`reason`, never a value) or what National Rail
  answered, at `/api/live?from=RDG&to=PAD`.
- **Checked:** `npm run check` 163 + 50 (new: the list complete, each code once, no markup,
  every snapshot's stations, typed names and codes, suggestions); `tsc -b`; build; the boxes at
  390px with touch and 1200px ("read" offers Reading, Reading Green Park, Reading West), no
  errors, no sideways scroll. Not checked: the knowledgebase licence for stations (John to
  share it, as before); the live pages again (the key saved now is the stations one).
- Key saved here now: Knowledgebase Stations.

### November 17th 2026: stage 3 built, for John to try (branch `claude/epic-wright-wlwhvp`, not merged; Claude Code)

- **John:** the station list from National Rail's Knowledgebase Stations feed (he'll
  subscribe and give the key through the secure form). Until then the boxes use a stand-in:
  the 273 stations named in the real live boards saved tonight (`scripts/stand-in-stations.ts`,
  `src/data/stations.json`). The government's NaPTAN list was blocked here.
- **What:** the page in SPEC §8 except "The days ahead" (stage 4): the chooser (suggestions as
  you type, arrow keys and Enter, a tap; swap; Recent, four kept on the device; `#RDG-PAD`);
  the strip with Swap and Change; the time fetched and Check again; the verdict; the next four
  hours with the folded list (a table on a computer, rows on a phone); Platforms; the last two
  hours; the last week; Share; the quote of the day with its picture; About; the footer;
  favicon C; preview picture A in `public/` (its tags are stage 5's); Web Analytics with the
  part after "#" dropped; the safety net.
- **The functions:** `api/live.ts` asks the board's five windows at once (about 0.6 seconds),
  keeps only what the page needs, no caching. `api/week.ts` asks one half hour with margins 3,
  10, 30 and 120; a 503 (busy) is tried again for up to 20 seconds; answers are kept by
  Vercel's servers until UK midnight (`s-maxage`), the dates being in the address. Both in
  London (`regions: ["lhr1"]`), keys from `RDM_LDB_KEY` and `RDM_HSP_KEY`, nothing logged.
- **Found:** tonight both half hours of Reading to Paddington, 5pm to 6pm, were accepted at
  the same time (40 seconds each, not refused as at 6pm), so the page asks for both halves
  together and asks again for a half refused as busy; if the second half fails, the first is
  shown and the sentence says so. An unknown station code is HTTP 400 ("Invalid crs code
  supplied"). An hour with no trains answers in about a second, with no services.
- **Drafted by Claude, for John:** the messages when a station isn't found or National Rail
  can't be reached; the last week for one Saturday or Sunday ("On Saturday November 14th,
  …"), with no trains, with one train, and with none on time ("Of these, …"); the Saturday
  and Sunday lines; "Copy a link to this journey" copies the sentence and the link, one under
  the other; the quote picture (`design/previews/stage3/quote-picture-*.png`), wired in on the
  branch but **not agreed yet**.
- **For John to note:** About and the first-visit paragraph mention engineering work, which
  arrives in stage 4. The "however" rule can say "about three quarters" got there on time
  (it triggers below three in four, and 0.7 rounds to three quarters).
- **Checked:** `npm run check` 157 + 50 (the agreed sentences word for word; the mock-up code
  and the app agree on all 14 real snapshots, five of them new tonight at 8.59pm with the next
  four hours past midnight; every snapshot moved to 11.40pm gives the same answers; breaking the
  clock wrap, the sort or the rounding made checks fail, then restored); `tsc -b`, lint, build.
  Chromium against live National Rail data: 36 views (first visit, Reading to Paddington,
  Manchester Airport, Bath to Bristol, no direct train, an unknown station; 1200px, 390px and
  844×390 with touch, light and dark): no errors, no sideways scrolling, fonts loaded, 44px
  taps. Controls (18 checks): typing and choosing, wrong and empty boxes, Recent, Swap,
  Change, Check again, the fold, Copy (read back), the quote picture copied (2400px wide), and
  the last week with the history's real answers for 5pm to 6pm (asked through the function at
  8.55pm; the key saved now is the live board's, so the page was fed them in the browser):
  25 of 56, matching stage 1.
- **Couldn't check:** Vercel itself (functions, region, caching); a real phone's share sheet;
  Safari's clipboard; the last week end to end in the browser with both keys at once.
- Key saved here now: Live Departure Board.

### November 17th 2026: stage 2 agreed; handover for stage 3 (Claude Code)

- John agreed stage 2 ("Yes please. That's great."). `SPEC.md` §8 lists everything agreed at
  the mock-ups (it overrides §3); `PLAN.md` updated; handover for stage 3 in
  `design/handover-stage-3-2026-11-17.md`. The stage 2 branch merged into `main` (notes and
  mock-ups only, house style §10).
- Branch tidied: "Delete merged branches" trial run 44171696731 (one merged branch, nothing
  unmerged), then the real run; `git ls-remote --heads origin` shows only `main`. Tracker
  updated (stage 3 next). Key saved here: Historical Service Performance.

### November 17th 2026: quote option C revised and built in; margins agreed (Claude Code)

- John: history margins 3, 10, 30 and 120 minutes agreed; quote option C with a matching
  closing mark and a small Share beneath it; verse on separate lines; a Share picture of the
  quote in stage 3 (`design/mockups-2026-11-17.md`, fifth answers).
- `build-mockups.mjs` now reads `src/data/quotes.ts` (run with
  `node --experimental-strip-types`). About: minutes in words. 54 views clean; controls in a
  sandboxed frame clean. Republished (Version 6).

### November 17th 2026: quote of the day (Claude Code)

- John: the sign-off is "QUOTE OF THE DAY", from his `quotes.ts` (written in a Claude chat),
  added unchanged as `src/data/quotes.ts` (byte-for-byte the same as the upload). Checked:
  366 quotes, no duplicates, never the same author two days running, `quoteOfTheDay()`
  changes at midnight UK time (November 17th: E. W. Hornung; 18th: Benjamin Franklin).
- Options A (a card), B (a centred sign-off in Caprasimo) and C (a tinted band with a large
  quotation mark and a Share button) in `design/quote-options/` (`build.mts`), computer and
  phone, light and dark, with today's quote, the longest and a verse. Verse lines (" / " in
  the file, 35 quotes) shown on separate lines: display only, for John to confirm.

### November 17th 2026: the last week's late trains, tested (Claude Code)

- John's Q1: history key saved here (secure form). Several margins cost nothing extra;
  cancelled trains miss every margin, so a 120-minute margin tells them apart; one cancelled
  train missing from the history altogether; a busy whole hour timed out tonight
  (`design/data-trial-2026-11-17.md` §9). `lastWeekOthers()` in `sentences.mjs`; the
  mock-up's result now uses the real half-hour figures. Republished (Version 5).
- Key saved here now: Historical Service Performance.

### November 17th 2026: share wording, long journey, John's fourth answers (Claude Code)

- P1 to P4 answered (`design/mockups-2026-11-17.md`, fourth answers). Share: friendly opening,
  a summary, then the link (`shareWords()`); preview picture A.
- Live Departure Board key saved here again (secure form). Snapshots at 7.47pm: Kings Cross to
  York (journey 6, the long-journey wording, tense by arrived or expected), Euston to
  Manchester, Kings Cross to Edinburgh (no train in the next four hours at 7.47pm),
  Paddington to Plymouth.
- Checked: 54 views clean (48 plus journey 6's six); controls in a sandboxed frame clean.
  Republished (Version 4).

### November 17th 2026: mock-ups rebuilt with John's answers (Claude Code)

- Every answer so far built in (`design/mockups-2026-11-17.md`, first to third answers):
  rounded shares (`share()` in `sentences.mjs`), minutes in words, the last two hours in the
  top only when bad (usual amount and the latest), the next four hours with no times and a
  summary with reasons, the train list folded, new platform wording, engineering work only
  naming both stations, "TRAINS TO CHECK", "Show trains", the no-direct-train wording, two
  Share drafts shown on the page, long journeys by expected arrival (not shown: no long
  journey in tonight's snapshots, and the key here is the incidents one).
- Favicon C chosen; link-preview options A and B in `design/preview-options/`.
- Checked: 48-view sweep (1200px, 390px, 844×390 with touch, light and dark) clean; the
  controls in a sandboxed frame clean. Republished (Version 3).

### November 17th 2026: John's second answers on the mock-ups (Claude Code)

- N1 to N14 answered; recorded in `design/mockups-2026-11-17.md` ("John's second answers").
  Checked for N7: the live board gives actual times at stops passed and expected times at
  stops ahead. Favicon picture sent again. Still open: O1 to O9. Nothing rebuilt yet.

### November 17th 2026: John's first answers on the mock-ups (Claude Code)

- Recorded in `design/mockups-2026-11-17.md` ("John's first answers"): new wording for
  "good news" when the last two hours were worse (leaving on time, arrivals in rounded
  fractions, "three minutes" in words), rounding, no times in "The next four hours" and a
  summary of late trains and reasons, platforms wording, the last two hours not repeated,
  "TRAINS TO CHECK", "Show trains". New questions N1 to N16 sent; nothing rebuilt yet.
### November 17th 2026: mock-up switcher fixed (Claude Code)

- John: the bar's menus didn't change the view on the private page. Cause: the page wrote
  its choice into the address first, which the private page's frame refuses, so it never
  redrew. Now the choice is kept in the page (the address only if allowed), and Swap,
  Recent and the brand are buttons. Tested in a sandboxed frame: every control works, no
  errors; the old version failed the same test. 48-view sweep clean. Republished.
### November 17th 2026: stage 2 mock-ups, for John (Claude Code)

- Branch `claude/trainchecker-stage-2-mockups-4v7pih` (the session's assigned branch, in
  place of `PLAN.md`'s `stage-2-mockups`). Not merged: mock-ups and notes only.
- Real snapshots at 6.24pm (`design/mockups/snapshots/`): Paddington to Reading (good),
  Reading to Paddington (good, however), Bath Spa to Bristol Temple Meads (mixed),
  Manchester Piccadilly to Manchester Airport (be prepared: Gatley signalling fault),
  Reading to Cambridge (no direct train); incidents feed at 6.26pm.
- The agreed rules in `design/mockups/analyse.mjs`, the sentences in `sentences.mjs`,
  engineering-work matching in `incidents.mjs` (a first draft, for stage 4 to test).
- Private page: https://claude.ai/artifact/QAUKZcDt6Xrhph1aPAUgAS (republish after
  `node build-mockups.mjs <folder>`). Pictures `design/previews/stage2/`; favicon
  options `design/favicon-options/`. Questions M1 to M20 in `design/mockups-2026-11-17.md`.
- Found: the incidents feed also carries unplanned disruption with National Rail's full
  advice, so the Disruptions API may not be needed (M11). Node's own fetch needs
  `NODE_USE_ENV_PROXY=1` to reach the API from this environment.
- Key saved here now: Knowledgebase Incidents (swapped through the secure form).
- Checked: 48 views in Chromium (1200px, 390px and 844×390 with touch, light and dark): no
  errors, no sideways scrolling, fonts loaded, tap targets 44px. Not checked: a real phone.

### November 17th 2026: stage 1 recommendation agreed (Claude Code)

- John agreed every point of `design/stage-1-recommendation-2026-11-17.md`.
  Stage 2 (mock-ups) starts in a new session: handover in
  `design/handover-stage-2-2026-11-17.md`.

### November 17th 2026: stage 1 finished, recommendation written (Claude Code)

- Elizabeth line history: trains missing whenever Paddington or Bond
  Street is one end; history uses its own codes for some stations (Abbey
  Wood ABX). Live boards are fine.
- Rules tried on nine real journeys at 6.15pm (`scripts/try-rules.py`,
  `design/rules-trial-2026-11-17.md`). Two script faults found and fixed
  (a negative gap wrapped round the clock; after-midnight arrivals sorted
  first), both of which made calm journeys look badly disrupted: the app
  needs checks for both.
- Recommendation for John: `design/stage-1-recommendation-2026-11-17.md`.
- John: the page signs off with a message of the day (366 of them, from a
  `.ts` file he's curating). Added to `SPEC.md` §3.
- John: history wording ends "…in under a minute"; same kind of day as
  today; only hours with trains if quick to check (it isn't, without
  timetable data: see the recommendation). Key saved here: Live
  Departure Board.

### November 17th 2026: last week by chosen hour (Claude Code)

- John: the visitor chooses an hour of departure, and the page fetches
  that hour's reliability over the last week (one history request, about
  40 seconds on a busy line). His draft wording is in `SPEC.md` §3, 4a.

### November 17th 2026: history can't run side by side (Claude Code)

- Only one history request is accepted at a time (others refused at once
  with 503). One hour of weekdays over the last week: about 43 seconds on
  Reading to Paddington; half an hour about 21. So "Show history" can
  cover about one hour of the day on a busy line, and can't tell one bad
  day from a poor week within the time. Details in
  `design/data-trial-2026-11-17.md` §8. Key saved here: HSP.

### November 17th 2026: last two hours on the page; last week on request (Claude Code)

- John: build it with "the last two hours" from the live board (option
  d), instead of the last week. The last week moves lower down, behind a
  "Show history" button with a warning that it takes about a minute. 40
  seconds with a warning is reasonable, much more isn't, so what it shows
  is tailored to what can be fetched in that time. `SPEC.md` §3 updated.

### November 17th 2026: no more failed-build emails (Claude Code)

- John was getting a "production deployment failed" email for every push:
  Vercel tried to build an app that doesn't exist yet. Added `vercel.json`
  with `"git": {"deploymentEnabled": false}` (Vercel's documented way to
  turn off all automatic deployments). Nothing visible changes.

### November 17th 2026: the last two hours from the live board (Claude Code)

- The live board looks back up to 120 minutes, and "GetDepBoardWithDetails"
  gives actual arrival times at the destination: a fast "last two hours"
  without the history service. Arrival boards aren't in the subscription.
  Details in `design/data-trial-2026-11-17.md` §7. The key saved here is
  the Live Departure Board one again.

### November 17th 2026: a week of history in one request (Claude Code)

- One request for a whole week of one hour took 44 seconds, the same as
  one day; two hours timed out at about 55 seconds. A week of four hours
  is up to 12 one-hour requests side by side, about a minute. Elizabeth
  line history looks patchy. The key saved here is the HSP one again.
  Details in `design/data-trial-2026-11-17.md` §6.

### November 17th 2026: all four products tested (Claude Code)

- Results in `design/data-trial-2026-11-17.md`. HSP works at
  `…_hsp_1_1/serviceMetrics` but takes 37 to 44 seconds for one hour of
  one day on a busy route, so the last week can't be fetched while a
  visitor waits (question for John). HSP has the Elizabeth line (XR),
  though not under Paddington's usual code. Incidents feed: one 2.8 MB
  file, 896 planned works, weeks ahead, routes in words only. Disruptions
  API: quick, by station, live problems only. The key saved here is now
  the Disruptions API's (one key per address, swapped for each test).

### November 17th 2026: fourth subscription (Claude Code)

- NationalRail Disruptions API approved; all four keys are in Vercel
  (John). Its licence: UK only, credit National Rail and the Rail
  Delivery Group, a month's notice; added to
  `design/licences-2026-11-17.md`.

### November 17th 2026: four hours, not five (Claude Code)

- John chose option a: the page covers the next four hours, all from the
  live board. Wherever the spec or notes say "five hours", read four.
  Vercel variable names agreed: `RDM_LDB_KEY`, `RDM_HSP_KEY`,
  `RDM_KB_KEY`, `RDM_DISRUPTIONS_KEY` (all type Secret).

### November 17th 2026: first live data (Claude Code)

- Live Departure Board key saved on John's Default environment (sent only
  to `api1.raildata.org.uk`, `x-apikey` header); the other two keys
  differ and come later. First test worked: notes in
  `design/data-trial-2026-11-17.md`. Elizabeth line in the live boards,
  including Tottenham Court Road. The board reaches only about four hours
  ahead (120-minute window, start at most 119 minutes ahead): question
  for John.

### November 17th 2026: subscriptions approved; licences read (Claude Code)

- John's Rail Data Marketplace subscriptions (Live Departure Board, HSP,
  Knowledgebase Incidents) were approved the same afternoon. Licences
  compared in `design/licences-2026-11-17.md`: free, public display
  allowed, credit needed; incidents data UK only, so functions go in
  London. The NationalRail Disruptions API isn't subscribed yet.
- Vercel project's main address: https://trainchecker-alpha.vercel.app/
- Live Departure Board address (John):
  `https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepartureBoard/{crs}`
- Vercel now calls write-only variables "Secret" (and readable ones
  "Config"); its page says Secrets are for API keys (read November 17th).

### November 17th 2026: data research without keys (Claude Code)

- Read the Rail Data Marketplace's public pages for the four products;
  findings in `design/data-research-2026-11-17.md`. Knowledgebase
  Incidents includes planned engineering work; HSP has the lowest uptime
  (89.86%) and may need approving by hand; the NationalRail Disruptions
  API added as a candidate. Licences, addresses and the Elizabeth line
  still to check. The Open Rail Data wiki is behind a bot check that
  blocks this session; `vercel.com` and `www.nationalrail.co.uk` didn't
  resolve yet. John created the Vercel project.

### November 17th 2026: waiting for the Rail Data Marketplace (Claude Code)

- John applied to join the Rail Data Marketplace at 3.30pm. Its email
  says the request is under review and may take up to three working
  days, so the answer is due by Friday November 20th. Stage 1's data
  tests wait for it; John is allowing the documentation sites in the
  environment meanwhile.

### November 17th 2026: name and rules confirmed; stage 1 agreed (Claude Code)

- John kept the name, agreed the "last week" and "badly disrupted" rules
  and National Rail's advice for alternatives, and agreed stage 1. He is
  registering on the Rail Data Marketplace and creating the Vercel
  project. Keys go in Vercel's settings and, for testing here, the
  environment's secure credential form; never in a chat or a file.

### November 17th 2026: John's answers to the 14 questions (Claude Code)

- Recorded beside each question in `SPEC.md` §7. In short: Elizabeth
  line in, Underground perhaps later; a small server is fine as there's
  no alternative; the last week modifies the verdict ("However, it's
  worth knowing…"); "on time" is within 3 minutes; the last week uses the
  same five hours of each day and must tell one bad day from consistently
  poor; platforms from the live board only; engineering work to the end
  of the coming weekend; no changes in the first version; remember, swap
  and "#" address yes; credits as the terms require; a Share button yes.
- `PLAN.md`: changes and worked-out routes moved to "Later"; stage 1 now
  checks the Elizabeth line and tunes the rules on real days; five stages.
- Name searched: a freight-inspection iPhone app called "TrainChecker"
  and a passenger app "RailChecker" exist; nothing for passengers called
  Trainchecker.
- Proposals for John to confirm: the "last week" rule, the "badly
  disrupted" rule, and National Rail's own advice standing in for
  alternative routes.
- Removed the session's local copy of the old `trainchecker-` clone (it
  was never pushed to).

### November 17th 2026: set-up (Claude Code)

- John created the repo, first as `trainchecker-`, then renamed it
  `trainchecker` at Claude's suggestion.
- John's brief and the earlier Claude chat's reply saved word for word in
  `design/handover-2026-11-17.md` (there was no separate handover file).
- The house-style files copied in (see Key points).
- `SPEC.md` and `PLAN.md` drafted, with 14 open questions.
- Data checked by web search only. The Open Rail Data wiki was blocked by
  this session's network, so some details come from search summaries.
  Found: live departures, a year of history and incidents are all on the
  Rail Data Marketplace, described as free; the history can't be called
  from a web page, so a small server is needed; no free journey planner
  was found for changes. None of it tried with real data yet.
