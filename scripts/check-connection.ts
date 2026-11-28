// npm run check (part 4): "Check my connection" on the real boards of November 21st 2026, 2.55pm
// (design/mockups/snapshots/20261121-1455-connection/). No network. The four answers are the ones
// John read and edited that day, word for word.
import { readFileSync } from 'node:fs'
import { places, trimConnect, type RawBoard } from '../api/connect.ts'
import { trim } from '../api/live.ts'
import { howToGet, type LinksTable, type StationLinks } from '../src/lib/platformLinks.ts'
import { aWait, answer, band, chipLabel, choices, firstChoice, longWait, mineOf, speeds } from '../src/lib/connection.ts'

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
eq('fine', fine.a, { kind: 'fine', text: 'If you’re planning to get the 3.39pm to Torquay, you should be fine. You’ll have 10 minutes to change trains. Your train from Ivybridge is expected to arrive on time at 3.29, and the Torquay train is expected to leave on time at 3.39, getting there at 3.49. You’re coming into platform 3 and you’ll want platform 1, where your train will be showing on the departure board as the Paignton train. The one after that is the 4.05 from platform 1, which would give you a 36-minute wait. These times can change, so it’s worth checking again later.' })

// The same platform, and the final destination is the one asked for.
const same = ask('IVY-NTA.json', 'IVY', 'NTA', nta, 'PAD', 'London Paddington', '15:04')
eq('same platform', same.a.text, 'If you’re planning to get the 3.54pm to London Paddington, you should be fine. You’ll have 25 minutes to change trains. Your train from Ivybridge is expected to arrive on time at 3.29, and the London Paddington train is expected to leave on time at 3.54, getting there at 6.27. You’re coming into platform 3, and the London Paddington train leaves from the same platform. These times can change, so it’s worth checking again later.')

// 9. No change needed: the train from Ivybridge carries on to Exeter St Davids.
const through = ask('IVY-NTA.json', 'IVY', 'NTA', nta, 'EXD', 'Exeter St Davids', '15:04')
eq('no change needed', [through.a.kind, through.a.text.startsWith('You don’t need to change: the train you’re on carries on to Exeter St Davids, and is expected there at ')], ['through', true])

// 2. Tight, and only because the Swindon train is late: Twyford's 3.07pm at Reading.
const tight = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'SWI', 'Swindon', '15:07')
eq('tight', tight.a, { kind: 'tight', text: 'If you’re planning to get the 3.13pm to Swindon, it’s going to be tight. It’s running five minutes late, which gives you four minutes to change trains. Your train from Twyford is expected to arrive on time at 3.14, and the Swindon train is now expected to leave at 3.18, getting there at 3.41. It may make up time, so don’t count on it. You’re coming into platform 12 and you’ll want platform 8, where your train will be showing on the departure board as the Carmarthen train. If you miss it, the next one is the 3.25 from platform 9, which would give you an 11-minute wait.' })

// 3. Looks unlikely: Twyford's 3.03pm ends at Reading, so the platform it comes into isn't said.
const unlikely = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'OXF', 'Oxford', '15:03')
eq('a train that ends at Reading has no arrival platform', unlikely.d.arrPlatform, null)
eq('unlikely', unlikely.a, { kind: 'unlikely', text: 'If you’re planning to get the 3.14pm to Oxford, that looks unlikely. You’d only have two minutes to change trains. Your train from Twyford is expected to arrive on time at 3.12, and the Oxford train is expected to leave on time at 3.14 from platform 7, getting there at 3.38. It’ll be showing on the departure board as the Manchester Piccadilly train. The next one is the 3.19 from platform 9B, which would give you a seven-minute wait.' })

// 4. Won't make it, asked for by name: Twyford's 3.07pm and the 3.14pm to Oxford.
const missed = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'OXF', 'Oxford', '15:07', '15:14')
eq('missed', missed.a, { kind: 'missed', text: 'You won’t make the 3.14pm to Oxford. Your train from Twyford is expected to arrive on time at 3.14, just as it’s due to leave. The next one is the 3.19 from platform 9B. You’d have five minutes to change, so that’s going to be tight too. The next connection which looks comfortable is the 3.48 from platform 9B, which would give you a 34-minute wait.' })
// Left to itself, it answers about the first train there's a minute or more for.
const first = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'OXF', 'Oxford', '15:07')
eq('first choice', [firstChoice(first.mine, first.d.trains)?.std, first.a.kind], ['15:19', 'tight'])
eq('choices start no more than ten minutes before you get in, six at most', [choices(first.mine, first.d.trains)[0].std, choices(first.mine, first.d.trains).length <= 6], ['15:14', true])

// 10. Cancelled: Reading's 3.45pm to York, for Twyford's 3.38pm.
const york = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'YRK', 'York', '15:38', '15:45')
eq('cancelled', york.a.text.startsWith('The 3.45pm to York has been cancelled. '), true)

// Fast, slower and Elizabeth Line trains (John, November 21st 2026): Reading to Paddington.
const pad = ask('TWY-RDG.json', 'TWY', 'RDG', rdg, 'PAD', 'London Paddington', '15:07')
const sp = speeds(pad.d.trains)
const kindAt = (std: string, plat: string) => sp.get(pad.d.trains.find((t) => t.std === std && t.platform === plat)!.id)
eq('kinds of train', [kindAt('15:27', '10'), kindAt('15:13', '15A'), kindAt('15:29', '14'), kindAt('15:29', '11A')], ['fast', 'slower', 'elizabeth', 'fast'])
eq('no kinds where the trains are alike', speeds(fine.d.trains).size, 0)
eq('the first choice names its kind, says when it gets there, and the next one isn’t the Elizabeth Line train', pad.a.text,
  'If you’re planning to get the 3.27pm fast train to London Paddington, you should be fine. You’ll have 13 minutes to change trains. Your train from Twyford is expected to arrive on time at 3.14, and the London Paddington train is expected to leave on time at 3.27, getting there at 3.52. You’re coming into platform 12 and you’ll want platform 10 for the 3.27. The one after that is two minutes later, the 3.29 fast train from platform 11A, which would give you a 15-minute wait.')
// Two trains at 3.29: the one that gets there first comes first; both stay in the row.
const row = choices(pad.mine, pad.d.trains).map((t) => chipLabel(t, sp))
eq('the row of trains', row, ['3.05pm fast, arrives 3.29', '3.11pm fast, arrives 3.35', '3.13pm slower, arrives 3.51', '3.27pm fast, arrives 3.52', '3.29pm fast, arrives 3.55', '3.29pm Elizabeth Line, arrives 4.25'])
eq('a plain row where the trains are alike', chipLabel(fine.d.trains.find((t) => t.std === '15:39')!, speeds(fine.d.trains)), '3.39pm')
// Chosen by name: the Elizabeth Line train stays in, with the quicker train pointed out.
const elizId = pad.d.trains.find((t) => t.std === '15:29' && t.platform === '14')!.id
const eliz = answer({ now: NOW, from: 'Twyford', at: 'Reading', to: 'London Paddington', mine: pad.mine, arrPlatform: pad.d.arrPlatform, trains: pad.d.trains, chosen: elizId })
eq('an Elizabeth Line train chosen by name', eliz.text,
  'If you’re planning to get the 3.29pm Elizabeth Line train to London Paddington, you should be fine. You’ll have 15 minutes to change trains. Your train from Twyford is expected to arrive on time at 3.14, and the London Paddington train is expected to leave on time at 3.29, getting there at 4.25. The 3.29 fast train leaves at the same time but gets there sooner, at 3.55. You’re coming into platform 12 and you’ll want platform 14 for the 3.29 Elizabeth Line train, or platform 11A for the 3.29 fast train. The 3.29 Elizabeth Line train will be showing on the departure board as the Abbey Wood train. The one after that is six minutes later, the 3.35 fast train from platform 11, which would give you a 21-minute wait.')

// Long waits to the nearest quarter of an hour (John, November 21st 2026).
eq('long waits', [60, 64, 68, 75, 86, 90, 94, 100, 105, 118, 120, 131, 150, 170, 185].map(longWait), ['an hour', 'more than an hour', 'almost an hour and a quarter', 'an hour and a quarter', 'almost an hour and a half', 'an hour and a half', 'more than an hour and a half', 'almost an hour and three quarters', 'an hour and three quarters', 'almost two hours', 'two hours', 'almost two and a quarter hours', 'two and a half hours', 'more than two and three quarter hours', 'more than three hours'])
eq('waits in a sentence', [59, 94, 8].map(aWait), ['a 59-minute wait', 'a wait of more than an hour and a half', 'an eight-minute wait'])

// "Over the footbridge" (John, November 21st 2026): the drafts he agreed, from the table made from
// OpenStreetMap (src/data/platform-links.json), on the same boards.
const links: LinksTable = JSON.parse(readFileSync(new URL('../src/data/platform-links.json', import.meta.url), 'utf8'))
const withLinks = (x: ReturnType<typeof ask>, at: string, chosen: string | null = null) =>
  answer({ now: NOW, from: x.a.text.match(/Your train from ([^ ]+(?: [A-Z][a-z]+)*) /)![1], at: x.d.atName, to: x.d.toName, mine: x.mine, arrPlatform: x.d.arrPlatform, trains: x.d.trains, chosen, links: links[at] })
eq('footbridge at Newton Abbot', withLinks(fine, 'NTA').text.includes('You’re coming into platform 3 and you’ll want platform 1, over the footbridge, where your train will be showing on the departure board as the Paignton train.'), true)
// Reading's is "the bridge" (John, November 24th 2026: links-overrides.json).
eq('the bridge at Reading', withLinks(tight, 'RDG').text.includes('You’re coming into platform 12 and you’ll want platform 8, over the bridge, where your train will be showing on the departure board as the Carmarthen train.'), true)
eq('"for the 3.27", then the bridge', withLinks(pad, 'RDG').text.includes('You’re coming into platform 12 and you’ll want platform 10 for the 3.27, over the bridge.'), true)
eq('two trains, both over the bridge (11A is the map’s 11)', withLinks(pad, 'RDG', elizId).text.includes('You’re coming into platform 12 and you’ll want platform 14 for the 3.29 Elizabeth Line train, or platform 11A for the 3.29 fast train, both over the bridge.'), true)
eq('the same platform: nothing added', withLinks(same, 'NTA').text, same.a.text)
eq('without the table, the agreed sentences are unchanged', answer({ now: NOW, from: 'Ivybridge', at: fine.d.atName, to: fine.d.toName, mine: fine.mine, arrPlatform: fine.d.arrPlatform, trains: fine.d.trains, chosen: null }).text, fine.a.text)
// Each kind, on the real table.
eq('the kinds', [
  howToGet(links.ADV, '1', '2'), howToGet(links.RDG, '9', '8'), howToGet(links.RDG, '4', '7'), howToGet(links.RDW, '1', '2'),
  howToGet(links.MDG, '1', '2'), howToGet(links.PAD, '1', '6'), howToGet(links.AHV, '1', '2'), howToGet(links.TWY, '1', '4'),
], ['through the subway', 'just across the platform', 'on the same level', 'which means going out of the station and round by the road',
  'across the level crossing', 'over the footbridge or round through the concourse', 'through the subway', 'over the footbridge'])
// In doubt (John, November 27th 2026): the Exits table says these platforms are on the level with an exit's
// platform, the links say across the line; one is wrong, so nothing is said. Maidenhead 1 to 5 (subway).
eq('in doubt: nothing said', [howToGet(links.MAI, '1', '5'), howToGet(links.MAI, '1', '4')], ['', ''])
// Bath Spa, no longer in doubt once John described it (November 28th 2026): platform 1 only by the subway.
eq('Bath Spa: 1 to 2 through the subway', [howToGet(links.BTH, '1', '2'), howToGet(links.BTH, '2', '1')], ['through the subway', 'through the subway'])
eq('in doubt only between those groups: Maidenhead 4 to 5 still said', howToGet(links.MAI, '4', '5') !== '', true)
// Hersham: John's words for going round (November 27th 2026).
eq('Hersham: round under the bridge', howToGet(links.HER, '1', '2'), 'which means taking the steps down and going round by the road under the railway bridge')
eq('either, at Clapham Junction (1 to 3)', howToGet(links.CLJ, '1', '3'), 'over the footbridge or through the subway')
eq('9A to 9B, a platform not on the map, or no table: nothing', [howToGet(links.RDG, '9A', '9B'), howToGet(links.RDG, '99', '1'), howToGet(undefined, '1', '2'), howToGet(links.RDG, '8', '8')], ['', '', '', ''])
const made: StationLinks = { g: [[['1']], [['2']], [['3']], [['4']]], x: 'bsxu?r' }
eq('pairs in order, either way round', [howToGet(made, '1', '2'), howToGet(made, '3', '1'), howToGet(made, '1', '4'), howToGet(made, '2', '3'), howToGet(made, '4', '2'), howToGet(made, '3', '4')],
  ['over the footbridge', 'through the subway', 'across the level crossing', '', '', 'which means going out of the station and round by the road'])
eq('the table has only stations in the list', Object.keys(links).every((c) => /^[A-Z]{3}$/.test(c)), true)


// A long wait, more than 40 minutes (John, November 22nd 2026). Ivybridge's 3.04pm gets into
// Newton Abbot at 3.29; the trains to Torquay that day leave at 3.06, 3.39, 4.05 and 4.45.
{
  const base = fine.d
  const late4 = (t: typeof base.trains[number]) => ({ ...t, etd: '16:49' })
  const ask2 = (o: { from?: string; chosen?: string; exp?: string; late?: boolean }) => {
    const trains = base.trains.filter((t) => t.std >= (o.from ?? '00:00')).map((t) => (o.late && t.std === '16:45' ? late4(t) : t))
    const mine = o.exp ? { ...fine.mine, sta: o.exp, exp: o.exp } : fine.mine
    return answer({ now: NOW, from: 'Ivybridge', at: base.atName, to: base.toName, mine, arrPlatform: null, trains, chosen: o.chosen ? trains.find((t) => t.std === o.chosen)!.id : null }).text
  }
  const tail = ' It’ll be showing on the departure board as the Paignton train. These times can change, so it’s worth checking again later.'
  eq('long wait: the next train, in words from 70 minutes (John)', ask2({ from: '16:15' }),
    'The next connecting train to Torquay is the 4.45pm, which is going to give you quite a wait at Newton Abbot. You’ll have more than an hour and a quarter between trains. Your train from Ivybridge is expected to arrive on time at 3.29, and the Torquay train is currently expected to leave on time from platform 2, getting there at 4.55.' + tail)
  eq('long wait: the same train chosen is still "the next"', ask2({ from: '16:15', chosen: '16:45' }), ask2({ from: '16:15' }))
  eq('long wait: a later train chosen', ask2({ chosen: '16:45' }).split('. ').slice(0, 2).join('. '),
    'If you’re planning to get the 4.45pm to Torquay, that’s quite a wait at Newton Abbot. You’ll have more than an hour and a quarter between trains')
  eq('long wait: 40 to 70 minutes, digits and "between trains"', ask2({ from: '16:00', exp: '15:20' }).split('. ').slice(0, 2).join('. '),
    'The next connecting train to Torquay is the 4.05pm, which is going to give you quite a wait at Newton Abbot. You’ll have 45 minutes between trains')
  eq('long wait: the onward train late keeps its time', ask2({ from: '16:15', late: true }).includes('the Torquay train is currently expected to leave four minutes late, at 4.49 from platform 2'), true)
  eq('40 minutes or less: "you should be fine" as before', ask2({ from: '16:00' }).startsWith('If you’re planning to get the 4.05pm to Torquay, you should be fine. You’ll have 36 minutes to change trains.'), true)
}
console.log(`check-connection: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
