# Stage 1: findings and recommendation (November 17th 2026)

For John to agree before the mock-ups (stage 2). The detail is in
`design/data-trial-2026-11-17.md`, `design/rules-trial-2026-11-17.md`
and `design/licences-2026-11-17.md`.

## 1. What the data gives (all tested with real data)

1. **The next four hours** (Live Departure Board): every train with its
   scheduled and expected time, cancellations, National Rail's reason, and
   the platform where known. Two requests cover four hours; quick.
2. **The last two hours** (the same board, looking back): actual arrival
   times at the destination; quick.
3. **Planned work ahead** (Knowledgebase Incidents): one 2.8 MB file,
   weeks ahead, with National Rail's advice; routes described in words.
4. **What's wrong now** (Disruptions API): by station code; quick.
5. **The last week, by chosen hour** (history service): one request at a
   time, about 43 seconds for an hour on a busy line, less on quiet ones.
6. **Elizabeth line:** fully in the live boards. **Unreliable in the
   history:** trains are missing whenever Paddington or Bond Street is
   one end (e.g. Reading to Paddington, 5pm to 6pm last Monday: one of
   five Elizabeth line trains counted; Reading to Ealing: all five), and
   the history uses its own codes for some stations (Abbey Wood "ABX").

## 2. Recommendations

1. **The verdict: count the affected trains, not just whether there are
   any.** With "any late or cancelled train means a mixed bag", three of
   nine calm journeys were "mixed": Reading to Paddington for one train
   20 minutes late out of 51, Liverpool Street to Stratford for one
   cancellation out of 62. Proposal (for John to confirm):
   - "Good news" when at most one train, or one in ten if there are many,
     is cancelled or more than 5 minutes late. The one train is still
     described below.
   - "It's a mixed bag" above that.
   - "Be prepared" when badly disrupted, three or more cancellations, or
     engineering work closes the line today.
2. **"However, it's worth knowing…" from the last two hours**, when they
   were noticeably worse than the next four hours look, e.g. (real, 6.15pm
   today): Reading to Paddington, 10 of 24 arrivals more than 3 minutes
   late; Manchester Piccadilly to Leeds, two trains cancelled.
3. **The last two hours on long journeys:** few trains have arrived yet
   (Kings Cross to York: none, as the journey takes about two hours).
   Proposal: use departures from A when fewer than three arrivals are in,
   and say so ("of the trains that left Kings Cross in the last two hours").
4. **Platforms:** known for about half the next four hours' trains (27 of
   51 for Reading to Paddington); say "Most of the next trains are going
   from platform 10A" and "platforms for later trains aren't announced
   yet".
5. **The history and the Elizabeth line:** for journeys where the
   Elizabeth line runs, say the history may leave some Elizabeth line
   trains out, rather than show figures that look complete.
6. **Hours to offer for the history:** there's no quick way to know which
   hours have trains without timetable data (not subscribed). An hour
   with no trains answers quickly (0.4 seconds), one with a single train
   took 9.5 seconds. Proposal: offer 5am to midnight; if an hour has no
   trains, say so at once. Each answer is kept for the day, so the list
   improves as people ask.
7. **Keys:** one per product; the app reads them from the four Vercel
   variables. The live board refuses Python's default User-Agent (403),
   so the app sets its own.
8. **The message of the day** (John, November 17th 2026): the page signs
   off with one of 366 messages, the same for everyone all day, supplied
   by John as a `.ts` file.

## 3. Next: stage 2, mock-ups

The whole page at 1200px, 390px and 844×390, light and dark, using real
journeys from today (a good, a mixed and a disrupted one), with every
sentence for John to agree word by word.
