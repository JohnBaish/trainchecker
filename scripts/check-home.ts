// npm run check (part 10): "Message home" (John, November 26th 2026), on the saved rush-hour board, Reading to
// Paddington at 6.24pm on November 17th 2026. The arrival board is made up from the departures (as the preview
// pictures are), so the platforms here are illustration only; the rules and wording are what's checked.
import { readFileSync } from 'node:fs'
import { trim } from '../api/live.ts'
import { analyse, type Snap } from '../src/lib/analyse.ts'
import { homeFor, SOON } from '../src/lib/messageHome.ts'
import { apart, boardKind, trainName } from '../src/lib/sentences.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const s = JSON.parse(readFileSync(new URL('../design/mockups/snapshots/20261117-1824-RDG-PAD.json', import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b: { board: unknown }) => b.board)) as Snap
const withArr = (platforms: boolean): Snap => ({ ...snap, arrivals: snap.services.map((x) => ({ ...x, platform: platforms ? '11' : null })) })
const a = analyse(withArr(true))
const all = [...a.past, ...a.ahead]
const train = (std: string) => all.find((t) => t.std === std)!

eq('four minutes', SOON, 4)

// Left, on time.
const on = homeFor(a, train('18:05'), a.now)
eq('on time: heading', on.heading, 'The 6.05pm from Reading')
eq('on time: words', on.line, 'Expected into London Paddington at 6.29pm, on platform 11.')
eq('on time: sent', on.sent, 'Here’s my train from Reading, expected into London Paddington at 6.29pm.')

// Left, late.
const late = homeFor(a, train('18:18'), a.now)
eq('late: words', late.line, 'Running two minutes late, now expected into London Paddington at 6.43pm, on platform 11.')
eq('late: sent', late.sent, 'Here’s my train from Reading, running two minutes late, now expected into London Paddington at 6.43pm.')

// Not left: the 6.28pm, expected to leave at 6.34 (ten minutes away): planning to get.
const plan = homeFor(a, train('18:28'), a.now)
eq('planned: sent', plan.sent.startsWith('I’m planning to get the 6.28pm from Reading,'), true)
eq('planned: platform in the message', plan.sent.endsWith(', on platform 11.'), true)

// The same train at 6.30 (four minutes before it's expected to leave): my train. At 6.29 (five): planning.
eq('four minutes before: my train', homeFor(a, train('18:28'), '18:30').sent.startsWith('Here’s my train from Reading,'), true)
eq('five minutes before: planning', homeFor(a, train('18:28'), '18:29').sent.startsWith('I’m planning to get'), true)
// An on-time train goes by its timetabled time: the 6.32pm at 6.28 is my train, at 6.27 planning.
eq('on time, four minutes before', homeFor(a, train('18:32'), '18:28').sent.startsWith('Here’s my train'), true)
eq('on time, five minutes before', homeFor(a, train('18:32'), '18:27').sent.startsWith('I’m planning'), true)

// Delayed with no time is never "my train" yet.
const delayed = { ...train('18:32'), etd: 'Delayed', unknown: true }
eq('delayed: planning', homeFor(a, delayed, '18:31').sent.startsWith('I’m planning'), true)

// No platform known: none in the words.
const b = analyse(withArr(false))
const noPlat = homeFor(b, [...b.past, ...b.ahead].find((t) => t.std === '18:28')!, b.now)
eq('no platform', [noPlat.line.includes('platform'), noPlat.sent.includes('platform')], [false, false])

// Two trains at the same time (John, November 26th 2026). One company's two 4.42pms from Reading (one fast,
// one slower) aren't labelled: no "fast" or "slower" in the lists; they're told apart by when they get in.
const sb = (f: string) => { const x = JSON.parse(readFileSync(new URL(`../design/mockups/snapshots/${f}`, import.meta.url), 'utf8')); return analyse(trim(x.from, x.to, x.taken, x.boards.map((b: { board: unknown }) => b.board)) as Snap) }
const r = sb('20261117-1824-RDG-PAD.json'), rAll = [...r.past, ...r.ahead], ra = apart(rAll)
const at = (l: typeof rAll, std: string) => l.filter((t) => t.std === std).sort((x, y) => (x.sta! < y.sta! ? -1 : 1))
eq('one company at 4.42pm: no label', at(rAll, '16:42').map(ra), ['', ''])
eq('one company at 4.42pm: plain name', trainName(at(rAll, '16:42')[0], rAll), 'the 4.42pm')
// A Great Western and an Elizabeth Line train at 4.47pm: each its company.
eq('two companies at 4.47pm', at(rAll, '16:47').map(ra), ['Great Western Railway', 'Elizabeth Line'])
eq('the Elizabeth Line one named', trainName(at(rAll, '16:47')[1], rAll), 'the 4.47pm Elizabeth Line train')
eq('alone at its time: plain', [ra(at(rAll, '18:05')[0]), trainName(at(rAll, '18:05')[0], rAll)], ['', 'the 6.05pm'])
// Liverpool Street to Stratford: Greater Anglia and Elizabeth Line at 7.48pm.
const l = sb('20261117-2059-LST-SRA.json'), lAll = [...l.past, ...l.ahead]
eq('Liverpool Street: the companies', at(lAll, '19:48').map(apart(lAll)), ['Greater Anglia', 'Elizabeth Line'])
eq('named by company', trainName(at(lAll, '19:48')[0], lAll), 'the 7.48pm Greater Anglia train')
// Message home's line keeps the board's kind (Fast, Slower, Elizabeth Line), as the arrivals board does.
eq('board kind kept', [boardKind(r)(at(rAll, '16:42')[0]), boardKind(r)(at(rAll, '16:42')[1])], ['Fast', 'Slower'])
// Already in: "Arrived into" in the picture, "got into" in the message.
const inn = homeFor(a, train('17:50'), a.now)
eq('arrived: words', inn.line, 'Arrived into London Paddington at 6.21pm, on platform 11.')
eq('arrived: sent', inn.sent, 'Here’s my train from Reading, which got into London Paddington at 6.21pm.')

console.log(`check-home: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
