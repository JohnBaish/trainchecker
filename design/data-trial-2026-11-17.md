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
