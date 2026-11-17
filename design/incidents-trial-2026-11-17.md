# The days ahead: matching tried on the real incidents feed (November 17th 2026)

Stage 4, for John. National Rail's Knowledgebase Incidents feed, fetched at 10.23pm on Tuesday
November 17th 2026 (`design/mockups/snapshots/20261117-2223-incidents.xml.gz`): 937 incidents in
Britain, 896 planned and 41 unplanned. 104 are live between then and the end of Sunday November
22nd. The matching is in `src/lib/incidents.ts`; this report is made by
`node scripts/try-incidents.ts <feed> <time>`; `scripts/check-days.ts` checks it.

## What was found about the feed

1. **One date range per incident**, from its start to its end. Work done only at night or only
   at weekends has the whole span: "Buses replace late night trains between Swindon and Bristol
   Temple Meads … from Monday 16 to Thursday 19 November" runs from Monday 00:00 to Thursday
   23:59. The summaries always say which nights or days, so the page shows the summary with the
   range ("Now until Thursday November 19th: Buses replace late night trains …").
2. **Cleared disruption is marked as cleared** (`ClearedIncident`): 31 of the 41 unplanned were
   cleared, the other 10 live. Cleared ones are left out, as is planned work that National Rail
   has called off (3 summaries begin "CANCELLED: Engineering work …").
3. **Names differ from the station list.** The feed writes "Swindon" and "Preston" (the list:
   "Swindon (Wilts)", "Preston (Lancs)"), "Gillingham (Kent)" ("Gillingham Kent"), "Kings Lynn",
   "Heathrow Terminal 5" ("… (Rail Station Only)"). The matching allows for all of these, never
   takes a short name inside a longer one ("Reading" inside "Reading West"), and doesn't guess
   when a short name could be two stations ("Newport").
4. **6 live incidents name no station at all**, so they can't be matched to a journey (list
   below), for example "Amended morning LNER services on Sunday 22 November".

## The rule as tried (John's O2, with three additions marked new)

An incident counts for a journey from A to B when its summary:

1. names **both** A and B ("between Derby and Matlock");
2. names A or B after **"to / from"** or "to / from / via" ("No trains to / from London
   Fenchurch Street"); the mock-ups only had "to / from / via", and the feed uses both;
3. *(new)* names A or B after **"at", "through" or "in the … area"** ("Disruption at Birmingham
   New Street", "… services in the York area");
4. *(new)* names A or B after **"via"** ("No late night trains via Lewisham");
5. is **one amended train** ("Amended 00:49 London Paddington to Reading service"): only when
   it runs from A to B, so not for Reading to London Paddington.

## Results (56 journeys)

The journeys were chosen to include tonight's incidents, so most have something; a journey
picked at random would usually have nothing. Everything counted was checked by eye and is right
for John's rule. The full list is below; the things worth a decision:

1. **Work at the far end of a line** isn't counted unless the summary names both stations or
   says "to / from". London Victoria to Brighton leaves out "Buses replace late night / early
   morning trains between Haywards Heath and Brighton / Worthing / Eastbourne", though a late
   train from Victoria would probably be affected (not checked: the feed doesn't say which
   trains). Likewise Exeter St Davids to Bristol Temple
   Meads leaves out "Buses replace late night trains between Swindon and Bristol Temple Meads",
   which is right (a different line). The page can't tell these apart without knowing the
   route, which the feed doesn't give.
2. **Single trains on part of a journey** aren't counted: "Amended 05:31 Bedwyn to London
   Paddington" for Reading to Paddington, though it probably stops at Reading. As John's rule.
3. **"In the Rugby area"** isn't counted for London Euston to Manchester Piccadilly (neither end
   is Rugby). As John's rule.

## Live incidents whose summary names no station, and the journeys one by one

### Naming no station (6): these can never match

1. Amended late night / early morning East Midlands Railway service from Monday 16 to Friday 20 November
2. Amended late night / early morning Southeastern services from Monday 16 to Friday 20 November
3. Essential improvement work: changes to Island Line services from Saturday 31 October to Sunday 29 November
4. Amended morning LNER services on Sunday 22 November
5. Amended Stansted Express trains before 09:00 on Sunday 22 November
6. (unplanned) Industrial action expected to impact London Underground services on Thursday 26 and Friday 27 November - and on future dates in December, January, and February

### Journey by journey

1. **Reading to London Paddington**: 1 counted, 11 left out
   - Counted (to-from): Amended trains to / from / via London Paddington on Sunday 22 November
   - Left out: Buses replace late night / early morning trains to / from Pangbourne from Monday 16 to Friday 20 November
   - Left out: Amended 05:31 Bedwyn to London Paddington service from Tuesday 17 to Friday 20 November
   - Left out: Buses replace very early morning Great Western Railway trains to / from Burnham / Taplow from Tuesday 17 to Friday 20 November
   - Left out: Amended 00:18 Henley-on-Thames to Reading service from Tuesday 17 to Thursday 19 November
   - Left out: Amended 22:30 London Paddington to Bedwyn service from Monday 16 to Thursday 19 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 23:45 Didcot Parkway to London Paddington service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Left out: Buses replace early morning / late night Great Western Railway trains to / from Burnham on Sunday 22 November
   - Left out: Amended 08:37 Reading to Basingstoke service on Sunday 22 November
   - Left out: Amended early morning trains between Reading and Newbury on Sunday 22 November

2. **London Paddington to Reading**: 3 counted, 9 left out
   - Counted (train): Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Counted (train): Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Counted (to-from): Amended trains to / from / via London Paddington on Sunday 22 November
   - Left out: Buses replace late night / early morning trains to / from Pangbourne from Monday 16 to Friday 20 November
   - Left out: Amended 05:31 Bedwyn to London Paddington service from Tuesday 17 to Friday 20 November
   - Left out: Buses replace very early morning Great Western Railway trains to / from Burnham / Taplow from Tuesday 17 to Friday 20 November
   - Left out: Amended 00:18 Henley-on-Thames to Reading service from Tuesday 17 to Thursday 19 November
   - Left out: Amended 22:30 London Paddington to Bedwyn service from Monday 16 to Thursday 19 November
   - Left out: Amended 23:45 Didcot Parkway to London Paddington service on Saturday 21 November
   - Left out: Buses replace early morning / late night Great Western Railway trains to / from Burnham on Sunday 22 November
   - Left out: Amended 08:37 Reading to Basingstoke service on Sunday 22 November
   - Left out: Amended early morning trains between Reading and Newbury on Sunday 22 November

3. **Bath Spa to Bristol Temple Meads**: 1 counted, 4 left out
   - Counted (both): Buses replace late night trains between Swindon and Bristol Temple Meads via Chippenham / Bath Spa from Monday 16 to Thursday 19 November
   - Left out: Amended 22:43 Exeter St Davids to Bristol Temple Meads from Monday 16 to Wednesday 18 November
   - Left out: Amended 23:30 Cardiff Central to Bristol Temple Meads service from Tuesday 17 to Thursday 19 November
   - Left out: Buses replace late night trains between Bristol Temple Meads and Westbury / Frome from Monday 16 to Thursday 19 November
   - Left out: Amended service between Bristol Temple Meads and Weston-super-Mare / Taunton on Saturday 21 and Sunday 22 November

4. **Manchester Piccadilly to Manchester Airport**: 1 counted, 4 left out
   - Counted (both): (unplanned) Disruption between Manchester Airport and Manchester Piccadilly expected until 05:00 Wednesday 18 November
   - Left out: Amended late night / early morning Northern trains between Manchester Airport and Blackpool North from Monday 16 to Friday 20 November
   - Left out: Amended late night Northern trains between Manchester Piccadilly and Rose Hill Marple / Sheffield on Wednesday 18 and Thursday 19 November
   - Left out: Amended 22:45 Manchester Airport to Blackpool North on Sunday 22 November
   - Left out: (unplanned) Disruption between Manchester Piccadilly and Rose Hill Marple / New Mills Central expected until the end of the day

5. **Reading to Cambridge**: 0 counted, 5 left out
   - Left out: Amended 00:18 Henley-on-Thames to Reading service from Tuesday 17 to Thursday 19 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Left out: Amended 08:37 Reading to Basingstoke service on Sunday 22 November
   - Left out: Amended early morning trains between Reading and Newbury on Sunday 22 November

6. **London Kings Cross to York**: 1 counted, 6 left out
   - Counted (at): Amended late night TransPennine Express services in the York area from Monday 16 to Thursday 19 November
   - Left out: Amended late night / early morning Lumo service between London Kings Cross and Edinburgh from Monday 16 to Wednesday 18 November
   - Left out: Amended morning LNER services on Sunday 22 November
   - Left out: Amended 08:57 London Kings Cross to Hull service on Sunday 22 November
   - Left out: Amended 01:40 London Kings Cross to Welwyn Garden City service on Sunday 22 November
   - Left out: No early morning trains between Finsbury Park and London Kings Cross on Sunday 22 November
   - Left out: Amended 22:55 Peterborough to London Kings Cross service on Sunday 22 November

7. **London Euston to Manchester Piccadilly**: 0 counted, 9 left out
   - Left out: Amended 18:52 Edinburgh to London Euston service from Monday 16 to Thursday 19 November
   - Left out: Amended late night service between London Euston and Wolverhampton from Sunday 15 to Wednesday 18 November
   - Left out: Amended late night Northern trains between Manchester Piccadilly and Rose Hill Marple / Sheffield on Wednesday 18 and Thursday 19 November
   - Left out: Amended 23:30 London Euston to Glasgow Central on Sunday 22 and Monday 23 November
   - Left out: Amended 23:24 London Euston to Wolverhampton service on Sunday 22 November
   - Left out: Buses replace early morning trains between London Euston and Milton Keynes Central / Northampton on Sunday 22 November
   - Left out: Amended trains in the Rugby area before 11:50 on Sunday 22 November
   - Left out: (unplanned) Disruption between Manchester Piccadilly and Rose Hill Marple / New Mills Central expected until the end of the day
   - Left out: (unplanned) Disruption between Manchester Airport and Manchester Piccadilly expected until 05:00 Wednesday 18 November

8. **London Paddington to Plymouth**: 1 counted, 6 left out
   - Counted (to-from): Amended trains to / from / via London Paddington on Sunday 22 November
   - Left out: Amended 05:31 Bedwyn to London Paddington service from Tuesday 17 to Friday 20 November
   - Left out: Amended 22:30 London Paddington to Bedwyn service from Monday 16 to Thursday 19 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 23:45 Didcot Parkway to London Paddington service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Left out: Amended service between Bristol Temple Meads and Weston-super-Mare / Taunton on Saturday 21 and Sunday 22 November

9. **London Euston to Milton Keynes Central**: 1 counted, 4 left out
   - Counted (both): Buses replace early morning trains between London Euston and Milton Keynes Central / Northampton on Sunday 22 November
   - Left out: Amended 18:52 Edinburgh to London Euston service from Monday 16 to Thursday 19 November
   - Left out: Amended late night service between London Euston and Wolverhampton from Sunday 15 to Wednesday 18 November
   - Left out: Amended 23:30 London Euston to Glasgow Central on Sunday 22 and Monday 23 November
   - Left out: Amended 23:24 London Euston to Wolverhampton service on Sunday 22 November

10. **London Liverpool Street to Stratford (London)**: 0 counted, 3 left out
   - Left out: Amended 23:30 London Liverpool Street to Norwich from Monday 16 to Wednesday 18 November
   - Left out: Amended 23:18 London Liverpool Street to Clacton-on-Sea service on Saturday 21 November
   - Left out: No London Overground trains between London Liverpool Street and Chingford / Enfield Town / Cheshunt until 09:50 on Sunday 22 November

11. **Reading to Pangbourne**: 2 counted, 5 left out
   - Counted (to-from): Buses replace late night / early morning trains to / from Pangbourne from Monday 16 to Friday 20 November
   - Counted (to-from): Buses replace early morning / late night trains to / from Pangbourne on Sunday 22 November
   - Left out: Amended 00:18 Henley-on-Thames to Reading service from Tuesday 17 to Thursday 19 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Left out: Amended 08:37 Reading to Basingstoke service on Sunday 22 November
   - Left out: Amended early morning trains between Reading and Newbury on Sunday 22 November

12. **Bedwyn to London Paddington**: 2 counted, 5 left out
   - Counted (train): Amended 05:31 Bedwyn to London Paddington service from Tuesday 17 to Friday 20 November
   - Counted (to-from): Amended trains to / from / via London Paddington on Sunday 22 November
   - Left out: Amended 22:30 London Paddington to Bedwyn service from Monday 16 to Thursday 19 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 23:45 Didcot Parkway to London Paddington service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Left out: Amended early morning trains between Reading and Newbury on Sunday 22 November

13. **London Paddington to Bedwyn**: 2 counted, 5 left out
   - Counted (train): Amended 22:30 London Paddington to Bedwyn service from Monday 16 to Thursday 19 November
   - Counted (to-from): Amended trains to / from / via London Paddington on Sunday 22 November
   - Left out: Amended 05:31 Bedwyn to London Paddington service from Tuesday 17 to Friday 20 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 23:45 Didcot Parkway to London Paddington service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Left out: Amended early morning trains between Reading and Newbury on Sunday 22 November

14. **Henley-on-Thames to Reading**: 1 counted, 4 left out
   - Counted (train): Amended 00:18 Henley-on-Thames to Reading service from Tuesday 17 to Thursday 19 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Left out: Amended 08:37 Reading to Basingstoke service on Sunday 22 November
   - Left out: Amended early morning trains between Reading and Newbury on Sunday 22 November

15. **Cardiff Central to Bristol Temple Meads**: 1 counted, 7 left out
   - Counted (train): Amended 23:30 Cardiff Central to Bristol Temple Meads service from Tuesday 17 to Thursday 19 November
   - Left out: Amended 22:43 Exeter St Davids to Bristol Temple Meads from Monday 16 to Wednesday 18 November
   - Left out: Buses replace late night trains between Swindon and Bristol Temple Meads via Chippenham / Bath Spa from Monday 16 to Thursday 19 November
   - Left out: Amended late night / early morning Great Western Railway services between Cardiff Central and Swansea from Monday 16 to Friday 20 November
   - Left out: Buses replace late night trains between Bristol Temple Meads and Westbury / Frome from Monday 16 to Thursday 19 November
   - Left out: Amended late night trains between Maesteg / Cardiff Central and Ebbw Vale Town from Monday 16 to Thursday 19 November
   - Left out: Amended service between Bristol Temple Meads and Weston-super-Mare / Taunton on Saturday 21 and Sunday 22 November
   - Left out: Buses replace trains between Southampton Airport Parkway / Southampton Central and Bournemouth / Poole on Sunday 22 November

16. **Swindon (Wilts) to Bristol Temple Meads**: 1 counted, 5 left out
   - Counted (both): Buses replace late night trains between Swindon and Bristol Temple Meads via Chippenham / Bath Spa from Monday 16 to Thursday 19 November
   - Left out: Amended 22:43 Exeter St Davids to Bristol Temple Meads from Monday 16 to Wednesday 18 November
   - Left out: Amended 23:30 Cardiff Central to Bristol Temple Meads service from Tuesday 17 to Thursday 19 November
   - Left out: Buses replace late night trains between Bristol Temple Meads and Westbury / Frome from Monday 16 to Thursday 19 November
   - Left out: Amended 23:42 Swindon to Cheltenham Spa from Monday 16 to Thursday 19 November
   - Left out: Amended service between Bristol Temple Meads and Weston-super-Mare / Taunton on Saturday 21 and Sunday 22 November

17. **Bristol Temple Meads to Frome**: 1 counted, 4 left out
   - Counted (both): Buses replace late night trains between Bristol Temple Meads and Westbury / Frome from Monday 16 to Thursday 19 November
   - Left out: Amended 22:43 Exeter St Davids to Bristol Temple Meads from Monday 16 to Wednesday 18 November
   - Left out: Amended 23:30 Cardiff Central to Bristol Temple Meads service from Tuesday 17 to Thursday 19 November
   - Left out: Buses replace late night trains between Swindon and Bristol Temple Meads via Chippenham / Bath Spa from Monday 16 to Thursday 19 November
   - Left out: Amended service between Bristol Temple Meads and Weston-super-Mare / Taunton on Saturday 21 and Sunday 22 November

18. **London Liverpool Street to Norwich**: 1 counted, 5 left out
   - Counted (train): Amended 23:30 London Liverpool Street to Norwich from Monday 16 to Wednesday 18 November
   - Left out: Amended late night / early morning trains between Ipswich and Norwich on Saturday 21 and Sunday 22 November
   - Left out: Amended 23:18 London Liverpool Street to Clacton-on-Sea service on Saturday 21 November
   - Left out: Buses replace trains between Norwich / Oulton Broad South and Lowestoft from Saturday 21 and Sunday 22 November
   - Left out: Buses replace trains between Colchester and Ingatestone on Sunday 22 November
   - Left out: No London Overground trains between London Liverpool Street and Chingford / Enfield Town / Cheshunt until 09:50 on Sunday 22 November

19. **Derby to Matlock**: 1 counted, 0 left out
   - Counted (both): Track renewal work: buses replace trains between Derby and Matlock from Saturday 14 to Sunday 22 November

20. **Haywards Heath to Brighton**: 1 counted, 0 left out
   - Counted (both): Buses replace late night / early morning trains between Haywards Heath and Brighton / Worthing / Eastbourne from Monday 16 to Friday 20 November

21. **London Victoria to Brighton**: 1 counted, 2 left out
   - Counted (to-from): No Gatwick Express / Southern trains to / from London Victoria on Sunday 22 November
   - Left out: Buses replace late night / early morning trains between Haywards Heath and Brighton / Worthing / Eastbourne from Monday 16 to Friday 20 November
   - Left out: Buses replace trains to / from / via Havant on Saturday 21 and Sunday 22 November

22. **London Fenchurch Street to Upminster**: 2 counted, 0 left out
   - Counted (both): Amended late night / early morning service between London Fenchurch Street and Barking / Upminster from Monday 16 to Wednesday 18 November
   - Counted (to-from): No trains to / from London Fenchurch Street on Saturday 21 and Sunday 22 November

23. **London Bridge to Selhurst**: 1 counted, 1 left out
   - Counted (train): Amended 00:01 London Bridge to Selhurst from Tuesday 17 to Friday 20 November
   - Left out: Amended 08:40 and 09:10 London Bridge to Sutton trains on Sunday 22 November

24. **London Euston to Wolverhampton**: 2 counted, 4 left out
   - Counted (both): Amended late night service between London Euston and Wolverhampton from Sunday 15 to Wednesday 18 November
   - Counted (train): Amended 23:24 London Euston to Wolverhampton service on Sunday 22 November
   - Left out: Amended 18:52 Edinburgh to London Euston service from Monday 16 to Thursday 19 November
   - Left out: Amended 23:30 London Euston to Glasgow Central on Sunday 22 and Monday 23 November
   - Left out: Buses replace early morning trains between London Euston and Milton Keynes Central / Northampton on Sunday 22 November
   - Left out: Amended trains in the Rugby area before 11:50 on Sunday 22 November

25. **London Kings Cross to Edinburgh**: 1 counted, 6 left out
   - Counted (both): Amended late night / early morning Lumo service between London Kings Cross and Edinburgh from Monday 16 to Wednesday 18 November
   - Left out: Amended 18:52 Edinburgh to London Euston service from Monday 16 to Thursday 19 November
   - Left out: Amended morning LNER services on Sunday 22 November
   - Left out: Amended 08:57 London Kings Cross to Hull service on Sunday 22 November
   - Left out: Amended 01:40 London Kings Cross to Welwyn Garden City service on Sunday 22 November
   - Left out: No early morning trains between Finsbury Park and London Kings Cross on Sunday 22 November
   - Left out: Amended 22:55 Peterborough to London Kings Cross service on Sunday 22 November

26. **Kettering to Corby**: 2 counted, 0 left out
   - Counted (both): Amended service between Kettering and Corby from Saturday 14 to Friday 20 November
   - Counted (both): Buses replace trains between Corby and Kettering before 06:30 on Saturday 21 November

27. **Dartford to Strood (Kent)**: 1 counted, 1 left out
   - Counted (both): Buses replace late night trains between Dartford and Strood / Gillingham (Kent) from Monday 16 to Thursday 19 November
   - Left out: Buses replace trains between Meopham / Strood and Rainham (Kent) on Sunday 22 November

28. **Preston (Lancs) to Colne**: 1 counted, 1 left out
   - Counted (train): Amended 05:20 Preston to Colne service from Tuesday 17 to Friday 20 November
   - Left out: Buses replace trains between Blackburn and Colne / Burnley Manchester Road on Sunday 22 November

29. **Manchester Oxford Road to Liverpool Lime Street**: 1 counted, 0 left out
   - Counted (both): Buses replace late night Northern services between Manchester Oxford Road and Liverpool Lime Street from Monday 16 to Thursday 19 November

30. **Crewe to Chester**: 1 counted, 0 left out
   - Counted (both): Buses replace late night / early morning trains between Chester and Crewe from Tuesday 17 to Friday 20 November

31. **Birmingham New Street to Coventry**: 1 counted, 1 left out
   - Counted (train): Amended 00:41 Birmingham New Street to Coventry service from Tuesday 17 to Friday 20 November
   - Left out: Amended 22:50 Birmingham New Street to Northampton service from Monday 16 to Thursday 19 November

32. **Lewisham to London Bridge**: 2 counted, 2 left out
   - Counted (via): No late night trains via Lewisham from Monday 16 to Thursday 19 November
   - Counted (via): No Southeastern services via Lewisham on Saturday 21 and Sunday 22 November
   - Left out: Amended 00:01 London Bridge to Selhurst from Tuesday 17 to Friday 20 November
   - Left out: Amended 08:40 and 09:10 London Bridge to Sutton trains on Sunday 22 November

33. **Reading to Basingstoke**: 1 counted, 5 left out
   - Counted (train): Amended 08:37 Reading to Basingstoke service on Sunday 22 November
   - Left out: Amended 00:18 Henley-on-Thames to Reading service from Tuesday 17 to Thursday 19 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Left out: Amended early morning trains between Reading and Newbury on Sunday 22 November
   - Left out: Buses replace trains between Southampton Airport Parkway / Southampton Central and Bournemouth / Poole on Sunday 22 November

34. **Reading to Newbury**: 1 counted, 4 left out
   - Counted (both): Amended early morning trains between Reading and Newbury on Sunday 22 November
   - Left out: Amended 00:18 Henley-on-Thames to Reading service from Tuesday 17 to Thursday 19 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November
   - Left out: Amended 08:37 Reading to Basingstoke service on Sunday 22 November

35. **London Paddington to Burnham (Buckinghamshire)**: 3 counted, 5 left out
   - Counted (to-from): Buses replace very early morning Great Western Railway trains to / from Burnham / Taplow from Tuesday 17 to Friday 20 November
   - Counted (to-from): Buses replace early morning / late night Great Western Railway trains to / from Burnham on Sunday 22 November
   - Counted (to-from): Amended trains to / from / via London Paddington on Sunday 22 November
   - Left out: Amended 05:31 Bedwyn to London Paddington service from Tuesday 17 to Friday 20 November
   - Left out: Amended 22:30 London Paddington to Bedwyn service from Monday 16 to Thursday 19 November
   - Left out: Amended 00:49 London Paddington to Reading service on Saturday 21 November
   - Left out: Amended 23:45 Didcot Parkway to London Paddington service on Saturday 21 November
   - Left out: Amended 00:34 London Paddington to Reading service on Sunday 22 November

36. **Glasgow Queen Street to Crianlarich**: 1 counted, 1 left out
   - Counted (both): Track, structures and signalling work: buses replace trains between Glasgow Queen Street and Crianlarich from Saturday 21 to Tuesday 24 November
   - Left out: West Highland Line upgrades: Buses replace trains between Crianlarich and Fort William / Mallaig from Monday 9 to Tuesday 17 November

37. **London Liverpool Street to Clacton-on-Sea**: 1 counted, 3 left out
   - Counted (train): Amended 23:18 London Liverpool Street to Clacton-on-Sea service on Saturday 21 November
   - Left out: Amended 23:30 London Liverpool Street to Norwich from Monday 16 to Wednesday 18 November
   - Left out: Buses replace trains between Colchester and Ingatestone on Sunday 22 November
   - Left out: No London Overground trains between London Liverpool Street and Chingford / Enfield Town / Cheshunt until 09:50 on Sunday 22 November

38. **Norwich to Lowestoft**: 1 counted, 2 left out
   - Counted (both): Buses replace trains between Norwich / Oulton Broad South and Lowestoft from Saturday 21 and Sunday 22 November
   - Left out: Amended 23:30 London Liverpool Street to Norwich from Monday 16 to Wednesday 18 November
   - Left out: Amended late night / early morning trains between Ipswich and Norwich on Saturday 21 and Sunday 22 November

39. **Colchester to Ingatestone**: 1 counted, 0 left out
   - Counted (both): Buses replace trains between Colchester and Ingatestone on Sunday 22 November

40. **Manchester Piccadilly to Sheffield**: 1 counted, 3 left out
   - Counted (both): Amended late night Northern trains between Manchester Piccadilly and Rose Hill Marple / Sheffield on Wednesday 18 and Thursday 19 November
   - Left out: Amended 23:08 Nottingham to Sheffield service from Monday 16 to Thursday 19 November
   - Left out: (unplanned) Disruption between Manchester Piccadilly and Rose Hill Marple / New Mills Central expected until the end of the day
   - Left out: (unplanned) Disruption between Manchester Airport and Manchester Piccadilly expected until 05:00 Wednesday 18 November

41. **Birmingham New Street to London Euston**: 0 counted, 8 left out
   - Left out: Amended 18:52 Edinburgh to London Euston service from Monday 16 to Thursday 19 November
   - Left out: Amended late night service between London Euston and Wolverhampton from Sunday 15 to Wednesday 18 November
   - Left out: Amended 22:50 Birmingham New Street to Northampton service from Monday 16 to Thursday 19 November
   - Left out: Amended 00:41 Birmingham New Street to Coventry service from Tuesday 17 to Friday 20 November
   - Left out: Amended 23:30 London Euston to Glasgow Central on Sunday 22 and Monday 23 November
   - Left out: Amended 23:24 London Euston to Wolverhampton service on Sunday 22 November
   - Left out: Buses replace early morning trains between London Euston and Milton Keynes Central / Northampton on Sunday 22 November
   - Left out: Amended trains in the Rugby area before 11:50 on Sunday 22 November

42. **London Liverpool Street to Cambridge**: 0 counted, 3 left out
   - Left out: Amended 23:30 London Liverpool Street to Norwich from Monday 16 to Wednesday 18 November
   - Left out: Amended 23:18 London Liverpool Street to Clacton-on-Sea service on Saturday 21 November
   - Left out: No London Overground trains between London Liverpool Street and Chingford / Enfield Town / Cheshunt until 09:50 on Sunday 22 November

43. **London Victoria to Gatwick Airport**: 1 counted, 0 left out
   - Counted (to-from): No Gatwick Express / Southern trains to / from London Victoria on Sunday 22 November

44. **London Waterloo to Wimbledon**: 0 counted, 1 left out
   - Left out: Amended train service between London Waterloo and Exeter St Davids from Monday 10 August until further notice

45. **Manchester Piccadilly to Rose Hill Marple**: 2 counted, 1 left out
   - Counted (both): Amended late night Northern trains between Manchester Piccadilly and Rose Hill Marple / Sheffield on Wednesday 18 and Thursday 19 November
   - Counted (both): (unplanned) Disruption between Manchester Piccadilly and Rose Hill Marple / New Mills Central expected until the end of the day
   - Left out: (unplanned) Disruption between Manchester Airport and Manchester Piccadilly expected until 05:00 Wednesday 18 November

46. **London Marylebone to Aylesbury Vale Parkway**: 1 counted, 0 left out
   - Counted (both): (unplanned) Reduced service between Aylesbury Vale Parkway and London Marylebone via Amersham expected until the end of the day on Wednesday 18 November

47. **Clapham Junction to Shepherd's Bush**: 1 counted, 2 left out
   - Counted (both): (unplanned) Reduced service between Clapham Junction and Shepherds Bush expected until the end of the day
   - Left out: Buses replace trains between Clapham Junction and Kew Bridge / Richmond on Sunday 22 November
   - Left out: No Southern trains between Shepherds Bush and Watford Junction from 19:00 on Saturday 21 and all day on Sunday 22 November

48. **London Fenchurch Street to Southend Central**: 1 counted, 2 left out
   - Counted (to-from): No trains to / from London Fenchurch Street on Saturday 21 and Sunday 22 November
   - Left out: Amended late night / early morning service between London Fenchurch Street and Barking / Upminster from Monday 16 to Wednesday 18 November
   - Left out: (unplanned) Residual disruption between Leigh-on-Sea and Shoeburyness expected until 22:30

49. **Arundel to Horsham**: 1 counted, 0 left out
   - Counted (both): (unplanned) Disruption between Arundel and Horsham expected until 04:00 on Wednesday 18 November

50. **Carlisle to Maryport**: 1 counted, 0 left out
   - Counted (both): (unplanned) No trains between Carlisle and Maryport: disruption expected until the end of the day

51. **Watford Junction to St Albans Abbey**: 1 counted, 2 left out
   - Counted (both): Buses replace early morning trains between Watford Junction and St Albans Abbey on Saturday 21 November
   - Left out: No Southern trains between Shepherds Bush and Watford Junction from 19:00 on Saturday 21 and all day on Sunday 22 November
   - Left out: Buses replace London Overground trains between Queens Park and Watford Junction on Saturday 21 and Sunday 22 November

52. **Swansea to Cardiff Central**: 1 counted, 2 left out
   - Counted (both): Amended late night / early morning Great Western Railway services between Cardiff Central and Swansea from Monday 16 to Friday 20 November
   - Left out: Amended 23:30 Cardiff Central to Bristol Temple Meads service from Tuesday 17 to Thursday 19 November
   - Left out: Amended late night trains between Maesteg / Cardiff Central and Ebbw Vale Town from Monday 16 to Thursday 19 November

53. **Nottingham to Sheffield**: 1 counted, 1 left out
   - Counted (train): Amended 23:08 Nottingham to Sheffield service from Monday 16 to Thursday 19 November
   - Left out: Amended late night Northern trains between Manchester Piccadilly and Rose Hill Marple / Sheffield on Wednesday 18 and Thursday 19 November

54. **Exeter St Davids to Bristol Temple Meads**: 1 counted, 5 left out
   - Counted (train): Amended 22:43 Exeter St Davids to Bristol Temple Meads from Monday 16 to Wednesday 18 November
   - Left out: Amended train service between London Waterloo and Exeter St Davids from Monday 10 August until further notice
   - Left out: Amended 23:30 Cardiff Central to Bristol Temple Meads service from Tuesday 17 to Thursday 19 November
   - Left out: Buses replace late night trains between Swindon and Bristol Temple Meads via Chippenham / Bath Spa from Monday 16 to Thursday 19 November
   - Left out: Buses replace late night trains between Bristol Temple Meads and Westbury / Frome from Monday 16 to Thursday 19 November
   - Left out: Amended service between Bristol Temple Meads and Weston-super-Mare / Taunton on Saturday 21 and Sunday 22 November

55. **London Waterloo to Exeter St Davids**: 1 counted, 1 left out
   - Counted (both): Amended train service between London Waterloo and Exeter St Davids from Monday 10 August until further notice
   - Left out: Amended 22:43 Exeter St Davids to Bristol Temple Meads from Monday 16 to Wednesday 18 November

56. **London Kings Cross to Hull**: 1 counted, 4 left out
   - Counted (train): Amended 08:57 London Kings Cross to Hull service on Sunday 22 November
   - Left out: Amended late night / early morning Lumo service between London Kings Cross and Edinburgh from Monday 16 to Wednesday 18 November
   - Left out: Amended 01:40 London Kings Cross to Welwyn Garden City service on Sunday 22 November
   - Left out: No early morning trains between Finsbury Park and London Kings Cross on Sunday 22 November
   - Left out: Amended 22:55 Peterborough to London Kings Cross service on Sunday 22 November

50 of 56 journeys have something counted.
