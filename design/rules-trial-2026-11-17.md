# Trying the rules on real departures (6.15pm, Tuesday November 17th 2026)

Made by `scripts/try-rules.py` from the Live Departure Board, nine
journeys, at about 6.15pm. It applies the draft rules from `SPEC.md` §7:

- **Badly disrupted** (answer 9): two of the next three trains cancelled;
  or someone turning up now would reach B 45 minutes or more after the
  timetable says; or no trains running.
- **Draft verdict:** "Be prepared" if badly disrupted or three or more
  cancellations in the next four hours; "It's a mixed bag" if any train is
  cancelled, more than 5 minutes late, or "Delayed" with no time; otherwise
  "Good news". (Engineering work isn't included here: that's another key.)

Two faults in the script were found and fixed before these results: a
negative difference wrapped round the clock, and trains arriving after
midnight sorted before evening ones. Both made calm journeys look badly
disrupted. The app's version needs checks for both (`npm run check`).

## The results


## Reading to London Paddington (RDG–PAD), checked 18:15 GMT
- Next four hours: 51 trains; 0 cancelled; 2 expected more than 5 minutes late; 0 'Delayed' with no time.
  - 18:26 Great Western Railway: expected 18:46 (20 min late) – This service has been delayed by train crew being delayed by service disruption
  - 18:28 Elizabeth Line: expected 18:34 (6 min late) – This service has been delayed by a fault on a train
- Platforms known so far: {'10A': 6, '10': 5, '11': 4, '14': 3, '11A': 3, '13': 3, '15A': 3} (27 of 51 trains)
- Last two hours: 14 of 24 arrivals within 3 minutes; worst 17:02 (23 min late); 0 cancelled.
- Badly disrupted? two of next three cancelled: False; turn up now and arrive 0 min after the timetable: False; no trains running: False → False
- Draft verdict: It's a mixed bag

## London Paddington to Reading (PAD–RDG), checked 18:15 GMT
- Next four hours: 46 trains; 0 cancelled; 0 expected more than 5 minutes late; 0 'Delayed' with no time.
- Platforms known so far: {'B': 10, '11': 1, '10': 1, '2': 1, '9': 1} (14 of 46 trains)
- Last two hours: 16 of 18 arrivals within 3 minutes; worst 17:36 (6 min late); 0 cancelled.
- Badly disrupted? two of next three cancelled: False; turn up now and arrive 0 min after the timetable: False; no trains running: False → False
- Draft verdict: Good news

## Birmingham New Street to London Euston (BHM–EUS), checked 18:15 GMT
- Next four hours: 14 trains; 0 cancelled; 0 expected more than 5 minutes late; 0 'Delayed' with no time.
- Platforms known so far: {'4A': 3, '1': 2, '5': 2, '6': 1} (8 of 14 trains)
- Last two hours: 0 of 2 arrivals within 3 minutes; worst 16:21 (11 min late); 0 cancelled.
- Badly disrupted? two of next three cancelled: False; turn up now and arrive 0 min after the timetable: False; no trains running: False → False
- Draft verdict: Good news

## London Euston to Birmingham New Street (EUS–BHM), checked 18:15 GMT
- Next four hours: 17 trains; 0 cancelled; 1 expected more than 5 minutes late; 0 'Delayed' with no time.
  - 18:26 LNR & WMR: expected 18:33 (7 min late)
- Platforms known so far: {} (0 of 17 trains)
- Last two hours: 2 of 2 arrivals within 3 minutes; worst 16:40 (2 min late); 0 cancelled.
- Badly disrupted? two of next three cancelled: False; turn up now and arrive 0 min after the timetable: False; no trains running: False → False
- Draft verdict: It's a mixed bag

## London Victoria to Brighton (VIC–BTN), checked 18:15 GMT
- Next four hours: 8 trains; 0 cancelled; 0 expected more than 5 minutes late; 0 'Delayed' with no time.
- Platforms known so far: {'13': 1} (1 of 8 trains)
- Last two hours: 2 of 2 arrivals within 3 minutes; worst 16:29 (3 min late); 0 cancelled.
- Badly disrupted? two of next three cancelled: False; turn up now and arrive 0 min after the timetable: False; no trains running: False → False
- Draft verdict: Good news

## Manchester Piccadilly to Leeds (MAN–LDS), checked 18:15 GMT
- Next four hours: 5 trains; 0 cancelled; 0 expected more than 5 minutes late; 0 'Delayed' with no time.
- Platforms known so far: {'1': 1, '14': 1} (2 of 5 trains)
- Last two hours: 0 of 1 arrivals within 3 minutes; worst 16:30 (6 min late); 2 cancelled.
- Badly disrupted? two of next three cancelled: False; turn up now and arrive 0 min after the timetable: False; no trains running: False → False
- Draft verdict: Good news

## Glasgow Central to Edinburgh (GLC–EDB), checked 18:15 GMT
- Next four hours: 6 trains; 0 cancelled; 0 expected more than 5 minutes late; 0 'Delayed' with no time.
- Platforms known so far: {} (0 of 6 trains)
- Last two hours: 1 of 2 arrivals within 3 minutes; worst 17:05 (4 min late); 0 cancelled.
- Badly disrupted? two of next three cancelled: False; turn up now and arrive 0 min after the timetable: False; no trains running: False → False
- Draft verdict: Good news

## London Liverpool Street to Stratford (London) (LST–SRA), checked 18:15 GMT
- Next four hours: 62 trains; 1 cancelled; 0 expected more than 5 minutes late; 0 'Delayed' with no time.
  - 18:19 Elizabeth Line: cancelled – This service has been cancelled because of a speed restriction over defective track
- Platforms known so far: {'A': 30, '10': 1, '16': 1, '14': 1, '12': 1, '11': 1} (35 of 62 trains)
- Last two hours: 44 of 47 arrivals within 3 minutes; worst 17:29 (5 min late); 0 cancelled.
- Badly disrupted? two of next three cancelled: False; turn up now and arrive 0 min after the timetable: False; no trains running: False → False
- Draft verdict: It's a mixed bag

## London Kings Cross to York (KGX–YRK), checked 18:15 GMT
- Next four hours: 11 trains; 0 cancelled; 0 expected more than 5 minutes late; 0 'Delayed' with no time.
- Platforms known so far: {'2': 1} (1 of 11 trains)
- Badly disrupted? two of next three cancelled: False; turn up now and arrive 0 min after the timetable: False; no trains running: False → False
- Draft verdict: Good news
