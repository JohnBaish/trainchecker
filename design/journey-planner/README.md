# A journey planner for Trainchecker: how far we got

Looked into on November 27th 2026 (Claude Code, with John). Nothing built.

John's idea: a Journey Planner section at the bottom of the page, after the Fact of the Journey,
finding times and connections for future journeys (not just today's live trains).

## What it would need

1. The timetable for future days (the live boards reach only about four hours ahead).
2. Something to work out routes, with one or more changes.
3. The railway's minimum connection times.

## The three routes looked at

1. **National Rail's own planner (the "Online Journey Planner").** From web searches only:
   offered under a formal licence; the Open Rail Data wiki has listed it as charged (that page
   about 18 months old). An unconfirmed user post on the Rail Data Marketplace (about October
   2026) says it's coming to the Marketplace "in the next few months". Not followed up.
2. **Our own planner from the Rail Delivery Group's timetable files.** On the Rail Data
   Marketplace: "Timetable – Full Refresh" (monthly, weekly or daily) and "Timetable – Changes
   Only – Daily". John subscribed to "Full Refresh – Daily". There's no key: it's a file, from
   "Data files" ("View files" to download it, or "File transfers" to have it sent somewhere
   automatically; destination types not looked at). **Licence read** (both products have the
   same text; summary in `design/licences-2026-11-17.md`): free, daily, "UK and Europe", but
   for "research & analysis purposes only". John and Claude both read that as not covering a
   public journey planner. **John: not taking this further for now**, and not writing to the
   Rail Delivery Group to ask (November 27th 2026). Files not downloaded or looked at.
3. **Someone else's data or planner** (a converted timetable on Transitland, from Interline;
   Transitous, a free planner on open data). Licences and reliability not checked. A planner
   run by someone else would mean sending visitors' journeys to them.

## If it's picked up again

- Check whether the Online Journey Planner has reached the Marketplace, and its licence.
- Check option 3's licences, and where their timetables come from (if from the same files,
  the same "research & analysis" limit might apply: not checked).
- The sources: the Open Rail Data wiki's DTD:Timetable and Real Time Journey Planner pages
  (they refuse automated reading from cloud sessions), and the Marketplace's own pages.
