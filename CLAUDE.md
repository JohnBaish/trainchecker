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
   `design/platform-links-trial/`. Since November 24th 2026 the same tables give a rough location guide
   when a platform is tapped (`design/platform-directions/`; John's corrections in
   `exits-overrides.json`, `links-overrides.json` and `src/data/to-platform.json`; Reading in full,
   numbered, in `reading.md`).
7. `design/passes-near/README.md`: "Your train passes near…" (an interesting thing near each
   stretch, with the train's side), with John's decisions and the prompt for the page. Since November 22nd
   2026 every stretch in England is in `stretches.json` (2,376), and since November 23rd 2026 all of them
   are done (`design/passes-near/COVERAGE.md`; what remains is upkeep when the network is rebuilt).
   On the page as "Fact of the Journey" since November 22nd 2026: after any change to the items, run
   `design/passes-near/to_site.py` (COVERAGE.md step 8), or the change doesn't reach the page.
8. `design/follow-my-train/README.md`: "Follow my progress", a link in Message home's Share to a page
   about the train you're on; John's decisions of November 26th 2026; mock-ups on `claude/dreamy-keller-gb9xf7`.

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
  `NODE_USE_ENV_PROXY=1 RDM_LDB_KEY=proxy-injected RDM_HSP_KEY=proxy-injected RDM_KB_KEY=proxy-injected RDM_ARR_KEY=proxy-injected`
  (only the key saved here works). `npm run check`: `scripts/check-rules.ts`, `scripts/check-api.ts`,
  `scripts/check-days.ts`, `scripts/check-connection.ts` and the rest (`scripts/check-arrivals.ts` for the arrival board), on the real snapshots.
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

### November 26th 2026: a late train still waiting at A was counted as gone; "Good news" not with the next train late; live (branch `fix/late-train-still-to-leave`, merged the same day; Claude Code)

- **John (photos, Birmingham New Street to Cardiff Central at 6.22pm; a second report of the same kind):** "Good
  news", "The next train … expected to be on time", while the 6.12pm was still on platform 11, expected at 6.30.
  Cause: `analyse.ts` sorted trains into gone and still to leave by the timetabled time only, so a late train
  whose time had passed was "gone": left out of the verdict, the panels and the late count.
- **Fixed:** a train whose timetabled time has passed but is expected to leave from now on, or shows "Delayed" with
  no time, counts as still to leave (`waiting` in `analyse()`). The panels already went by expected times.
- **Found:** the saved boards had it too: Manchester Piccadilly to the Airport at 6.24pm on November 17th (the 6.18pm,
  expected at 6.30), Bath Spa to Bristol (6.23pm, expected 6.25), Paddington to Reading (6.20pm, expected 6.24).
- **Checked:** five new checks in `check-rules.ts` (a late train ahead and first; gone once its expected time passes;
  "Delayed"); the older checks that changed now say what's true (Manchester "of the next 31 … three running late",
  Bath "two of the 19") or keep testing what they were for (`ids()` and `asLeft()`); the comparison with the
  mock-up code skipped on boards with such a train. All ten scripts pass, `tsc -b`, lint, build. Recreated on Kings
  Cross to York (made up: due 8.03pm, expected 8.21pm, clock 8.13pm): before, "They're all expected to be on time";
  after, "One is expected to be more than five minutes late". Not checked: Birmingham's own board (not saved).
- **Still "Good news":** the agreed rule allows one train in ten (or one, under 20 trains) to be late or cancelled,
  so a quiet line with the next train late still reads "running well". For John.
- **John:** "Yes please" to merging. Checks, `tsc -b` and build clean first; pushed to `main` (a72e151). Checked live:
  trainchecker.baish.net serves the same build (`index-CxvsGjOA.js`, built here from a72e151).
- **John:** yes to never "Good news" when "the next train expected to leave" (by expected time) is cancelled, more
  than five minutes late or "Delayed". Built, not merged: `nextBad` and `byNext` in `analyse()`; `nextSaid()` in
  `sentences.ts` (Claude's drafts): "It's a mixed bag: most trains from London Kings Cross to York are running this
  evening, but the next one, the 8.03pm, is running 18 minutes late, now expected to leave at 8.21pm." ("is
  cancelled"; "is delayed, with no new time given yet"; "…, and one more is cancelled" / "running late" / "cancelled
  or running late"); Share: "Most were running, but the next one, the 8.03pm, was running 18 minutes late, then
  expected to leave at 8.21pm." Checks: check-rules 267 (new: late, five minutes still good, "Delayed", cancelled,
  the share words, a late train that another leaves before); Liverpool Street to Stratford at 8.59pm (the 9pm
  cancelled) now "a mixed bag", so its comparison with the mock-up code is skipped. Sweep of the saved boards, the
  clock moved back up to two hours in tens (illustration only): 6 of 208 views change, 132 still "Good news".
- **John:** the booked and expected times both said, as we're often checking after a train's booked time: "…but the
  next one to leave, originally scheduled for 8.03pm, is running 18 minutes late. It's now expected to go at
  8.21pm." (his words); in the same pattern (Claude's drafts) "the next one, scheduled for 8.03pm, is cancelled." (John, after trying "the train scheduled to leave at 8.03pm
  was cancelled"; said only until its booked time, then it's in the last two hours),
  "the next one to leave, originally scheduled for 8.03pm, is delayed, with no new time given yet.", others as a
  sentence of their own ("Four more are running late."); Share "…was running 18 minutes late. It was then expected to
  go at 8.21pm." And still "Good news" when another train taking about as long (within five minutes, or a fifth of
  the journey) is on time and leaves in the next five minutes (John: Liverpool Street to Stratford, the 9pm cancelled,
  the 9.02 and 9.03 just behind). Checks: check-rules 271 (new: Liverpool Street good, and "a mixed bag" with the next
  two removed); sweep: 4 of 208 views now change, 134 "Good news". **John asked:** a late train still waiting shows in
  "Show the train that isn't on time" (yes, since the first fix: "8.03pm · Expected 8.21pm, 18 minutes late").
- **John:** "Yes please" to merging. All ten checks, `tsc -b`, lint and build clean first; pushed to `main` (6be6fce).
  Checked live: trainchecker.baish.net serves the same build (`index-jiNR1mdI.js`, built here from 6be6fce). The
  branch was never pushed, so nothing to tidy. Merged into `claude/dreamy-keller-gb9xf7` (Follow my progress).

### November 26th 2026: "Follow my progress": the sentences agreed, the page mocked up (branch `claude/dreamy-keller-gb9xf7`, not merged; Claude Code)

- **John:** his three drafts work for every train; one word order ("The 5.05pm train from Reading to London
  Paddington is on its way"), where it is in that sentence (", now between Twyford and Maidenhead"; nothing on a
  non-stop run), the platform at the end only when known. The rest drafted; all in `design/follow-my-train/README.md`.
- **Built (mock-up):** `src/lib/follow.ts`, `src/components/FollowView.tsx` (`?mock=A` words only, B with the
  train's line), the `#RDG-PAD/follow/…` route in `App.tsx`; Message home's share ends "Follow my progress on
  Trainchecker:" with the train's link until it's in; `api/live.ts`'s `calls` mark stops passed (`Call`), and the
  arrival board's trains carry their stops.
- **Checked:** all checks (ten scripts), `tsc -b`, lint, build; `design/previews/follow/shoot.mjs` (the 6.24pm
  board of November 17th, arrival board made up, some cases made up: illustration only): 14 cases at 1200px light
  and 390px dark, no errors, no sideways scroll; Message home's share caught on a phone and its link opened. Found
  and fixed: "on platform / 9." split over two lines, "late" alone on a line. Not checked: a real phone, live boards.
- **John:** option B (the words and the train's line; the `?mock=` switch and option A taken out); the drafts kept for
  now ("I need to keep checking it"); a way to send the link with Copy on a computer, and what the midnight gap would
  look like: both explained, for him. Checks, `tsc -b`, lint, build; `shoot.mjs` again: no errors, no sideways scroll.
- **John:** the wording of 1 to 14 agreed; the midnight fix (a train still on the boards is followed whatever the
  link's date; `sameTrain()` matches id and booked time); mock-ups of B and C for copying the message and link on a
  computer (`linkCopy` in `BoxShare.tsx`, `?copy=B|C` in Message home). New `scripts/check-follow.ts` (25: the 14
  sentences, midnight, the link) in `npm run check`. Checks (11 scripts), `tsc -b`, lint, build; `copy.mjs` at 1200px
  light and dark: both clipboards read back, no errors, no sideways scroll.
- **John:** rethink for a computer: no box or picture, only the message (the phone's turned round, third person, with
  the platform; "Follow its progress on Trainchecker:" and the link; arrived: "See how the trains are doing on
  Trainchecker:" and the journey's link) and "Copy this message"; the phone's planning case "getting into" too. All 11
  cases agreed. Built: `deskFor()` and `Home.desk` in `messageHome.ts`, `src/components/DeskMessage.tsx`, `.desk-message`;
  B and C taken out. Checks: check-home 57 (new: every computer case, the board's own, delayed, arrived); all 11 scripts,
  `tsc -b`, lint, build; `design/previews/follow/desk.mjs` at 1200px light and dark: no box, each message copied and read
  back with its link; at 390px dark with touch the box and "Share this journey" as before; no errors, no sideways scroll.
- **John (the preview, the 8.47pm from Reading):** (1) the platform: shown only when Paddington's arrival board gives
  one; now "not yet" in a third column when the train is on that board without one (`noPlat`), nothing when it isn't
  on it; (2) left late but on time again, in the first five minutes after leaving: "but it will make up the time"
  (case 6); (3) the journey card: "Check how all the trains on this journey are doing, including engineering work in
  the days ahead, recent reliability figures and bonus content." and the button "More about the route". Checks:
  check-follow 28; all 11 scripts, `tsc -b`, lint, build; `shoot.mjs` again and the new case at 1200px light and 390px
  dark: no errors, no sideways scroll. For John: case 5 ("made up some time") and Message home's messages unchanged.


### November 26th 2026: "Follow my progress", an idea for Message home's Share, talked through (notes only, straight to `main`; Claude Code)

- **John:** Message home's message ending "Follow my progress on Trainchecker:" with a link to a page about that
  train ("currently between X and Y … expected into B at …, on platform …"). His answers: only the stops it calls
  at (no location on a non-stop run; the box carries Message home's shared words instead); the link after the "#";
  "Check again", not updating by itself; the train plus a link to the full journey (to see in mock-ups); "my
  progress" for now; planning messages carry the link too. All in `design/follow-my-train/README.md`. Nothing
  built; mock-ups next, when John says.

### November 26th 2026: "Message home"; live (branch `claude/message-home`, merged the same day; Claude Code)

- **John:** a section after The last week, "Message home", folded under "Check your arrival and share", with the
  same question and list as Exits (Find my train too); then Exits, then "More arrivals" (Arrivals renamed, heading
  only). Choosing a train shows its line from B's arrival board in a box, with "Share this journey" ("Copy" on a
  computer). Picture (John): "TRAINCHECKER · MY TRAIN", "The 10.02am from Reading", "Expected into London Paddington
  at 10.26am, on platform 11.", "Checked at …". Sent with "Here's my train from Reading, expected into …" ("running
  six minutes late, now expected into …" when late); not yet left: "I'm planning to get the 10.02am from Reading,
  expected into … , on platform 11." (platform only when known).
- **Built:** `src/lib/messageHome.ts` (`homeFor()`: the line matched to B's arrival board by the id's first eight
  characters, its platform B's; without it, the departure board's time and no platform), `src/components/MessageHome.tsx`,
  `Board` exported from `JourneyView.tsx`, `answerImage()` takes a `foot`, `BoxShare` takes `title`, `when`, `foot`.
  Drafts (Claude's, for John): delayed with no time, already arrived ("Got into … at …", row "arrived" under "EXPECTED IN").
- **Checked:** all checks, `tsc -b`, lint, build; `design/previews/message-home/shoot.mjs` (Reading to Paddington at
  6.24pm, arrival board made up from the departures, illustration only): on time, late, planned and arrived, at
  1200px light and 390px dark, each picture read back from the clipboard; no errors, no sideways scroll, button 44px
  on a phone. Not checked: a real phone's share sheet, live boards.
- **John:** the delayed and late-and-planned drafts agreed; a train expected to leave in the next four minutes is
  "my train", not "planning to get" (`SOON` in `messageHome.ts`; "Delayed" with no time stays "planning"). New
  `scripts/check-home.ts` (14). For the arrived row, option B mocked up beside A (`box-arrived-B-*`, the heading
  "GOT IN" and no "arrived"; made by editing the page, illustration only), for John to choose.
- **John (live, Reading to Paddington):** Find my train said "the 4.42pm or the 4.42pm", over two buttons alike
  (a slower train and a fast one). Now in Connections, Message home and Exits: each button names its kind as the
  boards do ("· Fast", "· Slower", "· Elizabeth Line", when the journey has more than one), and a train sharing its
  time with another of the same kind adds its company (Liverpool Street to Stratford: Greater Anglia, Elizabeth
  Line); two found at the same time: "…you’re probably on one of the 4.42pm trains. Please choose one below." (John);
  one found, or the next at A, with a twin: "the 9.04pm slower train". `kindOf()` and `trainName()` in
  `sentences.ts`; Message home's row uses `kindOf()` too (it had missed trains already gone). Checks: check-home 23;
  `design/previews/same-time/shoot.mjs` (the 8.59pm board's two 9.04pms, clock 9.06 and 9.08pm, a pretend location
  between Reading and Twyford; arrivals made up, illustration only) at 390px dark and 1200px light: the sentences
  above, no errors, no sideways scroll. Connections' list not photographed (needs a change station; same code).
- **John:** the share picture's heading has no "fast" or "slower"; where another company's train leaves at the same
  time, the company just before "train" ("The 4.47pm Elizabeth Line train from Reading"; `otherCompany()` in
  `sentences.ts`), otherwise "The 4.42pm from Reading". (A first reading applied this to the lists too; John: only
  the heading, so the lists keep "· Fast"/"· Slower".) Arrived: A (the row as built); the picture reads "Arrived into
  London Paddington at 6.21pm, on platform 12."; the message keeps "which got into…" (John, for variety). Option B
  mock-up removed. Checks: check-home 28, all checks, `tsc -b`, lint, build; both preview runs again: no errors, no
  sideways scroll.
- **John (iPhone, the preview):** in Message home's box the first two columns swapped: "FROM READING" first ("The
  5.05pm · Fast", capital T, and how late with the arrow now pointing right, on to the time), then "EXPECTED IN",
  then "PLATFORM". Its own markup in `MessageHome.tsx` (the shared `Board` unchanged elsewhere); `Icon` "right";
  `.home .home-box` columns in `global.css`. Checks, `tsc -b`, lint, build; `message-home/shoot.mjs` at 390px dark and
  1200px light: the arrow on the line with its words, no errors, no sideways scroll.
- **John:** "6.43pm" and "Expected in" right-aligned with each other. The heading and row now share one grid
  (`subgrid` in `global.css`), as two separate grids sized their columns differently and the row ran about 40px past
  the box on a phone; the late note may wrap, the arrow kept with its last word. Measured at 360px and 390px with
  touch and 1200px: heading and time end on the same pixel, platform heading and badge too, no sideways scroll.
  John's share-message cases (left on time but late; left late; left late and made some up) drafted with the others,
  for him: not built.
- **John:** the message sent with the picture, cases 1 to 11 agreed as drafted (`sentFor()` in `messageHome.ts`, from
  how late the train left A, from the departure board, and how late it's expected in): left on time ("expected
  into…", "It left on time but it's now running … late", "a little early"); left late ("so it's expected…", "but it's
  made up some time … later than originally planned", "made up the time … on time", "and it's now running … late");
  planning ("It's expected to leave … late, at …, and get into…"); within the four minutes ("It's due to leave …");
  under two minutes counts as on time, a change of a minute as the same; how it left unknown: by the arrival, as
  before. The picture's words unchanged. Checks: check-home 44 (every case), all checks, `tsc -b`, lint, build;
  `message-home/shoot.mjs` again: no errors, no sideways scroll.
- **John:** "This looks great. Please merge to main." Checks (ten scripts, all passing), `tsc -b`, lint and build clean
  first; fast-forwarded into `main` with this note. Not checked: a real phone's share sheet with the picture, live
  boards producing every case.
- **Checked live** a few minutes after merging: trainchecker.baish.net serves the new build (Message home in it).
  Branch tidied: "Delete merged branches" trial run 45873458570, then the real run 45873501869; `git ls-remote
  --heads origin` shows only `main`. Tracker updated (What's built 37).

### November 26th 2026: "Find my train from my location", fuller lists, "expected", a refresh that keeps your place; live (branch `claude/happy-darwin-mmnd4m`, merged the same day; Claude Code)

- **John's answers:** "now expected into" kept for late trains; "expected" for the next train after an hour with
  none, the Arrivals counts and Arrivals' Share words and picture; "Your train is due into platform 9." and the
  timetabled "due"s kept. Done in `sentences.ts` and `JourneyView.tsx`; `check-rules.ts` updated to the new wording.
  Everything agreed today in `SPEC.md` §14. **John:** merge to `main` after as much testing as possible.
- **Checked:** `npm run check` 264 + 57 + 84 + 40 + 84 + 36 + 394 + 16 + 128; `tsc -b`, lint, build; in the browser
  `shoot.mjs`, `list.mjs` and `refresh.mjs` again, and a new `design/previews/find-my-train/sweep.mjs`: all 16 saved
  boards, every fold open, at 1200px light, 390px dark and 844×390 with touch: 48 views, no errors, no sideways scroll,
  the train buttons as counted. Then merged into `main`. Not checked: Safari on a real iPhone for the refresh, the
  live site with both live boards (the preview has been tried by John).
- **Checked live** a few minutes after merging: trainchecker.baish.net serves the new build (Find my train in it), and
  `/api/live` (Reading to Paddington, 3.55pm) sends each train's stop times (29 of 85 trains; the rest non-stop).
  Branch tidied: "Delete merged branches" trial run 45853798481, then the real run; `git ls-remote --heads origin`
  shows only `main`. Tracker updated.

### November 26th 2026: a refresh keeps your place; "expected into" on the train buttons (branch `claude/happy-darwin-mmnd4m`, not merged; Claude Code)

- **John:** where does Refresh land? Found: wherever the browser guesses (Chromium: the top, or near the bottom when the
  trains take half a second, as the folds start closed and the page is shorter; John: Safari on an iPhone the same).
  **John:** option 2, back to where you were. Built: `src/lib/keepPlace.ts` (`useKeepPlace()`, in `JourneyView.tsx`):
  notes the section at the top of the screen, how far into it, and the open folds, in the tab's session storage
  (stays on the device, goes with the tab); after a refresh only, reopens them and scrolls back; anything you do
  yourself stops it. Not kept: a train or station chosen in Connections or Exits, or Find my train's answer.
- **John:** "expected into" on Connections' and Exits' train buttons even when on time (the time was always the
  expected one). Done; "now expected into" kept for late trains, to confirm. The other places with "due" or
  "expected" listed for John, not changed.
- **Checked:** all checks, `tsc -b`, lint, build; `design/previews/find-my-train/refresh.mjs` (Reading to Paddington at
  6.24pm, National Rail answering after 600ms): Exits, Connections and the last week at 390px light and 1200px dark,
  each back to the same pixel after a refresh, folds open again, a fresh visit at the top, no errors, no sideways
  scroll. Not checked: Safari on a real iPhone.

### November 26th 2026: Connections and Exits offer every train on its way; Exits says "now expected" (branch `claude/happy-darwin-mmnd4m`, not merged; Claude Code)

- **John:** the list should hold every train on its way and the next ones to leave, in time order ("Good solution").
  It held the first eight, so on a busy line the train that had just left couldn't be chosen (Reading to Paddington at
  6.24pm and 8.59pm: the latest gone wasn't in the eight). `shownTrains()` and `NEXT_TO_LEAVE` (four) in
  `connection.ts`: every train that has left A and is still on its way (or got in within three minutes), then the next
  four, in timetabled order; at A, Find my train's list as before. Saved boards: 3 to 11 trains, 15 or 16 at rush hour.
- **John asked** whether Exits' "due into London Paddington at 10.26am" is the timetabled or expected time: expected,
  but it didn't say when a train was late. Now as Connections: "now expected into London Paddington at …" when a minute
  or more late.
- **Checked:** check-find 128 (new: every board, every train on its way offered, the next four, time order; the 6.18pm
  at 6.24pm offered and not in the old eight); all checks, `tsc -b`, lint, build; Exits on the 6.24pm board
  (`design/previews/find-my-train/list.mjs`, arrival board made up, illustration only) at 390px dark and 1200px light:
  15 trains, "now expected" on the late ones, no errors, no sideways scroll. Not checked: a real phone.

### November 26th 2026: "Find my train from my location": still at A, only trains still to leave (branch `claude/happy-darwin-mmnd4m`, not merged; Claude Code)

- **John (iPhone, at Reading at 10.02am, Reading to Paddington):** "You seem to be at the station still. Please choose
  the train you're planning to take." over a list of trains that had all gone. Cause: the list holds the first eight
  trains, and at 10.02 all eight had left, so the next one wasn't among them and couldn't be chosen. **John:** at A, show
  trains that haven't left, or left very recently.
- **Built:** the matching gets every train, not just the eight shown; at A the list shows only trains still to leave or
  gone in the last two minutes (`JUST_GONE` in `FindMyTrain.tsx`; "Delayed" with no time counts as not gone), the next
  one chosen; the question then reads "Which train are you planning to take?". "On" kept in the answers (John).
- **John (on the train, Butts Hill Road bridge between Reading and Twyford, 10.05am):** "None of these trains seems to be
  near you", over the eight trains from 9.16 to 9.46am; his left at about 10.02. The same cause: the matching was given only
  the eight on screen. Fixed by the same change; a new check recreates it on the 8.59pm board (the 9.01pm ninth: with
  every train, "the 9pm or the 9.01pm"; with the first eight, the 9pm alone). Found: the list itself can't offer a
  train that left recently on a busy line (the first eight are older trains still on their way), for John.
- **Checked:** all checks (check-find 79), `tsc -b`, lint, build; `shoot.mjs` again: at Reading at 8.59pm the 9pm chosen
  and only later trains below it; the other answers unchanged; no errors, no sideways scroll. Not checked: a real phone.

### November 26th 2026: "Find my train from my location": John's wording, found trains first, About (branch `claude/happy-darwin-mmnd4m`, not merged; Claude Code)

- **John:** "This looks great"; wording changes ("From your location", "at the moment", "Finding your location…", no
  station name at A, "Your location couldn’t be found."); the trains found listed first with "Or choose another" above
  the rest (also done for one train and the next at A: Claude's choice, told to John); an About paragraph (Claude's
  draft, in `Tail.tsx`; agreed, with "which train you’re probably taking" for "…on", John). All in `design/find-my-train/README.md`. He'll try it on his phone on a journey within the hour.
- **Checked:** all checks (check-find 76), `tsc -b`, lint, build; every answer again in the browser (`shoot.mjs`):
  the wording, the found trains first, no errors, no sideways scroll, button 44px. Not checked: a real phone or train.

### November 26th 2026: "Find my train from my location" on the page, for John (branch `claude/happy-darwin-mmnd4m`, not merged; Claude Code)

- **John:** carry on to mock-ups. Built into the page: `src/components/FindMyTrain.tsx` in Connections and Exits,
  between the question and the trains; shown only when a train in the list has left A. One train: chosen; two: both
  edged (dashed accent) and you choose; at A: the next train chosen. Every sentence is Claude's draft, numbered in
  `design/find-my-train/README.md`; pictures in `design/previews/find-my-train/` (`shoot.mjs`).
- **Checked:** all checks (check-find 76), `tsc -b`, lint, build; every answer in the browser at 390px light, and
  three at 390px dark and 1200px light: no errors, no sideways scroll, button 44px. Not checked: a real phone or train.

### November 26th 2026: "Find my train from my location": the matching (branch `claude/happy-darwin-mmnd4m`, not merged; Claude Code)

- **John:** build the matching first. `scripts/build-positions.ts` and `src/data/station-pos.json` (every station's
  position, the track's where the feed is more than 500 metres out); `api/live.ts` keeps each train's stop times
  (`calls`, about 1 KB more compressed); `src/lib/findTrain.ts` (`far`, `atA`, `one`, `two`, `none`). Details and
  the figures to tune in `design/find-my-train/README.md`. Nothing on the page yet.
- **Checked:** `npm run check` 264 + 57 + 84 + 40 + 84 + 36 + 394 + 16 + 76 (new `scripts/check-find.ts`: 13 cases
  by hand on the saved boards, and a sweep of 63 trains between stations: all offered, 34 alone, 29 with one other
  train within four minutes); `tsc -b`, lint, build. Found by the checks: two faults in the checks themselves, not
  the matching (fixed). Not checked: a real phone on a real train.

### November 26th 2026: "Find my train from my location", looked into (notes only, straight to `main`; Claude Code)

- **John:** a button at the top of the train lists in Connections and Exits, "Find my train from my location", only to
  narrow down which train you're on; two trains too close to tell apart offered both. The idea and its limits in
  `design/find-my-train/README.md`. Nothing built.
- **Checked:** the Knowledgebase Stations feed gives a map position for all 2,616 stations (half within 39 metres of
  the OpenStreetMap track's station ends, 99 in 100 within 320 metres); two wrong in the feed (Burnham-on-Crouch in
  the North Sea, Canary Wharf (Elizabeth line) with its longitude's sign wrong).
- Key saved here now: Knowledgebase Stations (it replaced the Live Arrival Board's).

### November 26th 2026: "am" or "pm" once, in lists and ranges; live (branch `claude/lucid-feynman-lbfd8l`, merged the same day; Claude Code)

- **John (iPhone, the fold under a panel):** "The 6.44am, 6.48am, 7.14am … are cancelled" should say "am" once, as
  the rest of the page does. `cancelledLine()` in `windows.ts` now uses `clockSay()` and `andList()`: "The 6.44am,
  6.48, 7.14 … are cancelled", "pm" again only when it changes, "7pm" kept.
- **John, on what else was found:** (1) National Rail's times in "The days ahead" the same way; (2) ranges as
  "7.24 to 8.24pm" throughout; (3) the boards' rows left as they are. `SPEC.md` §12.31.
- **Built:** `src/lib/timesSaid.ts` (`onceSay()`, `rangeSay()`), used by `clockSay()`, Connections' `clockOnce()`
  and `houseStyle()` in `incidents.ts` (`chainSay()`: a range is "between … and", "from … to/until" or two times
  joined by "to"/"until"; anything else a list). Ranges changed: the first panel's Share words and picture, the
  later picture's period, hour by hour's words, the earlier-trains line ("from 7.36 to 8.10am"), the last week
  ("between 6.40 and 7.10pm"). A range keeps both where it changes or starts on the hour.
- **Checked:** `npm run check` 264 + 57 + 84 + 40 + 84 + 36 + 394 + 16 (new: Manchester's two cancelled lists,
  Liverpool Street's "9pm and 9.28", the first panel's ranges, five of National Rail's); `tsc -b`, lint, build.
  Not checked in a browser (text only).

### November 25th 2026: no quote while the trains load; live (branch `claude/clever-wozniak-j7ic52`, merged the same day; Claude Code)

- **John:** a fresh journey showed the quote of the day for a moment while the data loaded; show something
  else. Cause: the loading screen drew "Asking National Rail for the trains…" and the quote under it.
- **Built (mock-up, behind `?load=A|B`, B when left out):** A, the line alone; B, the line and pale outlines
  of the verdict and the two panels, pulsing gently (still where motion is turned down) (`.skel` in
  `global.css`). The quote still shows when National Rail can't be reached. Pictures and `shoot.mjs` in
  `design/previews/loading/` (the answer held back): 390px dark and 1200px light, no quote, no errors, no
  sideways scroll. Checks, `tsc -b`, lint, build.
- **John:** B ("That's all sorted then, please merge to Main!"). The `?load=` switch removed. Merged with
  everything else on the branch: the Share under the location guide and Exits, Exits folded, "across the
  line", Putney. Checks, `tsc -b`, lint and build clean first.

### November 25th 2026: Share under the location guide and Exits; live (branch `claude/clever-wozniak-j7ic52`, merged the same day; Claude Code)

- **John:** a Share under the departures' directions (a tapped platform) and under Exits' answer, on a line
  below the box, reproducing the box; the words to think about.
- **Built (mock-up, drafts):** `src/components/BoxShare.tsx` (the button and the picture: `answerImage()` in
  `share.ts`, now with a `kicker`); `DirLines` in `JourneyView.tsx` (the board gets `at`: the station, the
  journey, the time); `Exits.tsx` under the answer. Drafts: "Share/Copy these directions", picture
  "TRAINCHECKER · PLATFORM GUIDE" / "Getting to platform 11A at Reading", sent with "Here’s how to find
  platform 11A at Reading, from Trainchecker."; "Share/Copy the way out", "TRAINCHECKER · EXITS" / "Arriving
  at Reading on the 1.04pm from Twyford", "Here’s the way out at Reading from the 1.04pm Twyford train, from
  Trainchecker." The guide's paragraphs run together in the picture.
- **Checked** (`design/previews/box-share/shoot.mjs`): the guide on the saved Reading to Paddington board
  (6.24pm, November 17th), Exits on live arrivals from Twyford (departure side made up, illustration only);
  1200px light and 390px dark with touch; both pictures read back from the clipboard; buttons 44px on a
  phone; no errors, no sideways scroll. `tsc -b`, lint, build, checks. Not checked: a phone's share sheet.
- **John:** "Share these directions" under Exits too; the picture keeps the paragraphs apart as on the screen
  (`answerImage()` takes `paras`, half a line between them); the rest of the wording agreed. And Exits' trains
  folded away: the station's sentence stays, then "Check directions from your train" with the arrow
  (`details.exits-fold`, as Arrivals and Connections). Checked: the fold starts closed (summary 44px on a
  phone), the answer still lands under the tapped train or row (columns measured once opened), both pictures
  copied and read back (the guide's in two paragraphs), 1200px light and 390px dark; no errors, no sideways
  scroll; checks, `tsc -b`, lint, build.

### November 25th 2026: Putney's one entrance; entrances named after their own platform; live (branch `claude/clever-wozniak-j7ic52`, merged the same day; Claude Code)

- **John (Putney, platform 2):** "Platform 2 is right by the Disraeli Road entrance. From the entrance nearest
  platform 2, the way in leads to platform 2." reads as if Disraeli Road were nearer, and says platform 2
  twice; look for others across the network. And Putney itself: one entrance, on Putney High Street, onto
  the footbridge, down to platforms 1 to 4 (2 and 3 an island); Disraeli Road is a map error.
- **Found:** 63 platform-guide answers at about 57 stations, and 50 Exits answers, name an entrance or exit
  after the very platform they're about; 62 of the 63 reach it by crossing the line (footbridge or subway).
  First tried "the other entrance" by count: `check-exits` failed it (dropped before as vague; Aberdare's "From
  the entrance…" and Ebbw Vale's "From the other entrance" with no first one).
- **Built (drafts):** `toPlatform.ts` (`named()`) and `exits.ts` (`target(…, asked)`): "the entrance/exit
  across the line" where the way crosses it, else "the other", "another" or "the" by how many the answer
  names. Putney: its own reading, `line` and `say` in `exits-overrides.json` (one exit, Putney High Street,
  up from every platform); `to-platform.json` gains `say` (John's words for a platform's guide, new in
  `Fix`) with Putney's four. `exits.json` rebuilt (only Putney changes). Left, for John: six answers with two
  entrances of one street name told apart by platform (East Croydon, Haddenham, Haywards Heath ×2,
  Whitechapel, Waterloo).
- **Review list for John:** `design/platform-directions/putney-and-across-the-line.md` (numbered, before and
  after, every changed answer). **Checked:** all checks (check-exits 83: no entrance named after its own
  platform, the six pairs listed, Aberdare, Ashford, Putney; undoing the rule made two fail), `tsc -b`, lint,
  build. Not checked in a browser.
- **John:** "across the line" is right. "Island platform" was background, not for the wording: taken out of
  Putney's platforms 2 and 3 (they now read as 1 and 4); the `say` option stays for the future. Checks:
  check-exits 84 (new: Putney 3's guide has no "island platform"). **John:** Putney's sentences are fine
  (agreed, November 25th 2026).

### November 25th 2026: the arrival board for Arrivals, Exits and Connections; live (branch `claude/clever-wozniak-j7ic52`, merged the same day; Claude Code)

- **John:** use the Live Arrival Board for all three ("the more reliable method"); key in Vercel as
  `RDM_ARR_KEY` (Secret, Production and Preview; John believes it's in).
- **Limits** (tested): as the departure board, 25 rows a request, two hours back to two hours ahead; an
  unknown station is HTTP 400. Fields: `sta`, `eta`, `platform` for B; A's time in `previousCallingPoints`.
- **Built:** `api/live.ts` also asks B's arrival board for trains from A (`ARR_WINDOWS` -60, 0 and 60 for an
  hour each; `trimArr()`), sent as `arrivals` (null without the key or if it fails, and then the page is as
  before). `analyse.ts` keeps them apart as `a.arr` (its `platform` is B's). `arrivals()` and
  `arrivalsPicture()` use them: each row has its platform at B (or "not yet"; "All from platform" when
  shared), a third heading "PLATFORM", and no long-journey note (the board sees every train due). `Board`
  and the Share picture draw the third heading. `api/connect.ts`'s platform lookup (Exits, Connections) asks
  the arrival board when `RDM_ARR_KEY` is set, from an hour before the expected time (it goes by timetabled
  times). Exits offers trains that end at B again when `a.arr` is there. About reworded (draft): "…and the
  arrivals, with the platforms trains come into, from its live arrival boards…". Exits' error says "live
  arrivals".
- **Checked:** `npm run check` 264 + 57 + 79 + 40 + 76 + 36 + 391 + 16 (new `scripts/check-arrivals.ts`, on
  boards saved at 11.55am and 12.01pm; breaking the platform rule and the note rule made two fail); `tsc -b`,
  the two functions type-checked, lint, build. Browser at 1200px light and 390px dark with touch, with live
  arrival boards and the departure side made up from them (illustration only; this session holds only the
  arrival key): Twyford to Reading and Reading to Paddington, platforms on every row, no errors, no sideways
  scroll; Exits from Twyford offered the 12.03pm (ending at Reading) and the real lookup answered platform
  14; the Share picture read back from the clipboard, fonts loaded (`design/previews/arrival-board/`).
- **Not checked:** the whole page with both live boards together (needs the departure key here, or the
  preview), Connections in the browser, a real phone.
- **John (the preview, a phone):** works with Twyford to Reading; but with many trains, Exits' answer
  appeared below the whole list, out of sight. Now it's drawn straight under the train you tapped
  (`.exit-reply` inside the list in `Exits.tsx`; the "Asking National Rail…" and error lines too); on a
  computer, where the trains sit in columns (counted from the grid), under the end of that row, full width.
  Checked (`design/previews/arrival-board/exits-under.mjs`, live arrivals, Reading to Paddington): 390px
  dark, third train tapped, answer 9px under it with five trains below; 1200px light, three columns, second
  train tapped, answer under that row; the last train tapped, answer at the end; no errors, no sideways
  scroll. `tsc -b`, lint, build.
- **John:** Connections the same way. Its answer (with the "Asking…" and error lines, the other trains
  to ask about and Share) now goes under the train you tapped, or under that row on a computer. The
  column count is shared: `src/lib/useGridCols.ts` (`useGridCols()`, `rowEnd()`); the class is now
  `.tap-reply` for both. Checked (`connect-under.mjs`; ILLUSTRATION ONLY: Twyford to Reading for Oxford,
  the onward trains made up from Oxford's live arrival board, as this session can't ask the departure
  board): 390px dark and light, 1200px light (three columns): answer 9px under the tapped train or row,
  the rest of the list below it; Exits re-run unchanged; all checks pass, `tsc -b`, lint, build; no
  errors, no sideways scroll.
- **John:** "Please merge." Checks (eight scripts, all passing), `tsc -b`, lint and build clean first;
  fast-forwarded into `main` with this note. Not checked: the live site with both boards together, a real
  phone.

### November 25th 2026: the Live Arrival Board works (notes only, straight to `main`; Claude Code)

- **John** subscribed to the Live Arrival Board and saved its key here (secure form; the first paste was
  refused as "Invalid ApiKey", the second works). Address:
  `https://api1.raildata.org.uk/1010-live-arrival-board-arr/LDBWS/api/20220120/GetArrBoardWithDetails/{crs}`.
  The plain `GetArrivalBoard` isn't routed on it (HTTP 500); the "with details" call is (200).
- **Tested at 11.55am:** Reading from Twyford (`filterCrs=TWY&filterType=from`): the Elizabeth Line trains
  ending at Reading arrive at platform 14, the Didcot trains at 13B. Paddington from Reading: every train with
  its platform, those ending at Paddington included (9, 12, 2, 4, 11, 5, 10, 1, 8; Elizabeth Line A). Saved in
  `design/mockups/snapshots/20261125-1155-arrivals/`.
- **Licence** (John's PDF): free, global, may be passed on freely, credit "National Rail"; in
  `design/licences-2026-11-17.md`.
- **Key saved here now:** Live Arrival Board (it replaced the departure board's; the departure board refuses
  it). Vercel needs it too as a new Secret variable, for Production and Preview, before anything uses it.
- **Next, for John:** what to build with it (Arrivals, Exits and Connections for trains ending at B).
  Nothing built yet. Tracker: Ideas for later 6.

### November 25th 2026: an arrivals board for platforms at the destination, to look into (notes only, straight to `main`; Claude Code)

- **John asked:** is there definitely no way to get an arrivals board with platforms? Not with the current
  key: on the Live Departure Board product, `GetArrivalBoard`, `GetArrDepBoardWithDetails` and
  `GetServiceDetails` all answer HTTP 500 "Unable to route the message to a Target Endpoint" (the
  product routes departure calls only); `GetDepartureBoard` works.
- **Probably available separately:** a web search summary of the openraildata wiki's list of Rail Data
  Marketplace products names a "Live Arrival Board" and "Live Arrival and Departure Boards" (Rail
  Delivery Group, open); the wiki page itself refused automated reading, so not seen. National Rail's
  older arrivals board gave each train's platform at that station, including trains that end there.
- **Next (John, later today):** find it on the Marketplace, subscribe, read its licence (watch for "UK
  only"), save its key through the secure form; then test on Twyford to Reading and on trains ending
  at Paddington. Would let Arrivals, Exits and Connections give the platform for trains that end at B.
  Weaker routes: the Service Details product with a train id rebuilt for B (untested guess); Darwin
  Push Port (needs an always-running server). Tracker: Ideas for later 6.

### November 24th 2026: Share for the two panels, counts of trains running; live (branch `claude/ecstatic-dijkstra-w0herd`, merged the same day; Claude Code)

- **John:** the Share buttons back, certainly on "The next hour"; for the later panel, find a way if one works; mock-ups
  and sentences first. Built (drafts): `firstShare()` and `laterShare(a, 'A'|'B'|'C')` in `windows.ts`; `PicShare` in
  `JourneyView.tsx`, "Copy/Share these trains" at the foot of each panel's "trains and platforms" fold; `listImage()`
  draws "not yet" (`PicRow.noPlat`). The later picture three ways behind `?share=A|B|C` (A when left out): A every later
  train (Reading to Paddington: 34 rows, a very long picture); B the panel's sentence and only the trains not on time,
  each with its reason; C hour by hour. Pictures in `design/previews/next-hour/share/` (`share-pics.mjs` reads them back
  from the clipboard). Checks unchanged; `tsc -b`, lint, build; fonts loaded, no errors.
- **John:** C, but "FROM" isn't obvious, the line has room for another layout, and no "with platforms" that far ahead.
  Now `hoursImage()` in `share.ts` (`ListPicture.layout: 'hours'`): no header; each row "7.24 to 8.24pm" on the left,
  "seven trains" on the right, and under them in orange "three cancelled, one late"; an hour with none, "no trains".
  Checks unchanged; `tsc -b`, lint, build; Manchester, Reading to Paddington, Kings Cross to York (stretched) and
  Euston to Milton Keynes read back from the clipboard, fonts loaded, no errors.
- **John:** (b): when the first panel is stretched, the later picture lists the few later trains (as A) instead of
  hours; and the orange line didn't say whether its trains were among the count on the right: now "three of them
  cancelled, one late" ("cancelled" or "running late" for a single train). Checks unchanged; `tsc -b`, lint, build;
  pictures read back as before.
- **John:** counts and rates of trains running, cancelled ones "more" (Manchester: "about seven per hour" counted
  cancelled trains; five are running per hour): first panel "There are five trains in the next hour. Three more are
  cancelled…"; second "There are five trains per hour. Seven more in that time are cancelled…" (`Span.more` in
  `nextFour()`; the rate from the running trains); the stretched heading counts running trains again; hour by hour
  "four trains" / "one of these is late, three more are cancelled"; "…, hour by hour, from…" (commas); and the first
  panel's platforms line back above its fold ("Platforms have been announced for all of these: platform 1.", the
  second keeps "already"; "mostly" now needs three or more trains and a real majority: Reading to Midgham's two read
  "mostly platform 12A"). `check-windows` 391 (new: "more" on every saved board, the words, the rows; setting three to
  two made 22 fail). Checks, `tsc -b`, lint, build; Manchester at 1200px light and 390px dark, its picture read back:
  no errors, no sideways scroll.
- **John:** "Let's do it." Hour by hour made the picture (the `?share=` switch and options A and B taken out;
  `laterShare(a)`); `SPEC.md` §12.30. Checks 264 + 57 + 79 + 40 + 76 + 36 + 391, `tsc -b`, lint, build; the page
  without the switch at 1200px light, 390px dark and 844×390 with touch, the pictures read back: no errors, no
  sideways scroll. Merged into `main` (fast-forward). Not checked: a real phone's share sheet, the live site in a browser.

### November 24th 2026: "The next hour" first, then the rest; live (branch `claude/ecstatic-dijkstra-w0herd`, merged the same day; Claude Code)

- **John:** show the information in the order people need it. Swap "The next four hours" and "Platforms"; the first panel
  named for its period, the second covering only what comes after it. His answers: the next hour, stretched to the next
  three trains when the hour has fewer (1b), no train in both panels; headings "The next hour" and "The following three
  hours", or "The next three trains" (Claude's draft) and "Later" when stretched (2); cancelled trains not on the board,
  said in the fold (3); the board folded (4); later trains' platforms shown if a nice way is found (5); side by side (6).
- **Built behind `?mock=A` / `?mock=B`** (the live page unchanged without it): `src/lib/windows.ts` (`split()`, `only()`,
  `firstPanel()`, `laterPanel()`); `nextFour()` and `trainsAnHour()` take the panel's own span; `FirstPanel` and
  `LaterPanel` in `JourneyView.tsx`; "not yet" for a train with no platform (`.bnoplat`). A: a line about the later
  trains' platforms; B: that line and a fold with them. Pictures and `shoot.mjs` in `design/previews/next-hour/`.
- **Checked:** `npm run check` unchanged (264 + 57 + 79 + 40 + 76 + 36), `tsc -b`, build; 13 saved boards' sentences
  read through; pictures at 1200px light and 390px dark with touch: no errors, no sideways scroll.
- **John:** 1 (three trains) and 2 ("The next three trains") yes; 3 the board uncapped is fine (it's folded); 4 A or B
  to decide after looking on his phone; 5 the second panel's opening shortened, as its heading says the period ("There
  are about five trains an hour."); 6 "not yet" kept; 7 never totals and "an hour" mixed. Done: `trainsAnHour(…, short)`,
  used only by the second panel; when any group has fewer than one train an hour there, every group is a total
  ("There's one fast train and nine slower ones.", Euston to Milton Keynes at 8.59pm). Survey of the saved boards, moved
  back by up to two hours: the only mixed openings were that one and "… and three on the Elizabeth Line in that time"
  (agreed November 18th, still on the live four-hour panel). Checks unchanged; `tsc -b`.
- **John:** each panel's sentences as one paragraph (done); "not yet" kept; **B** for the later trains, and they
  should be shown as the first panel shows its trains: every later train with its platform or "not yet" (done:
  `trainsPicture()` for both panels, the cancelled line under it; the old "Two earlier trains…" line gone). Found and
  fixed: with no platform on any row, "PLATFORM" sat over "EXPECTED TO LEAVE". Checks unchanged; `tsc -b`, lint, build;
  Paddington to Reading at 390px dark and Euston to Milton Keynes at 390px light: no errors, no sideways scroll.
- **John:** both folds stay in the second panel ("Show the trains that aren't on time" is the bad news, "Show the
  trains and platforms" is everything). He'll try it at length (`?mock=B` on the branch preview) before anything goes
  live. Not merged; to do when he says: make B the page (take out `?mock=`, option A and the old four-hour panel),
  checks for `windows.ts`, `SPEC.md`.
- **John:** "There's about one fast train and five slow ones per hour." (St Pancras to Bedford read "about one fast
  train an hour and about five slower ones an hour"). Done in the second panel's short wording: the rate once at the end
  ("per hour", John's word), "about" once at the start when any figure is rounded; "slower" kept (agreed November 18th).
  Checks unchanged; `tsc -b`.
- **John:** "slower" right; "per hour" deliberate, for this panel only. The stretched first panel's opening sentence
  ("There are only two trains in the next hour, so here are the next three.") dropped: the heading says it. Found on live
  trains (Peterborough to Kings Cross): three running and one cancelled under "The next three trains" read "One is
  cancelled … and two … The other one …", four trains; the heading now counts the cancelled one too ("The next four
  trains"). Checks unchanged; `tsc -b`, lint.
- **John:** "really excellent … merge it to Main"; he may later ask what the page did before. Made B the page: the
  `?mock=` switch, option A, the old "The next four hours" and "Platforms" panels and `PlatformTrains` taken out of
  `JourneyView.tsx` (the page before: `main` at `6d64697`, the last commit before this merge; their
  sentence functions, `nextFour()`, `platforms()`, `platformTrains()`, `platformsPicture()`, stay in `sentences.ts`
  with their checks). New `scripts/check-windows.ts` (385: every saved board, moved back by up to two hours: each train
  in one panel, three running first, the headings, no "an hour" or "in that time" in the second panel, the agreed
  wording; setting three to two made 20 fail). `SPEC.md` §12.29. Checks 264 + 57 + 79 + 40 + 76 + 36 + 385, `tsc -b`,
  lint, build; six saved boards at 1200px light and 390px dark, two at 844×390, all with touch on phones
  (`design/previews/next-hour/live-*`): no errors, no sideways scroll. **Not carried over** from the old Platforms
  panel, for John: its summary sentence ("Most fast trains are currently going from platforms 10 and 11…") and its
  Share button for the list as a picture. Not checked: a real phone, the live site in a browser.

### November 24th 2026: "How do I get to my platform?", tapping a platform for a rough location guide; live (branch `claude/cool-sagan-k0e2ao`, merged the same day; Claude Code)

- **John:** can tapping a platform in Platforms give directions to it, from the data we have? Yes, mostly: the exits
  table read the other way round (`src/lib/toPlatform.ts`, drafts), a line for each entrance (John). Trial on 12
  stations he knows, and mock-ups A (tap a badge on the board) and B ("How do I get to my platform?" under the board),
  behind `?mock=A|B`: `design/platform-directions/` (README with the points for John and every sentence).
- **Checked:** `tsc -b`, lint, build; both at 1200px and 390px with touch, light and dark: no errors, no sideways scroll.
- **John:** A is better; "Tap a platform for directions."; Reading's wording. Wired in as general rules in
  `toPlatform.ts` (README "What John's Reading notes changed": "or from", the missing "by platform" filled in from the
  rest of the station, entrances added with "then walk to platform 4" from `platform-links.json`, "come down on
  platform 15A"); one exception file, `src/data/to-platform.json` (Reading 4 to 7: the south entrance only).
  Checks pass; `tsc -b`, lint, build; Reading 15A at 390px light and 1200px dark: no errors, no sideways scroll.
- **John:** "Tap a platform for a rough location guide."; Reading's entrances corrected (a whole corrected reading in
  `exits-overrides.json`, new `reading` and `exit_only`; `build_exits_table.py` rebuilt, only Reading changes, so its
  Exits sentences change too: `check-exits` updated, awaiting John); Paddington A and B "go down", Twyford and Bath Spa
  named (`to-platform.json`); the walk rule only at stations read from their maps. Everything about Reading, numbered,
  with eight questions: `design/platform-directions/reading.md`. Checks pass; `tsc -b`, lint.
- **John answered all eight:** his sentence for the station and platforms 1 to 3 (Exits, `line` and `say` in
  `exits-overrides.json`); Apex Plaza for 4 to 6 (draft); platform 3 round a corner from 7 and "over the bridge" in
  Connections (new `links-overrides.json` and `apply_links_overrides.py`; `platformLinks.ts` takes the station's word);
  "go down to platform 7"; Twyford "the entrance on the town side"; Bath Spa's Railway Place on platform 2 a map error.
  These change the live Exits and Connections at Reading once merged. Checks 264 + 57 + 79 + 40 + 59 + 36; `tsc -b`,
  lint, build.
- **John:** no more changes; "please merge to Main". Option A made permanent (the `?mock=` switch and option B taken
  out; the tables load only for a board with platforms). The numbered Reading list stays in
  `design/platform-directions/reading.md` for referring to by number (`reading-list.ts` remakes it). Checks
  264 + 57 + 79 + 40 + 59 + 36, `tsc -b`, lint and build clean; Reading to Paddington at 390px dark and 1200px light,
  Bath to Bristol at 390px light: no errors, no sideways scroll, badges 44px on a phone. Merged into `main`
  (fast-forward). Not checked: a real phone, the live site in a browser.
- Branches tidied: "Delete merged branches" trial run 45388926667, then the real run; `git ls-remote --heads origin`
  shows only `main` (it also removed `claude/eloquent-brown-y333xz`, merged on November 23rd). Tracker updated.
- **John (iPhone, Guildford to Reading):** with one platform, "Tap “8” for a rough platform location guide." Done in
  `JourneyView.tsx`; checks, `tsc -b`, lint, build; Bath to Bristol (one platform) at 390px and 1200px, Reading to
  Paddington (several) at 390px: the right line, no errors, no sideways scroll. Straight to `main` at John's word.
- **John (Guildford):** Walnut Tree Close is "the main town centre exit/entrance", Guildford Park Road "the Guildford
  Park Road exit/entrance at the back" (`names` in `exits-overrides.json`; the station's sentence is Claude's draft,
  `line`); and Exits didn't mention Guildford Park Road from platforms 3 to 8. Now a subway or footbridge answer also
  names the other exit the other way ("…the subway to the main town centre exit, or the footbridge to the Guildford
  Park Road exit at the back."), as the level answers already did: 48 answers at 34 stations. Checks, `tsc -b`,
  lint, build. Straight to `main` at John's word.
- **Why Guildford's sentence was wrong (John asked):** `stationLine()` needs a platform for every exit; one exit by no
  platform (Guildford Park Road, off the footbridge) sent it to a catch-all that ignored the exit by platforms 1 and 2.
  The same at 162 stations ("the exits aren't on the platforms themselves", Falconwood's and West Hampstead
  Thameslink's "every platform reaches…", Edinburgh's "up above"). **John:** the safe version now ("option 2"), the
  fuller rule perhaps later. Now: "At Newbury, there are exits by platforms 1 and 2.", "…there's an exit by platform
  3.", "…two exits by platform 3."; King's Cross and Aberdeen keep "and others off the concourse". 175 sentences
  change (the 162, those two, and internal codes). New checks, including a sweep that fails if any station with an
  exit by a platform says a catch-all (it finds all 162 on the old code). Checks, `tsc -b`, lint, build. Straight to
  `main` at John's word. Not done: naming the other exits in that sentence (each platform's own line names them).
- **John asked what else the sweep found about entrances:** (1) same-named exits named twice (72 direction answers
  at 43 stations, 68 in Exits); (2) entrances left out of a platform's directions (1,096 answers at 552 stations);
  (3) six exits never mentioned (New Street, London Bridge, Liverpool Street ×2, Nottingham, St Pancras); (4) "the
  other entrance" (28 answers at 20 stations). **John:** do 1 and merge; samples of 2 first; 3 from the station maps;
  4 by Claude. **Done (1):** `merge_twins()` in `build_exits_table.py` (same name by the same platform: one exit drawn
  twice; 73 merged at 70 stations, none of those with corrections); `twinTag()`/`hasTwin()` in `exits.ts` (the
  platform added only where both are named in the same answer: "for Moss Lane by platform 2"; "the other Ferry Road
  entrance" where one is by no platform; Berkhamsted's two building entrances by platform); `toPlatform()` joins two
  ways to one entrance in one sentence (Carlisle). New checks, with a sweep for any answer naming one twice. Checks
  264 + 57 + 79 + 40 + 72 + 36, `tsc -b`, lint, build; the Reading list unchanged. Straight to `main`.
- **(2), samples for John:** `toPlatform(…, fill)` adds the left-out entrances on the level with another platform,
  with the walk between the two from the platform links ("From the Rigg Approach entrance by platform 2, go over the
  footbridge to platform 1."; "…there's no way through the station: go out and round by the road…"; "…platform 4 is
  just across the platform."); off (`fill` false) until John agrees; never at his corrected stations. 11 numbered
  samples in `design/platform-directions/fill-samples.md` (`fill-samples.ts`): about 840 answers would change.
- **(3):** the map readings' notes (`maps-read-*.json`) had routes the strict reading lost: New Street's Navigation
  Street (footbridge, every platform) and Liverpool Street's Old Broad Street, Sun Street and Bishopsgate (West)
  (concourse, every platform), now `add_routes` in `exits-overrides.json` (new). London Bridge Street, Nottingham's
  step-free Station Street and St Pancras's Eurostar taxi drop-off have no route in the readings: the maps needed again.
  Names with brackets now join ("the Broadgate, … Bishopsgate (East) … entrance").
- **(4):** `from_osm()` records `nw`, an unnamed exit-by-no-platform's nearest platform on foot (90 stations); "the
  entrance nearest platform 3" / "the exit nearest platform 3" instead of "the other entrance". Found: 42 answers at
  39 stations send people over a bridge or through a subway to an entrance by or nearest their own platform (29 were
  already there; Aberdare, Ashford International): probably an entrance across a road, for John. Checks 264 + 57 + 79
  + 40 + 76 + 36, `tsc -b`, lint, build; the Reading list unchanged. Straight to `main`.
- **(3) continued:** National Rail's maps for the three fetched again (assets and images.nationalrail.co.uk now
  answer) and read: Nottingham's step-free Station Street is at the main building's north-west corner, reached as
  Carrington Street; St Pancras's Eurostar taxi drop-off is off the lower-level arcade, as Midland Road (south)
  (`same_as`, new, in `exits-overrides.json`). London Bridge Street: the map shows it on the upper concourse,
  reached from the lower concourse ("To Upper Concourse"), but not how the upper concourse meets the platforms;
  left out, for John.

### November 24th 2026: the Share words, verdict first; live (`main`; Claude Code)

- **John:** reword the Share message at the top: "Good news, when the trains from Reading to Guildford were
  checked at 6.39am on November 24th they were running well."; "It's a mixed bag for trains from A to B,
  according to a check at …"; "Be prepared for the train journey from A to B. At … a check showed …".
  Full examples agreed (date kept; "of the next 30 trains"; the no-train messages unchanged). `shareWords()`
  in `sentences.ts`; `SPEC.md` §12.28. Straight to `main` at John's word.
- **Checked:** `npm run check` 264 + 57 + 79 + 40 + 59 + 36 (each verdict word for word on the saved boards,
  and be prepared from late arrivals only; the old comparison with the mock-ups' Share words removed);
  `tsc -b`, lint, build. Not checked in a browser (text only).

### November 23rd 2026: "Your train passes near…": batch 58, every stretch in England done (notes, straight to `main`; Claude Code, scheduled task)

- The last 15 stretches, all in the North East (the Northumberland Line from Ashington to Northumberland Park, Bedlington
  to Morpeth and Pegswood, the East Coast Main Line from Pegswood to Berwick-upon-Tweed and Reston, and the two lines
  through Gateshead to Heworth); 15 items, none skipped. **All 2,376 stretches in England are now done** (2,349 items, 27
  skipped); COVERAGE.md and the passes-near README say so.
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning; no point is our own
  calculation. For John: Bedlington to Morpeth and to Pegswood, and Chester-le-Street and Dunston to Heworth (through
  Gateshead without calling at Newcastle) may carry no regular passenger trains, given items; Berwick Castle names a
  station's town; the Hartley Colliery disaster and the burning at St Mary's, Gateshead, in 1080 passed over.
- `check-facts`: Acklington to Alnmouth, the "no fact yet" journey, now has a fact and no uncovered journey remains, so
  the check now says it has one. `to_site.py` run: 2,349 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 57 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Chester-le-Street to Newcastle through to Morpeth to Pegswood (the main line into Newcastle and north to
  Morpeth, Manors to Northumberland Park, Heworth to Sunderland, the Durham Coast line to Billingham, round Stockton, Thornaby
  and Middlesbrough, the Tees Valley line to Bishop Auckland, Darlington to Durham and Chester-le-Street, the coast to Saltburn
  and the Esk Valley line to Great Ayton); 2,361 of 2,376 done, North East 53 of 68. Next: BEJ-MPT (Bedlington to Morpeth).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; deaths and
  rail crashes passed over (Emily Davison's grave too); no point is our own calculation. For John: Marske Hall (Longbeck to
  Marske) and the story of Nunthorpe's name (Gypsy Lane to Nunthorpe) name a station's place. `check-facts`' "no fact yet"
  journey, Acklington to Alnmouth, still has none, so unchanged. `to_site.py` run: 2,334 facts live with this push; checks and
  build pass.

### November 23rd 2026: "Your train passes near…": batch 56, the North West finished (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Langwathby to Lazonby & Kirkoswald through to Chester-le-Street to Dunston (the last 27 of the North West: the
  Settle to Carlisle line from Lazonby to Ribblehead, Wetheral to Haltwhistle, the Windermere branch, the Liverpool loop and
  Northern line stations, Carnforth to Lancaster, the lines round Salford and Deansgate, Manchester Airport to Styal, Piccadilly to
  Mauldeth Road and Levenshulme; then the North East: the Tyne Valley from Haltwhistle to Newcastle, and Chester-le-Street to
  Dunston); 38 items and two stretches skipped (Bache to Shotton and to Wrexham General, through Chester, where every train calls and
  Merseyrail's trains end); 2,321 of 2,376 done, North West 396 of 396 (finished), North East 13 of 68. Next: CLS-NCL
  (Chester-le-Street to Newcastle).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Deaths passed over (Ribblehead
  Viaduct's builders, the drowning at the Irwell bridge); no point is our own calculation (Smardale Viaduct and St Margaret's Tower
  are Historic England's list points). The Angel of the North kept for Chester-le-Street to Newcastle. For John: Kendal Castle,
  Liverpool Town Hall and Salford Cathedral and Lads' Club name a station's town; Chester-le-Street to Dunston (the Team Valley line
  to the Dunston side of King Edward VII Bridge) may carry no regular passenger trains, given an item. `check-facts`' "no fact
  yet" journey, Acklington to Alnmouth, still has none, so unchanged. `to_site.py` run: 2,294 facts live with this push; checks and
  build pass.

### November 23rd 2026: "Your train passes near…": batch 55 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Blackburn to Mill Hill (Lancs) through to Armathwaite to Lazonby & Kirkoswald (round Blackburn, the East Lancashire
  line by Accrington and Burnley to Colne, Burnley to Todmorden, the Ribble Valley line to Hellifield, Carnforth to Wennington and
  Oxenholme, the West Coast Main Line to Penrith and Carlisle and on towards Lockerbie and Gretna Green, the Cumbrian Coast from
  Carlisle to Whitehaven, Carlisle to Wetheral, and the Settle to Carlisle line to Lazonby); 2,281 of 2,376 done, North West 369 of
  396. Next: LGW-LZB (Langwathby to Lazonby & Kirkoswald).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; rail crashes and a
  colliery passed over; no point is our own calculation (four are Historic England's list points). For John: Clitheroe Castle,
  Whalley Abbey, Hapton Castle, River Brun and St Michael's Church, Workington name a station's town. `to_site.py` run: 2,256
  facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 54 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Hyde Central to Hyde North through to Blackburn to Darwen (the Hyde loop, Reddish Vale, Marple, Rose Hill and
  Strines, the Glossop line to Broadbottom, Stalybridge through Standedge Tunnel to Marsden, Hazel Grove and Disley to Middlewood
  and New Mills Newtown, Hindley by Atherton and Walkden to Salford Crescent, Clifton to Bolton, Bolton to Lostock, and the Ribble
  Valley line to Blackburn); 2,241 of 2,376 done, North West 329 of 396. Next: BBN-MLH (Blackburn to Mill Hill (Lancs)).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; pit disasters, the
  Burnden Park disaster and an execution passed over; no point is our own calculation (Lyme Park left out for that reason). For
  John: Hall i' th' Wood is the item for Bromley Cross to Hall-i'-th'-Wood, the station's namesake. `to_site.py` run: 2,216 facts
  live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 53 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Cheadle Hulme to Handforth through to Guide Bridge to Hyde North (Stockport and its lines, the Mid-Cheshire line
  from Stockport by Altrincham and Knutsford to Greenbank, Chinley to Hazel Grove, the Buxton line, Levenshulme and Ardwick, the
  Reddish line, Guide Bridge to Gorton and Ashburys, the lines round Miles Platting, the Calder Valley line by Rochdale and Summit
  Tunnel to Walsden, and Ashton to Stalybridge and Hyde North); 2,201 of 2,376 done, North West 289 of 396. Next: HYC-HYT (Hyde
  Central to Hyde North).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Chinley to Navigation Road
  skipped (the freight-only Midland line by Cheadle Heath); for John, three curves round Miles Platting given items though they
  may carry no regular passenger trains. Deaths and disasters passed over; no point is our own calculation. `to_site.py` run:
  2,176 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 52 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Helsby to Ince & Elton (Cheshire) through to Bramhall to Cheadle Hulme (Chester to Helsby and Mouldsworth, the
  Mid-Cheshire line, Frodsham and Runcorn, Acton Bridge and Hartford, round Warrington, Earlestown and Newton-le-Willows, the
  Liverpool and Manchester line by Rainhill to Huyton, Patricroft and Eccles, the lines to Wigan North Western, Crewe to Winsford,
  Whitchurch and Kidsgrove, and the Macclesfield line to Cheadle Hulme); 2,161 of 2,376 done, North West 249 of 396. Next:
  CHU-HTH (Cheadle Hulme to Handforth).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; battles, Huskisson's
  death and rail crashes passed over; no point is our own calculation. For John: Adlington Hall is 744 m from the line (its park
  110 m). `to_site.py` run: 2,137 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 51 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Crewe to Sandbach through to Ince & Elton to Stanlow & Thornton (Crewe to Chester, out of Chester towards
  Shotton and Wrexham, the Wirral Line by Hooton and Birkenhead under the Mersey to James Street, the West Kirby, New
  Brighton and Borderlands lines, and the Ellesmere Port line); 2,121 of 2,376 done, North West 209 of 396. Next: HSB-INE
  (Helsby to Ince & Elton (Cheshire)).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; the items on
  the stretches into Wales are in England; battles, a bombing and a shooting passed over; no point is our own calculation.
  `to_site.py` run: 2,097 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 50 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Liverpool South Parkway to Runcorn through to Holmes Chapel to Sandbach (over the Mersey to Runcorn, the
  Cheshire Lines route by Widnes, Warrington, Irlam and Urmston to Deansgate, round central Manchester, Ardwick and
  Ashburys, the Styal line to Manchester Airport and Wilmslow, and Alderley Edge to Sandbach); 2,081 of 2,376 done, North
  West 169 of 396. Next: CRE-SDB (Crewe to Sandbach).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; bombings
  and air crashes passed over; no point is our own calculation. `check-facts.ts`'s "no fact yet" journey moved from
  Manchester to the Airport (now has facts) to Acklington to Alnmouth. `to_site.py` run: 2,057 facts live with this push;
  checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 49 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Leyland to Preston (Lancs) through to Brunswick to Liverpool Central (round Preston, Leyland and Bamber
  Bridge, Chorley to Westhoughton, Hindley and Ince to Wigan, the Liverpool to Wigan line by St Helens and Huyton, Edge
  Hill to Lime Street and Mossley Hill, the Northern Line round Sandhills and Bootle, and Liverpool South Parkway to
  Liverpool Central); 38 items and two stretches skipped (Broad Green and Edge Hill to Kirkdale, the freight-only Bootle
  branch); 2,041 of 2,376 done, North West 129 of 396. Next: LPY-RUN (Liverpool South Parkway to Runcorn).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Deaths passed over; no
  point is our own calculation. `to_site.py` run: 2,017 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 48 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Maghull to Maghull North through to Euxton Balshaw Lane to Leyland (the Ormskirk line to Kirkdale, the
  Southport line by Bootle, Crosby and Formby to Southport, Southport to Wigan Wallgate by Parbold, the Kirkby line by
  Upholland and Rainford, Kirkby to Walton, and Wigan North Western to Leyland); 2,001 of 2,376 done, North West 89 of 396.
  Next: LEY-PRE (Leyland to Preston (Lancs)).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; deaths
  passed over; no point is our own calculation. For John: Crosby Beach is 738 m from the line. `to_site.py` run: 1,979
  facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 47 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Millom to Silecroft through to Maghull North to Town Green (the Cumbrian Coast to Barrow, the Furness line
  to Carnforth, Morecambe and Heysham, Lancaster to Preston, the Fylde lines to Blackpool North and Blackpool South, Preston
  to Burscough Junction and Ormskirk to Maghull North); 1,961 of 2,376 done, North West 49 of 396. Next: MAG-MNS (Maghull
  to Maghull North).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; fatal
  accidents passed over; no point is our own calculation. `to_site.py` run: 1,939 facts live with this push; checks and
  build pass.

### November 23rd 2026: "Your train passes near…": batch 46, Yorkshire and The Humber finished (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Battersby to Kildale through to Bootle (Cumbria) to Silecroft (the Esk Valley line to Whitby, Brigg to Kirton
  Lindsey, the Barton line, the Copy Pit line, round Wakefield and Rotherham, the long stretches through York and Northallerton,
  then the Cumbrian Coast from Corkickle to Silecroft); 36 items and four stretches skipped (through Leeds to Woodlesford);
  1,921 of 2,376 done, Yorkshire and The Humber 238 of 238 (finished), North West 9 of 396. Next: MLM-SIC (Millom to Silecroft).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. No point is our own
  calculation; THORP's geotag looks like a general Sellafield point (for John). `to_site.py` run: 1,899 facts live with this
  push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 45 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Eastrington to Gilberdyke through to Battersby to Great Ayton (Howden and Wressle, Selby to York, Malton to
  York and Seamer, the Yorkshire coast from Scarborough to Bridlington, the Hull to Scarborough line by Driffield and
  Beverley, round Hull and along the Humber, Thorne South to Scunthorpe, Barnetby to Cleethorpes by Grimsby, Bradford Forster
  Square to Frizinghall, Battersby to Great Ayton); 1,881 of 2,376 done, Yorkshire and The Humber 207 of 238. Next: BTT-KLD
  (Battersby to Kildale).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; Cottingham to
  Hessle (a curve avoiding Hull Paragon) given an item; rail crashes and the Bradford fire passed over; no point is our own
  calculation. `to_site.py` run: 1,863 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 44 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Conisbrough to Mexborough through to Gilberdyke to Saltmarshe (round Rotherham, Meadowhall and Sheffield,
  Elsecar and Barnsley, Totley Tunnel, Kiveton to Shireoaks, the Dearne Valley to Moorthorpe, Doncaster's lines to Retford,
  Gainsborough, York, Selby and Kirk Sandall, round Hatfield, Thorne and Goole, Snaith to Knottingley); 39 items and one
  stretch skipped (Doncaster to Sherburn-in-Elmet, over the Hambleton south curve); 1,841 of 2,376 done, Yorkshire and The
  Humber 167 of 238. Next: EGN-GBD (Eastrington to Gilberdyke).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Disasters and a rail crash
  passed over; no point is our own calculation. `to_site.py` run: 1,823 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 43 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, East Garforth to Garforth through to Conisbrough to Doncaster (Garforth and Cross Gates to Leeds, Leeds to
  Woodlesford and Outwood, round Wakefield, Pontefract and Castleford, by Burton Salmon to Sherburn-in-Elmet and Selby, the
  Wakefield line to Doncaster, Selby and Micklefield to South Milford); 36 items and four stretches skipped (Doncaster over
  the Hambleton Junction south-to-west curve: freight and occasional diversions only); 1,801 of 2,376 done, Yorkshire and
  The Humber 127 of 238. Next: CNS-MEX (Conisbrough to Mexborough).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Neighbours' sights shared
  out, mining disasters, the Barnbow explosion and other deaths passed over; no point is our own calculation.
  `to_site.py` run: 1,784 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 42 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Berry Brow to Honley through to East Garforth to Micklefield (the Penistone line to Barnsley, Darton and
  Wakefield Kirkgate; round Mirfield and Dewsbury; Batley and Morley to Leeds; the Harrogate line from Leeds to York; the
  East Coast Main Line from York to Darlington and Northallerton to Yarm; Ulleskelf, Church Fenton and Micklefield);
  1,761 of 2,376 done, Yorkshire and The Humber 87 of 238. Next: EGF-GRF (East Garforth to Garforth).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; disasters,
  rail crashes and construction deaths passed over; no point is our own calculation. `to_site.py` run: 1,748 facts live
  with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 41 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Hellifield to Long Preston through to Berry Brow to Lockwood (the Airedale line from Hellifield to Shipley,
  Shipley to Leeds, the Wharfedale line to Ilkley, round Bradford, Halifax and Brighouse, the Calder Valley line to Walsden,
  and Huddersfield to Slaithwaite and Berry Brow); 1,721 of 2,376 done, Yorkshire and The Humber 47 of 238. Next: BBW-HOY
  (Berry Brow to Honley).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; disasters and
  fires passed over; no point is our own calculation. `to_site.py` run: 1,708 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 40, the West Midlands finished (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Blake Street to Shenstone through to Horton-in-Ribblesdale to Ribblehead (the last 33 of the West
  Midlands: the Cross-City line to Gravelly Hill, round Burton, Tamworth and Nuneaton, Banbury to Leamington, the
  Stourbridge Town branch, Wem and Whitchurch, Droitwich to Worcester, round Smethwick and Pineapple Road; then the
  Bentham line and the Settle to Carlisle line to Ribblehead); 38 items and two stretches skipped (over the Abbey Foregate
  loop at Shrewsbury); 1,681 of 2,376 done, West Midlands 191 of 191 (finished), Yorkshire and The Humber 7 of 238. Next:
  HLD-LPR (Hellifield to Long Preston).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Neighbours' sights shared
  out, three rail crashes passed over; no point is our own calculation (the Hoffmann kiln's and Polesworth Abbey's
  distances are to Historic England's points). `to_site.py` run: 1,668 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 39 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Henley-in-Arden to Wootton Wawen through to Lichfield City to Shenstone (Stratford-upon-Avon and its
  branch, the Chiltern line from Hatton to Tyseley, Warwick and Leamington, Coventry, the West Coast Main Line to
  Stechford, Coventry to Rugby and Nuneaton, round Water Orton and Tamworth, the Trent Valley line to Rugeley Trent
  Valley, Lichfield); 1,641 of 2,376 done, West Midlands 158 of 191. Next: BKT-SEN (Blake Street to Shenstone).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; rail
  crashes passed over; Nuneaton Priory's distance is to Historic England's point (474 m), not the area's edge.
  `to_site.py` run: 1,630 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 38 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Smethwick Galton Bridge to Smethwick Rolfe Street through to Danzey to Henley-in-Arden (round Smethwick,
  central Birmingham's lines from New Street, Moor Street and Snow Hill, the Chase line to Walsall, Aston, the Camp Hill
  line and the North Warwickshire line to Henley-in-Arden); 1,601 of 2,376 done, West Midlands 118 of 191. Next: HNL-WWW
  (Henley-in-Arden to Wootton Wawen).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; four
  possible avoiding lines given items; the Stechford rail crash passed over; no point is our own calculation.
  `to_site.py` run: 1,590 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 37 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Hednesford to Rugeley Town through to Birmingham New Street to Smethwick Rolfe Street (the Chase line to
  Walsall, Willenhall and Darlaston, Penkridge to Wolverhampton and Willenhall, the Stour Valley line to Galton Bridge,
  the Stourbridge line to Kidderminster and Droitwich, the Lickey Incline, Redditch and the Cross-City line); 1,561 of
  2,376 done, West Midlands 78 of 191. Next: SGB-SMR (Smethwick Galton Bridge to Smethwick Rolfe Street).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; no point is
  our own calculation. For John: Stambermill Viaduct's point (its article's) is 286 m from the track it carries.
  `to_site.py` run: 1,550 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 36, the East Midlands finished (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Dronfield to Grindleford through to Rugeley Trent Valley to Rugeley Town (the last two of the East
  Midlands, then the West Midlands: round Shrewsbury, the Welsh Marches line to Abergavenny, the Heart of Wales line to
  Knucklas, Wellington to Wolverhampton, Stafford, Stoke-on-Trent, Uttoxeter and Rugeley); 1,521 of 2,376 done, East
  Midlands 140 of 140 (finished), West Midlands 38 of 191. Next: HNF-RGT (Hednesford to Rugeley Town).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; three
  possible avoiding lines given items; rail crashes passed over; no point is our own calculation (Wolverhampton railway
  works' geotag is rounded). For John: Chirk Viaduct (Chirk to Gobowen) is half in Wales. `to_site.py` run: 1,510 facts
  live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 35 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Boston to Hubberts Bridge through to Leicester to Market Harborough (Boston and the Skegness line, the
  joint line from Peterborough by Spalding to Lincoln, round Lincoln to Market Rasen and Brigg, Grantham to Peterborough,
  the Derwent Valley line, Chesterfield to Dore, Syston to Stamford, Corby and Kettering, Banbury to Kings Sutton, the
  West Coast Main Line from Rugby and the Northampton loop, Glossop to Hadfield); 37 items and three stretches skipped
  (to Market Harborough over the Leicester to Burton freight line); 1,481 of 2,376 done, East Midlands 138 of 140. Next:
  DRO-GRN (Dronfield to Grindleford).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Neighbours' sights
  shared out, three rail crashes passed over; no point is our own calculation (COVERAGE.md says which come from
  Historic England). `to_site.py` run: 1,470 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 34 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Creswell to Whitwell (Derbyshire) through to Hubberts Bridge to Swineshead (Worksop and Retford, the
  East Coast Main Line from Grantham to Retford, the Gainsborough lines, round Lincoln, the Nottingham to Lincoln line,
  the Nottingham to Grantham line and the Poacher line to Hubberts Bridge); 39 items and one stretch skipped (Newark
  Castle to Retford, across the Newark flat crossing, a way no passenger train goes); 1,441 of 2,376 done, East
  Midlands 98 of 140. Next: BSN-HBB (Boston to Hubberts Bridge).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Neighbours' sights
  shared out, the Grantham and Newark rail crashes and a shipwreck passed over; no point is our own calculation
  (COVERAGE.md says which come from Historic England). `to_site.py` run: 1,433 facts live with this push; checks and
  build pass.

### November 23rd 2026: "Your train passes near…": batch 33 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Narborough to South Wigston through to Creswell to Langwith-Whaley Thorns (Leicester to Loughborough,
  round Trent Junction, the Erewash Valley line to Chesterfield, round Derby, into Nottingham, and the Robin Hood line to
  Creswell); 1,401 of 2,376 done, East Midlands 58 of 140. Next: CWD-WWL (Creswell to Whitwell (Derbyshire)).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. None skipped; Beeston
  to Ilkeston, Beeston to Bulwell and Market Harborough to South Wigston may carry few regular passenger trains (given
  items); the Barrow upon Soar crash and the 2012 Derby arson attack passed over; no point is our own calculation.
  `to_site.py` run: 1,394 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 32, the East of England finished (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, East Tilbury to Stanford-le-Hope through to Burton-on-Trent to South Wigston (the London, Tilbury and
  Southend line to Shoeburyness, Watford, Colchester Town, Ipswich to Mistley, then the Hope Valley, Glossop and Buxton
  lines in Derbyshire); 33 items and seven stretches skipped (four through Norwich, a terminus; three on the Leicester
  to Burton freight line); 1,361 of 2,376 done, East of England 237 of 237 (finished), East Midlands 18 of 140. Next:
  NBR-SWS (Narborough to South Wigston).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, the Watford rail crash and the Padley martyrs passed over; no point is our own calculation
  (COVERAGE.md says which come from Historic England). `to_site.py` run: 1,354 facts live with this push; checks and
  build pass.

### November 23rd 2026: "Your train passes near…": batch 31 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Brandon to Lakenheath through to East Tilbury to Tilbury Town (the Breckland line to Shippea Hill,
  Diss to Norwich, the Bittern line to Sheringham, the Wherry line to Great Yarmouth and Reedham, Lowestoft, the East
  Coast Main Line from Stevenage to Hadley Wood, the Hertford loop to Crews Hill, the Watford DC line, Ebbsfleet to
  Rainham, and the Tilbury lines); 1,321 of 2,376 done, East of England 215 of 237. Next: ETL-SFO (East Tilbury to
  Stanford-le-Hope).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, the rail crashes near Welwyn, Hatfield and Potters Bar passed over; two points (Tilbury Fort's
  scheduled area, Grim's Ditch's nearest section) are our own calculation from Historic England's outlines
  (COVERAGE.md says which). `to_site.py` run: 1,321 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 30 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Great Bentley to Weeley through to Brandon to Thetford (the Sunshine Coast and Mayflower lines, round
  Ipswich and the Felixstowe branch, the East Suffolk line to Oulton Broad, the Wherry line to Norwich, and the
  Breckland line to Thetford and Brandon); 1,281 of 2,376 done, East of England 175 of 237. Next: BND-LAK (Brandon to
  Lakenheath).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, a fatal crash and other deaths passed over; two points (Thorpe Hall's gardens, Cockfield Hall's
  park) are our own calculation from Historic England's outlines (COVERAGE.md says which). `to_site.py` run: 1,281
  facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 29 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Needham Market to Westerfield through to Alresford (Essex) to Great Bentley (round Ipswich, the Great
  Eastern Main Line from Ipswich to Harold Wood, the Southend Victoria line, the Crouch Valley line, the Braintree branch,
  the Gainsborough line to Sudbury, and Colchester by Hythe to Great Bentley); 1,241 of 2,376 done, East of England 135
  of 237. Next: GRB-WEE (Great Bentley to Weeley).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Fatal crashes passed
  over; no point is our own calculation (COVERAGE.md says which come from Historic England). `to_site.py` run: 1,241
  facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 28 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Bishops Stortford to Stansted Mountfitchet through to Needham Market to Stowmarket (the West Anglia
  line to Cheshunt and Waltham Cross, the Hertford East branch, the Stansted Airport branch, Cambridge to Waterbeach,
  Ely and Newmarket, round Ely, March and Whittlesea, the Fen line to Kings Lynn, Soham to Bury St Edmunds, and on to
  Stowmarket, Diss and Needham Market); 1,201 of 2,376 done, East of England 95 of 237. Next: NMT-WFI (Needham Market
  to Westerfield).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, the Soham and Stowmarket explosions passed over; Devil's Dyke's point is our own calculation
  (COVERAGE.md says which). `to_site.py` run: 1,201 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 27 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Lidlington to Ridgmont through to Elsenham (Essex) to Stansted Mountfitchet (the Marston Vale line to
  Woburn Sands, the West Coast Main Line from Tring to Watford Junction, the Abbey line, Chorleywood to Rickmansworth,
  round Peterborough, the East Coast Main Line to Stevenage, the Cambridge line to Cambridge, and the West Anglia line
  to Stansted Mountfitchet); 1,161 of 2,376 done, East of England 55 of 237. Next: BIS-SST (Bishops Stortford to
  Stansted Mountfitchet).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Crashes and a murder
  passed over; four points come from Historic England's list entries, none is our own calculation (COVERAGE.md says
  which). `to_site.py` run: 1,161 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 26, London finished (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Brixton to Herne Hill through to Lidlington to Millbrook (Bedfordshire) (the last of London, round
  Brixton, London Bridge, Croydon, Dalston, Hackney Wick, Lewisham, Grove Park, Barking and Barnehurst, then the Midland
  Main Line from Elstree to Bedford and Wellingborough and the Marston Vale line to Millbrook); 1,121 of 2,376 done,
  London 421 of 421 (finished), East of England 15 of 237. Next: LID-RID (Lidlington to Ridgmont).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, crashes, riots and attacks passed over; four points are calculated from Historic England's mapped
  outlines (COVERAGE.md says which). `to_site.py` run: 1,121 facts live with this push; checks and build pass.

### November 23rd 2026: "Between X and Y, your train…" in Fact of the Journey (branch `claude/eloquent-brown-y333xz`, merged the same day; Claude Code)

- **John:** start the fact with the stretch's two stations, so a long journey's facts say where they are.
  `withPlace()` and `placeName()` in `src/lib/passesNear.ts`: "Between Southall and Hayes & Harlington, your train
  passes…", in the order the train meets them, only before "Your train" (station facts, "While your train…" and the
  boundaries' own "Between…" left alone); not when the stretch is the whole journey, nor when the fact is about one of
  the two stations' own places ("your train passes Newington", 32 facts); brackets and the three unbracketed county
  names dropped ("Bramley", "Seaford"). COVERAGE.md step 5 tells batches not to name the two stations themselves.
- **Checked:** `npm run check` 273 + 57 + 79 + 40 + 59 + 35 (new: both directions, the boundary, a station fact, the
  whole journey, the own place, names); `tsc -b`, lint, build; Tiverton Parkway to Paddington and Bath to Bristol at
  1200px and 390px, light and dark (`design/previews/fact/between.mjs`): no errors, no sideways scroll.
- **John:** "Yes please" to merging. Checks, `tsc -b`, lint and build clean first; merged into `main` with this note.

### November 23rd 2026: "Your train passes near…": batch 25 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Elstree & Borehamwood to Mill Hill Broadway through to Brixton to Denmark Hill (the Thameslink core
  from St Pancras to Elephant & Castle and Loughborough Junction, the lines round Battersea, Vauxhall, Clapham and
  Victoria, Waterloo to Charing Cross and Waterloo East, Teddington, Wembley Central, Finsbury Park to St Pancras and
  King's Cross, Purley and Streatham Hill); 1,081 of 2,376 done, London 396 of 421. Next: BRX-HNH (Brixton to Herne
  Hill).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, crashes, attacks and fires passed over; no point is our own calculation (COVERAGE.md says which
  are a district's or a cemetery's middle). `to_site.py` run: 1,081 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 24 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Ilford to Manor Park through to Hendon to Mill Hill Broadway (the Great Eastern Main Line to Harold Wood,
  Romford to Upminster, Barking to Upminster, Dagenham Dock, Rainham and Purfleet, the Gospel Oak to Barking line, the
  Chingford line, round Camden Road, the Watford DC line to Kensal Green, and the Midland Main Line to Mill Hill
  Broadway); 1,041 of 2,376 done, London 356 of 421. Next: ELS-MIL (Elstree & Borehamwood to Mill Hill Broadway).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, crashes, attacks and a murder passed over; no point is our own calculation (COVERAGE.md says
  which come from Historic England). `to_site.py` run: 1,041 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 23 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Bickley to Petts Wood through to Forest Gate to Manor Park (the Bickley and Chislehurst loops, Grove
  Park to Bromley North, Orpington to Knockholt, the Bexleyheath line, Abbey Wood to Dartford, the Sidcup line,
  Fenchurch Street to Limehouse, West Ham and Stratford, Barking to Woodgrange Park, and Stratford to Manor Park);
  1,001 of 2,376 done, London 316 of 421. Next: IFD-MNP (Ilford to Manor Park).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, killings, crashes and attacks passed over; no point is our own calculation. `to_site.py` run:
  1,001 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 22 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Brockley to New Cross Gate through to Bickley to St Mary Cray (out of London Bridge and Cannon Street,
  the South London line, the East London line through the Thames Tunnel to Shadwell, Greenwich to Charlton, the Hayes
  line, Beckenham Junction to Bromley South and St Mary Cray, and the Catford Loop to Nunhead); 961 of 2,376 done,
  London 276 of 421. Next: BKL-PET (Bickley to Petts Wood).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, fatal crashes, murders and attacks passed over; no point is our own calculation (COVERAGE.md
  says which come from Wikipedia's geotags). `to_site.py` run: 961 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 21 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Balham to Mitcham Eastfields through to Brockley to Honor Oak Park (Mitcham and Hackbridge, Streatham,
  Herne Hill, Tulse Hill and the Dulwich and Norwood stations, round Crystal Palace, Penge and Beckenham, Norwood
  Junction to Croydon, Purley, Coulsdon and Kenley, the Oxted line to Upper Warlingham, and Anerley to Honor Oak Park);
  921 of 2,376 done, London 236 of 421. Next: BCY-NXG (Brockley to New Cross Gate).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, crashes, a stabbing and the Croydon poisonings passed over; no point is our own calculation
  (COVERAGE.md says which come from Historic England). `to_site.py` run: 921 facts live with this push; checks and
  build pass.

### November 23rd 2026: "Your train passes near…": batch 20 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Bruce Grove to White Hart Lane through to Balham to Tooting (the Enfield Town and Cheshunt lines, the
  Lea Valley line to Waltham Cross, the Elizabeth line round Whitechapel, Canary Wharf and Woolwich, the North Kent line
  to Charlton and Lewisham, Nunhead, Peckham Rye and the Dulwich stations, Streatham, Tooting and Wimbledon); 881 of
  2,376 done, London 196 of 421. Next: BAL-MTC (Balham to Mitcham Eastfields).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, killings, crashes and attacks passed over; no point is our own calculation (COVERAGE.md says
  which come from Historic England). `to_site.py` run: 881 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 19 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Bowes Park to Palmers Green through to Bruce Grove to Seven Sisters (the Hertford loop to Crews Hill,
  the Northern City line to Moorgate, the Elizabeth line from Paddington to Whitechapel, the East London line to
  Dalston, the North London line to Stratford, Bethnal Green and Hackney, and Rectory Road to Seven Sisters); 841 of
  2,376 done, London 156 of 421. Next: BCV-WHL (Bruce Grove to White Hart Lane).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, attacks, sieges and a murder passed over; no point is our own calculation (COVERAGE.md says which
  come from Historic England). `to_site.py` run: 841 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 18 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Clapham Junction to Wandsworth Common through to Alexandra Palace to Bowes Park (the West London line
  over the Thames to Willesden Junction, the West Coast Main Line and Watford DC line to Hatch End, round Acton and
  Gunnersbury, the North London line to Kentish Town West, the Gospel Oak to Barking line to Harringay Green Lanes,
  and Hornsey to New Barnet and Bowes Park); 801 of 2,376 done, London 116 of 421. Next: BOP-PAL (Bowes Park to
  Palmers Green).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, fatal events passed over; every point is the article's own (COVERAGE.md says which).
  `to_site.py` run: 801 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 17 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches of south and south-west London, Isleworth to Syon Lane through to Balham to Wandsworth Common (Putney
  and Wandsworth, Clapham Junction to Wimbledon and Surbiton, the Kingston loop, the Chessington branch, the Sutton
  loop and lines round Sutton, Wallington and West Croydon, Selhurst to Balham); 761 of 2,376 done, London 76 of 421.
  Next: CLJ-WSW (Clapham Junction to Wandsworth Common).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, fatal crashes and a murder passed over; no point is our own calculation (COVERAGE.md says which
  come from Historic England). `to_site.py` run: 761 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 16, the South East finished (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Ashurst (Kent) to Eridge through to Brentford to Syon Lane (the Uckfield branch, Littlehampton, Sandwich
  to Thanet Parkway, then London: the Chiltern lines into Marylebone, Harrow to Rickmansworth, Heathrow, the Hounslow
  Loop, Twickenham, Richmond and Barnes); 721 of 2,376 done, South East 384 of 384 (finished), London 36 of 421. Next:
  ISL-SYL (Isleworth to Syon Lane).
- Every fact checked with `wiki_text.py` (now finds titles with "&"); `check.py` clean but for the Parson and Clerk
  warning. Items already used next door replaced, fatal crashes passed over; Bushy Park's point is our own calculation
  (COVERAGE.md says which). `to_site.py` run: 721 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 15 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Bletchley to Milton Keynes Central through to Ashurst (Kent) to Cowden (Kent) (the West Coast Main Line
  from Wolverton to Tring, the Marston Vale line to Woburn Sands, the Island Line, the Shepperton branch, the Tattenham
  Corner and Epsom Downs branches, the Quarry line, the Caterham branch, the Oxted line to East Grinstead and Ashurst);
  681 of 2,376 done, South East 376 of 384. Next: AHS-ERI (Ashurst (Kent) to Eridge).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, fatal events passed over; eight points are our own calculation (COVERAGE.md says which).
  `to_site.py` run: 681 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 14 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Dover Priory to Martin Mill through to Bicester North to Kings Sutton (the Seaford branch, the Windsor
  branch, Oxford to Kings Sutton and Bicester, the Chiltern Main Line to Denham, the Aylesbury line to Chorleywood,
  Bicester to Bletchley); 641 of 2,376 done, South East 336 of 384. Next: BLY-MKC (Bletchley to Milton Keynes Central).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, fatal crashes passed over; six points are our own calculation (COVERAGE.md says which).
  `to_site.py` run: 641 facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 13 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Adisham to Bekesbourne through to Martin Mill to Walmer (Canterbury East to Faversham, the Chatham
  Main Line to Rochester and Strood, Rochester to Longfield, the Sheerness line, the Kent coast to Ramsgate, Minster
  to Canterbury West and Wye, Minster to Walmer); 601 of 2,376 done, South East 296 of 384. Next: DVP-MTM (Dover
  Priory to Martin Mill).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Fatal events passed
  over; three points are our own calculation (COVERAGE.md says which). `to_site.py` run: 601 facts live with this
  push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 12 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Beltring to Paddock Wood through to Adisham to Aylesham (Paddock Wood to Pluckley and Tonbridge,
  Ashford by Charing and Maidstone East to Otford, the Marshlink line to Hastings and West St Leonards, Ashford to
  Wye, Folkestone and Dover, and Dover to Adisham); 561 of 2,376 done, South East 256 of 384. Next: ADM-BKS
  (Adisham to Bekesbourne).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already
  used next door replaced, fatal crashes and a murder passed over (COVERAGE.md says which). `to_site.py` run: 561
  facts live with this push; checks and build pass.

### November 23rd 2026: "Your train passes near…": batch 11 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Leigh to Penshurst through to Beltring to Yalding (Redhill to Tonbridge, Sevenoaks, the Maidstone
  line to Longfield, High Speed 1 from Ashford, Gravesend to Strood, the Medway Valley line to Beltring); 521 of
  2,376 done, South East 216 of 384. Next: BEG-PDW (Beltring to Paddock Wood).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already
  used next door replaced; three points are our own calculation (COVERAGE.md says which). `to_site.py` run: 521
  facts live with this push; checks and build pass.

### November 22nd 2026: "Your train passes near…": batch 10 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Surbiton to Thames Ditton through to Leigh to Tonbridge (the Hampton Court branch, Epsom, Gatwick to
  Three Bridges, round Lewes, the East Coastway to West St Leonards, the Hastings line from Crowhurst to Tonbridge);
  481 of 2,376 done, South East 176 of 384. Next: LIH-PHR (Leigh to Penshurst).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already used
  next door replaced, the Epsom riot passed over (COVERAGE.md says which). `to_site.py` run: 481 facts live with
  this push; checks and build pass.

### November 22nd 2026: "Your train passes near…": batch 09 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Brighton to Hove through to Walton-on-Thames to Weybridge (Brighton to Three Bridges, the Arun
  Valley line to Arundel, Horsham to Leatherhead, the New Guildford Line, Esher to Weybridge); 441 of 2,376 done,
  South East 136 of 384. Next: SUR-THD (Surbiton to Thames Ditton).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already
  used next door replaced (COVERAGE.md says which). `to_site.py` run: 441 facts live with this push; checks and
  build pass.

### November 22nd 2026: "Your train passes near…": batch 08 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Guildford to Worplesdon through to Hove to Preston Park (the Portsmouth Direct line to
  Havant, then the West Coastway to Hove); 401 of 2,376 done, South East 96 of 384. Next: BTN-HOV
  (Brighton to Hove).
- Every fact checked against its article with `wiki_text.py`; `check.py` clean but for the Parson and
  Clerk warning. Arundel Castle dropped (1.4 km from the line); items used next door replaced (COVERAGE.md
  says which); no fatal accidents.
- `to_site.py` run: 401 facts in `src/data/passes-near.json`, live with this push; checks and build pass.

### November 22nd 2026: "Your train passes near…": batch 07 (notes, straight to `main`; Claude Code, scheduled task)

- 40 stretches, Shawford to Winchester through to Woking to Worplesdon (Eastleigh, Romsey and Fareham, Basingstoke
  to Woking, the Alton line, Aldershot to Bracknell, Ascot to Weybridge); 361 of 2,376 done, South East 56 of 384.
  Next: GLD-WPL (Guildford to Worplesdon).
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning. Items already
  used next door replaced, fatal events passed over (COVERAGE.md says which). `to_site.py` run: 361 facts live
  with this push; checks and build pass.

### November 22nd 2026: Fact of the Journey moved to the bottom; live (`main`; Claude Code)

- **John:** move it to the very bottom, just above "About these figures", and merge straight to `main`.
  `JourneyView.tsx`: the FactCard now comes after Exits (it was straight under the quote); nothing else changed.
- **Checked:** `npm run check` 273 + 57 + 79 + 40 + 59 + 24; `tsc -b`, lint, build; Reading to Paddington's
  saved board at 1200px light and 390px dark with touch (`design/previews/fact/order.mjs`): the fact last,
  above About; no errors, no sideways scroll.

### November 22nd 2026: "Your train passes near…": batch 06, the South West finished (notes, straight to `main`; Claude Code)

- 40 stretches, Axminster to Honiton through to Micheldever to Winchester; 321 of 2,376 done, South West
  30 of 30 (with the Great Western routes, both parts done). Next: SHW-WIN (Shawford to Winchester), the
  South East.
- Every fact checked with `wiki_text.py`; `check.py` clean but for the Parson and Clerk warning.
  `candidates.py` fixed for an empty Historic England shape. `to_site.py` run: 321 facts live with this push.

### November 22nd 2026: "Your train passes near…": batch 05, the Great Western routes finished (notes, straight to `main`; Claude Code)

- 40 stretches, Digby & Sowton to Polsloe Bridge through to Feniton to Honiton (the Exmouth branch,
  Southampton to Portsmouth, the Greenford branch, the remaining avoiding lines, then the first South West
  stretches); 281 of 2,376 done, Great Western routes 271 of 271. Next: AXM-HON (Axminster to Honiton).
- Every fact checked against its article with `wiki_text.py`; `check.py` clean but for the Parson and
  Clerk warning. Items already used next door replaced (COVERAGE.md says which); no fatal accidents.
- `to_site.py` run: 281 facts in `src/data/passes-near.json`, live with this push; checks and build pass.

### November 22nd 2026: "Your train passes near…": batch size recorded (notes, straight to `main`; Claude Code)

- **John** agreed: 40 stretches a batch, and a session may do two or three in a row, committing after
  each. Written into `design/passes-near/COVERAGE.md` ("Batch size"), with the reason.

### November 22nd 2026: "Your train passes near…": batch 04 (notes, straight to `main`; Claude Code)

- 40 stretches, Ashchurch for Tewkesbury to Cheltenham Spa through to Polsloe Bridge to St James Park
  (Cheltenham and Gloucester, Westbury to Salisbury and Romsey, the North Downs Line from Reading to
  Redhill, the Marlow and Windsor branches, Exeter); 241 of 2,376 done. Next: DIG-POL (Digby & Sowton
  to Polsloe Bridge).
- Every fact checked against its article with `wiki_text.py`; `check.py` clean but for the Parson and
  Clerk warning. Fatal accidents passed over as items (COVERAGE.md says which).
- `to_site.py` run (the new step 8, from the Fact of the Journey session, merged first): 241 facts in
  `src/data/passes-near.json`, so this push makes batch 04 live; `npm run check` and `npm run build` pass.

### November 22nd 2026: "Your train passes near…": batch 03 (notes, straight to `main`; Claude Code)

- 40 stretches, Nailsea & Backwell to Yatton through to Ashchurch for Tewkesbury to Worcestershire Parkway
  (Weston-super-Mare, the Severn Tunnel, Bristol Parkway to Gloucester and Cheltenham, the Golden Valley line,
  the Cotswold Line to Hereford); 201 of 2,376 done (Great Western routes 196 of 271). Next: ASC-CNM
  (Ashchurch for Tewkesbury to Cheltenham Spa).
- Every fact checked against its article with `wiki_text.py`; `check.py` clean but for the Parson and Clerk
  warning. Cheltenham Spa to Stonehouse (the curve round Gloucester) probably has no regular passenger
  train; given an item, not skipped (COVERAGE.md says why).

### November 22nd 2026: "Your train passes near…": the Wikipedia files committed (notes, straight to `main`; Claude Code)

- **John:** save the download work. `design/passes-near/wiki/`: the article locations (3.3 MB), a
  cut-down index of the articles dump for those articles (2 MB) and their redirects (1.7 MB), from the
  20261101 run, with a README (licence CC BY-SA 4.0; how to remake). `candidates.py` and `wiki_text.py`
  use them by default (`--wiki-api` and `--dumps` for the old ways), so a batch needs no download.

### November 22nd 2026: "Your train passes near…": batch 02 (notes, straight to `main`; Claude Code)

- 40 stretches, Chapelton to Umberleigh through to Nailsea & Backwell to Parson Street (Exeter, Taunton,
  the Heart of Wessex Line, Bath to Westbury, Bristol Parkway to Swindon, the Severn Beach line); 161 of
  2,376 done (Great Western routes 156 of 271). Next: NLS-YAT (Nailsea & Backwell to Yatton).
- Article pages refused (429) after eight reads, so `wiki_text.py` (new) reads articles from the
  multistream articles dump by byte range (index downloaded, 290 MB, md5 checked); every fact checked
  against it. `check.py` clean but for the Parson and Clerk warning.

### November 22nd 2026: "Fact of the journey", built and merged the same day (branch `claude/fact-of-the-journey`; Claude Code)

- **John:** the design for "Your train passes near…": a box just under the quote of the day, laid out
  identically, called FACT OF THE JOURNEY, without the quotation marks or attribution, in a different
  colour; the same Share button (a picture); the left-and-right note and the credits in About.
- **Built:** `design/passes-near/to_site.py` makes `src/data/passes-near.json` (every stretch and the
  121 items; loaded only with a journey, 28 KB compressed) with `passes-near-LICENCE.md`;
  `src/lib/passesNear.ts` (the journey's stretches from A, the stops of the train with the most stops
  and B, the shortest way between each pair; the side swapped for b to a; curly apostrophes; one at
  random); `FactCard` in `Tail.tsx`, after the quote in `JourneyView.tsx`, only with a train on the
  boards and a fact on the journey; `factImage()` in `share.ts`; `factShareText()` (draft); About's
  paragraph (draft). Three colours behind `?fact=a|b|c` (sage, sky, stone), to come out once chosen.
- **Checked:** `npm run check` 273 + 57 + 79 + 40 + 59 + 24 (new `scripts/check-facts.ts`, on the saved
  Reading–Paddington both ways, Paddington–Plymouth, Bath–Bristol and Manchester–Airport boards);
  `tsc -b`, lint, build; the three colours at 1200px and 390px with touch, light and dark
  (`design/previews/fact/`): no errors, no sideways scroll, Share 44px. Not checked: the Share
  picture read back, a real phone.
- **John:** sky blue (option B); not shown once the last train has gone ("The last direct train …
  seems to have gone"), so only with a train in the next four hours; the share words agreed; About
  reads "The Fact of the Journey is …" and "Left and right are as the train is going. Facing
  backwards? Look the other way." Done; the `?fact=` switch removed. Checked: checks as above, `tsc
  -b`, lint, build; 1200px and 390px light and dark; Kings Cross to Edinburgh at 8.59pm (last train
  gone) shows no fact; the Share picture read back from the clipboard (`design/previews/fact/
  share-picture.png`), all fonts loaded, no errors.
- **John:** "Yes please" to merging. `main`'s batches 02 and 03 merged in first, so 201 facts go live;
  `to_site.py` added to COVERAGE.md's batch steps (step 8) at John's request, so every batch puts its
  facts on the page; README and "Read these first" say so. Checks, `tsc -b`, lint and build clean first.

### November 22nd 2026: "Your train passes near…": Wikipedia from its dumps; batch 01 looked at again (notes, straight to `main`; Claude Code)

- **John:** fix the Wikipedia search problem before the next batch. `dumps.wikimedia.org` added to the
  Default environment (approved). `wiki_dump.py` (new) makes one file of 105,329 articles with
  coordinates in Great Britain from the 20261101 dumps (checksums checked; kept outside git);
  `candidates.py --wiki-dump` takes nearby articles from it, same ranking, distances and sides, first
  sentences from `/wiki/Title?action=raw` (also refused (429) after a few hundred quick requests: it waits).
  Batch 01 again in four minutes, 223 Wikipedia candidates (`batches/01/rerun/`).
- Three items replaced, facts checked against their articles: FMT-PNM (National Maritime Museum
  Cornwall), COP-MRD (Down St Mary church), PMA-UMB (Brightley Barton). The other five stations and
  Roche's holy well kept (nothing better that could be checked). Batch 01 had eight station items, not
  nine. `check.py` clean but for the known Parson and Clerk warning. COVERAGE.md's steps rewritten.

### November 22nd 2026: "Your train passes near…": batch 01 (notes, straight to `main`; Claude Code)

- **John:** "Read design/passes-near/COVERAGE.md and do the next batch." 40 stretches in Cornwall and
  Devon (the Great Western branches), one item each, every fact checked against a Wikipedia article;
  `check.py` clean but for the known Parson and Clerk warning; 121 of 2,376 done (Great Western routes
  116 of 271). Next: CPN-UMB (Chapelton to Umberleigh).
- `candidates.py`: `PN_PATIENT=1` waits as long as Wikipedia asks (it allows about one search every 40
  seconds from here). `.gitignore` now leaves out each batch's `cache/`. Historic England's own pages
  refuse automated reading (Cloudflare), so facts come from Wikipedia; COVERAGE.md says so.

### November 22nd 2026: "Your train passes near…": every stretch in England, set up (notes and scripts, straight to `main`; Claude Code)

- **John:** run the set-up prompt in `design/passes-near/README.md`.
- **Reach:** `services-eu1.arcgis.com`, `en.wikipedia.org` and `historicengland.org.uk` added to John's
  Default environment (approved). Historic England's list answers in full. Wikipedia answered the first
  few hundred requests, then refused nearly all ("too many requests"); its rules ask for a contact in the
  user agent, and none of John's was used. `candidates.py` carries on without it and can be run again.
- **Network:** `build_stretches.py` on the UK extract of November 21st 2026 (download.openstreetmap.fr,
  checksum checked) and ONS's country and region boundaries: 2,600 of 2,616 stations found by code, 3,024
  stretches in the UK, **2,376 with any of them in England** (16 into Wales or Scotland). Per region: South
  East 472, London 428, North West 396, Yorkshire and The Humber 238, East of England 237, West Midlands 203,
  South West 194, East Midlands 140, North East 68. In John's order, Great Western routes 271 (taken from
  the regions), then South West 30, South East 384, London 421, East of England 237, East Midlands 140, West
  Midlands 191, Yorkshire 238, North West 396, North East 68. A station's own track is the track beside its
  platforms; the search never turns more than 50 degrees, so never reverses.
- **For John:** 127 stretches in England run past a third station both ends connect to (`past`): some are
  avoiding lines no passenger train uses (round York, Didcot, Norwich), others real (Reading to Tilehurst
  past Reading West). The map can't tell them apart, so all are kept, last in the order, to be looked at
  in their batch and put under `skipped` with a reason if unused. 166 have no train company on the map
  (often a gap in OpenStreetMap; some freight lines). Found on the way and fixed: the first rule dropped
  them, and real lines with them; joining the two directions' tracks made zigzags at stations (Didcot).
- **Items:** `passes-near.json` now holds the network and the items keyed by stretch (`to_network.py`); the
  81 items unchanged; 80 fit. **The site of Elm Park (Reading West to Mortimer) doesn't:** Reading Green Park
  station (2023) is between them. Left under `unplaced` for John; `check.py` fails until it's placed.
- **Scripts:** `candidates.py` (Historic England's Grade I and II*, scheduled monuments, parks and gardens,
  battlefields, World Heritage Sites, and Wikipedia, within 1 km, with side and distance, ranked), `check.py`
  (all 79 sides recomputed from the points agree; Parson and Clerk's point is in the tunnel: a warning),
  `coverage.py`, `pn.py`. `COVERAGE.md` with "How to do the next batch". README's page prompt rewritten
  for the network (John hadn't run it). Nothing on the page.
- **Checked:** the build twice from the cached read; `check.py` (one error, Elm Park); `candidates.py` on
  three stretches. Not checked: the stretches against the railway itself beyond the Great Western lines'
  items, and the long ones in the report.
- **John:** Elm Park is on Reading West to Reading Green Park (done: all 81 items on the network, `check.py`
  clean but for the Parson and Clerk warning); Wikipedia may be given the site's address as the contact
  (done, in `candidates.py`; still refused here an hour later, so a later session may need to run it again).

### November 22nd 2026: Paddington's Elizabeth Line platforms; up or down; live (branch `claude/dreamy-dijkstra-swkirc`, merged the same day; Claude Code)

- **John:** platforms A and B read "The way out is up or down from the platform, to Eastbourne Terrace
  (Elizabeth line)."; now his words, "The way out is up from the Elizabeth Line platforms to the
  Eastbourne Terrace exit." (`say` in the corrections file). Only Paddington changes in the table.
  The same "up or down" wording is at about 40 other stations (Liverpool Street, Bond Street, Ealing
  Broadway among them), for John to look at.
- **John:** where did "up or down" come from? (Tunbridge Wells.) Two sources: the station maps'
  "u" (stairs, lift or escalator to a hall above or below, which way not recorded) and the map data's
  path crossing a track it doesn't meet, with no bridge or tunnel tag. Now: `exits-2026-11-22/u-directions.json`
  gives up or down for the station maps from the readers' notes (Glasgow Queen Street 8 and 9,
  Liverpool Street A and B, Nottingham, St Pancras (down from 1 to 13, up from A and B), Tunbridge
  Wells 2: up; Watford Junction: down), "unknown" where the map didn't show it (Conway Park, Crosshill,
  Duddeston, Hornbeam Park, Hillside, Parton, Small Heath); the sentence says "The way out is up from
  the platform to X." or, where which way isn't known (and for the 37 map-data stations), "The way out
  from the platform leads to X." (draft). Leaving the map-data routes out was tried and dropped: Ealing
  Broadway, Putney and Streatham lost their main exits and Heathrow Terminal 5 went altogether.
  169 answers change, all of this kind; "up or down" nowhere.
- **Checked:** `npm run check` 273 + 57 + 79 + 40 + 59; `tsc -b`, build.
- **John:** "Yes please!": merged into `main` (fast-forward); checks, `tsc -b`, lint and build clean first.

### November 22nd 2026: "Your train passes near…": all of England, the plan (notes, straight to `main`; Claude chat)

- **John:** work through every stretch in England in a structured way. Plan and the Claude Code prompt to
  set it up (every stretch from the UK extract, a coverage file, region by region, a candidates script) at
  the end of `design/passes-near/README.md`. Not started.

### November 22nd 2026: "Your train passes near…": four more lines (notes, straight to `main`; Claude chat)

- **John:** all items kept without his checking; "on the train's left/right" with the one-line note for
  facing backwards; carry on with the research, then a prompt for Claude Code (he'll say how it looks).
- **Done:** Reading to Penzance (45 stretches), Didcot Parkway to Oxford, Reading to Basingstoke and Twyford
  to Henley-on-Thames added to `design/passes-near/passes-near.json` by `more_items.py`: 81 stretches, one
  item each (Reading to Reading West shared). New kind `station` (Mortimer). Facts checked against Historic
  England, Wikipedia, the National Trust and others; sides from the OpenStreetMap track. The README lists the
  lines and holds the prompt. Nothing on the page.

### November 22nd 2026: "Your train passes near…": data for Paddington to Bristol (notes, straight to `main`; Claude chat)

- **John:** one interesting thing near each stretch between neighbouring stations, with which side
  of the train it's on; one picked at random from the journey's stretches each visit; England only.
- **Done:** `design/passes-near/` (README with method, decisions and the prompt for Claude Code;
  `passes-near.json`, 26 items for Paddington to Bristol via Bath; `pilot_items.py` writes it).
  Every fact checked against a source; all kept by John. More lines to come in the same file.
  Nothing on the page.

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
