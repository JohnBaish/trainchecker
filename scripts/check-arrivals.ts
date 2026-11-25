// npm run check (part 8): the arrival board (John, November 25th 2026), on the real answers saved
// on November 25th 2026: B's arrival board read by trimArr(), Arrivals with B's platforms, the
// long-journey note gone, and the platform a train that ends at B comes into (Exits, Connections).
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { trimArr, ARR_WINDOWS, type RawBoard } from '../api/live.ts'
import { trimConnect, type RawBoard as ConnBoard } from '../api/connect.ts'
import { analyse, type Snap } from '../src/lib/analyse.ts'
import { arrivals, arrivalsPicture } from '../src/lib/sentences.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const dir = new URL('../design/mockups/snapshots/', import.meta.url)
const read = (f: string) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
const readGz = (f: string) => JSON.parse(gunzipSync(readFileSync(new URL(f, dir))).toString('utf8'))

// Reading to Paddington at 12.01pm: three windows, as the live function asks.
const s = read('20261125-1201-arr-RDG-PAD.json')
eq('windows', ARR_WINDOWS, s.boards.map((b: { off: number; win: number }) => [b.off, b.win]))
const boards: RawBoard[] = s.boards.map((b: { board: RawBoard }) => b.board)
const arr = trimArr('RDG', boards)
const ids = new Set(boards.flatMap((b) => (b.trainServices || []).map((t) => t.serviceID)))
eq('each train once', arr.length, ids.size)
eq('every train with Reading’s time and Paddington’s', arr.every((t) => /^\d\d:\d\d$/.test(t.std) && /^\d\d:\d\d$/.test(t.sta!)), true)
eq('every train with a platform at Paddington', arr.every((t) => !!t.platform), true)
eq('Elizabeth Line trains at Paddington’s platforms A and B only', arr.filter((t) => t.operator === 'Elizabeth Line').every((t) => t.platform === 'A' || t.platform === 'B'), true)

const snap: Snap = { taken: s.taken, from: 'RDG', to: 'PAD', fromName: 'Reading', toName: 'London Paddington', services: [], arrivals: arr }
const a = analyse(snap)
eq('arr kept apart', [a.arr!.length, a.ahead.length, a.past.length], [arr.length, 0, 0])
const pic = arrivalsPicture(a)!
eq('three headings', pic.heads, ['EXPECTED IN', 'FROM READING', 'PLATFORM'])
eq('a platform on every row', pic.rows.every((r) => !!r.platform || !!r.noPlat), true)
eq('no long-journey note', pic.note, null)
eq('rows in expected order', pic.rows.length > 2, true)
const x = arrivals(a)
eq('sentence names the next hour', /next hour/.test(x.text), true)

// Without the arrival board, the picture is as before.
const b = analyse({ ...snap, arrivals: null })
eq('no arr: null', b.arr, null)

// A long journey (a train left A more than two hours before it's due): the note isn't needed with
// the arrival board, which sees every train due. Illustration: one train's time at A moved back.
const longArr = arr.map((t, i) => (i === arr.length - 1 ? { ...t, std: t.sta!.replace(/^(\d\d)/, (h) => String((+h + 21) % 24).padStart(2, '0')) } : t))
eq('long journey: no note', /aren’t included|aren't included/.test(arrivals(analyse({ ...snap, arrivals: longArr })).text), false)

// Reading from Twyford at 11.55am: the Elizabeth Line trains end at Reading, at platform 14.
const twy = readGz('20261125-1155-arrivals/RDG-from-TWY.json.gz') as RawBoard
const t = trimArr('TWY', [twy])
const ending = t.filter((x) => x.destination === 'Reading')
eq('trains ending at Reading found', ending.length > 0, true)
eq('…all at platform 14', [...new Set(ending.map((x) => x.platform))], ['14'])

// Exits and Connections: the platform that train comes into, found on the arrival board by the
// first eight digits of its id (the same on every station's board).
const mine = ending[0].id.slice(0, 8)
eq('connection: arrival platform of a train ending at B', trimConnect('RDG', 'RDG', s.taken, [], [twy as ConnBoard], mine).arrPlatform, '14')

console.log(`check-arrivals: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
