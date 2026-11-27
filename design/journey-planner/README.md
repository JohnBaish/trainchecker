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
   Transitous, a free planner on open data). Transitous ruled out by John (it would mean sending
   visitors' journeys to someone else). Transitland: below.

### Option 3: Transitland's UK rail feed, looked at the same day

Transitland's own pages refuse automated reading (a Cloudflare check) and its data service needs a
key, so John sent screenshots, and the feed's entry was read from GitHub
(`transitland/transitland-atlas`, `feeds/gtfs-source-feeds.transit.land.dmfr.json`, id `f-uk~rail`):
- "United Kingdom rail feed converted into GTFS by Interline"; it replaces an older feed called
  "rail delivery group planar gtfs", so it's made from the Rail Delivery Group's timetable.
- Transitland's licence summary: attribution needed ("Powered by National Rail Enquiries"); derived
  products, redistribution and commercial use all "yes". No licence named or linked.
- The download needs a Transitland key (`token`).
- **The catch:** that summary is Transitland's own, and it doesn't match the licence the Rail
  Delivery Group now gives for the same timetable ("research & analysis purposes only"). The
  attribution wording looks like the older National Rail open-data terms, so the summary may date
  from those. Which applies to a copy passed on by Interline isn't known (not checked).

## If it's picked up again

- Check whether the Online Journey Planner has reached the Marketplace, and its licence.
- Check option 3's licences, and where their timetables come from (if from the same files,
  the same "research & analysis" limit might apply: not checked).
- The sources: the Open Rail Data wiki's DTD:Timetable and Real Time Journey Planner pages
  (they refuse automated reading from cloud sessions), and the Marketplace's own pages.
