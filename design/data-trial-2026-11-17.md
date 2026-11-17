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
