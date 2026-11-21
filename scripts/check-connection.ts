// npm run check (part 4): "Check my connection" on the real boards of November 21st 2026, 2.55pm
// (design/mockups/snapshots/20261121-1455-connection/). No network. The four answers are the ones
// John read and edited that day, word for word.
import { readFileSync } from 'node:fs'
import { places, trimConnect, type RawBoard } from '../api/connect.ts'
import { trim } from '../api/live.ts'
import { answer, band, choices, firstChoice, mineOf } from '../src/lib/connection.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const dir = new URL('../design/mockups/snapshots/20261121-1455-connection/', import.meta.url)
const read = (f: string): RawBoard => JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
const TAKEN = '2026-11-21T14:55:00Z', NOW = '14:55'

eq('bands', [9, 6, 5, 3, 2, 1, 0, -4].map(band), ['fine', 'fine', 'tight', 'tight', 'unlikely', 'unlikely', 'missed', 'missed'])

// The whole boards saved that day stand in for the boards the function asks for: those to C are
// the trains that call there; those from A, the trains on A's own board.
const nta = read('NTA.json')
const rdg: RawBoard = { locationName: 'Reading', trainServices: [0, 15, 30, 45, 60, 75, 90, 105].flatMap((o) => read(`RDG-w${o}.json`).trainServices || []) }
const to = (b: RawBoard, crs: string, name: string): RawBoard => ({ locationName: b.locationName, filterLocationName: name,
  trainServices: (b.trainServices || []).filter((s) => (s.subsequentCallingPoints || []).some((g) => (g.callingPoint || []).some((c) => c.crs === crs))) })
const came = (b: RawBoard, journey: RawBoard): RawBoard => {
  const ids = new Set((journey.trainServices || []).map((s) => s.serviceID.slice(0, 8)))
  return { trainServices: (b.trainServices || []).filter((s) => ids.has(s.serviceID.slice(0, 8))) }
}

eq('Newton Abbot: stations with a train in two hours', places([nta]).length, 52)
// 144 stations in all; four are only on cancelled trains or stops, which aren't offered.
eq('Reading: stations with a train in two hours', places([rdg]).length, 140)
eq('places leaves out none of a train’s stops', ['TQY', 'PGN', 'EXD', 'PAD', 'PNZ'].every((c) => places([nta]).includes(c)), true)

function ask(journeyFile: string, a: string, b: string, board: RawBoard, c: string, cName: string, std: string, chosenStd?: string) {
  const journey = read(journeyFile)
  const snap = trim(a, b, TAKEN, [journey])
  const mine = mineOf(snap.services.find((s) => s.std === std)!)
  const d = trimConnect(b, c, TAKEN, [to(board, c, cName)], [came(board, journey)], mine.id)
  const chosen = chosenStd ? d.trains.find((t) => t.std === chosenStd)!.id : null
  return { d, mine, a: answer({ now: NOW, from: snap.fromName, at: d.atName, to: d.toName, mine, arrPlatform: d.arrPlatform, trains: d.trains, chosen }) }
}

// 1. Fine: Ivybridge's 3.04pm, changing at Newton Abbot for Torquay.
const fine = ask('IVY-NTA.json', 'IVY', 'NTA', nta, 'TQY', 'Torquay', '15:04')
eq('the train from Ivybridge comes into platform 3', fine.d.arrPlatform, '3')
eq('fine', fine.a, { kind: 'fine', text: 'If you’re planning to get the 3.39pm to Torquay, you should be fine. You’ll have 10 minutes to change trains. Your train from Ivybridge is expected to arrive on time at 3.29, and the Torquay train is expected to leave on time at 3.39. You’re coming into platform 3 and you’ll want platform 1, where your train will be showing on the departure board as the Paignton train. The one after that is the 4.05 from platform 1, which would give you a 36-minute wait. These times can change, so it’s worth checking again later.' })

// The same platform, and the final destination is the one asked for.
const same = ask('IVY-NTA.json', 'IVY', 'NTA', nta, 'PAD', 'London Paddington', '15:04')
eq('same platform', same.a.text, 'If you’re planning to get the 3.54pm to London Paddington, you should be fine. You’ll have 25 minutes to change trains. Your train from Ivybridge is expected to arrive on time at 3.29, and the London Paddington train is expected to leave on time at 3.54. You’re coming into platform 3, and the London Paddington train leaves from the same platform. These times can change, so it’s worth checking again later.')

// 9. No change needed: the train from Ivybridge carries on to Exeter St Davids.
const through = ask('IVY-NTA.json', 'IVY', 'NTA', nta, 'EXD', 'Exeter St Davids', '15:04')
eq('no change needed', [through.a.kind, through.a.text.startsWith('You don’t need to change: the train you’re on carries on to Exeter St Davids, and is expected there at ')], ['through', true])

// 2. Tight, and only because the Swindon train is late: Twyford's 3.07pm at Reading.
const tight = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'SWI', 'Swindon', '15:07')
eq('tight', tight.a, { kind: 'tight', text: 'If you’re planning to get the 3.13pm to Swindon, it’s going to be tight. It’s running five minutes late, which gives you four minutes to change trains. Your train from Twyford is expected to arrive on time at 3.14, and the Swindon train is now expected to leave at 3.18. It may make up time, so don’t count on it. You’re coming into platform 12 and you’ll want platform 8, where your train will be showing on the departure board as the Carmarthen train. If you miss it, the next one is the 3.25 from platform 9, which would give you an 11-minute wait.' })

// 3. Looks unlikely: Twyford's 3.03pm ends at Reading, so the platform it comes into isn't said.
const unlikely = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'OXF', 'Oxford', '15:03')
eq('a train that ends at Reading has no arrival platform', unlikely.d.arrPlatform, null)
eq('unlikely', unlikely.a, { kind: 'unlikely', text: 'If you’re planning to get the 3.14pm to Oxford, that looks unlikely. You’d only have two minutes to change trains. Your train from Twyford is expected to arrive on time at 3.12, and the Oxford train is expected to leave on time at 3.14 from platform 7, showing as the Manchester Piccadilly train. The next one is the 3.19 from platform 9B, which would give you a seven-minute wait.' })

// 4. Won't make it, asked for by name: Twyford's 3.07pm and the 3.14pm to Oxford.
const missed = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'OXF', 'Oxford', '15:07', '15:14')
eq('missed', missed.a, { kind: 'missed', text: 'You won’t make the 3.14pm to Oxford. Your train from Twyford is expected to arrive on time at 3.14, just as it’s due to leave. The next one is the 3.19 from platform 9B. You’d have five minutes to change, so that’s going to be tight too.' })
// Left to itself, it answers about the first train there's a minute or more for.
const first = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'OXF', 'Oxford', '15:07')
eq('first choice', [firstChoice(first.mine, first.d.trains)?.std, first.a.kind], ['15:19', 'tight'])
eq('choices start no more than ten minutes before you get in, six at most', [choices(first.mine, first.d.trains)[0].std, choices(first.mine, first.d.trains).length <= 6], ['15:14', true])

// 10. Cancelled: Reading's 3.45pm to York, for Twyford's 3.38pm.
const york = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'YRK', 'York', '15:38', '15:45')
eq('cancelled', york.a.text.startsWith('The 3.45pm to York has been cancelled. '), true)

console.log(`check-connection: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
