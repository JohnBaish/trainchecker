// npm run check (part 10): "Message home" (John, November 26th 2026), on the saved rush-hour board, Reading to
// Paddington at 6.24pm on November 17th 2026. The arrival board is made up from the departures (as the preview
// pictures are), so the platforms here are illustration only; the rules and wording are what's checked.
import { readFileSync } from 'node:fs'
import { trim } from '../api/live.ts'
import { analyse, type Snap } from '../src/lib/analyse.ts'
import { homeFor, SOON } from '../src/lib/messageHome.ts'

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

console.log(`check-home: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
