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
   bag…" or "Be prepared…". It gives the main reason in a few words, for
   example (illustration only): "Good news: trains from Reading to
   Paddington are running normally this afternoon."
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
   seven days, in words, for example (illustration only): "Over the last
   week, 104 of 120 trains arrived within 3 minutes of time. Six were
   cancelled. Thursday was the worst day."
5. **The days ahead.** Any planned engineering work or other known
   problems affecting the journey in the next few days, in words, with
   what National Rail says to do instead.
6. **If it's badly disrupted:** another way to get there, if there is
   one, and roughly how long it takes, for example (illustration only):
   "Instead, you could go via Basingstoke, changing there. That takes
   about 1 hour 20 minutes, compared with 45 minutes usually."
7. **If there's no direct train:** the page works out where to change, and
   everything above is about the journey with that change.
8. The source line and the footer (§8 of the house style).

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
4. **Changes and alternative routes:** no ready-made free journey planner
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

1. Northern Ireland, the London Underground and most trams (not in
   National Rail's data).
2. Fares and tickets.
3. Alerts or notifications.
4. Journeys with more than one change.

## 7. Open questions

1. **Name:** "Trainchecker" hasn't been searched for clashes yet.
2. **Area:** Great Britain's National Rail network only, as in §6?
3. **A server:** are you happy for Trainchecker to have small Vercel
   functions that hold the keys and send the two chosen stations to
   National Rail, storing nothing? This changes the privacy sentence
   from "nothing leaves your browser".
4. **The verdict:** a first proposal for when each one is used:
   - "Good news…": every train in the next five hours is on time or less
     than 5 minutes late, and no engineering work today.
   - "It's a mixed bag…": some trains late or cancelled, or the last week
     was poor, or engineering work later in the week.
   - "Be prepared…": several cancellations, major disruption, or
     engineering work affecting today.
   Should the last week count towards today's verdict, or only the next
   five hours and known problems?
5. **"On time":** the industry has several measures (within 59 seconds,
   within 3 minutes, within 5 or 10 minutes). Proposal: "within 3
   minutes", said in words so nobody has to know the jargon.
6. **The last week:** every train on the journey that week, or only those
   at roughly the same times of day as the visitor's?
7. **Platforms "generally speaking":** from today's live board only, or
   also a record of which platforms these trains usually use? A record
   would need a collector running through the day, as Hindcaster's does.
8. **"The next few days":** how far ahead for engineering work: three
   days, seven, or to the end of the coming weekend?
9. **"Badly disrupted":** what should trigger the alternative route: a
   cancellation, a delay of 30 minutes or more, or a line closed?
10. **Alternatives:** trains only, or also say when National Rail lists
    replacement buses?
11. **Changes:** one change at most in the first version?
12. **Remembering:** keep recent journeys in the browser, swap direction
    with one tap, and put the journey in the address after a "#" so it
    can be bookmarked (as Hindcaster does)?
13. **Credits:** how National Rail's data is credited, once its terms are
    read (house style §8 asks you first).
14. **Share button:** wanted? If so, its sentence is agreed with the
    mock-up (house style §17).
