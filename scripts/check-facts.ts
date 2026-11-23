// npm run check (part 6): "Fact of the journey" (John, November 22nd 2026) on the real data
// (src/data/passes-near.json) and real saved boards: the journey's stretches, the side swapped for
// the other way, nothing where no stretch has a fact yet.
import { readFileSync } from 'node:fs'
import d from '../src/data/passes-near.json' with { type: 'json' }
import { trim, type RawBoard } from '../api/live.ts'
import { journeyFacts, journeyLegs, pickFact, placeName, sentenceFor, shortestLegs, withPlace, type PnData } from '../src/lib/passesNear.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const D = d as unknown as PnData
function board(file: string) {
  const s = JSON.parse(readFileSync(new URL(`../design/mockups/snapshots/${file}`, import.meta.url), 'utf8'))
  const snap = trim(s.from, s.to, s.taken, s.boards.map((b: { board: RawBoard }) => b.board))
  return { from: snap.from, to: snap.to, stops: snap.stops.map(([c]) => c) }
}
const ids = (from: string, stops: string[], to: string) => journeyLegs(D, from, stops, to).map((l) => l.id)

// Reading to Paddington (the 8.59pm board): its train with the most stops is an Elizabeth Line one,
// so every stretch from Reading to Paddington, both ways, and the same stretches each way.
const rp = board('20261117-2059-RDG-PAD.json'), pr = board('20261117-2059-PAD-RDG.json')
const rpIds = ids(rp.from, rp.stops, rp.to), prIds = ids(pr.from, pr.stops, pr.to)
eq('Reading to Paddington: starts at Reading, ends at Paddington', [journeyLegs(D, rp.from, rp.stops, rp.to)[0].from, journeyLegs(D, rp.from, rp.stops, rp.to).at(-1)!.to], ['RDG', 'PAD'])
eq('Reading to Paddington: no stretch twice', new Set(rpIds).size, rpIds.length)
eq('Paddington to Reading: the same stretches the other way', [...prIds].reverse(), rpIds)
eq('Reading to Paddington: crosses the Thames at Maidenhead', rpIds.includes('MAI-TAP'), true)
const rpFacts = journeyFacts(D, rp.from, rp.stops, rp.to)
eq('Reading to Paddington: a fact for every stretch (all covered by the pilot)', rpFacts.length, rpIds.length)

// The side swaps for the other way; a boundary uses its own words for the other way.
const ham = D.items['HAN-WEA']   // written from West Ealing to Hanwell, on the left
eq('Hanwell cemetery: left going towards Hanwell', sentenceFor(ham, { id: 'HAN-WEA', from: 'WEA', to: 'HAN' }).includes("on the train’s left"), true)
eq('Hanwell cemetery: right going towards West Ealing', sentenceFor(ham, { id: 'HAN-WEA', from: 'HAN', to: 'WEA' }).includes("on the train’s right"), true)
const iver = D.items['IVR-LNY']
eq('Iver to Langley: the boundary each way', [sentenceFor(iver, { id: 'IVR-LNY', from: 'IVR', to: 'LNY' }), sentenceFor(iver, { id: 'IVR-LNY', from: 'LNY', to: 'IVR' })],
  ['Between Iver and Langley, your train passes from Buckinghamshire into Berkshire.', 'Between Langley and Iver, your train passes from Berkshire into Buckinghamshire.'])
eq('the facts read the right way on the real journey', rpFacts.find((f) => f.id === 'IVR-LNY')!.text, 'Between Langley and Iver, your train passes from Berkshire into Buckinghamshire.')
eq('curly apostrophes, as on the rest of the page', sentenceFor(D.items['MAI-TAP'], { id: 'MAI-TAP', from: 'TAP', to: 'MAI' }).includes('Brunel’s'), true)
eq('no straight quotation marks left in any fact', Object.entries(D.items).some(([k, i]) => /['"]/.test(sentenceFor(i, { id: k, from: i.a, to: i.b }))), false)
eq('no "{side}" left in any fact on either journey', [...rpFacts, ...journeyFacts(D, pr.from, pr.stops, pr.to)].some((f) => f.text.includes('{')), false)

// A fast train: Paddington to Plymouth (the 7.47pm board) stops at Reading, Westbury, Exeter…; the
// way between stops is the shortest through the network, so it runs through Reading, Westbury and
// Exeter St Davids and passes stations it doesn't stop at.
const pp = board('20261117-1947-PAD-PLY.json')
const ppLegs = journeyLegs(D, pp.from, pp.stops, pp.to)
const through = new Set(ppLegs.flatMap((l) => [l.from, l.to]))
eq('Paddington to Plymouth: through Reading, Westbury and Exeter St Davids', ['RDG', 'WSB', 'EXD'].every((c) => through.has(c)), true)
eq('Paddington to Plymouth: passes Thatcham without stopping', [pp.stops.includes('THA'), through.has('THA')], [false, true])
eq('Paddington to Plymouth: a joined-up route', ppLegs.every((l, i) => i === 0 || ppLegs[i - 1].to === l.from), true)
eq('Paddington to Plymouth: dozens of facts to pick from', journeyFacts(D, pp.from, pp.stops, pp.to).length > 40, true)

// Bath Spa to Bristol: the pilot's stretches; Manchester to the Airport: facts since batch 50.
// Acklington to Alnmouth (the North East, not reached yet): no facts there yet, so nothing.
const bb = board('20261117-1824-BTH-BRI.json'), mm = board('20261117-1824-MAN-MIA.json')
eq('Bath to Bristol: facts', journeyFacts(D, bb.from, bb.stops, bb.to).length > 0, true)
eq('Manchester to the Airport: facts', journeyFacts(D, mm.from, mm.stops, mm.to).length > 0, true)
eq('Acklington to Alnmouth: no fact yet, so the card is left off', journeyFacts(D, 'ACK', [], 'ALM'), [])

// Stations outside the network (Cardiff Central) and the same station twice give nothing, not a guess.
eq('a station outside the network: no way found', shortestLegs(D, 'CDF', 'RDG'), [])
eq('the same station: no stretches', shortestLegs(D, 'RDG', 'RDG'), [])

// Picking: one of them, at random; none from none.
const fs = journeyFacts(D, bb.from, bb.stops, bb.to)
eq('picking: the first and the last can both come up', [pickFact(fs, 0), pickFact(fs, 0.9999)], [fs[0], fs.at(-1)])
eq('picking from nothing', pickFact([]), null)

// Every item in the page's data sits on a real stretch, with "{side}" exactly when it has a side.
const known = new Set(D.stretches.map(([a, b]) => [a, b].sort().join('-')))
eq('every item on a stretch', Object.keys(D.items).every((k) => known.has(k)), true)
eq('"{side}" exactly when there is a side', Object.values(D.items).every((i) => i.text.includes('{side}') === Boolean(i.side)), true)

// "Between X and Y, your train…" (John, November 23rd 2026): the two stations in the order the train
// meets them, only before "Your train", never when the stretch is the whole journey.
const pf = journeyFacts(D, pr.from, pr.stops, pr.to), rf = rpFacts
const hay = (fs: typeof pf) => fs.find((f) => f.id === 'HAY-STL')!.text
eq('the gurdwara, Paddington to Reading', hay(pf).startsWith('Between Southall and Hayes & Harlington, your train passes near Gurdwara'), true)
eq('the gurdwara, Reading to Paddington', hay(rf).startsWith('Between Hayes & Harlington and Southall, your train passes near Gurdwara'), true)
eq('the River Colne, Reading to Paddington', rf.find((f) => f.id === 'IVR-WDT')!.text.startsWith('Between Iver and West Drayton, your train crosses the River Colne'), true)
eq('every "Your train" fact on both journeys gets its stations', [...pf, ...rf].filter((f) => /^Your train/.test(f.text)).map((f) => f.id), [])
eq('a boundary keeps its own "Between"', rf.find((f) => f.id === 'IVR-LNY')!.text.startsWith('Between Langley and Iver, your train passes from'), true)
const st = Object.entries(D.items).find(([, i]) => i.kind === 'station' && !/^Your train/.test(i.text))!
eq('a station fact is left as it is', withPlace(st[1].text, { id: st[0], from: st[1].a, to: st[1].b }, { from: 'PAD', to: 'RDG' }), st[1].text)
eq('a stretch that is the whole journey: no "Between"', withPlace('Your train crosses X.', { id: 'TAP-MAI', from: 'TAP', to: 'MAI' }, { from: 'TAP', to: 'MAI' }), 'Your train crosses X.')
eq('brackets dropped from a name', [placeName('BMY'), placeName('WWC'), placeName('SEF')], ['Bramley', 'Woolwich', 'Seaford'])
eq('a fact about the station’s own place keeps no "Between"', withPlace('Your train passes Newington, on the train’s left.', { id: 'NGT-RAI', from: 'NGT', to: 'RAI' }, { from: 'VIC', to: 'RAM' }), 'Your train passes Newington, on the train’s left.')
eq('…but a place named after it does', withPlace('Your train passes near Strawberry Hill House.', { id: 'STW-TWI', from: 'STW', to: 'TWI' }, { from: 'WAT', to: 'RDG' }).startsWith('Between Strawberry Hill and Twickenham, your'), true)
eq('every station on the network has a name', D.stretches.flat().filter((c) => typeof c === 'string').every((c) => placeName(c as string) !== c), true)

console.log(`check-facts: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
