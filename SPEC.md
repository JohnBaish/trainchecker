# Trainchecker: spec (draft)

**Tagline:** "How's this train line doing" (John, November 17th 2026).

Draft by Claude Code, November 17th 2026, from John's brief in
`design/handover-2026-11-17.md`. Everything here is for John to agree. The
open questions are numbered at the end.

## 1. Who it's for

- People travelling later today or in the next few days, who want a
  general picture, in plain English, of what's happening on their line.
- People who'd rather be broken in gently when the news is bad. So the page
  starts with a friendly verdict before any detail.

## 2. What the visitor does

1. Types two stations, "From" and "To" (with suggestions as they type,
   from National Rail's station list).
2. Gets one page about that journey. Nothing else needs choosing.
3. Can swap the direction with one tap (question 12).

## 3. What the page shows, in order

1. **The verdict.** A sentence starting "Good news…", "It's a mixed
   bag…" or "Be prepared…", based on the next five hours and known
   problems. It gives the main reason in a few words. If the last week
   tells a different story, a second sentence adds it, starting "However,
   it's worth knowing…" (answer 4). For example (illustration only):
   "Good news: trains from Reading to Paddington are running normally
   this afternoon. However, it's worth knowing that this time of day has
   been unreliable most days this week."
2. **The next five hours.** A summary in words of the departures from A
   that reach B in that time, for example (illustration only): "There are
   18 trains in the next five hours. 16 are on time, one is expected 12
   minutes late, and the 15.42 is cancelled." Then details for every
   delayed or cancelled train: when it was due, when it's expected, and
   the reason if National Rail gives one.
3. **Platforms.** Which platforms these trains are going from at the
   moment, generally speaking, for example (illustration only): "Most are
   leaving from platform 9; two are from platform 11." Platforms are often
   only announced shortly before a train leaves, so this says so when they
   aren't known yet.
4. **The last week.** How reliable the same journey has been over the last
   seven days, in the same five hours of the day as the visitor's
   enquiry (answer 6), in words, and whether it was one bad day or
   consistently poor (§7, question 6), for example (illustration only): "Over the last
   week, 104 of 120 trains arrived within 3 minutes of time. Six were
   cancelled. Thursday was the worst day."
5. **The days ahead.** Any planned engineering work or other known
   problems affecting the journey from now to the end of the coming
   weekend (answer 8), in words, with
   what National Rail says to do instead.
6. **If it's badly disrupted** (§7, question 9): what National Rail
   advises instead, such as other routes where tickets are accepted and
   replacement buses (answer 10). A route worked out by Trainchecker
   itself, with a journey time, needs a journey planner, so it waits for
   a later version (answer 11).
7. A Share button (answer 14), its sentence agreed with the mock-up.
8. The source line, with National Rail's credit as its terms require
   (answer 13), and the footer (house style §8).

Only journeys with a direct train in the first version (answer 11): if
there's none, the page says so plainly and suggests a journey planner.

## 4. Data (checked so far)

Checked by web search on November 17th 2026. This session's network
blocked the Open Rail Data wiki, so details from there were seen only in
search summaries, not read in full. Nothing has been tried with real data
yet: that's stage 1 of `PLAN.md`.

1. **Live departures and platforms:** National Rail's Live Departure Board
   (Darwin), through the Rail Data Marketplace (RDM). Described as free in
   recent sources; one National Rail page mentions a limit of 5 million
   requests every four weeks for the older service. To confirm in RDM's
   own terms.
2. **The last week:** Darwin's Historical Service Performance (HSP), up to
   a year back, on RDM. Its documentation says it can't be called from a
   web page directly (no CORS). Forum posts from March 2026 mention a limit
   of one request per second and timeouts. Untested.
3. **Engineering work and known problems:** National Rail's Knowledgebase
   "Incidents" feed, listed as free on RDM. Not yet checked whether it
   includes planned engineering work as well as live disruption, or how
   far ahead.
4. **Changes and alternative routes (later, not the first version):** no ready-made free journey planner
   was found. Options, to test in stage 1: (a) the full timetable (RDG's
   timetable files, free from the National Rail Data Portal), with
   Trainchecker working out routes itself; (b) the live boards' calling
   points, combined at likely changing stations. Option (a) is more work
   but works for future days too.
5. **Station names and codes:** National Rail's station list (in the
   timetable files and the Knowledgebase).

Licences and credit lines for each are to be read before building, and
the wording agreed with John (house style §8).

## 5. How it would work

- **A small server is needed.** The Live Departure Board needs a secret
  key, and the historical data can't be called from a browser. So
  Trainchecker would have a few small Vercel functions that hold the keys
  (as Vercel settings, never in the code) and fetch the data. This is the
  first baish.net tool to need one (question 3).
- **Privacy:** the two stations a visitor chooses would go to
  Trainchecker's functions, and from there to National Rail. Nothing would
  be stored or logged. The privacy sentence must say this honestly
  (question 3).
- Some answers can be kept briefly to save repeated requests: the last
  week for a journey (for a few hours), engineering work (for a few
  minutes).
- The usual house style throughout: Vite, React and TypeScript; the
  organic design; dark mode following the device; phones first-class;
  Vercel Web Analytics.

## 6. Not in the first version (unless John says otherwise)

1. Journeys that need a change, and routes worked out by Trainchecker
   (answer 11).
2. The London Underground: a possible later addition (answer 2).
   Northern Ireland and most trams aren't in National Rail's data.
3. Fares and tickets.
4. Alerts or notifications.
5. Asking what time the visitor is travelling (answer 6).

## 7. Questions and John's answers

Answers from John, November 17th 2026, unless marked.

1. **Name:** searched (November 17th 2026). There's an iPhone app called
   "TrainChecker" for rail freight inspectors (pre-departure wagon
   checks), and a passenger app called "RailChecker". Nothing found called
   Trainchecker for passengers. Keep the name (John).
2. **Area:** Great Britain's National Rail, and the Elizabeth line for
   sure, if doable. The Underground perhaps later. *Elizabeth line:
   individual central-London services appear on a site built on rail data
   (RailChecker), so it looks likely, but it's unconfirmed until stage 1
   (John: OK).*
3. **A server:** yes, if there's no alternative. There isn't one, even for
   Reading to Paddington only: National Rail's live data needs a key that
   mustn't be in a web page, and its history service refuses requests
   from web pages. (Rainfaller's Environment Agency data is different:
   open, with no key, and browsers may fetch it.)
4. **The verdict:** based on the next five hours and known problems; the
   last week modifies it with "However, it's worth knowing…" or similar.
   *The exact rules and wording are agreed with the mock-ups (stage 2).*
5. **"On time":** within 3 minutes, said in words.
6. **The last week:** no asking when the visitor travels. Every train on
   the journey in the five hours after the enquiry, on each of the last
   seven days (confirmed). It must tell one bad day from consistently
   poor running. Agreed (John), with the thresholds tuned on real data
   in stage 1:
   - a day is "poor" if fewer than four in five of its trains were within
     3 minutes, or two or more were cancelled;
   - no poor days: reliable;
   - one or two poor days: "one bad day" (named), otherwise fine;
   - three or more poor days: consistently poor.
7. **Platforms:** from today's live board only.
8. **The days ahead:** to the end of the coming weekend, if easy.
   *Checked in stage 1.*
9. **"Badly disrupted":** not a single cancellation. Two of the next three
   trains cancelled, a delay of 45 minutes or more, or the line closed
   counts, but one very late train doesn't count when others run often.
   Agreed (John): badly disrupted when any of these is true:
   - two of the next three trains to B are cancelled;
   - someone arriving at the station now would reach B 45 minutes or more
     later than the timetable says (so one late train among frequent
     on-time ones doesn't count, as in the Hereford example);
   - no trains are running, or National Rail says the line is closed.
10. **Alternatives:** trains and replacement buses, if possible. In the
    first version this means National Rail's own advice (question 11);
    agreed (John: "I think so").
11. **Changes:** not in the first version. Direct trains only.
12. **Remembering:** yes to all: recent journeys kept in the browser, a
    swap-direction button, and the journey in the address after a "#".
13. **Credits:** however National Rail's terms require. *Read in
    stage 1.*
14. **Share button:** yes. Its sentence is agreed with the mock-up.
