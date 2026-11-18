// npm run check (part 2): the two functions' own rules, on the real answers National Rail gave
// on November 17th 2026 (design/mockups/snapshots/). No network: only trim(), count() and
// untilMidnight() are tried. Fails loudly if an answer changes.
import { readFileSync, readdirSync } from 'node:fs'
import { trim, WINDOWS, type RawBoard } from '../api/live.ts'
import { count, untilMidnight } from '../api/week.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const dir = new URL('../design/mockups/snapshots/', import.meta.url)
const read = (f: string) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'))

// The live function asks for the same five windows as the snapshots were taken with.
const rdg = read('20261117-1824-RDG-PAD.json')
eq('windows', WINDOWS, rdg.boards.map((b: { off: number; win: number }) => [b.off, b.win]))

for (const f of readdirSync(dir).filter((x) => /^\d{8}-\d{4}-[A-Z]{3}-[A-Z]{3}\.json$/.test(x))) {
  const s = read(f)
  const snap = trim(s.from, s.to, s.taken, s.boards.map((b: { board: RawBoard }) => b.board))
  const ids = new Set(s.boards.flatMap((b: { board: RawBoard }) => (b.board.trainServices || []).map((t) => t.serviceID)))
  eq(`${f}: each train once`, snap.services.length, ids.size)
  eq(`${f}: names`, typeof snap.fromName === 'string' && snap.fromName.length > 3 && snap.toName.length > 3, true)
  eq(`${f}: no train without a time`, snap.services.every((t) => /^\d\d:\d\d$/.test(t.std)), true)
}
const t = trim(rdg.from, rdg.to, rdg.taken, rdg.boards.map((b: { board: RawBoard }) => b.board))
eq('RDG-PAD names', [t.fromName, t.toName], ['Reading', 'London Paddington'])

// The history's answers: Reading to London Paddington, 5pm to 5.30pm, weekdays November 10th to
// 16th (asked with margins 0, 3, 10 and 30): 26 trains; 8, 21 and 26 within 3, 10 and 30.
const r = count(read('20261117-hsp-RDG-PAD-1700-1730.json'))
eq('history RDG-PAD', [r.n, r.w3, r.w10, r.w30, r.w120], [26, 8, 21, 26, 26])
eq('history RDG-PAD dates', r.dates, ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-16'])
const m = count(read('20261117-hsp-MAN-MIA-1840-1910.json'))
// Manchester Piccadilly to the Airport, 6.40pm to 7.10pm on November 17th (asked with 120): four
// trains, three of them cancelled (they miss even 120 minutes; data trial §9).
eq('history MAN-MIA', [m.n, m.w3, m.w10, m.w30, m.w120, m.n - m.w120], [4, 0, 1, 1, 1, 3])
// Leaving the Elizabeth Line out (John, November 18th 2026: a stray run at Paddington), as at
// Twyford to Paddington, 8am to 9am: two Great Western trains five times, one Elizabeth Line run.
const tw = { Services: [
  { serviceAttributesMetrics: { matched_services: '5', toc_code: 'GW', rids: [] }, Metrics: [{ tolerance_value: '3', num_tolerance: '3' }, { tolerance_value: '120', num_tolerance: '4' }] },
  { serviceAttributesMetrics: { matched_services: '5', toc_code: 'GW', rids: [] }, Metrics: [{ tolerance_value: '3', num_tolerance: '3' }, { tolerance_value: '120', num_tolerance: '4' }] },
  { serviceAttributesMetrics: { matched_services: '1', toc_code: 'XR', rids: [] }, Metrics: [{ tolerance_value: '3', num_tolerance: '0' }, { tolerance_value: '120', num_tolerance: '1' }] },
] }
eq('history: Elizabeth Line left out', [count(tw).n, count(tw, 'XR').n, count(tw, 'XR').w3, count(tw, 'XR').w120, count(tw, 'XR').elizabeth], [11, 10, 6, 8, 0])
eq('history empty', count({ Services: [] }), { n: 0, w3: 0, w10: 0, w30: 0, w120: 0, dates: [], elizabeth: 0 })

// Kept until UK midnight: 6.24pm GMT on November 17th is 20,160 seconds before it; in summer
// time, 10.30pm UTC on July 1st is 11.30pm BST, half an hour before it.
eq('until midnight (winter)', untilMidnight(new Date('2026-11-17T18:24:00Z')), 20160)
eq('until midnight (summer)', untilMidnight(new Date('2026-07-01T22:30:00Z')), 1800)

console.log(`check-api: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
