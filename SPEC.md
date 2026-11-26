# Trainchecker: spec (draft)

**Tagline:** "How the trains are doing, written the way we speak." (John, November 18th 2026; was "How's this train line doing", November 17th 2026).

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

**Superseded in places by §8 (the mock-ups, agreed November 17th 2026),** whose wording
is final where they differ.

1. **The verdict.** A sentence starting "Good news…", "It's a mixed
   bag…" or "Be prepared…", based on the next four hours and known
   problems. It gives the main reason in a few words. If the last week
   tells a different story, a second sentence adds it, starting "However,
   it's worth knowing…" (answer 4). For example (illustration only):
   "Good news: trains from Reading to Paddington are running normally
   this afternoon. However, it's worth knowing that this time of day has
   been unreliable most days this week."
2. **The next four hours** (four, not five: the live board reaches only
   about four hours ahead; John, November 17th 2026, option a). A summary in words of the departures from A
   that reach B in that time, for example (illustration only): "There are
   18 trains in the next four hours. 16 are on time, one is expected 12
   minutes late, and the 15.42 is cancelled." Then details for every
   delayed or cancelled train: when it was due, when it's expected, and
   the reason if National Rail gives one.
3. **Platforms.** Which platforms these trains are going from at the
   moment, generally speaking, for example (illustration only): "Most are
   leaving from platform 9; two are from platform 11." Platforms are often
   only announced shortly before a train leaves, so this says so when they
   aren't known yet.
4. **The last two hours** (John, November 17th 2026, replacing "the last
   week" in the main page): how the same journey's trains have actually
   run in the last two hours, from the live board, with no waiting, for
   example (illustration only): "In the last two hours, 15 of 23 trains
   reached Paddington within 3 minutes. The worst was 23 minutes late."
4a. **The last week, on request** (John, November 17th 2026): lower down,
   the visitor chooses an hour of departure and gets the reliability of
   trains making this journey in that hour over the last week. John's
   draft wording: "If you'd like to see the reliability history of trains
   making this journey over the last week, choose an hour of departure and
   the results should load within 40 seconds." Agreed wording ends "…the
   results should load in under a minute." (John). Same kind of day as
   today (weekday, Saturday or Sunday); only hours when trains run, if
   that's easy to check quickly (John). One history request (one
   hour, one kind of day) per choice: about 43 seconds on a busy line like
   Reading to Paddington, much less on quieter ones
   (`design/data-trial-2026-11-17.md` §8). Results kept for the rest of
   the day, so later visitors get them at once. It can't tell one bad day
   from a poor week within that time.
5. **The days ahead.** Any planned engineering work or other known
   problems affecting the journey from now to the end of the coming
   weekend (answer 8), in words, with
   what National Rail says to do instead.
6. **If it's badly disrupted** (§7, question 9): what National Rail
   advises instead, such as other routes where tickets are accepted and
   replacement buses (answer 10). A route worked out by Trainchecker
   itself, with a journey time, needs a journey planner, so it waits for
   a later version (answer 11).
6a. **A message of the day** to sign off (John, November 17th 2026): one
   of 366 messages, the same for everyone for the whole day, curated by
   John in a Claude chat and supplied as a `.ts` file.
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
   "Incidents" feed, listed as free on RDM. Its page says it covers
   planned engineering work as well as unplanned disruption (checked
   November 17th); how far ahead isn't stated. RDM's newer "NationalRail
   Disruptions API" may do the same job (`design/data-research-2026-11-17.md`).
4. **Changes and alternative routes (later, not the first version):** no ready-made free journey planner
   was found. Options, to test in stage 1: (a) the full timetable (RDG's
   timetable files, free from the National Rail Data Portal), with
   Trainchecker working out routes itself; (b) the live boards' calling
   points, combined at likely changing stations. Option (a) is more work
   but works for future days too.
5. **Station names and codes:** National Rail's station list (in the
   timetable files and the Knowledgebase).

Licences: read on November 17th 2026 (`design/licences-2026-11-17.md`).
All three are free and allow the data to be shown to the public, with a
credit to the Rail Delivery Group and, for live departures, National
Rail. The incidents data may only be used in the UK, so the functions
run in London. Credit wording agreed with John at the mock-ups.

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
4. **The verdict:** based on the next four hours and known problems; the
   last week modifies it with "However, it's worth knowing…" or similar.
   *The exact rules and wording are agreed with the mock-ups (stage 2).*
5. **"On time":** within 3 minutes, said in words.
6. **The last week:** no asking when the visitor travels. Every train on
   the journey in the four hours after the enquiry, on each of the last
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
13. **Credits:** however National Rail's terms require. Read on
    November 17th: credit the Rail Delivery Group and National Rail, with
    no suggestion of endorsement (`design/licences-2026-11-17.md`).
14. **Share button:** yes. Its sentence is agreed with the mock-up.

## 8. Agreed at the mock-ups (stage 2, November 17th 2026)

Agreed by John on November 17th 2026. Every sentence's exact wording, John's answers and the
real examples are in `design/mockups-2026-11-17.md`; the rules and sentences as code are in
`design/mockups/` (`analyse.mjs`, `sentences.mjs`, `incidents.mjs`); the private page is
https://claude.ai/artifact/QAUKZcDt6Xrhph1aPAUgAS.

1. **The page, top to bottom:** the station boxes ("From", "To", swap, "Show trains", recent
   journeys); a strip "TRAINS TO CHECK" with the journey, Swap and Change; the date and time
   fetched, "Live from National Rail." and Check again; the verdict; "The next four hours"
   with "Platforms" beside it on a computer, and "The last two hours" under Platforms unless
   the verdict has given it; "The days ahead"; "The last week"; Share; the quote of the
   day; "About these figures"; the footer.
2. **The verdict** (rules from the stage 1 recommendation): "Good news: trains from A to B
   are running well this evening." ("leaving on time" when the last two hours were bad);
   "It's a mixed bag: most trains … are running …, but two of the 18 in the next four hours
   are cancelled."; "Be prepared: trains … are (badly) disrupted …. Of the next 30, 10 are
   cancelled …, mostly because of …". "Delayed" with no time counts as late.
3. **The last two hours in the verdict** only when bad (two or more cancelled, or fewer than
   three in four within three minutes), and not after "Be prepared": "Half of the trains on
   this route in the last couple of hours got to B within three minutes of their timetabled
   arrival. The others were mostly about six minutes late, and the latest was 23 minutes
   late." The usual amount (the middle one) and the latest, not an average.
4. **Long journeys** (fewer than three arrivals): the trains that left A in the last two
   hours, by actual or expected arrival at B, with the tense to match ("are expected to
   reach", "reached", "have reached or are expected to reach").
5. **Rounding:** with 10 or more trains, the nearest of one in twenty, one in ten, a quarter,
   a third, half, two thirds, three quarters, nine in ten, nineteen in twenty, with "about"
   unless exact; fewer than 10, the real count ("five of the nine"); "all" and "none" plainly.
6. **Numbers:** minute counts in sentences follow the house number rule ("three minutes",
   "20 minutes"); the train list keeps digits. Times "6.26pm".
7. **The next four hours:** no clock times in the sentences; the late and cancelled trains
   summarised with National Rail's reasons, shortened ("because of a fault on a train",
   "mostly because of …" when there are more than two reasons); the list of trains folded
   away ("Show the three trains that aren't on time").
8. **Platforms:** "At the moment, most trains are going from platform B…", or "At the
   moment, trains are going from platforms including 10, 10A, 11 and 13."; "No platforms
   have been announced yet."
9. **The days ahead:** only incidents whose summary names both stations, or "to / from /
   via" one of them; a single amended train only in its own direction. National Rail's
   advice always folded. (Matching to be tested properly in stage 4.)
10. **The last week:** John's sentence, hours 5am to midnight, the same kind of day; the
    result with margins of 3, 10, 30 and 120 minutes: "… about a third of the 26 trains
    that left Reading between 5pm and 5.30pm reached London Paddington within three minutes
    of the timetable. Of the others, about three quarters were less than 10 minutes late,
    and the rest 10 to 30 minutes late." A train missing 120 minutes counts as cancelled.
    Elizabeth line note where it runs.
11. **No direct train:** "We can't find a direct train from A to B in the next four hours.
    Trainchecker only covers direct journeys – if you know part of the route, try that."
12. **Share** sends a sentence and the link (`#RDG-PAD`, station codes) separately: "Here's
    how the trains from A to B were looking at 6.24pm on November 17th: good news, they
    were running well. From Trainchecker." (past tense, a date; the summary follows the
    verdict).
13. **Quote of the day:** John's `src/data/quotes.ts`, unchanged, `quoteOfTheDay()`; option
    C revised (a tinted band, large opening and closing quotation marks, the author and
    source beneath, a small Share under the closing mark); verse lines on separate lines;
    Share makes a picture of the quote with "The quote of the day on Trainchecker for
    November 17th, from E. W. Hornung." and a link to the first page (picture shown to John
    first).
14. **Colours:** a coloured edge on the verdict (olive good, terracotta mixed, red be
    prepared, grey no direct train) and on each listed train (red cancelled, terracotta
    late).
15. **Favicon C** (the front of a train, `design/favicon-options/C.svg`); link-preview
    picture A ("How’s this train line doing", `design/preview-options/og-A.html`).
16. **About these figures, the credit and the privacy line:** as on the mock-up page, agreed
    for now.

## 9. Agreed while trying stage 3 (November 17th 2026)

Agreed by John on November 17th 2026, after trying the branch's preview on his computer and
iPhone. The exact words are in `src/lib/sentences.ts` and the components; the log in `CLAUDE.md`
has the examples.

1. **Station list:** National Rail's Knowledgebase Stations feed, all 2,616 stations, bundled
   with the page (`scripts/build-stations.ts`).
2. **Layout:** "The last two hours" across the full width under "The next four hours" and
   "Platforms" (which are the same height), replacing §8.1's "under Platforms".
3. **"Both"** for two of two ("Both are expected on time").
4. **"Copy a link to this journey"** in the notes' grey; it copies the Share sentence with the
   link on the line below.
5. **The last train gone:** with trains in the last two hours and none in the next four, after
   6pm or before 4am, "The last direct train from A to B seems to have gone: …"; in the day,
   "The latest direct train from A to B left at …"; the Share sentence to match.
6. **Platforms with one or two known**, the error and waiting messages, and the last week's
   Saturday, Sunday, no-train, one-train and none-on-time wording (John's question 3, a to e).
7. **The quote's Share picture** as built (`design/previews/stage3/quote-picture-*.png`).
8. **The last week's speed:** about 25 seconds for Reading to Basingstoke on the preview: fine.

## 10. Agreed at the start of stage 4 (November 17th 2026)

Asked for by John on November 17th 2026, before stage 4's work; built on the stage 4 branch.

1. **Order:** the quote of the day now comes before "The last two hours", on computers and
   phones: … the verdict; Share; "The next four hours" and "Platforms"; the quote of the day;
   "The last two hours"; "The days ahead" (stage 4); "The last week"; "About these figures"; the
   footer. (Replaces §8.1's order for these parts.)
2. **The last two hours are never in the verdict** (replaces §8.3): they always stay in "The
   last two hours". After "Good news" the only difference when they were bad is "leaving on
   time" for "running well"; after "It's a mixed bag" nothing in the verdict changes. The verdict
   itself is decided from the next four hours only, as before.
3. **Share ("Copy a link to this journey", "Share this journey" on phones)** straight under the
   verdict it quotes, for John to confirm (he wasn't sure where it should go).
4. **"The days ahead" may also list what might affect the journey** (John, option 2): incidents
   that name A or B but don't meet §8.9's rule (one amended train only when it leaves A or ends
   at B), after the rest, under "These might affect some trains from A to B too, as they involve
   B:" ("This … as it involves …" for one; "A or B" when both). Not folded.
5. **§8.9's rule, as built** (`src/lib/incidents.ts`; trial in `design/incidents-trial-2026-11-17.md`):
   both stations named; or one named after "to / from" (with or without "/ via"), and, for John
   to confirm, after "at", "through", "in the … area" or "via"; one amended train only from A to
   B. Cleared disruption and called-off work are left out.
6. **Arrows on the folds** (John, November 18th 2026): a down arrow to unfold, pointing up when
   open; on National Rail's advice and "Show the … trains that aren't on time".
7. **The line closed today** (John, November 18th 2026, agreed): with no train in the next four
   hours and an item for the journey, applying now, saying buses replace the trains (not only at
   some hours): "**Be prepared:** National Rail says buses are replacing trains between A and B
   today. Their advice is under “The days ahead” below." Then "The days ahead" and the quote.
   Drafts: the same with "no trains are running", and the Share sentence ("…National Rail said
   buses were replacing trains between A and B that day.").
8. **Badly disrupted** (John, agreed): "Be prepared" adds "National Rail’s advice, including
   other ways to travel with your ticket, is under “Disruption now” below." when National Rail
   lists disruption now for the journey.
9. **Drafts agreed** (John): the section's loading line and the message when the feed can't be
   reached.
10. **A summary above the fold** (John, November 18th 2026: option A): under each item's summary,
    at most two sentences of National Rail's own advice: its first sentence, then the first that
    names this journey's trains and says what changes (for one amended train, the sentence about
    it), leaving out ways round it. "…, and run later than usual throughout" is dropped (John).
    A sentence ending "will:" before a list is joined to the list.
11. **Single services very early or late** (before 7am, or from 10pm), two or more, grouped (John):
    "TWO SINGLE SERVICES", then "If you're travelling before 6am between now and Friday or after
    11pm on Saturday you may be affected – see more details.", and a fold "More details" with each
    service's summary, its two sentences and National Rail's advice. After midnight: "after
    midnight on Friday night" (Claude's, so it isn't read as Saturday night).
12. **What can't affect the journey is left out** (John, agreed): "might affect" items naming other
    stations stay only if one is a station this journey's trains call at (the live board, including
    beyond B); a single amended train stays only if its advice names the other end.
13. **The Disruptions API** (compared November 18th 2026, `design/data-trial-2026-11-17.md` §10):
    the same incidents as the feed, unplanned only; for John to decide whether to keep it.
14. **Drafts agreed** (John, November 18th 2026): the "no trains are running" verdict, the
    line-closed Share sentence, and "after midnight on Friday night".
15. **Wording** (John, November 18th 2026): platforms say "currently" ("Trains are currently going
    from platforms including …", "Most trains are currently going from platform B …"); the
    summaries' reasons say "a fault on the train" (the train list keeps "this train"); "This might
    affect …" when the list shows one entry (two grouped single services count as one); numbers
    one to nine in words in National Rail's sentences where they count something ("closing two out
    of four lines").
16. **Trains an hour** (John, November 18th 2026), with more than eight in the next four hours:
    groups by journey time to B: fast (no more than a quarter longer than the quickest, or within
    10 minutes of it), slower (only if usually 10 minutes or more longer), and the Elizabeth Line
    on its own when it's slower; a company named only when every group is one company and they
    differ, and its name isn't shared ("LNR & WMR" isn't named). "An hour" said once, one "and",
    journey times only for groups in the middle: "There are eight fast trains an hour from Reading
    to London Paddington in the next four hours, two slower ones (taking about 40 minutes) and
    about two on the Elizabeth Line." Fewer than four in a group: "three on the Elizabeth Line in
    that time" (Claude's draft). Eight or fewer: the count, as before. "Slower", not "slow".
17. **"Elizabeth Line"** with a capital L, as National Rail shows it (John).
18. **The train list** (John): each train's status ("Cancelled" in red, or how late), then on the
    same line, in the explanation's font, " because of … (Great Western Railway)." The table's
    "Why" column and the company under the destination are gone.
19. **"To the end of this weekend"** ("today" on a Sunday), no date; with nothing listed: "National
    Rail isn't listing any planned engineering work for this journey between now and the end of
    this weekend." (John).
20. **National Rail's summaries in the house style** (John, agreed): the date at the end dropped
    (the line above says when), except after a time or "until further notice"; dates and times in
    house style ("Wednesday November 18th", "5.31am"), in the two-sentence summaries too; "to / from
    / via" as "to, from and through", "to / from" as "to and from", other lists "A, B or C";
    numbers one to nine in words where they count something.
21. **Approved** (John, November 18th 2026): "three on the Elizabeth Line in that time" for a
    group of fewer than four, "eight" (no "about") when exact, and the house-style rewording.
22. **"An hour" after every group** (John): "…two slower ones an hour (taking about 40 minutes) and
    about two an hour on the Elizabeth Line."
23. **When, as people say it** (John): the words in the kicker's capitals, the date in brackets in
    ordinary type: "ON SUNDAY (November 22nd)", "NOW UNTIL FRIDAY (November 20th)", "TOMORROW
    (November 19th)", "FROM FRIDAY TO SUNDAY (November 20th to 22nd)", "LATER TODAY", "UNTIL THE
    END OF TODAY", "NOW". Beyond the coming week, full dates as before.
24. **Platforms by kind of train** (John: "accurate but not all that precise"), when the trains
    fall into groups: "Most fast trains are currently going from platforms 10 and 11, with slower
    ones using mostly platform 15A and Elizabeth Line trains using platforms 13 and 14." Up to two
    platforms a group, covering at least two thirds of its trains with a platform; "Most" or
    "mostly" unless they cover all; "10A" counted as 10 where plain 10 is in use. One kind of
    train: as before.
25. **"Mostly using"** rather than "using mostly" in the platforms sentence (John).
26. **"On this route"** (John): "Planned engineering work and changes on this route from National
    Rail, to the end of this weekend:". The sentence when nothing is listed keeps "for this
    journey".
27. **The line before possible changes** (John), in the same type as the planned line: "Other
    changes involving London Paddington which might also affect this route:"; one entry: "Another
    change involving …"; with nothing listed above: "Changes involving … which might affect this
    route:" or "A change involving …" (Claude's, to match). Replaces §10.4's sentence.
28. **What might affect the journey, tightened** (after John found Southampton to Bournemouth shown
    for Basingstoke to Southampton Central): "the route" is now only the stations between A and B;
    an item is left out when its advice says the journey's trains carry on ("Trains will continue
    to run between Reading and Southampton Central", "other services are available"); otherwise
    it stays if it names no other station, a station between A and B, or its advice has a sentence
    about trains between A and B that stop there (not "via Bath Spa (not calling)"). Reading to
    Newbury now drops out for Paddington to Reading.
29. **The last two hours with cancellations** (John, November 18th 2026): "Of the trains on this
    route in the last couple of hours which weren't cancelled, about 19 in 20 got to B within
    three minutes of their timetabled arrival. The other was seven minutes late. Two trains didn't
    run at all." Without cancellations, as before. Rounded shares in digits from 10: "one in 20",
    "one in 10", "nine in 10", "19 in 20".
30. **One or two late trains in their own tense** (John): "The other is expected to be seven
    minutes late" or "Of the other two, one was six minutes late and the other is expected to be
    seven minutes late", not "was or is expected to be".
31. **Platforms:** no "Most" when every announced train uses one platform ("Trains are currently
    going from platform 1."); by kind of train only when the kinds use different platforms (John,
    Tiverton Parkway).
32. **The last week counts only the trains that ran** (John): "…none of the four trains that left
    Tiverton Parkway between 7am and 8am reached London Paddington within three minutes of the
    timetable. Of these, one was less than 10 minutes late, and the rest 10 to 30 minutes late. One
    more was cancelled." All cancelled: "…both trains due to leave A between X and Y were
    cancelled." A plain count for few ("one was", not "one of the four was").
33. **No direct train:** "Trainchecker only covers direct journeys – please try another." (John).
34. **No record** (John): "Sorry, National Rail isn’t offering historical data between these two
    stations." In place of the hour choice when every train is on the Elizabeth Line and Paddington
    or Bond Street is one end; and in place of "no trains left…" when an Elizabeth Line journey's
    answer is empty.
35. **A cross (×) in the station boxes** to empty them in one tap (John), keeping the cursor there.
36. **"Ten" after a spelt number** (John): "10" is spelt when it follows one to nine within two
    words ("nine in ten", "four and ten minutes late"); otherwise digits ("one was less than 10
    minutes late"). Not for times or platforms.
37. **One platform known:** "So far, a platform has only been announced for one train: platform
    12A." (John).
38. **The tagline** (John): "How the trains are doing, written the way we speak." The link-preview
    picture remade (`design/og-trainchecker.html`, `node design/og-shoot.cjs`, fonts from
    `node_modules`), broken after the comma.
39. **Suggestions stay open while a name is being typed** (John, Ivybridge): they close only when
    the box holds a station's full name, not when the letters typed so far happen to be a code
    ("Ivy" is Ivybridge's code, IVY).
40. **The last week via a stand-in station** (John's idea, tested November 18th 2026): when every
    train is on the Elizabeth Line and the record leaves an end out (Paddington or Bond Street), the
    last week measures to (or from) Ealing Broadway when the trains call there, otherwise the
    nearest stop the record covers, under "National Rail’s record leaves these trains out at Bond
    Street, so this shows how they ran as far as Ealing Broadway." (Claude's draft). With both ends
    left out, the no-record message (§10.34).
41. **Journeys with Elizabeth Line and other trains, where the record leaves the Elizabeth Line out
    at an end** (John, Twyford to Paddington): two parts. The other trains to the real end, any
    stray Elizabeth Line run left out, named when one company ("six of the eight Great Western
    Railway trains that left Twyford…"); then "National Rail’s record leaves Elizabeth Line trains
    out at London Paddington, so for those this shows how they ran as far as Ealing Broadway."
    (Claude's draft) and the Elizabeth Line trains to Ealing Broadway ("…of the 11 Elizabeth Line
    trains that left Twyford…"). The history asked for one company with its own `toc_filter`.
42. **The last week's trains not on time, as counts** (John, November 18th 2026), when fewer than
    10: "Another two were less than 10 minutes late, and the other one was 10 to 30 minutes late."
    "One more was…" when the first band is one; three bands: "Another two were …, one was … and one
    was …"; one band: "The other three were…" ("The other was…"); none on time: "One was less than
    10 minutes late, and the other three were 10 to 30 minutes late." or "They were all…". Ten or
    more: rounded shares and "the rest", as before. A band ("10 to 30") keeps its digits.

## 11. Agreed at the fresh look (November 18th 2026)

John accepted every recommendation of the fresh look (report of November 18th 2026, commit
58b8a5d), with the choices below. Built and live the same day. These replace earlier points where
they differ.

1. **"Be prepared" counts** (2.1, 2.3): only what applies, never "zero are cancelled": "Of the next
   six, all six are running late."; "all four are cancelled" (and "All four are cancelled" in "The
   next four hours") when every train is; the Share sentence gives the same counts.
2. **Late arrivals** (2.2, option b): when someone arriving now would reach B 45 minutes or more late,
   the verdict says so ("Someone arriving at the station now is expected to reach B about 50 minutes
   later than the timetable says."); "The next four hours" says when trains leave on time but are
   expected at B more than five minutes late, and lists them ("Expected at B 7.44pm, 55 minutes
   late"); a "Delayed" train with no time counts at its timetabled time in the 45-minute rule.
3. **Every train cancelled, Platforms** (2.3): "None of these trains is running, so there are no
   platforms to show." ("This train is cancelled, so there's no platform to show." for one).
4. **After midnight** (2.4): "tonight" from midnight to 4am; "the first trains of the day" after
   midnight (still "tomorrow" from 6pm).
5. **Three cancellations** (2.5, option b): "Be prepared" only when also more than one train in 20.
   "About these figures" says so.
6. **The last train gone** (3.1, option a): "The last two hours", "The days ahead" and "The last week"
   shown, without the second station chooser. "No direct train at all" is unchanged.
7. **Recent** (3.2): not kept when there's no direct train either way in the six hours.
8. **Station boxes** (4.1 to 4.3): the suggestions close once the box holds a full name, even when
   longer names start with it (§10.39 still holds for codes); apostrophes ignored ("King's Cross");
   Return in From moves to To.
9. **The days ahead** (5.1 to 5.3, and John's rule on past start dates): the same time on different
   days said once ("after midnight on Friday or Saturday night"); the two-sentence summaries tidied
   like the summaries (slashes as words, "Monday 9 to Tuesday 17 November" as a whole); a short list
   after a colon (up to three items) joined on; a longer one ends the sentence at the colon, and
   "The following …:" isn't used; a start date that has passed is left out ("From Monday 10 August,
   … will run" → "… are running"; "From Monday 9 to Tuesday 24 November, buses will replace" →
   "Until Tuesday 24 November, buses are replacing"); one still to come stays. National Rail's
   advice in the fold is unchanged.
10. **The last week** (6.1 to 6.3): "Check again" keeps the page (and the last week's answer and open
    folds) while it asks again, saying so if it can't; the Elizabeth Line note and the no-record
    message only when Paddington or Bond Street is an end; counts up to 20 trains not on time
    (replaces "fewer than 10" in §10.42), shares above that.
11. **Across the site** (7.1 to 7.3): printing keeps cards whole and leaves out the last week's box
    without an answer; the tab names the journey ("Reading to London Paddington – Trainchecker");
    the introduction runs the full width and adds "and, if you ask, how they ran over the last week".

## 12. Agreed in stage 5 (November 18th 2026)

1. **Search:** title "Trainchecker – free train delays and disruption checker"; description "Free
   live train delays between any two stations in Great Britain, in plain English: the next four
   hours, platforms, the last week and engineering work."; link previews the name and tagline.
2. **The last two hours, share first** (John: "the way we speak"). Replaces the "Of the trains…"
   openings in §8 and §10. Illustrations only:
   - "All four trains leaving Midgham in the last couple of hours reached Reading within three
     minutes of their planned time." Likewise "Both trains leaving…", "Five of the nine trains
     leaving…", "About three quarters of the trains leaving…", "19 in 20 trains leaving…"; but
     "None of the four trains that left Midgham…".
   - Tenses: "reached Reading"; "are expected to reach Reading"; "have reached Reading (or are
     expected to do so)". "One of the nine" takes "is" and "has".
   - Three or more arrived (only those counted): "All 12 trains on this route in the last couple of
     hours reached Reading…"; with cancellations, "…trains that ran on this route…", then "Two more
     didn't run at all."
   - One train: "The only train leaving Midgham in the last couple of hours got to Reading within
     three minutes of its planned time." / "…was six minutes late getting to Reading." (or "is
     expected to…"), with no sentence after it (it had read "They was…").
   - The sentences after it are unchanged.
3. **Share:** "…got there within three minutes of their planned time" (was "of the timetable").
4. **The last two hours, cancellations:** "Two more didn't run at all." whenever trains are counted before
   it; one train with cancellations, "The only train that ran from Midgham…".
5. **The next four hours:** "It's expected to be on time." / "Both of them are expected to be on time." /
   "They're all expected to be on time." / "The rest are expected to be on time." / "The other one is
   expected to be on time."
6. **The last week** (illustrations only):
   - The days, with no dates: "On the weekdays from last Wednesday until yesterday, …" (Tuesday to
     Friday); "From last Monday to Friday, …" (Monday); "Last Saturday, …"; "Last Sunday, …".
   - "…all five trains leaving Midgham between 11am and midday got to Reading within three minutes of
     their planned time."; "both trains leaving"; "five of the nine trains leaving"; "about a third of the
     26 trains leaving"; but "38 of the 40 trains leaving" for the "in" shares (was "about 19 in 20 of the
     40"); "none of the four trains that left Midgham…".
   - One train: "…the only train leaving Midgham … got to Reading within three minutes of its planned
     time." / "…was less than 10 minutes late getting to Reading." ("10 to 30 minutes", "more than half an
     hour"); "the only train that ran from" with cancellations.
   - Unchanged: no trains ("no trains left … for …"), all cancelled, and the sentences after.
   - The line under the hours: "Today is a weekday, so that's what this checks. (Saturdays and Sundays
     have their own timetables.)", and the same for Saturdays and Sundays. The waiting line is unchanged.
   - About keeps "within three minutes of the timetable" (a definition).
7. **Sharing a link** (the link-preview picture and its text tags): "Check how the trains are doing, with
   gentle, natural-sounding answers and a fragment of inspiration." In the picture, three lines broken at
   the commas (option A), in bold (Figtree 700, John). The tagline itself is unchanged; baish.net's line is "Are the trains OK? (With
   gentle, natural answers.)".
8. **Platforms, the fold** (John): "Show the trains with platforms" (one: "Show the train with a platform"), opening
   "There are trains leaving at 3.12pm (platform 2), 3.34pm (four minutes later than planned, platform 3) and 3.58pm
   (platform 2)." The next ten with a platform, in the order they're expected to leave; cancelled ones and trains with
   no platform left out; then "We're only showing you the next ten departures, there are another 19 running later which
   also have platforms showing." ("already" dropped, John.) One platform for all of them, or two for three or more
   trains, said once: "There are trains leaving from platforms 9 and 13 at 6.36pm, 6.37pm (nine minutes later than
   planned) and 6.51pm." Illustration only. Long journeys' arrivals: Claude's drafts agreed. About names the arrivals.
   By kind of train, as the Platforms sentence groups them (John): "Fast trains are leaving from platforms 10 and 11 at
   9.01pm, 9.10pm (six minutes later than planned) and 9.12pm, slower ones at 9.04pm (platform 14A) and 9.38pm (platform
   15A), and Elizabeth Line trains from platform 14 at 9pm and 9.30pm."; "a slower one" for one; 10A counted as 10 where
   plain 10 is in use; the ten-train limit across them all. Illustration only.
9. **Arrivals** (John), after the last week, folded under "At Oxford from Reading": "Trains are expected at 3.05pm (the one
   due to leave Reading at 2.40pm), 3.22pm (the 3pm from Reading, arriving four minutes later than planned), 3.30pm (the
   3.15pm, arriving six minutes later than planned) and 3.45pm (the 3.20pm)." The next hour, up to 10, "and more after
   that"; one: "One train is expected, at …"; none: "No direct trains from Reading are expected at Oxford in the next
   hour." and, if one was cancelled, "The one due in at 3.14pm was cancelled." Journeys of two hours or more: a draft
   sentence saying trains that left more than two hours ago can't be seen. Illustration only.
   Then (John): the hour said up front, and no "and more after that": "The first ten trains in the next hour are
   expected at …" (more than ten); "The trains arriving in the next hour are expected at …" (three to ten); "There are
   two trains arriving in the next hour. They're expected at …"; "The only train arriving in the next hour is expected
   at …". Long journeys (Claude's draft, agreed): "Trainchecker can see three trains arriving in the next hour. They're expected
   at …" (or "one train …, expected at …"), then the note.
10. **The last two hours, again** (John, November 18th 2026): "have reached (or look like they will reach) Manchester
    Piccadilly …" (trains still to arrive keep "are expected to reach"); more than two late trains as a range, "The
    others were between four and 23 minutes late, most of them less than 10." ("most of them less than 10, 15, 20, 30
    or 60" only when the range is more than 10 minutes), replacing "mostly about … and the latest was …"; "expected"
    said once in the paragraph, then "set to be" ("The others were, or are set to be, between five and 78 minutes
    late…"). Illustration only.
11. **Share:** "in the next four hours" (was "following").
12. **Times in a list:** "am" or "pm" said the first time and again only when it changes; on the hour it stays ("9pm").
    Times in brackets count ("7.58pm (the one due to leave Oxford at 7.30), 8.19 (the 7.16 from Oxford, …)").
13. **The two lists laid out** (option D of four mock-ups): a lead line, then bold times, a time with something to say
    on its own line, the rest run together with accent-coloured dots; one or two trains stay a sentence. Fast, slower
    and Elizabeth Line trains each get a lead ("Fast trains, from platforms 10 and 11:").
14. **Share for each list**, separately: "Share these trains" and "Share these arrivals" ("Copy …" on a computer), the
    words Claude's drafts, agreed: "Here are the trains from Reading to Midgham with platforms, as of 8.22am on November 18th.
    There are trains leaving at … From Trainchecker." and "Here are the trains due at Midgham from Reading, as of …".
15. **"Delayed" with no time** (John, November 18th 2026): out of both lists, as it isn't expected at its timetabled time;
    a sentence of its own after the list, with the reason when the board gives one. Arrivals: "The 10.01pm from Oxford,
    due at 10.25, is delayed, with no new time given yet." / "The 10.01pm and 10.23 from Oxford, due at 10.25 and 10.46,
    are delayed, with no new times given yet." / all of them: "The trains due in the next hour are delayed, with no new
    times given yet: the 10.01pm from Oxford, due at 10.25, and the 10.23, due at 10.46." With delayed trains as well,
    "Trains are expected in the next hour at …", "Two trains are expected …", "One train is expected …" (not "The only
    train…" or "There are two trains…"). Platforms: "The 3.30pm, from platform 3, is delayed, with no new time given
    yet." Illustration only.
16. **More than ten trains with platforms** (John, November 19th 2026): no sentence about the rest
    ("We're only showing you the next ten departures…" is gone); the list starts "The next ten trains are
    leaving at:" (or "…leaving from platform 1 at:"). Where the trains are grouped by kind, "The next ten
    trains" comes first, in bold with no colon (John), then the groups as before, and the Share words begin "Of the next ten trains,
    fast ones are leaving…" (Claude's draft for the grouped case, for John).
17. **"The next ten trains" above grouped lists** (John, November 19th 2026): in small orange capitals,
    as the day labels in "The days ahead" (option C), so "Fast trains:" reads as the first heading.
18. **The two lists' Share sends a picture** (John, November 19th 2026), always in the dark colours, with
    a sentence and the journey's link sent separately (house style §17). Platforms (option B): a row per
    train with the time it's leaving, the kind of train when the list is grouped, lateness in orange
    ("six minutes late"), and the platform as a badge; when all share one platform, "All from platform"
    and the badge once in the heading row (3.1). Arrivals (B1): "Due in" with the timetabled arrival,
    "From Reading" with "the 8.47pm", and "arriving three minutes late". Every row keeps its "am" or "pm".
    A train delayed with no time is a row of its own, "delayed, no new time yet" (Claude's draft); a long
    journey's note about trains Trainchecker can't see goes under the rows. The words: "The next ten
    trains from Reading to London Paddington with platforms, at 6.24pm on November 17th, from
    Trainchecker." ("The trains…" with ten or fewer); "The trains due at London Paddington from Reading,
    at 8.59pm on November 17th, from Trainchecker." ("The first ten trains due at … after 8.59pm on
    November 17th…" with more). With no trains in the list, the words alone, as before.
19. **Delayed trains with no time in the pictures** (John, November 19th 2026): a bold orange "?" in
    the time box and the explanation beside it, at the bottom of the list so the times above run in
    order. Arrivals: "the 8.58am · delayed, was due 9.21am, no new time yet"; platforms: "the 9.31am ·
    delayed, no new time yet", with the platform badge kept. Orange, not red (red means "be prepared"
    and cancellations). The kind of train ("Fast", "Slower", "Elizabeth Line") now shows on arrivals too
    when the journey has more than one kind, so two "8.58am" trains can be told apart. A long note goes
    on a second line.
20. **The lists on the page as boards** (John, November 19th 2026, option B of two): the folds under
    Platforms and Arrivals show the share pictures' layout in the page's own colours (light or dark): a
    row per train, the time in bold, the kind of train and lateness beside it (lateness on its own line
    on a phone), platform badges. A one-platform list with nothing to say about any train is a line of
    times, "am" or "pm" said once: tiles on a phone, even columns under a light rule on a computer, with
    "All from platform" and the badge above (John, after three layouts). The friendly voice stays in the sentences: Platforms
    keeps its sentence above the fold; Arrivals gets one too (Claude's draft: "More than ten trains are
    due in the next hour. Of the first ten, eight are expected on time, and two are running between
    three and five minutes late."; "Trainchecker can see one train due in the next hour." on a long
    journey); its fold keeps "At Reading from Midgham" (John). A delayed train's sentence, with its reason, stays
    under the board.
21. **The big time is the one to act on** (John, November 20th 2026): in both boards and both pictures
    the bold time is when the train is now expected to leave or arrive, and a late one says "was due
    12.47, running late" beside it ("am" or "pm" left off when it matches, kept across midday or
    midnight: "was due 11.58am"). Headings "EXPECTED TO LEAVE" (on one line) and "EXPECTED IN".
    Arrivals are now in the order they're expected; "the 12.35pm" stays as the train's timetabled
    departure from A. This replaces §12.17's timetabled arrival time: on November 19th John meant the
    timetabled departure from A to be shown, not the big time to be the timetable (12.59 read as the
    time expected, so "the 12.35pm … 11 minutes late" looked like a 13-minute journey). The sentences
    under Platforms say "6.39 (was due 6.36, platform 10A)"; Arrivals' "(the one due to leave Reading
    at 8.37 and arrive at 9.01)" (illustration only), "(the 8.47, which was due at 9.10)" (Claude’s draft). The boards'
    sentence counts lateness from the minutes, not the words. A late note breaks only after its comma.
22. **Tighter late notes** (John, November 20th 2026, after trying §12.21 on his iPhone): Platforms says
    only "was due 1.42" (the heading "EXPECTED TO LEAVE" shows it's late); Arrivals says "running 15
    minutes late" instead of a third time ("1.44pm the 1.05pm · Fast · running 15 minutes late"). The
    sentences follow: "(the one due to leave Reading at 5.41, running two minutes late)", "(the 8.47,
    running three minutes late)". A delayed train with no time keeps "delayed, was due 8.45am, no new
    time yet".
23. **"was due to go at"** (John, November 20th 2026): Platforms' late note is "was due to go at 2.19", on
    the board, in the picture and in the sentence ("6.39 (was due to go at 6.36, platform 10A)"). It
    fits on one line on a 390px phone, even with "12.28" (measured; "was due to leave at" didn't).
24. **Arrivals: an arrow at the big time** (John, November 20th 2026, option D of four,
    `design/board-options/arrivals-lateness-options.png`: "closer to what people actually say"): a late
    arrival reads "6.25pm · the 5.41pm · Slower · ← two minutes late", the arrow drawn in the page's icon
    style (Lucide's arrow-left), so the lateness belongs to the time and 6.25 plainly includes it. On a
    phone the note keeps its own line; on a computer and in the picture it follows the train with a gap
    rather than a dot. Screen readers hear "two minutes late". The Arrivals sentence keeps "(the 6.01
    from Reading, running two minutes late)", having no arrow.
25. **The arrow on its own line everywhere** (John, November 20th 2026): on a computer and in the shared
    picture, as on a phone, a late arrival's "← two minutes late" sits under the train, starting at the
    column's edge, so the arrow points straight at the big time; in the picture those rows are taller (110
    rather than 90) so neither line shrinks. Platforms' notes stay beside the train on a computer.


26. **Earlier trains with no platform yet** (John, November 22nd 2026, option A): at Paddington the
    Elizabeth Line's platform B is shown about an hour ahead, the main line's much nearer the time, so
    the list could start at 8.15am with five trains leaving before it. When a train still to leave
    before the first one with a platform has none yet: Platforms says "So far, platforms have only been
    announced for the Elizabeth Line trains, which are going from platform B." (one kind of train has
    platforms) or "So far, platforms have only been announced for later trains: from 8.15am, all from
    platform B."; and a line above the list (and in its picture and Share words): "Five earlier trains,
    at 7.36am, 7.38, 7.50, 7.51 and 7.53, don't have platforms yet." Claude's choices, told to John:
    "am"/"pm" once; more than six trains as "from 7.36am to 8.05".

27. **Engineering work about a train that has already gone** (John, November 22nd 2026, Paddington to
    Reading at 8.23am, still showing "Amended 12.34am …" and "The 6.38am … will not run"): on the
    item's last day, once a train's time has passed and it starts at A, an item about that one train
    drops out, and a day-long item's summary stops naming it (its first sentence stays, as the work
    goes on all day). Kept when the train starts elsewhere (it may still be to come at A) and on an
    earlier day of a longer item; no margin after its time. Claude's choices, agreed by John.

28. **The Share button's words, verdict first** (John, November 24th 2026), replacing "Here's how
    the trains from A to B were looking at …:":
    - "Good news, when the trains from Reading to Guildford were checked at 6.39am on November 24th
      they were running well." (or "…they were leaving on time, though …");
    - "It's a mixed bag for trains from A to B, according to a check at 6.24pm on November 17th.
      Most were running, but two of the 18 in the next four hours were cancelled.";
    - "Be prepared for the train journey from A to B. At 6.24pm on November 17th a check showed
      that, of the next 30 trains, 10 were cancelled and two were running late, mostly because of
      …"; with no counts, "…a check showed that someone arriving at the station then was expected
      to reach B about 55 minutes later than the timetable said."
    Then "From Trainchecker." and the link, as before. The date kept (§17); the no-train messages
    unchanged. Agreed by John.

29. **"The next hour" first, then "The following three hours"** (John, November 24th 2026), replacing
    "The next four hours" with "Platforms" beside it, so the page goes in the order people need it.
    No train is in both panels.
    - **The first panel** covers the next hour. With fewer than three trains running in it, it
      stretches to the third running train and is headed by its count, cancelled trains included
      ("The next three trains", "The next four trains"), with no opening sentence. Otherwise it
      opens "There are 15 trains in the next hour." The on-time sentence follows in the same
      paragraph. Folded under "Show the trains and platforms": a board of every running train in
      it, each with its platform badge (tap for the rough location guide) or "not yet"; cancelled
      trains not on the board but in a line under it ("The 7.13pm is cancelled, because of …").
    - **The second panel** is "The following three hours", or "Later" when the first was
      stretched. Its opening is short, as the heading gives the period: "There are about seven fast
      trains, two slower ones (taking about 40 minutes) and two on the Elizabeth Line per hour."
      ("per hour" here only; "about" once, when any figure is rounded); when any group has fewer than
      one train an hour, totals for every group ("There's one fast train and nine slower ones."),
      never totals and rates mixed; "There are three trains." for a few; when stretched, "There are
      two more trains in the next four hours." Then the on-time sentence; "Show the trains that
      aren't on time" (the bad news); "Platforms have already been announced for 11 of these: from
      platforms 10, 11 and 13."; and "Show the trains and platforms" (everything), as in the first
      panel. Side by side on a computer. Checked in `scripts/check-windows.ts`.

30. **Counts of trains running, cancelled ones "more"; the platforms line; Share for both panels** (John,
    November 24th 2026). Counts and rates in both panels are of the trains running, and cancelled trains
    are said as "more": "There are five trains in the next hour. Three more are cancelled, because of …";
    "There are five trains per hour. Seven more in that time are cancelled, mostly because of …"; the
    stretched heading counts the trains running ("The next three trains … One more is cancelled").
    The next hour's platforms line above its fold, as the second panel's: "Platforms have been announced
    for all of these: platform 1." (the second: "…have already been announced…"); "mostly" only with
    three or more trains and a real majority. Share at the foot of each panel's "Show the trains and
    platforms" fold ("Copy these trains" on a computer, "Share these trains" on a phone):
    - the next hour: a picture of its board, "not yet" for a train with no platform, headed "THE NEXT
      HOUR · 6.24 to 7.24pm on November 17th", with "The trains from A to B leaving between 6.24 and
      7.24pm on November 17th, with the platforms announced so far, from Trainchecker." (stretched: "The
      next three trains from A to B after 7.47pm on November 17th, …");
    - the following three hours: hour by hour, the panel's sentence then a row per hour, "7.24 to
      8.24pm" on the left, the trains running on the right ("four trains"; "no trains running", "no
      trains"), and under them in orange "one of these is late, three more are cancelled" ("it's running
      late" for a single train), with "The trains from A to B, hour by hour, from 7.24 to 10.24pm on
      November 17th, from Trainchecker."; when the first panel was stretched, the few later trains
      themselves, with "The later trains from A to B, up to 11.47pm on November 17th, with the platforms
      announced so far, from Trainchecker."

31. **"am" or "pm" once** (John, November 26th 2026). A list says it with the first time and again only
    when it changes ("The 6.44am, 6.48, 7.14 and 7.18 are cancelled"); a range says it at the end ("6.24
    to 7.24pm", "between 6.40 and 7.10pm"). Both keep it where it changes ("between 11.35pm and 5.15am")
    and on the hour ("7pm", "between 5pm and 5.30pm"). National Rail's times in "The days ahead" too
    ("The 8.40am and 9.10 London Bridge to Sutton trains", "between 9.10 and 9.40am"). The boards' rows
    keep it on every row, like a station departure board.

## 13. Connections (November 21st 2026)

John's idea, built and agreed with him in one day; `CLAUDE.md`'s log has the order it happened in.
The sums and sentences are in `src/lib/connection.ts`, with the agreed answers word for word in
`scripts/check-connection.ts`.

1. **What it is.** You're on a train from A to B and changing at B. A card under the quote of the
   day, laid out as Arrivals is: the heading "Connections", then a fold, "Check trains leaving B".
   No line under the heading. Inside: "Where are you going next?", "Which train are you on, or
   planning to take?", then the answer in a box with a coloured edge, a row of other trains to
   ask about, and Share.
2. **Stations offered:** those with a train from B in the next two hours, where any match what's
   typed; otherwise any station.
3. **Trains offered:** those from A still on their way, or arrived in the last three minutes.
4. **The four answers**, by the minutes you'd have: six or more, "you should be fine"; five, four
   or three, "it's going to be tight"; two or one, "that looks unlikely"; none or less, "You won't
   make the …". Opening: "If you're planning to get the 3.39pm to Torquay, you should be fine.
   You'll have 10 minutes to change trains."
5. **The times:** "Your train from Ivybridge is expected to arrive on time at 3.29, and the Torquay
   train is expected to leave on time at 3.39, getting there at 3.49." Late: "is running six
   minutes late and is now expected in at …"; "expected to leave two minutes later than planned
   at …". "pm" once. The arrival is the expected time, or the timetabled one.
6. **Only possible because the onward train is late:** "It's running five minutes late, which
   gives you four minutes to change trains." and "It may make up time, so don't count on it."
7. **Platforms:** "You're coming into platform 3 and you'll want platform 1, where your train will
   be showing on the departure board as the Paignton train." The "showing as" part only when the
   final destination isn't the one asked for. The same platform: "…leaves from the same
   platform." When the platform you come into isn't known, nothing is said about it.
8. **Fast, slower and Elizabeth Line trains** (the page's own rule) are named where a route has
   more than one kind: "the 3.29pm Elizabeth Line train". Slower trains stay in, as people may
   be booked on them. A later train that gets there sooner is pointed out: "The 3.29 fast train
   leaves at the same time but gets there sooner, at 3.55." Then both platforms: "you'll want
   platform 14 for the 3.29 Elizabeth Line train, or platform 11A for the 3.29 fast train." With
   one train on such a route: "platform 10 for the 3.27". The row of trains: "3.29pm Elizabeth
   Line, arrives 4.25". The trains the page suggests itself skip any that a later one overtakes.
9. **The next train:** after "fine", "The one after that is the 4.05 from platform 1, which would
   give you a 36-minute wait." (no "if you miss it"), with "two minutes later, " before the train
   when it leaves less than ten minutes after the first. After "tight": "If you miss it, the next
   one is …". Otherwise "The next one is …". When that one is tight or unlikely as well: "You'd
   have five minutes to change, so that's going to be tight too. The next connection which looks
   comfortable is the 3.48 from platform 9B, which would give you a 34-minute wait."
10. **Long waits:** an hour or more to the nearest quarter of an hour, "almost" or "more than"
    whichever is closer: "a wait of more than an hour and a half".
11. **No change needed:** "You don't need to change: the train you're on carries on to Exeter St
    Davids, and is expected there at …"
12. **The closing line**, when your train is more than 30 minutes from B: "These times can change,
    so it's worth checking again later."
13. **Share:** a picture of the box in the dark colours, its edge in the answer's colour, headed
    "Changing at Reading for London Paddington from the 5.25pm Midgham train", with "Here's how my
    change at Reading for London Paddington looks on Trainchecker." and the journey's link.
14. **Not agreed word for word (Claude's drafts, live):** the two questions; "got in at"; "a little
    early"; "N minutes after the … train is due to leave"; the delayed and no-train messages; "The
    3.45pm to York has been cancelled. If you're planning to get the … instead"; "arrives".
15. **For later:** how to get between the platforms ("over the footbridge"):
    `design/handover-platform-links-2026-11-21.md`.
16. **A long wait, more than 40 minutes** (John, November 22nd 2026, after Paddington to Midgham
    showed "you should be fine … 91 minutes to change trains"): "The next connecting train to Midgham
    is the 9.43am, which is going to give you quite a wait at Reading. You'll have more than an hour
    and a half between trains. … and the Midgham train is currently expected to leave on time, getting
    there at 9.59." Digits under 70 minutes ("52 minutes between trains"), words from 70. Only when
    it's really the next train you can make; a later one chosen: "If you're planning to get the
    10.43am to Midgham, that's quite a wait at Reading." A late onward train keeps its time
    ("currently expected to leave four minutes late, at 9.47"). Judged on the gap after lateness, so a
    gap shrunk to tight uses the tight wording.

## 14. Find my train from my location, and the train lists (November 26th 2026)

All agreed by John on November 26th 2026, after trying it on a journey from Reading to Paddington.
How it works, and the figures to tune: `design/find-my-train/README.md`.

1. **The button** "Find my train from my location", at the top of the train list in Connections and
   Exits, shown once a train in the list has left A. Under it: "Your location stays on this device."
   While working: "Finding your location…".
2. **The answers:** "From your location, you're probably on the 5.53pm." (chosen, as if tapped);
   "From your location, you're probably on the 8.42pm or the 8.47pm, which are close together at the
   moment. Please choose one below." (in time order); "You seem to be at the station still, so here's
   the next train, the 9pm." (or "…still. Please choose the train you're planning to take."); "You
   don't seem to be near the line from Reading to London Paddington at the moment, so please choose
   your train below."; "None of these trains seems to be near you at the moment, so please choose
   yours below."; "Trainchecker wasn't allowed to see where you are. You can change that in your
   browser's settings, or choose your train below."; "Your location couldn't be found. Please try
   again, or choose your train below." "On", not "taking", in these (John: no sentence ending in a
   preposition).
3. **The trains found go first**, edged in a dashed accent line, with "Or choose another" above the
   rest. Still at A, the list shows only trains still to leave or gone in the last two minutes.
4. **About these figures:** "Find my train from my location, in the Connections and Exits sections,
   uses your device's location only when you tap it, and only on your device: it isn't sent to
   Trainchecker or anyone else. It compares where you are with where each train should be by National
   Rail's times, so it can only say which train you're probably taking. The stations' positions come
   from National Rail, and from OpenStreetMap where the two differ."
5. **The train lists** in Connections and Exits: every train on its way, then the next four to leave,
   in time order (was the first eight, which could leave out the train just boarded).
6. **Expected times say so:** the train buttons read "expected into London Paddington at 10.26am",
   or "now expected into … at 10.31am" when a minute or more late; Arrivals "The next one is expected
   at 4.20pm.", "Three trains are expected in the next hour." (and the other counts), "…can't say
   which trains are expected at Plymouth in the next hour."; Arrivals' Share "Here are the trains
   expected at London Paddington from Reading, as of …" and its picture's words. Kept as "due": a
   timetabled time ("The one due in at 3.14pm was cancelled.", "the one due to leave Reading at
   2.40pm", "due at 3.30pm, is delayed", "was due to go at 2.19"), and "Your train is due into
   platform 9."
7. **A refresh keeps your place:** the same section, the same distance down, the same folds open;
   only after a refresh, kept in the tab's own storage. A train or station chosen inside Connections
   or Exits isn't brought back.
