# Handover for stage 2 (mock-ups), November 17th 2026

For a new Claude Code session on `JohnBaish/trainchecker`. Stage 1 (the
data) is finished and every point of its recommendation was agreed by
John.

## Read these first

1. `CLAUDE.md`: the notes and log (key points at the top).
2. `SPEC.md`: what the page shows, in order (§3), with John's answers (§7).
3. `design/stage-1-recommendation-2026-11-17.md`: what the data gives and
   the agreed rules. **Its section 2 overrides the spec where they differ**
   (the verdict counts affected trains; departures fallback for long
   journeys; Elizabeth line note on the history; history hours 5am to
   midnight).
4. `design/data-trial-2026-11-17.md`: addresses, timings and quirks of
   each data product.
5. `design/rules-trial-2026-11-17.md` and `scripts/try-rules.py`: the
   rules tried on nine real journeys (real sentences for the mock-ups can
   be made the same way).
6. `design/licences-2026-11-17.md`: credits needed.
7. `HOUSE-STYLE.md`, especially §2 (colours and dark mode), §5 and §6
   (layout and phones), §8 (privacy wording), §10 (mock-ups first), §13
   and §15 (numbers and wording), §17 (sharing).

## The page, as agreed (top to bottom)

1. Two station boxes ("From", "To"), a swap button, recent journeys
   remembered in the browser, the journey in the address after "#".
2. The verdict: "Good news…", "It's a mixed bag…" or "Be prepared…",
   from the next four hours and known problems; a "However, it's worth
   knowing…" sentence when the last two hours were noticeably worse.
3. The next four hours in words, with details of each delayed or
   cancelled train and National Rail's reason.
4. Platforms "at the moment, generally speaking", from the live board.
5. The last two hours (arrivals within 3 minutes; departures when few
   have arrived).
6. The days ahead: engineering work to the end of the coming weekend,
   and live disruption at the two stations, with National Rail's advice.
7. The last week, on request: "If you'd like to see the reliability
   history of trains making this journey over the last week, choose an
   hour of departure and the results should load in under a minute." Same
   kind of day as today; hours 5am to midnight; Elizabeth line note.
8. A Share button (sentence agreed with the mock-up).
9. Message of the day (366 messages, one per day, the same for everyone;
   John will supply a `.ts` file).
10. Credits (Rail Delivery Group and National Rail; draft in the licences
    file), privacy wording, and the usual footer.

Direct journeys only; no changes of train in the first version.

## Stage 2 itself (`PLAN.md`)

Mock-ups on branch `stage-2-mockups`: the whole page at 1200px, 390px and
844×390 with touch, light and dark (dark mode built in from the start,
following the device), using real journeys: a good one, a mixed one, a
disrupted one, and a journey with no direct train. Every sentence is for
John to agree word by word. Show favicon and preview-picture options
separately before wiring them in (§7).

## Practical points

1. **Keys for testing here:** all four products share one address
   (`api1.raildata.org.uk`, header `x-apikey`) and this environment holds
   one key per address. At the end of stage 1 the saved key is the
   **Live Departure Board** one. To use another product, open the secure
   credential form (`request_credential`) and ask John to paste that
   product's Consumer Key. Never ask for a key in the chat.
2. **Keys for the app:** in Vercel as Secret variables `RDM_LDB_KEY`,
   `RDM_HSP_KEY`, `RDM_KB_KEY`, `RDM_DISRUPTIONS_KEY`. Functions must run
   in London (`lhr1`): two licences are UK only.
3. **`vercel.json` turns off automatic deployments** (no app yet, to stop
   failed-build emails). Turn them back on, at least for the branch, when
   there's something to build.
4. The live board refuses Python's default User-Agent (403); set one.
5. The Open Rail Data wiki is behind a bot check that blocks cloud
   sessions; don't rely on it.
6. Keep the project tracker up to date (`CLAUDE.md`, top).
