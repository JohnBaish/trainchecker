# Stage 1 data trial: notes as it goes (started November 17th 2026)

## 1. Live Departure Board (tested 4.57pm, Tuesday November 17th 2026)

Address: `https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepartureBoard/{crs}`,
key in the `x-apikey` header. Asked for trains from Reading (RDG) calling
at London Paddington (PAD): `filterCrs=PAD&filterType=to`.

1. **It works.** Each train has its scheduled time (`std`), expected time
   (`etd`, e.g. "On time" or "17:10"), platform, operator, destination,
   `isCancelled`, `cancelReason` and `delayReason` (e.g. "This service has
   been delayed by congestion").
2. **Elizabeth line: yes.** Reading's board includes Elizabeth line
   trains to Abbey Wood (calling at Paddington), and Tottenham Court Road's
   own board works, listing Elizabeth line trains. Central London is
   covered in the live boards. (History still to check.)
3. **Platforms:** given for every train in the test (e.g. 10, 11A, 15A).
4. **How far ahead: about four hours, not five.** The board returns at
   most 120 minutes per request (asking for 300 gave the same 32 trains as
   120), and the furthest start it accepts is 119 minutes ahead (180 gave
   an error, HTTP 400). Two requests together reached 16:56 to 20:47, so
   the live board covers roughly the next four hours. A fifth hour would
   need another source, such as the timetable.
5. This board doesn't give the arrival time at the destination. If the
   page needs journey times, "GetDepBoardWithDetails" (with calling
   points) is the one to try next.

## 2. Historical Service Performance (tested 5.15 to 5.45pm, November 17th)

Address (John, from the product's Specification tab):
`https://api1.raildata.org.uk/1010-historical-service-performance-_hsp_1_1/serviceMetrics`
(and `…/serviceDetails`), POST with JSON, key in `x-apikey`. The older
address in forum posts (`…_hsp_v1/api/v1/serviceMetrics`) refuses the key
("Invalid ApiKey for given resource").

1. **It works, but slowly.** Reading to Paddington, 5pm to 6pm on one
   day: 37 to 44 seconds per request (11 trains). Four hours of one day
   (4pm to 8pm) timed out after 55 seconds (HTTP 504, "Gateway Timeout").
   Reading to Tottenham Court Road, one hour (5 trains): 7.5 seconds. So
   time grows with the number of trains, and a week of four-hour windows
   can't be fetched while a visitor waits.
2. **What it gives:** each train's scheduled departure and arrival, the
   operator, where it started and finished, and, for each "tolerance"
   asked for (0 minutes, 3 minutes), whether it arrived within it. The
   3-minute rule (spec answer 5) can be asked for directly.
3. **Elizabeth line: yes.** Reading to Tottenham Court Road returned five
   Elizabeth line trains (operator code XR). But Reading to Paddington
   (PAD) returned only Great Western trains, though Elizabeth line trains
   call there: the Elizabeth line's Paddington probably has its own code
   in the history data. To check.
4. Still to check: whether a single request for a week of one hour is
   faster than seven one-day requests; how cancellations show (probably
   as "not within tolerance", with reasons in `serviceDetails`).

## 3. Knowledgebase Incidents (tested 5.25pm, November 17th)

Address: `https://api1.raildata.org.uk/1010-knowlegebase-incidents-xml-feed1_0/incidents.xml`
(the "knowlegebase" spelling is theirs), key in `x-apikey`.

1. **One file of everything:** 2.8 MB of XML (gzip-compressed to 0.3 MB),
   fetched in about a second. 931 incidents: 896 planned, 35 unplanned.
2. **Planned work weeks ahead:** for Reading and Paddington alone, entries
   ran into December, e.g. "Dolphin Junction upgrade: no trains to / from
   London Paddington on Saturday 28 and Sunday 29 November". "To the end
   of the coming weekend" (spec answer 8) is easy.
3. Each incident has start and end times, planned or not, a summary, a
   full description (HTML, with customer advice and ticket acceptance),
   the train companies affected, and the routes affected **in words**
   ("Between Lancaster / Barrow-in-Furness and Carlisle"), with no
   station codes. Matching incidents to a journey means matching station
   names and train companies in that text: a job for stage 4.

## 4. NationalRail Disruptions API (tested 5.30pm, November 17th)

Address: `https://api1.raildata.org.uk/1010-disruptions-experience-api-11_1/stations/disruptions/incidents?crsCode={crs}`,
key in `x-apikey`.

1. Quick (about half a second) and **keyed by station code**, so no text
   matching is needed. Reading and Paddington had nothing at the time;
   Carlisle had one, a signalling fault between Manchester Airport and
   Manchester Piccadilly, with National Rail's full description.
2. It seems to carry live disruption only: Whitehaven's long-running
   planned bus replacement wasn't there. So: this API for "what's wrong
   now" at the two stations, the Incidents feed for planned work ahead.

## 5. Keys in this environment

All four products share one address, and this environment holds one key
per address, so keys were swapped in turn for testing. At the end of
these tests the saved key is the Disruptions API's.

## 6. History: a week in one request (tested about 6pm, November 17th)

1. **A whole week takes no longer than one day.** Reading to Paddington,
   5pm to 6pm, every weekday from November 10th to 16th: 44 seconds,
   56 train runs (one day of the same hour took 37 to 44 seconds). So the
   time depends on the length of the time window, not the number of days.
2. **But two hours at once timed out** (55 seconds, HTTP 504), even for
   the week. The gateway seems to give up at about 55 seconds, so one
   hour per request is the safe size, and even that is close to the
   limit on a busy line. Half-hour requests are the fallback.
3. **So a week of four hours = four one-hour requests per type of day**
   (the service asks for "WEEKDAY", "SATURDAY" or "SUNDAY" separately):
   up to 12 requests, which can run side by side (a second apart, as
   forum posts mention a limit of one per second). About a minute in
   all, if the service holds up.
4. **A real figure, for illustration of what it gives:** in that hour last
   week, 25 of 56 Reading to Paddington arrivals were within 3 minutes.
5. **Elizabeth line coverage looks patchy.** In the same hour of the
   week only one Elizabeth line run (the 17:16, one day) appeared for
   Paddington, where about three an hour call. Reading to Bond Street
   gave none for November 16th, though Reading to Tottenham Court Road
   gave five earlier. "PDX" (a guess at a separate Paddington code) gave
   nothing. To investigate before relying on the history for Elizabeth
   line journeys.

## 7. The live board looking back (tested 5.49pm, November 17th)

John asked whether recent arrivals can be had without the history
service. They can, for about the last two hours.

1. **`timeOffset=-120` works.** `GetDepartureBoard/RDG` (to PAD), asked at
   5.49pm, listed every train from 15:44, each with its actual departure
   time ("On time" or e.g. "15:52"), Elizabeth line included. Answered in
   under a second.
2. **Arrivals too, via "with details".**
   `GetDepBoardWithDetails/RDG?filterCrs=PAD&filterType=to&timeOffset=-120&timeWindow=120`
   gives each train's calling points, including Paddington's scheduled
   time (`st`) and actual time (`at`, "On time" or a time); trains still
   running show an expected time (`et`) instead. It returned 25 trains
   where the plain board returned 34, so it seems to cap the number of
   rows: two requests (each an hour) would cover two hours fully.
3. **The arrivals board itself (`GetArrivalBoard`, `GetArrDepBoardWithDetails`)
   isn't in this subscription** (HTTP 500).
4. **A real figure, for illustration:** of the 23 trains that had reached
   Paddington by 5.49pm (departures 15:44 to 17:12), 15 arrived within 3
   minutes; the latest was the 17:02 from Reading, 23 minutes late.
5. Quick and cheap, so the page could say how the last two hours have
   gone with no waiting. Longer periods still need the history service or
   our own collection.

## 8. History: requests side by side (tested 6pm, November 17th)

1. **Only one request at a time is accepted.** Twelve sent a second
   apart: the first three were accepted and all timed out (55 seconds,
   HTTP 504); the other nine were refused at once (HTTP 503, "Service
   Temporarily Unavailable"). Two or three half-hour requests a second
   apart: the first finished in about 22 seconds, the others were refused
   at once (503). So requests can't run side by side.
2. **One at a time is fine, and time follows the length of the window.**
   Reading to Paddington, weekdays November 10th to 16th: 6pm to 7pm took
   42.6 seconds (61 train runs); 6pm to 6.30pm took 20.7 seconds (31
   runs). Quieter lines are quicker (Reading to Tottenham Court Road, one
   hour of one day: 7.5 seconds).
3. **What fits in about 45 seconds on a busy line:** one hour of the day,
   for the same kind of day (weekdays, or Saturdays, or Sundays) over the
   last week. On quieter lines, more hours.
4. **"One bad day" isn't available within that time.** `serviceMetrics`
   adds each train up over all the days asked for; splitting by day would
   mean a request per day (time doesn't shrink with fewer days) or a
   `serviceDetails` request per train run. Each train run's ID does start
   with its date (e.g. `20261116…`), but the on-time counts aren't given
   per run.

## 9. History: several margins, and cancellations (tested 8.20 to 8.35pm, November 17th)

For John's question: can the last week say what happened to the trains that weren't on time?

1. **No minutes in the totals.** `serviceMetrics` only counts trains within each margin
   ("tolerance") asked for. But it takes several margins in one request, at no measurable
   cost: Reading to Paddington, 5pm to 5.30pm, weekdays November 10th to 16th, took 20.5
   and 26.7 seconds with one margin and 20.0 and 30.6 seconds with three (3, 10, 30).
2. **The answer:** 26 trains; 8 within 3 minutes, 21 within 10, all 26 within 30
   (`design/mockups/snapshots/20261117-hsp-RDG-PAD-1700-1730.json`).
3. **The whole hour (5pm to 6pm) timed out** at 55 seconds tonight, though it took 37 to 44
   seconds earlier today. A busy line's hour may need two half-hour requests, one after
   the other (about 40 to 60 seconds), or it may sometimes fail: to plan for in stage 3.
4. **Cancelled trains count as missing every margin.** Manchester Piccadilly to Manchester
   Airport, 6.40pm to 7.10pm tonight (9 to 23 seconds): the 6.47pm and 7pm Northern and the
   6.51pm TransPennine miss even a 120-minute margin; `serviceDetails` (0.6 seconds each)
   confirms they have no actual times and a cancellation reason (code 832). So a 120-minute
   margin separates cancelled trains from late ones. The 6.55pm Transport for Wales,
   cancelled on the live board, isn't in the history at all (it may have ended at
   Piccadilly), so some cancellations can go uncounted.
5. **Per-train details are quick** (0.6 seconds), unlike the totals. A true average would need
   one per late train, one after the other: perhaps 10 to 20 seconds more on a busy line.
   Not needed for the agreed wording.

## 10. The Disruptions API against the incidents feed (6.35am to 6.40am, November 18th 2026)

The incidents feed saved at 6.35am (`snapshots/20261118-0635-incidents.xml.gz`: 919 incidents,
25 unplanned, 5 of them live), then the Disruptions API asked for 23 stations at 6.40am
(`snapshots/20261118-0640-disruptions/`): the stations the live disruptions name, and Reading,
Paddington, Manchester Airport, Euston, Kings Cross, Brighton, Victoria, Waterloo, Liverpool
Street, Derby, Matlock, Cardiff and Bristol.

1. **The same incidents, with the same ids and words.** The API returned four disruptions, each
   also in the feed with the same id, summary and description. The fifth live one in the feed
   (London Underground industrial action) names no station, so no station would return it.
2. **Unplanned only:** no planned work at all (Derby, Matlock and Victoria had none, though the
   feed has work there this week), so the feed is needed anyway.
3. **What it adds: stations along the route.** Cardiff Central returned "Buses replace trains
   between Llanhilleth and Ebbw Vale Town", which doesn't name Cardiff; the feed's "Routes
   affected" says the same ("Between Maesteg / Bridgend / Cardiff Central / Newport (South
   Wales) and Ebbw Vale Town").
4. Quick (well under a second a station), but one request per station per visit, where the feed
   is one request for everyone every five minutes.

## 11. The Elizabeth Line in the history, again (8am to 8.30am, weekdays November 11th to 17th 2026)

Reading to Bond Street: no trains. Reading to Ealing Broadway: 10, all Elizabeth Line. Reading to
Tottenham Court Road: 10. Reading to Paddington: 34, one Elizabeth Line. So the record leaves the
Elizabeth Line out at Bond Street and Paddington only. Of Ealing's 10, four missed every margin:
each has National Rail's cancellation code in the train's details (773 on November 11th, 896 on
the 13th), so they really were cancelled, not missing. Reading to Ealing Broadway, 8am to 9am,
through the page: 15 ran, about three quarters within three minutes, five cancelled.

## 12. Twyford, and asking for one company (November 18th 2026)

Twyford to Paddington, 8am to 9am, weekdays November 11th to 17th: the 8.23am and 8.56am Great
Western trains (five runs each) and a single Elizabeth Line run (the 8.18am, one day, more than
half an hour late), which is what made John's sentence say "the rest more than half an hour late".
The other Elizabeth Line runs, three an hour, are missing at Paddington; to Ealing Broadway all
15 are there. The service's `toc_filter` works: Great Western only, 11 seconds, the ten runs.
Through the page, both parts together answered in 31 seconds.
