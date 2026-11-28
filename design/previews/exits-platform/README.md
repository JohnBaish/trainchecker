# Exits: the platform on each train button (an idea, not taken up)

John, November 28th 2026. Kept so the idea and the reasons can be found again.

## The idea

In Exits, under "Check directions from your train", each train button shows only its time and
when it's expected in. You find out its platform only by tapping it (the page then asks National
Rail for that train's platform and gives the way out from it).

Since November 25th 2026 the page already has the destination's arrival board, with each train's
platform where one has been announced. So each button could also show the platform it's coming
into, or "not yet". That would make "Check if your train's platform has been confirmed" something
you can see at a glance, without tapping.

Two layouts were mocked up (pictures here; the platforms in them are made up, illustration only,
on the saved Bath Spa to Bristol Temple Meads board of 6.24pm, November 17th 2026):

- **A** (`mock-A-*.png`): a line under each train, "Platform **3**" or, greyed out, "Platform not
  announced yet". Plain; each button one line taller.
- **B** (`mock-B-*.png`): the boards' orange platform badge on the right, or "not yet" in grey
  italics. Matches "The next hour" and "More arrivals"; on a phone the "expected into…" line wraps
  more. Claude preferred B.

As mocked up, the platform would show on the buttons every time, not only when the trains share a
platform; that was left as a question for John.

## John's decision

Not taken up, for simplicity: someone who opens Exits has asked about the way out and cares only
about their own train, so the buttons stay as they are (time, and when it's expected in). Worth
another look if Exits, or the train lists generally, are expanded later.

What was built instead, the same day: the line above the question when the announced trains share
one platform ("All the trains whose platforms have been announced are coming into platform 2." /
"The only train whose platform has been announced is coming into platform 2."), with the directions
from that platform. See `CLAUDE.md`'s log, November 28th 2026.
