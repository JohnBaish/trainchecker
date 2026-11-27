// npm run check (part 7): "The next hour" and "The following three hours" (John, November 24th 2026)
// on the real saved boards: no train in both panels, the stretch to three running trains, the
// headings, the agreed wording word for word, "not yet", cancelled trains under the board.
import { readFileSync, readdirSync } from 'node:fs'
import { trim, type RawBoard } from '../api/live.ts'
import { analyse, type Analysis } from '../src/lib/analyse.ts'
import { firstPanel, firstShare, laterPanel, laterShare, split } from '../src/lib/windows.ts'
import { slowerBy } from '../src/lib/sentences.ts'

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
  const n = s.first.ahead.filter((t) => !t.cancelled).length
  if (s.stretched) eq(`${f} -${back}: stretched heading counts the trains running`, h, n === 1 ? 'The next train' : `The next ${words[n] ?? n} trains`)
  else eq(`${f} -${back}: the hour`, [h, laterPanel(a).heading], ['The next hour', 'The following three hours'])
  if (s.stretched) eq(`${f} -${back}: "Later" when stretched`, laterPanel(a).heading, 'Later')
  // Counts are of trains running; cancelled ones are "more" (John, November 24th 2026).
  for (const x of [...firstPanel(a).lines, ...laterPanel(a).lines]) { if (/cancelled/.test(x) && !/(more|All \w+ are cancelled|cancelled\.$)/.test(x)) eq(`${f} -${back}: cancelled said as "more"`, x, '(with "more")') }
  // Never totals and "an hour" mixed in the later panel (John).
  const l = laterPanel(a).lines.join(' ')
  eq(`${f} -${back}: no "an hour" in the later panel`, /an hour/.test(l), false)
  eq(`${f} -${back}: "in that time" only after "more"`, /in that time/.test(l.replace(/more in that time/g, '')), false)
}

// Since November 26th 2026 (John, Birmingham to Cardiff) a late train still waiting at A counts as still to leave:
// Bath Spa's 6.23pm (expected 6.25) and Paddington's 6.20pm (expected 6.24) are on these boards at 6.24pm.
const bth = A('20261117-1824-BTH-BRI.json'), rdgPad = A('20261117-1824-RDG-PAD.json'), padRdg = A('20261117-1824-PAD-RDG.json')
const eusMkc = A('20261117-2059-EUS-MKC.json'), kgxYrk = A('20261117-1947-KGX-YRK.json'), tvp = A('20261118-0822-TVP-PAD.json')

eq('the next hour: running trains counted, the cancelled one "more" (John)', firstPanel(bth).lines.join(' '), 'There are four trains in the next hour. One more is cancelled, because of a passenger being taken ill on a train. The rest are expected to be on time.')
const manMia = A('20261117-1824-MAN-MIA.json')
eq('later: the rate of trains running, "Seven more in that time" (John)', laterPanel(manMia).lines.join(' '), 'There are five trains per hour. Seven more in that time are cancelled, mostly because of a fault with the signalling system, and one is expected to be more than five minutes late, because of a passenger being taken ill on a train. The rest are expected to be on time.')
eq('the next hour: the platforms line (John)', [firstPanel(bth).platLine, firstPanel(A('20261117-1824-RDG-PAD.json')).platLine], ['Platforms have been announced for all of these: platform 1.', 'Platforms have been announced for all of these: from platforms 10, 11 and 14.'])
eq('two trains on two platforms: not "mostly"', firstPanel(A('20261118-0822-RDG-MDG.json')).platLine, 'Platforms have been announced for two of these: from platforms 2 and 12A.')
eq('hour by hour: running on the right, "of these" late, "more" cancelled (John)', laterShare(manMia)!.rows.map((r) => [r.time, r.mid, r.late]), [['7.24 to 8.24pm', 'four trains', 'one of these is late, three more are cancelled'], ['8.24 to 9.24pm', 'six trains', 'two more are cancelled'], ['9.24 to 10.24pm', 'five trains', 'two more are cancelled']])
eq('ranges: "pm" once, at the end (John, November 26th 2026)', [firstShare(manMia)!.words.text, firstShare(manMia)!.when], ['The trains from Manchester Piccadilly to Manchester Airport leaving between 6.24 and 7.24pm on November 17th, with the platforms announced so far, from Trainchecker.', '6.24 to 7.24pm on November 17th'])
eq('hour by hour: the words (John: commas)', laterShare(manMia)!.words.text, 'The trains from Manchester Piccadilly to Manchester Airport, hour by hour, from 7.24 to 10.24pm on November 17th, from Trainchecker.')
eq('stretched: the later trains themselves, not hours (John, (b))', laterShare(A('20261117-1947-KGX-YRK.json'))!.layout, undefined)
eq('cancelled: under the board, not on it', [firstPanel(bth).cancelled, firstPanel(bth).picture!.rows.some((r) => r.time === '7.13pm')], ['The 7.13pm is cancelled, because of a passenger being taken ill on a train.', false])
eq('cancelled: "pm" said once, kept on the hour (John, November 26th 2026)', [firstPanel(manMia).cancelled, laterPanel(manMia).cancelled], ['The 6.47pm, 6.55 and 7pm are cancelled, because of a fault with the signalling system at Gatley and a fault with the signalling system.', 'The 7.28pm, 7.47, 7.55, 8.47, 8.55, 9.47 and 9.55 are cancelled, mostly because of a fault with the signalling system.'])
eq('cancelled: two, "pm" once', firstPanel(A('20261117-2059-LST-SRA.json')).cancelled, 'The 9pm and 9.28 are cancelled, because of the emergency services dealing with an incident earlier today.')
eq('later: the rate once, "per hour" (John)', laterPanel(padRdg).lines[0], 'There are about six fast trains, two slower ones (taking about 35 minutes) and two on the Elizabeth Line per hour.')
eq('later: one kind, trains running', laterPanel(bth).lines[0], 'There are about four trains per hour.')
eq('later: a group under one an hour, all totals (John)', laterPanel(eusMkc).lines[0], "There's one fast train and nine slower ones.")
eq('later: platforms already announced', laterPanel(rdgPad).platLine, 'Platforms have already been announced for 11 of these: from platforms 10, 11 and 13.')
eq('later: all on one platform', laterPanel(bth).platLine, 'Platforms have already been announced for all of these: platform 1.')
eq('stretched: heading, no opening sentence (John)', [firstPanel(kgxYrk).heading, firstPanel(kgxYrk).lines], ['The next three trains', ["They're all expected to be on time."]])
eq('stretched: "Later"', laterPanel(kgxYrk).lines[0], 'There are two more trains in the next four hours.')
eq('stretched, nothing later', [firstPanel(tvp).heading, laterPanel(tvp).lines[0]], ['The next three trains', 'There are no more direct trains from Tiverton Parkway to London Paddington in the next four hours.'])
const pp = firstPanel(padRdg).picture!
eq('"not yet" for a train with no platform', [pp.rows.length, pp.rows.filter((r) => (r as { noPlat?: boolean }).noPlat).length, pp.rows[4].time], [13, 7, '6.48pm'])
eq('one platform for all: in the heading', firstPanel(tvp).picture!.one, '2')

// Coaches (John, November 27th 2026): each row carries the board's count; 0 on the board is none.
{
  const rp = A('20261117-1824-RDG-PAD.json')
  const rows = firstPanel(rp).picture!.rows
  eq('Reading to Paddington: coaches on the rows', rows.map((r) => r.coaches ?? null), [4, 8, null, 5, 9, null, 5, 5, 8, null, 10, 5, 4, 9, 9])
  const el = rp.ahead.filter((t) => t.operator === 'Elizabeth Line')
  eq('Elizabeth Line with 0 on the board: no count', el.every((t) => t.coaches === null), true)
  const nta = A('20261127-1558-NTA-PAD.json')
  eq('Newton Abbot: one platform, counts on every row', [firstPanel(nta).picture!.one, firstPanel(nta).picture!.rows.map((r) => r.coaches)], ['3', [9, 5, 10]])
  const eus = A('20261127-1640-EUS-MKC.json')
  const er = firstPanel(eus).picture!.rows
  eq('Euston: rows with no platform yet are marked so (the page shows no count on them)', er.every((r) => r.platform || r.noPlat), true)
}

// "Slower (by 15 minutes)", exact, against the fast trains' usual time (John, November 27th 2026).
const slowRows = (a: Analysis) => [firstPanel(a), laterPanel(a)].flatMap((p) => p.picture?.rows ?? []).filter((r) => /Slower/.test(r.mid)).map((r) => `${r.time} ${r.mid}`)
eq('slower: by how much, Reading to Paddington', slowRows(A('20261117-1824-RDG-PAD.json')).slice(0, 3), ['6.33pm Slower (by 14 minutes)', '7.11pm Slower (by 15 minutes)', '7.42pm Slower (by 16 minutes)'])
eq('slower: under ten minutes in words', slowRows(A('20261127-1640-EUS-MKC.json')).includes('6.26pm Slower (by nine minutes)'), true)
eq('slower: over an hour', slowRows(A('20261117-1947-PAD-PLY.json')), ['11.45pm Slower (by two hours and 19 minutes)'])
eq('slowerBy: one minute, an hour', [slowerBy(1), slowerBy(60), slowerBy(61), slowerBy(75)], ['one minute', 'an hour', 'an hour and one minute', 'an hour and 15 minutes'])
console.log(`check-windows: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
