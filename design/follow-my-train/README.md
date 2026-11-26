# "Follow my progress": a link to the train you're on

An idea for Message home's Share, talked through with John on November 26th 2026. Nothing built yet.

## The idea

Message home's message would end "Follow my progress on Trainchecker:", with a link (sent
separately, house style §17). The link opens a small page about that one train: where it is now
and when it's expected into B, on which platform.

## What John decided (November 26th 2026)

1. **Where the train is: the stops it calls at only.** From B's arrival board, which gives an
   actual time for each stop passed and an expected time for each stop ahead: "The train is
   currently between Twyford and Maidenhead, and is expected into London Paddington at 10.38am,
   on platform 11." No estimate of where it is between stops. On a non-stop run (Reading to
   Paddington on a fast train) we don't name a location at all, just as you wouldn't expect one;
   the box carries the same words as Message home's shared message instead (`sentFor()` in
   `src/lib/messageHome.ts`). The exact wording to be drafted ("we can draft our way out of this one").
2. **The link goes after the "#"**, like the journey link: e.g.
   `trainchecker.baish.net/#RDG-PAD/follow/1002-11041330-1126` (the journey, the timetabled time,
   the first eight characters of the train's id, the date). It never reaches the server or the visit
   statistics, and nothing is stored. The link preview is the general Trainchecker card.
3. **"Check again"**, as on the main page; it doesn't update by itself.
4. **The page shows the train, plus a link to the full journey.** What that link leads to, and
   how it looks, to be shown in mock-ups.
5. **"Follow my progress on Trainchecker"** for now.
6. **"Planning to get" messages carry the link too**; the page says the train hasn't left yet
   until it goes.

## Points found while thinking it through (Claude, for the mock-ups)

- B's arrival board reaches about two hours either side of now, so it covers most journeys and
  keeps "Got into … at …" for about two hours after the train is in. A train more than two hours
  from B would be found on A's departure board instead. The middle of a very long journey (more
  than two hours from both ends, e.g. Penzance to London) needs another step.
- Some stops have no time ("No report", Bodmin Parkway on the saved board of November 25th):
  use the last stop that does.
- The times reach the boards a minute or two after the train passes, so the page says when it
  was checked.
- Cases to word: not left yet, between two stops, a non-stop run, arrived, cancelled or ending
  early, a platform change, the link opened on a later day.
- A short cache (about 30 seconds) on the function, so several people opening the same link
  ask National Rail once.
- A finer source (passing times at every location: Darwin's live feed, Network Rail's train
  movements, perhaps the Realtime Trains API) isn't needed for now; the first two need a server
  running all the time, and the third's terms haven't been checked.

## The sentences (John, November 26th 2026; all 14 agreed: "The wording of 1-14 is excellent")

John drafted three cases, thinking of non-stop trains, and they work for every train. Agreed: one word order,
"The 5.05pm train from Reading to London Paddington is on its way" (14); where it is goes in that first sentence,
", now between Twyford and Maidenhead", and on a non-stop run the sentence just ends (15, 16: "now", not a second
"currently"); the platform at the end, only when known (17). The rest are Claude's drafts, built in
`src/lib/follow.ts`:

1. (John) Left on time, on time now: "…It left on time, 13 minutes ago, and it's currently expected into London
   Paddington at 6.54pm, on platform 9."
2. (John) Left on time, now late: "…but it's now running two minutes late, currently expected into…"
3. (John) Left late, still as late: "…It left three minutes late, at 6.21pm, so it's currently expected into…"
4. A little early: "…and it's running a little early, currently expected into…"
5. Left late, made up some time: "…but it's made up some time, and it's now running five minutes late, currently
   expected into…" (changed from the first draft, so the platform stays at the end)
6. Left late, made up all of it: "…but it's made up the time, and it's currently expected into London Paddington
   on time, at 6.39pm, on platform 9."
7. Left late, later still: "…and it's now running 12 minutes late, currently expected into…"
8. "It left on time just now", "a minute ago", "an hour and 10 minutes ago".
9. Not left yet: "…hasn't left yet. It's expected to leave 20 minutes late, at 6.46pm, and get into London
   Paddington 13 minutes late, at 7.07pm, on platform 9." ("…leave on time and get into … at …" when on time)
10. Delayed, no new time: "…is delayed, with no new time given yet. It was due to leave Reading at 6.32pm and get
    into London Paddington at 6.58pm."
11. Arrived: "The 5.50pm train from Reading got into London Paddington eight minutes late, at 6.21pm, on platform 12."
12. Cancelled: "…has been cancelled because of a fault on a train." (the reason only when National Rail gives one)
13. A later day: "This link was for the 6.11pm train from Reading to London Paddington on November 16th. It's no
    longer being followed."
14. Not on the boards: "Trainchecker can't find the 6.40pm train … at the moment. Please check again later.", or,
    more than two hours after its time, "…is no longer on National Rail's boards, so it will have finished its journey."

## The mock-ups (branch `claude/dreamy-keller-gb9xf7`, November 26th 2026)

- **Built for real, on the branch:** `src/lib/follow.ts` (the link and the sentences), `src/components/FollowView.tsx`
  (the page), the route in `App.tsx`, and Message home's share: until the train is in, its sentence ends "Follow my
  progress on Trainchecker:" and the link is the train's page (an arrived train keeps the journey link).
  `api/live.ts`'s `calls` now mark each stop passed, and the arrival board's trains carry their stops too, for a
  train that has gone from A's board.
- **The page:** "FOLLOWING A TRAIN" / "The 6.11pm from Reading"; the time checked with "Check again"; the sentences
  in a box edged by how it's doing (green on time, orange late, red cancelled); below, "TRAINS TO CHECK" / "Reading
  to London Paddington", a line about the journey page and "See the whole journey" (drafts). `?mock=A` shows the
  words alone in the box, B (the default) the words and the train's line as Message home shows it.
- **Pictures** in `design/previews/follow/` (`shoot.mjs`): every case at 1200px light and 390px dark with touch,
  option A for two; on the saved Reading to Paddington board at 6.24pm on November 17th, the arrival board made up
  from it and some trains changed for the cases it didn't have (illustration only). `message-home-sends.txt`: what
  Message home's share sends.
- **For John:** on a computer, Message home's "Copy" puts only the picture on the clipboard, so the link (and the
  sentence) only travel from a phone's share sheet. A train timetabled just before midnight and followed after it
  would read as "a later day". About these figures shows under the page, as on every page.

## Later the same day (John, November 26th 2026)

- **Option B** for the page (the words and the train's line); the switch and option A taken out.
- **Across midnight:** the train is followed whenever it's still on National Rail's boards (matched by its id and its
  booked time at A), whatever the date in the link; the "later day" message only once it has gone from them. So a link
  sent at 11.52pm about the 11.50pm and opened at 12.10am follows the train.
- **`scripts/check-follow.ts`** (in `npm run check`): the 14 agreed sentences word for word, the midnight cases, the link.
- **On a computer, no picture** (John, November 26th 2026, after mock-ups B and C): Copy can carry a picture or words,
  not both, so a computer gets only the message and its link, with "Copy this message" (copies both, on one line). The
  message is the phone's turned round, with the platform when known, fixed times only so it stays true however late
  it's read (the page's own "now between…" and "13 minutes ago" would go stale in a message); all agreed:
  1. "The 6.11pm from Reading is expected into London Paddington at 6.54pm, on platform 9."
  2. "… left on time but it's now running two minutes late, expected into … at 6.26pm, on platform 13."
  3. "… is expected into London Paddington a little early, at 6.26pm, on platform 11."
  4. "… left three minutes late, at 6.21pm, so it's expected into … at 6.43pm, on platform 11."
  5. "… left eight minutes late, at 6.23pm, but it's made up some time so it's now expected into … at 7.14pm, on
     platform 10, five minutes later than originally planned."
  6. "… left three minutes late, at 5.49pm, but it's made up the time and is expected into … on time, at 6.39pm, on
     platform 9."
  7. "… left eight minutes late, at 6.23pm, and it's now running 12 minutes late, expected into … at 7.21pm, on
     platform 10."
  8. "… is due to leave on time, and it's expected into … at 6.58pm, on platform 12."
  9. "… is expected to leave 20 minutes late, at 6.46pm, getting into … at 7.07pm, on platform 9."
  10. "… is delayed, with no new time given yet. It was due into London Paddington at 6.58pm."
  11. "The 5.50pm from Reading got into London Paddington at 6.21pm, on platform 12. See how the trains are doing on
      Trainchecker: [the journey's link]"
  Each of 1 to 10 ends "Follow its progress on Trainchecker: [link]". The phone's planning message now says "getting
  into" too (John). Phones are otherwise unchanged (picture and share sheet). `deskFor()` in `messageHome.ts`,
  `DeskMessage.tsx`; checks in `check-home.ts`; pictures `design/previews/follow/desk-*` (`desk.mjs`).
