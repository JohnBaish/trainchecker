# Handover: a fresh look at Trainchecker (November 18th 2026)

For a new Claude Code session on `JohnBaish/trainchecker`. Stages 1 to 4 are finished, agreed by
John and live on `main` (trainchecker-alpha.vercel.app; the `trainchecker.baish.net` address is
stage 5's). John wants the **fresh look** now: a full review of the tool as people really use it,
changing nothing, ending in a numbered report. After he has answered it and the changes are made,
stage 5 (the launch) follows: `design/handover-stage-5-2026-11-18.md`.

## How to run it

Type `/fresh-look` (the skill is in `.claude/skills/fresh-look/`, the house style's master copy
from `JohnBaish/clockwheel`). Follow `SKILL.md` exactly: **change nothing** in the repo; test
scripts and pictures go in the session's scratchpad; the report goes to John in chat and as the
phone-friendly PDF (`make-pdf.mjs`).

## Read first

1. `CLAUDE.md`: key points and the log (November 17th and 18th 2026 above all).
2. `SPEC.md` **§8, §9 and §10**: everything agreed. §10 (42 points, November 17th and 18th 2026)
   changed several earlier decisions: the page's order, the last two hours never in the verdict,
   Share under the verdict, trains an hour with fast, slower and Elizabeth Line groups, platforms
   by kind of train, the train list's reasons on one line, "this weekend", National Rail's
   summaries reworded in the house style, single services grouped, "might affect this route",
   the line closed today, cancellations in the last two hours and the last week, "ten" after a
   spelt number, the last week to Ealing Broadway where National Rail's record leaves out the
   Elizabeth Line. **Don't report agreed behaviour as a fault**; do report where it reads badly in
   a case nobody has seen yet.
3. `HOUSE-STYLE.md` (§5 and §6 layout and phones, §13 and §15 wording).
4. `design/incidents-trial-2026-11-17.md` and `design/data-trial-2026-11-17.md` §10 to §12: how
   the incidents matching and the Elizabeth Line history were tested.

## What there is to look at

- **First visit** (`#` or no address): the station boxes, the intro, the quote of the day, About,
  the footer.
- **A journey** (`#RDG-PAD`, station codes): strip with Swap and Change; time and Check again; the
  verdict; Share / Copy a link; the next four hours (with the folded train list); Platforms; the
  quote; the last two hours; the days ahead (National Rail's incidents); the last week (choose an
  hour; it takes up to a minute); About; footer.
- **Cases worth finding live or making from saved answers:** good, mixed and "Be prepared" days; no
  direct train; the last train gone (evening, no train in four hours); the line closed today
  (Derby to Matlock had buses all week of November 16th); disruption now; single early or late
  services; a long journey (fewer than three arrivals); an Elizabeth Line-only journey with
  Paddington or Bond Street as an end (Reading to Bond Street: the last week measured to Ealing
  Broadway); a mixed journey (Twyford to Paddington: Great Western to Paddington and the Elizabeth
  Line to Ealing Broadway, two paragraphs); the station boxes (suggestions, the cross, Recent,
  Ivybridge typed letter by letter); dark mode; the quote's Share picture.

## Practical points

1. **Keys:** this environment holds **one** Rail Data Marketplace key at a time (all are for
   `api1.raildata.org.uk`, `x-apikey` header). At the end of the last session it was the
   **Historical Service Performance** key. To use the live board (`RDM_LDB_KEY`) or the incidents
   feed (`RDM_KB_KEY`) here, ask John for that key through the secure form
   (`request_credential`). Vercel has all of them for the live site.
2. **Running it here:** `npm run build`, then
   `NODE_USE_ENV_PROXY=1 RDM_LDB_KEY=proxy-injected RDM_HSP_KEY=proxy-injected
   RDM_KB_KEY=proxy-injected node node_modules/vite/bin/vite.js preview --port 4620 --strictPort`
   serves the page and its three functions (only the key saved here really works). For the
   others, feed the page saved answers in the browser, as these scripts do:
   `design/previews/stage3/from-snapshots.mjs` (live boards in `design/mockups/snapshots/`),
   `design/previews/stage4/stand-in.ts` and `stand-in-mixed.ts` (the last week, real history),
   `type-ivybridge.cjs`. Saved incidents feeds: `20261117-2223-` and `20261118-0635-incidents.xml.gz`
   (`liveItems()` in `api/days.ts` turns one into what `/api/days` sends).
3. **Checks:** `npm run check` (`check-rules`, `check-api`, `check-days`; 200 + 57 + 68 when this
   was written), `npx tsc -b`, `npm run lint`, `npm run build`.
4. **The live site** may not be reachable from a cloud session; review the local build of `main`
   and say so in the report.
5. **Not yet checked anywhere:** Safari itself (WebKit isn't installed here); John has tried the
   preview on his iPhone throughout and reported the cross and Ivybridge fixed.
6. **The Disruptions API isn't used** (the incidents feed carries the same disruption); John is
   keeping the subscription for now.

## Prompt for John to paste into the new session

```
This is Trainchecker. Stage 4 is live. Please read design/handover-fresh-look-2026-11-18.md
first and follow it, then run /fresh-look on the whole tool. Change nothing; send me the
numbered report and the PDF. I'll answer it item by item, and we'll make the agreed changes
before stage 5.
```
