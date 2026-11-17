# Handover for stage 3 (the real page), November 17th 2026

For a new Claude Code session on `JohnBaish/trainchecker`. Stages 1 (the data) and 2 (the
mock-ups) are finished and agreed by John.

## Read these first

1. `CLAUDE.md`: the notes and log (key points at the top).
2. `SPEC.md`, especially **§8 (agreed at the mock-ups), which overrides §3** where they differ.
3. `design/mockups-2026-11-17.md`: every sentence, John's answers in five rounds, and the
   real examples. Its wording is final.
4. `design/mockups/`: the agreed rules and sentences as working code, to port into the app:
   `analyse.mjs` (the verdict, "badly disrupted", the last two hours, platforms),
   `sentences.mjs` (every sentence, `share()` rounding, `lastWeekOthers()`, `shareWords()`),
   `incidents.mjs` (the incidents feed and its matching rule), `page.src.html` (the layout
   and CSS, in the house style). The real answers from National Rail are in `snapshots/`:
   use them as fixtures for `npm run check`.
5. `design/stage-1-recommendation-2026-11-17.md` and `design/data-trial-2026-11-17.md`
   (addresses, timings, quirks; §9 for the history's margins and cancellations).
6. `design/licences-2026-11-17.md` (credits), and `HOUSE-STYLE.md` (§2 dark mode, §5 and §6
   layout and phones, §8 privacy, §10 ways of working, §13 and §15 wording, §17 sharing).

## What stage 3 builds (branch `stage-3-direct`, or the session's assigned branch)

The page in SPEC §8, as a Vite, React and TypeScript app in the house style (copy the
shared parts from a sister project, as Riverwatcher did from Hindcaster), with:

1. **The chooser:** "From", "To", swap, "Show trains", recent journeys in the browser, the
   journey after "#" (`#RDG-PAD`). Station names need a list with codes: **not yet sourced**.
   Check what the subscribed products offer first (the Knowledgebase has a stations feed,
   but it isn't subscribed); ask John before adding a subscription.
2. **Vercel functions in London** (`lhr1`; two licences are UK only), holding the keys
   `RDM_LDB_KEY`, `RDM_HSP_KEY`, `RDM_KB_KEY` (and `RDM_DISRUPTIONS_KEY`, probably not
   needed: stage 4). Each sends the key in an `x-apikey` header and its own User-Agent (the
   live board refuses some default ones). Nothing is stored or logged.
3. **The live part:** `GetDepBoardWithDetails` for the last two hours and the next four
   (five windows, as in `fetch-snapshot.mjs`); the verdict, the next four hours, platforms
   and the last two hours from it.
4. **The last week:** `serviceMetrics` with margins 3, 10, 30 and 120 minutes. Requests go one
   at a time (others are refused at once). A busy line's whole hour timed out at 55 seconds
   on the evening of November 17th, though it took 37 to 44 seconds earlier that day, so ask
   for each half hour in turn, and say plainly if it fails. Keep each answer for the rest of
   the day. Note for Elizabeth line journeys.
5. **Share** (words and link) and **the quote of the day** (`src/data/quotes.ts`, John's,
   unchanged) with its small Share making a picture of the quote: **show John the picture
   before wiring it in.**
6. **Favicon C** (`design/favicon-options/C.svg`) and preview picture A
   (`design/preview-options/og-A.html`): agreed, so they can go in (the search tags are stage
   5's).
7. **`npm run check`** with the stage 1 faults (a negative gap wrapped round the clock;
   after-midnight trains sorted first), rounding, the tense of long journeys, every
   sentence across the snapshots (no "undefined"), and the "badly disrupted" rules.
8. **`vercel.json`** turns off automatic deployments; turn them back on (at least for the
   branch) once there's an app to build.

"The days ahead" (engineering work and disruption) is stage 4's, though the mock-up's code
already reads the incidents feed.

## Practical points

1. **Keys for testing here:** one per address. The key saved now is the **Historical Service
   Performance** one. To use another, open the secure form (`request_credential`) and ask
   John for that product's Consumer Key; never in the chat.
2. Node's own `fetch` needs `NODE_USE_ENV_PROXY=1` to reach the APIs from a cloud session.
3. `node --experimental-strip-types` runs the `.ts` quotes file from plain scripts (as
   `design/mockups/build-mockups.mjs` does).
4. The side panel in John's app opens only files in the session's main folder: send files he
   should read with the file-sending tool.
5. Keep the project tracker up to date (`CLAUDE.md`, top).
