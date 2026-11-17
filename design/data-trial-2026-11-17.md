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
