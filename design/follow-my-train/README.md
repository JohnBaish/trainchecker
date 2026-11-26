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

## Next

Mock-ups, when John says: the train page in its cases, and the link to the full journey.
