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
