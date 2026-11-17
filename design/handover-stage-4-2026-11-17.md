# Handover for stage 4 (the days ahead), November 17th 2026

For a new Claude Code session on `JohnBaish/trainchecker`. Stages 1 to 3 are finished and
agreed by John. Stage 3 (the real page) was merged into `main` on November 17th 2026, so
trainchecker-alpha.vercel.app shows it (the `trainchecker.baish.net` domain is stage 5's).

## Read these first

1. `CLAUDE.md`: the notes and log (key points at the top; the stage 3 entries say how the app
   is built, run and checked).
2. `SPEC.md`: **§8** (agreed at the mock-ups) and **§9** (agreed while trying stage 3) override
   §3 where they differ. Stage 4 is §3 points 5 and 6, §7 answers 8 to 11, and §8.9.
3. `design/mockups-2026-11-17.md`: questions M9, M10, M11 and John's answers O2 and O3 (the days
   ahead), and the agreed wording.
4. `design/data-trial-2026-11-17.md` §3 (Knowledgebase Incidents) and §4 (the NationalRail
   Disruptions API); `design/licences-2026-11-17.md` (both are **UK only**, so the functions stay
   in London; the Disruptions API's licence needs a month's notice to end).
5. `design/mockups/incidents.mjs`: the mock-ups' first draft of reading the incidents feed and
   matching it to a journey, and the snapshot it was tried on
   (`design/mockups/snapshots/20261117-incidents.xml.gz`, 6.26pm). Its matching was never tested
   beyond the mock-ups' five journeys.
6. `HOUSE-STYLE.md` (§2 dark mode, §5 and §6 layout and phones, §10 ways of working, §13 and §15
   wording).

## What stage 4 builds (branch `stage-4-ahead`, or the session's assigned branch)

From `PLAN.md`: engineering work and known problems to the end of the coming weekend, their
effect on the verdict, and National Rail's advice when a journey is badly disrupted.

1. **"The days ahead" section**, between "The last two hours" and "The last week" (SPEC §8.1),
   as on the mock-up page (https://claude.ai/artifact/QAUKZcDt6Xrhph1aPAUgAS): its heading
   ("The days ahead", or "Disruption now, and the days ahead" when something is happening now),
   each item with when it applies ("Now", "Now until Friday November 20th", "Sunday November
   22nd") and National Rail's summary, and **National Rail's advice always folded** (O3) with "More
   on National Rail's website"; with nothing: "National Rail lists no planned engineering work
   for this journey between now and the end of Sunday November 22nd."
2. **Which incidents count** (O2, John: only what affects the starting and ending stations, not
   stations between): the summary names both stations, or "to / from / via" one of them; a single
   amended train only in its own direction. National Rail describes routes in words only, so
   **test the matching properly** on many real journeys before relying on it, and show John
   what it finds and misses.
3. **The verdict:** "Be prepared" also when engineering work closes the line today (SPEC §7
   answer 4; the About paragraph already says so). And, when badly disrupted, National Rail's
   advice (other routes where tickets are accepted, replacement buses: §7 answers 9 and 10).
   Agree with John how these show, with mock-ups or the preview, before building.
4. **One feed or two (M11):** the incidents feed also carried tonight's unplanned Manchester
   disruption with National Rail's full advice, so the Disruptions API may not be needed. Test
   both on real days and keep only one if it's enough; tell John before dropping a subscription.
5. **A function** (as `api/live.ts` and `api/week.ts`: self-contained, key from Vercel's
   settings, `x-apikey` header, its own User-Agent, in London, nothing logged). The incidents
   feed is one 2.8 MB file (0.3 MB compressed) of every incident in Britain, so fetch it once and
   keep it briefly (Vercel's servers, `s-maxage` of a few minutes), then match on the server and
   send the page only the journey's items. National Rail's advice is HTML: keep only simple
   tags (`cleanAdvice()` in the mock-up code), with links opening National Rail's pages.
6. **`npm run check`:** the matching on the saved feed (and new real snapshots), the "when"
   wording, the end of the weekend, and every sentence free of "undefined".

## Known points

1. **The end of the weekend in summer:** the mock-up's `endOfSunday()` assumes UK time is UTC
   (true in November only). Work it out for British Summer Time too, with a check.
2. **Engineering work is already promised** in About and the first visit's paragraph, agreed
   wording, so this stage makes them true.
3. **"The last week" can't name the bad day** (data trial §8): unchanged, not part of stage 4.
4. **Station names:** the page's headings use the live board's names; the boxes use the
   Knowledgebase Stations feed's (`src/data/stations.json`, 2,616 stations; 22 names differ
   slightly, for example "Bond Street (Elizabeth line)"). The incidents feed's summaries may
   use either, or neither: check when matching.

## Practical points

1. **Keys for testing here:** one per address (`api1.raildata.org.uk`), so they're swapped with
   the secure form (`request_credential`); ask John for the product's Consumer Key. The key
   saved now is **Knowledgebase Stations**. Stage 4 needs **Knowledgebase Incidents**
   (`RDM_KB_KEY` in Vercel) and perhaps the **Disruptions API** (`RDM_DISRUPTIONS_KEY`);
   the live board's (`RDM_LDB_KEY`) to try whole pages.
2. **On Vercel,** each key must be ticked for Production and Preview (John found the preview
   had none at first; changes apply only to new deployments, so Redeploy). The functions say
   which setting is missing at `/api/live?from=RDG&to=PAD`; do the same for the new one.
3. **Running it here:** `NODE_USE_ENV_PROXY=1 RDM_LDB_KEY=proxy-injected
   RDM_HSP_KEY=proxy-injected node node_modules/vite/bin/vite.js preview --port 4620
   --strictPort` after `npm run build` serves the page and functions (`vite.config.ts`); add the
   new function to its list. Pictures from saved answers when the live key isn't the one saved:
   `design/previews/stage3/from-snapshots.mjs`. Browser checks: `sweep.cjs`, `try.cjs`.
4. **Phones:** Chromium's iPhone emulation didn't show the station-list tap fault John found on
   his iPhone (WebKit isn't installed here), so ask John to try new touch controls on his phone.
5. The side panel in John's app opens only files in the session's main folder: send files he
   should read with the file-sending tool.
6. Keep the project tracker up to date (`CLAUDE.md`, top).
