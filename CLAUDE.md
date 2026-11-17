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

0. `design/mockups-2026-11-17.md`: the stage 2 mock-ups and John's questions M1 to M20
   (then `design/handover-stage-2-2026-11-17.md`, where stage 2 started).
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
- `vercel.json` turns off automatic deployments (`git.deploymentEnabled:
  false`) while there's no app, so pushing notes doesn't send John
  failed-build emails. Remove it, or set it per branch, in stage 3.
- Functions run in London (`lhr1`): the incidents licence allows UK use
  only.
- Every figure on the page comes from real data. Examples in documents
  are marked "illustration only".
- Copied from `JohnBaish/clockwheel` at commit `372c03c` (November 17th
  2026): `HOUSE-STYLE.md`, `SEO-HANDOVER.md`, `.claude/skills/fresh-look/`
  and `.github/workflows/tidy-branches.yml`. Clockwheel holds the master
  copies.

## Log

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
