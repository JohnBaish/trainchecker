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

0. `design/handover-stage-4-2026-11-17.md`: where things stand for stage 4 (the days ahead).
   Then `design/mockups-2026-11-17.md`: the agreed wording, and `SPEC.md` §8 and §9.
1. `design/handover-2026-11-17.md`: John's brief, in his own words.
2. `SPEC.md`: what the tool does, with the open questions.
3. `PLAN.md`: the stages.
4. `HOUSE-STYLE.md`: the shared design and ways of working.
5. `SEO-HANDOVER.md`: when search work comes up (stage 5).

## Key points

- Nothing visible is built until John has answered the spec's questions
  and agreed stage 1.
- Never write a key or token into a file, log or commit. Keys live in
  Vercel's settings as "Secret" variables (house style §9). The Rail
  Data Marketplace's key goes in an `x-apikey` header; its "consumer
  secret" isn't used.
- `vercel.json` sets the functions' region (`lhr1`) and time limits. Automatic deployments
  are on again since stage 3 was merged (November 17th 2026): `main` is the live site at
  trainchecker-alpha.vercel.app, each branch gets a preview.
- **The app (stage 3):** Vite, React and TypeScript, parts copied from Riverwatcher
  (`organic.css`, `theme.ts`, `ThemeSwitch.tsx`, `responsive.ts`, `words.ts`) and the
  agreed mock-ups' styles (`src/styles/global.css`). Two Vercel functions: `api/live.ts`
  (the live board, five windows) and `api/week.ts` (the history, one half hour). The rules in
  `src/lib/analyse.ts`, every sentence in `src/lib/sentences.ts`. `npm run dev` and `vite
  preview` serve the functions too (`vite.config.ts`); from a cloud session run them with
  `NODE_USE_ENV_PROXY=1 RDM_LDB_KEY=proxy-injected RDM_HSP_KEY=proxy-injected`. `npm run
  check`: `scripts/check-rules.ts` and `scripts/check-api.ts`, on the real snapshots.
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
