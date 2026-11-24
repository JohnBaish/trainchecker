// npm run check (part 7): "The next hour" and "The following three hours" (John, November 24th 2026)
// on the real saved boards: no train in both panels, the stretch to three running trains, the
// headings, the agreed wording word for word, "not yet", cancelled trains under the board.
import { readFileSync, readdirSync } from 'node:fs'
import { trim, type RawBoard } from '../api/live.ts'
import { analyse, type Analysis } from '../src/lib/analyse.ts'
import { firstPanel, laterPanel, split } from '../src/lib/windows.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const dir = new URL('../design/mockups/snapshots/', import.meta.url)
function A(file: string, back = 0): Analysis {
  const s = JSON.parse(readFileSync(new URL(file, dir), 'utf8'))
  const taken = new Date(Date.parse(s.taken) - back * 60000).toISOString()
  return analyse(trim(s.from, s.to, taken, s.boards.map((b: { board: RawBoard }) => b.board)))
}
const files = readdirSync(dir).filter((f) => /^\d{8}-\d{4}-[A-Z]{3}-[A-Z]{3}\.json$/.test(f)).sort()

// Every saved board, and each moved back by up to two hours: every train in exactly one panel, the
// first panel has at least three running trains (or every one there is), and the heading counts them all.
for (const f of files) for (const back of [0, 30, 60, 90, 120]) {
  const a = A(f, back)
  if (a.verdict === 'none') continue
  const s = split(a)
  const ids = [...s.first.ahead, ...s.later.ahead].map((t) => t.id)
  eq(`${f} -${back}: each train once`, [ids.length, new Set(ids).size], [a.ahead.length, a.ahead.length])
  const running = (x: Analysis) => x.ahead.filter((t) => !t.cancelled).length
  eq(`${f} -${back}: at least three running first`, running(s.first) >= Math.min(3, running(a)), true)
  const h = firstPanel(a).heading
  const words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
  const n = s.first.ahead.length
  if (s.stretched) eq(`${f} -${back}: stretched heading counts every train`, h, n === 1 ? 'The next train' : `The next ${words[n] ?? n} trains`)
  else eq(`${f} -${back}: the hour`, [h, laterPanel(a).heading], ['The next hour', 'The following three hours'])
  if (s.stretched) eq(`${f} -${back}: "Later" when stretched`, laterPanel(a).heading, 'Later')
  // Never totals and "an hour" mixed in the later panel (John).
  const l = laterPanel(a).lines.join(' ')
  eq(`${f} -${back}: no "an hour" in the later panel`, /an hour/.test(l), false)
  eq(`${f} -${back}: no "in that time"`, /in that time/.test(l), false)
}

const bth = A('20261117-1824-BTH-BRI.json'), rdgPad = A('20261117-1824-RDG-PAD.json'), padRdg = A('20261117-1824-PAD-RDG.json')
const eusMkc = A('20261117-2059-EUS-MKC.json'), kgxYrk = A('20261117-1947-KGX-YRK.json'), tvp = A('20261118-0822-TVP-PAD.json')

eq('the next hour, one paragraph of two sentences', firstPanel(bth).lines.join(' '), 'There are four trains in the next hour. One is cancelled, because of a passenger being taken ill on a train. The rest are expected to be on time.')
eq('cancelled: under the board, not on it', [firstPanel(bth).cancelled, firstPanel(bth).picture!.rows.some((r) => r.time === '7.13pm')], ['The 7.13pm is cancelled, because of a passenger being taken ill on a train.', false])
eq('later: the rate once, "per hour" (John)', laterPanel(padRdg).lines[0], 'There are about six fast trains, two slower ones (taking about 35 minutes) and two on the Elizabeth Line per hour.')
eq('later: one kind', laterPanel(bth).lines[0], 'There are about five trains per hour.')
eq('later: a group under one an hour, all totals (John)', laterPanel(eusMkc).lines[0], "There's one fast train and nine slower ones.")
eq('later: platforms already announced', laterPanel(rdgPad).platLine, 'Platforms have already been announced for 11 of these: from platforms 10, 11 and 13.')
eq('later: all on one platform', laterPanel(bth).platLine, 'Platforms have already been announced for all of these: platform 1.')
eq('stretched: heading, no opening sentence (John)', [firstPanel(kgxYrk).heading, firstPanel(kgxYrk).lines], ['The next three trains', ["They're all expected to be on time."]])
eq('stretched: "Later"', laterPanel(kgxYrk).lines[0], 'There are two more trains in the next four hours.')
eq('stretched, nothing later', [firstPanel(tvp).heading, laterPanel(tvp).lines[0]], ['The next three trains', 'There are no more direct trains from Tiverton Parkway to London Paddington in the next four hours.'])
const pp = firstPanel(padRdg).picture!
eq('"not yet" for a train with no platform', [pp.rows.length, pp.rows.filter((r) => (r as { noPlat?: boolean }).noPlat).length, pp.rows[4].time], [12, 7, '6.50pm'])
eq('one platform for all: in the heading', firstPanel(tvp).picture!.one, '2')

console.log(`check-windows: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
