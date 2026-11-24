# How do I get to my platform? A trial (November 24th 2026)

John asked whether Trainchecker could give directions to a platform in Platforms, from the data
we already have. This reads the exits table (`src/data/exits.json`, built for "Exits") the other
way round: from each entrance to the platform. A line for each entrance (John); entrances with the
same way are joined into one line. Nothing is agreed, and nothing is on the live site.

- `src/lib/toPlatform.ts`: the sentences (all Claude's drafts).
- `trial.ts`: prints every platform at the stations below. `node design/platform-directions/trial.ts [CRS …]`
- `mock.mjs` and `pictures/`: the two mock-ups on saved boards (Reading to Paddington at 8.59pm,
  Bath Spa to Bristol at 6.24pm). On the branch, `?mock=A` or `?mock=B` in the address turns
  them on; without it the page is unchanged.
  - **A:** the platform badges on the board are buttons; tapping one opens the directions under
    that train. A line "Tap a platform for directions." (John) sits above the board. **John chose A** (November 24th 2026).
  - **B:** under the board, "How do I get to my platform?" and a button for each platform on it.

Checked: `tsc -b`, lint, build; both mock-ups at 1200px light and 390px with touch, light and dark:
no errors, no sideways scroll, buttons 44px on a phone (A's badges are 32px with a mouse).

## What John's Reading notes changed (November 24th 2026)

General rules, so they apply at every station (counted over all 1,914 stations, 4,864 platforms):

1. **"From A, or from B, …"**: a comma and "or from" when the entrance names can't be joined as
   "the A or B entrance" (165 answers).
2. **The missing "by platform …" filled in** from what the rest of the station agrees on (Reading's 14
   and 15 now read like 8 to 13): 149 answers at 68 stations.
3. **Entrances with no way stored added**, and **"cross the bridge and go down by platform 7, then
   walk to platform 4"** where the bridge's far end comes down on the level with the platform but on
   another island (from `platform-links.json`). New lines at 85 stations; the walk itself only at
   seven: Reading, Blackfriars, Hither Green, Lewes, Preston, Shipley and Stirling (to check).
4. **"Go up to the bridge and come down on platform 15A"** where the bridge's stair is on that very
   platform (184 answers).

One exception, in `src/data/to-platform.json`: Reading 4 to 7 name only the south entrance on Station
Hill (the table has Forbury Road and Apex Plaza too). Question for John: are those two real entrances?
If not, they come out of the exits table, which mends the Exits section too.

## Still to check (illustration only: from the table, not checked at the stations)

1. **Paddington A and B:** "the way in leads to platform A"; it should be "go down" (John's Exits wording).
2. **Twyford 5:** "right by the entrance between platforms 4 and 5 and the entrance by platform 4".
3. **Bath Spa 1:** its own entrance and Railway Place: one entrance or two?
4. **Redhill 3:** the footbridge from Noke Drive; subways everywhere else.
5. **The seven "walk" stations** above.
6. **No steps or lifts**, as for Exits.

## The trial

## Reading

- **Platform 1:** Platform 1 is right by the town centre and Station Hill. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15, cross the bridge and go down by platform 7, then walk to platform 1.
- **Platform 2:** Platform 2 is right by the town centre and Station Hill. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15, cross the bridge and go down by platform 7, then walk to platform 2.
- **Platform 3:** Platform 3 is right by the town centre and Station Hill. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15 and cross to platform 3.
- **Platform 4:** Platform 4 is right by the south entrance on Station Hill. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15, cross the bridge and go down by platform 7, then walk to platform 4.
- **Platform 5:** Platform 5 is right by the south entrance on Station Hill. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15, cross the bridge and go down by platform 7, then walk to platform 5.
- **Platform 6:** Platform 6 is right by the south entrance on Station Hill. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15, cross the bridge and go down by platform 7, then walk to platform 6.
- **Platform 7:** Platform 7 is right by the south entrance on Station Hill. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15 and cross to platform 7.
- **Platform 8:** From the town centre and Station Hill, go up to the bridge by platform 7 and cross to platform 8. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15 and cross to platform 8.
- **Platform 9:** From the town centre and Station Hill, go up to the bridge by platform 7 and cross to platform 9. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15 and cross to platform 9.
- **Platform 10:** From the town centre and Station Hill, go up to the bridge by platform 7 and cross to platform 10. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15 and cross to platform 10.
- **Platform 11:** From the town centre and Station Hill, go up to the bridge by platform 7 and cross to platform 11. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15 and cross to platform 11.
- **Platform 12:** From the town centre and Station Hill, go up to the bridge by platform 7 and cross to platform 12. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15 and cross to platform 12.
- **Platform 13:** From the town centre and Station Hill, go up to the bridge by platform 7 and cross to platform 13. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15 and cross to platform 13.
- **Platform 14:** From the town centre and Station Hill, go up to the bridge by platform 7 and cross to platform 14. From the north entrance by the car park on the Caversham side, go up to the bridge by platform 15 and cross to platform 14.
- **Platform 15:** From the town centre and Station Hill, go up to the bridge by platform 7 and cross to platform 15. From the north entrance by the car park on the Caversham side, go up to the bridge and come down on platform 15.

## London Paddington

- **Platform 1:** From the Praed Street or Eastbourne Terrace entrance, cross the concourse to platform 1. From the Sheldon Square entrance, go up to the footbridge and come down on platform 1.
- **Platform 2:** From the Praed Street or Eastbourne Terrace entrance, cross the concourse to platform 2. From the Sheldon Square entrance, go up to the footbridge by platform 1 and cross to platform 2.
- **Platform 3:** From the Praed Street or Eastbourne Terrace entrance, cross the concourse to platform 3. From the Sheldon Square entrance, go up to the footbridge by platform 1 and cross to platform 3.
- **Platform 4:** From the Praed Street or Eastbourne Terrace entrance, cross the concourse to platform 4. From the Sheldon Square entrance, go up to the footbridge by platform 1 and cross to platform 4.
- **Platform 5:** From the Praed Street or Eastbourne Terrace entrance, cross the concourse to platform 5. From the Sheldon Square entrance, go up to the footbridge by platform 1 and cross to platform 5.
- **Platform 6:** From the Praed Street or Eastbourne Terrace entrance, cross the concourse to platform 6. From the Sheldon Square entrance, go up to the footbridge by platform 1 and cross to platform 6.
- **Platform 7:** From the Praed Street or Eastbourne Terrace entrance, cross the concourse to platform 7. From the Sheldon Square entrance, go up to the footbridge by platform 1 and cross to platform 7.
- **Platform 8:** From the Praed Street or Eastbourne Terrace entrance, cross the concourse to platform 8. From the Sheldon Square entrance, go up to the footbridge by platform 1 and cross to platform 8.
- **Platform 9:** From the Praed Street or Eastbourne Terrace entrance, cross the concourse to platform 9. From the Sheldon Square entrance, go up to the footbridge by platform 1 and cross to platform 9.
- **Platform 10:** From the Praed Street, Sheldon Square or Eastbourne Terrace entrance, cross the concourse to platform 10.
- **Platform 11:** From the Praed Street, Sheldon Square or Eastbourne Terrace entrance, cross the concourse to platform 11.
- **Platform 12:** From the Praed Street, Sheldon Square or Eastbourne Terrace entrance, cross the concourse to platform 12.
- **Platform 14:** From the Praed Street, Sheldon Square or Eastbourne Terrace entrance, cross the concourse to platform 14.
- **Platform A:** From the Eastbourne Terrace entrance (Elizabeth line), the way in leads to platform A.
- **Platform B:** From the Eastbourne Terrace entrance (Elizabeth line), the way in leads to platform B.

## Twyford

- **Platform 1:** Platform 1 is right by the Hurst Road entrance. From the entrance by platform 4, go up to the footbridge and cross to platform 1.
- **Platform 2:** From the Hurst Road entrance, go up to the footbridge by platform 1 and cross to platform 2. From the entrance by platform 4, go up to the footbridge and cross to platform 2.
- **Platform 3:** Platform 3 is right by the long-term car park. From the Hurst Road entrance, go up to the footbridge by platform 1 and cross to platform 3. From the entrance by platform 4, go up to the footbridge and cross to platform 3.
- **Platform 4:** Platform 4 has its own entrance, and is right by the entrance between platforms 4 and 5. From the Hurst Road entrance, go up to the footbridge by platform 1 and cross to platform 4.
- **Platform 5:** Platform 5 is right by the entrance between platforms 4 and 5 and the entrance by platform 4. From the Hurst Road entrance, go up to the footbridge by platform 1 and cross to platform 5.

## Oxford

- **Platform 1:** Platform 1 is right by the city centre entrance. From the Roger Dudman Way entrance, go up to the footbridge by platform 4 and cross to platform 1.
- **Platform 2:** Platform 2 is right by the city centre entrance. From the Roger Dudman Way entrance, go up to the footbridge by platform 4 and cross to platform 2.
- **Platform 3:** Platform 3 is right by the city centre entrance. From the Roger Dudman Way entrance, go up to the footbridge by platform 4 and cross to platform 3.
- **Platform 4:** Platform 4 is right by the Roger Dudman Way entrance. From the city centre entrance, go up to the footbridge by platform 2 and cross to platform 4.

## Newton Abbot

- **Platform 1:** From the entrance by the station building, go up to the footbridge by platform 3 and cross to platform 1.
- **Platform 2:** From the entrance by the station building, go up to the footbridge by platform 3 and cross to platform 2.
- **Platform 3:** Platform 3 is right by the entrance by the station building.

## Midgham

- **Platform 1:** Platform 1 has its own entrance, by the level crossing.
- **Platform 2:** Platform 2 is right by the Station Road entrance, by the level crossing.

## Ivybridge

- **Platform 1:** Platform 1 has its own entrance, and is right by the town centre entrance.
- **Platform 2:** From the town centre entrance, go up to the footbridge by platform 1 and cross to platform 2. From the entrance by platform 1, go up to the footbridge and cross to platform 2.

## Southampton Central

- **Platform 1:** Platform 1 is right by the Blechynden Terrace entrance near the Mayflower and the BBC. From the town centre entrance, go up to the footbridge and cross to platform 1.
- **Platform 2:** From the Blechynden Terrace entrance near the Mayflower and the BBC, or from the town centre entrance, go up to the footbridge and cross to platform 2.
- **Platform 3:** From the Blechynden Terrace entrance near the Mayflower and the BBC, or from the town centre entrance, go up to the footbridge and cross to platform 3.
- **Platform 4:** Platform 4 is right by the town centre entrance. From the Blechynden Terrace entrance near the Mayflower and the BBC, go up to the footbridge and cross to platform 4.

## Redhill

- **Platform 0:** Platform 0 is right by the Ladbroke Grove and town centre entrances. From the Noke Drive or St Anne's Drive entrance, go down to the subway by platform 3 and come up on platform 0.
- **Platform 1:** From the town centre entrance, go down to the subway by platform 0 and come up on platform 1. From the Noke Drive or St Anne's Drive entrance, go down to the subway by platform 3 and come up on platform 1.
- **Platform 2:** From the town centre entrance, go down to the subway by platform 0 and come up on platform 2. From the Noke Drive or St Anne's Drive entrance, go down to the subway by platform 3 and come up on platform 2.
- **Platform 3:** Platform 3 is right by the St Anne's Drive entrance. From the Noke Drive entrance, go up to the footbridge and cross to platform 3. From the town centre entrance, go down to the subway by platform 0 and come up on platform 3.

## Bristol Temple Meads

- **Platform 1:** Platform 1 is right by the Station Approach and Queen Anne Gate entrances. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 1.
- **Platform 3:** Platform 3 is right by the Station Approach entrance, the Queen Anne Gate entrance and the north entrance on Station Approach. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 3.
- **Platform 4:** Platform 4 is right by the Station Approach and Queen Anne Gate entrances. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 4.
- **Platform 5:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 5. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 5.
- **Platform 6:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 6. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 6.
- **Platform 7:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 7. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 7.
- **Platform 8:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 8. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 8.
- **Platform 9:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 9. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 9.
- **Platform 10:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 10. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 10.
- **Platform 11:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 11. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 11.
- **Platform 12:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 12. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 12.
- **Platform 13:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 13. From the University of Bristol entrance, go down to the subway and come up on platform 13.
- **Platform 15:** From the Station Approach or Queen Anne Gate entrance, go down to the subway by platform 3 and come up on platform 15. From the University of Bristol entrance, go down to the subway by platform 13 and come up on platform 15.

## Bath Spa

- **Platform 1:** Platform 1 has its own entrance, and is right by the Railway Place entrance. From the bus station entrance, go down to the subway by platform 2 and come up on platform 1.
- **Platform 2:** Platform 2 is right by the Railway Place and bus station entrances. From the entrance by platform 1, go down to the subway and come up on platform 2.

## Clapham Junction

- **Platform 1:** Platform 1 is right by the Grant Road entrance. From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 1. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 1.
- **Platform 2:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 2. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 2. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 2.
- **Platform 3:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 3. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 3. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 3.
- **Platform 4:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 4. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 4. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 4.
- **Platform 5:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 5. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 5. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 5.
- **Platform 7:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 7. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 7. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 7.
- **Platform 8:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 8. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 8. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 8.
- **Platform 9:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 9. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 9. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 9.
- **Platform 10:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 10. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 10. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 10.
- **Platform 11:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 11. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 11. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 11.
- **Platform 12:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 12. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 12. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 12.
- **Platform 13:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 13. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 13. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 13.
- **Platform 14:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 14. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 14. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 14.
- **Platform 15:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 15. From the Brighton Yard entrance, go up to the footbridge and come down on platform 15. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 15.
- **Platform 16:** From the St John's Hill entrance, go down to the subway by platform 17 and come up on platform 16. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 16. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 16.
- **Platform 17:** From the St John's Hill entrance, go down to the subway and come up on platform 17. From the Brighton Yard entrance, go up to the footbridge by platform 15 and cross to platform 17. From the Grant Road entrance, go down to the subway by platform 1 and come up on platform 17.
