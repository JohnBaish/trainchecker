// Checks for "Find my train from my location" (src/lib/findTrain.ts) on the real boards saved in
// design/mockups/snapshots/, with pretend positions. No network.
//
//   node scripts/check-find.ts        (part of npm run check)
//   node scripts/check-find.ts -v     (also prints the sweep, board by board)
//
// 1. Cases worked out by hand from the boards' own times: still at A, nowhere near the line, a
//    train at the station you're at, and no train near you.
// 2. A sweep: every train between two stations when a board was saved, with you placed where its
//    times put it then (by the time between the two stations' times). The train must always be
//    offered, as one or one of two; how often a second train is offered too is counted, for John.
import { readdirSync, readFileSync } from 'node:fs'
import { trim, type RawBoard } from '../api/live.ts'
import { analyse, diff, isTime, mins, type Analysis } from '../src/lib/analyse.ts'
import { mineOf, NEXT_TO_LEAVE, shownTrains } from '../src/lib/connection.ts'
import { findTrain, ukMinutes, type Candidate, type Fix, type Positions } from '../src/lib/findTrain.ts'

const verbose = process.argv.includes('-v')
const pos: Positions = JSON.parse(readFileSync(new URL('../src/data/station-pos.json', import.meta.url), 'utf8'))
const dir = new URL('../design/mockups/snapshots/', import.meta.url)
let failed = 0, passed = 0
const ok = (cond: boolean, what: string) => { if (cond) passed++; else { failed++; console.log('FAIL:', what) } }

type Board = { a: Analysis; trains: Candidate[]; stops: string[]; now: number }
function load(file: string): Board {
  const s = JSON.parse(readFileSync(new URL(file, dir), 'utf8'))
  const snap = trim(s.from, s.to, s.taken, s.boards.map((b: { board: RawBoard }) => b.board))
  const a = analyse(snap)
  // The trains you might be on, as Connections and Exits list them.
  const trains = [...a.past, ...a.ahead].filter((t) => !t.cancelled && t.sta && t.rel <= 120)
    .filter((t) => { const m = mineOf(t); return m.exp ? diff(a.now, m.exp) >= -3 : t.rel >= -120 })
  return { a, trains, stops: snap.stops.map(([c]) => c), now: ukMinutes(new Date(s.taken)) }
}
const at = (crs: string, accuracy = 30): Fix => ({ lat: pos[crs][0], lon: pos[crs][1], accuracy })
const between = (p: string, q: string, f: number, accuracy = 30): Fix =>
  ({ lat: pos[p][0] + f * (pos[q][0] - pos[p][0]), lon: pos[p][1] + f * (pos[q][1] - pos[p][1]), accuracy })
/** A point a fraction `f` of the way from station p to station q along the route's stations (the
 *  train with the most stops), as findTrain() draws a train that passes them without stopping. */
function along(b: Board, p: string, q: string, f: number): Fix {
  const route = [b.a.fromCrs, ...b.stops, b.a.toCrs]
  const i = route.indexOf(p), j = route.indexOf(q)
  const pts = i >= 0 && j > i ? route.slice(i, j + 1) : [p, q]
  const m = (x: string, y: string) => Math.hypot((pos[y][0] - pos[x][0]) * 111320, (pos[y][1] - pos[x][1]) * 111320 * Math.cos((pos[x][0] * Math.PI) / 180))
  const lens = pts.slice(1).map((x, k) => m(pts[k], x))
  let left = f * lens.reduce((t, l) => t + l, 0)
  for (let k = 0; k < lens.length; k++) {
    if (left <= lens[k] || k === lens.length - 1) return between(pts[k], pts[k + 1], lens[k] ? Math.min(1, left / lens[k]) : 0)
    left -= lens[k]
  }
  return between(p, q, f)
}
const std = (b: Board, id: string | null | undefined) => b.trains.find((t) => t.id === id)?.std ?? String(id)
const said = (b: Board, r: ReturnType<typeof findTrain>) =>
  r.kind === 'one' ? `one ${std(b, r.id)}` : r.kind === 'two' ? `two ${std(b, r.ids[0])}, ${std(b, r.ids[1])}` : r.kind === 'atA' ? `atA ${std(b, r.next)}` : r.kind
const run = (b: Board, fix: Fix, now = b.now) => findTrain(fix, now, b.a.fromCrs, b.a.toCrs, b.stops, b.trains, pos)

// ---- 1. By hand ----
{
  const b = load('20261117-2059-RDG-PAD.json')
  // At Reading at 8.59pm: still at A. The next train not yet gone, from the board: the 9pm.
  const r = run(b, at('RDG'))
  ok(r.kind === 'atA' && std(b, r.next) === '21:00', `Reading to Paddington, at Reading: ${said(b, r)}`)
  // A phone unsure by 600 metres, 500 metres from Reading station: still counts as at Reading.
  const r2 = run(b, { ...between('RDG', 'TWY', 500 / 7600), accuracy: 600 })
  ok(r2.kind === 'atA', `Reading to Paddington, near Reading and unsure: ${said(b, r2)}`)
  // In Birmingham: nowhere near the line.
  const r3 = run(b, at('BHM'))
  ok(r3.kind === 'far', `Reading to Paddington, in Birmingham: ${said(b, r3)}`)
  // Five kilometres north of Maidenhead: off the line.
  const r4 = run(b, { lat: pos.MAI[0] + 0.045, lon: pos.MAI[1], accuracy: 30 })
  ok(r4.kind === 'far', `Reading to Paddington, 5 km north of Maidenhead: ${said(b, r4)}`)
}
{
  const b = load('20261117-1824-MAN-MIA.json')
  // At Heald Green at 6.24pm: the 6.04pm is expected there at 6.24 (the board: HDG 18:20, expected
  // 18:24); the 6.18pm not till 6.39. So the 6.04pm.
  const r = run(b, at('HDG'))
  ok(r.kind === 'one' && std(b, r.id) === '18:04', `Manchester to the Airport, at Heald Green at 6.24pm: ${said(b, r)}`)
  // Half way from Gatley to Heald Green at 6.22pm: the 6.04pm (Gatley expected 6.21, Heald Green 6.24).
  const r2 = run(b, between('GTY', 'HDG', 0.5), mins('18:22') + 0.5)
  ok(r2.kind === 'one' && std(b, r2.id) === '18:04', `Manchester to the Airport, Gatley to Heald Green at 6.22pm: ${said(b, r2)}`)
}
{
  const b = load('20261117-1947-PAD-PLY.json')
  // At Taunton at 7.48pm: the 6.03pm (Taunton 19:47, expected 19:49).
  const r = run(b, at('TAU'), mins('19:48'))
  ok(r.kind === 'one' && std(b, r.id) === '18:03', `Paddington to Plymouth, at Taunton at 7.48pm: ${said(b, r)}`)
  // At Exeter St Davids at 7.47pm: the 6.03pm isn't due there till 8.12, the 6.36pm till 9.09.
  const r2 = run(b, at('EXD'), mins('19:47'))
  ok(r2.kind === 'none', `Paddington to Plymouth, at Exeter St Davids at 7.47pm: ${said(b, r2)}`)
  // Between Hungerford and Bedwyn at 7.27pm: the 6.36pm (Hungerford 19:24, Bedwyn 19:30), which
  // the 6.03pm passed long before (it was at Taunton by 7.49), even though it doesn't stop there.
  const r3 = run(b, between('HGD', 'BDW', 0.5), mins('19:27'))
  ok(r3.kind === 'one' && std(b, r3.id) === '18:36', `Paddington to Plymouth, Hungerford to Bedwyn at 7.27pm: ${said(b, r3)}`)
}
{
  const b = load('20261117-1947-KGX-EDB.json')
  // At Dunbar, in Scotland, at 10.08pm: the 6pm (Dunbar 22:08).
  const r = run(b, at('DUN'), mins('22:08'))
  ok(r.kind === 'one' && std(b, r.id) === '18:00', `Kings Cross to Edinburgh, at Dunbar at 10.08pm: ${said(b, r)}`)
  // At Doncaster at 7.39pm: the 6pm (Doncaster 19:39); the 6.30pm doesn't stop there, and is
  // worked out to pass it at about 7.53 (Kings Cross 18:30, York expected 20:22).
  const r2 = run(b, at('DON'), mins('19:39'))
  ok(r2.kind === 'one' && std(b, r2.id) === '18:00', `Kings Cross to Edinburgh, at Doncaster at 7.39pm: ${said(b, r2)}`)
}
{
  const b = load('20261118-0822-TVP-PAD.json')
  // At Pewsey at 8.14am: the 6.53am (Pewsey 08:14).
  const r = run(b, at('PEW'), mins('08:14'))
  ok(r.kind === 'one' && std(b, r.id) === '06:53', `Tiverton Parkway to Paddington, at Pewsey at 8.14am: ${said(b, r)}`)
}

{
  // John, November 26th 2026, out of Reading at 10.05am: the list showed its first eight trains, which had all
  // gone long before his, so the matching (given only those) said none was near. Here: the 8.59pm board's first
  // eight run up to the 9pm; the 9.01pm is ninth. Half way to Twyford at 9.04pm, every train must be looked at.
  const b = load('20261117-2059-RDG-PAD.json')
  const nine = b.trains.findIndex((t) => t.std === '21:01')
  ok(nine >= 8, `Reading to Paddington: the 9.01pm is ninth or later in the list (${nine + 1})`)
  const r = run(b, along(b, 'RDG', 'TWY', 0.55), mins('21:04'))
  ok(r.kind === 'two' && r.ids.some((id) => std(b, id) === '21:01') && r.ids.some((id) => std(b, id) === '21:00'),
    `Reading to Paddington, out of Reading at 9.04pm, every train looked at: ${said(b, r)}`)
  const old = findTrain(along(b, 'RDG', 'TWY', 0.55), mins('21:04'), 'RDG', 'PAD', b.stops, b.trains.slice(0, 8), pos)
  ok(old.kind === 'one', `…and with only the first eight, as before, the 9.01pm can't be offered: ${said(b, old)}`)
}

// ---- The list offered in Connections and Exits (John, November 26th 2026): every train on its way, then the next four. ----
for (const f of readdirSync(dir).filter((f) => /^\d{8}-\d{4}-[A-Z]{3}-[A-Z]{3}\.json$/.test(f))) {
  const b = load(f)
  const left = (t: Candidate) => t.etd !== 'Delayed' && diff(b.a.now, isTime(t.etd) ? t.etd : t.std) < 0
  const shown = shownTrains(b.a.now, b.trains, (t) => t)
  const gone = b.trains.filter(left), next = b.trains.filter((t) => !left(t))
  ok(gone.every((t) => shown.includes(t)), `${f}: every train on its way is offered`)
  ok(shown.filter((t) => !left(t)).length === Math.min(NEXT_TO_LEAVE, next.length), `${f}: the next ${NEXT_TO_LEAVE} to leave are offered`)
  ok(shown.every((t, i) => i === 0 || b.trains.indexOf(shown[i - 1]) < b.trains.indexOf(t)), `${f}: in time order`)
}
{
  // The rush-hour board: the train that left most recently (6.18pm) was ninth or later before.
  const b = load('20261117-1824-RDG-PAD.json')
  const shown = shownTrains(b.a.now, b.trains, (t) => t)
  ok(shown.some((t) => t.std === '18:18') && !b.trains.slice(0, 8).some((t) => t.std === '18:18'),
    `Reading to Paddington at 6.24pm: the 6.18pm is offered now (${shown.length} trains), and wasn't in the first eight`)
}

// ---- 2. The sweep ----
const files = readdirSync(dir).filter((f) => /^\d{8}-\d{4}-[A-Z]{3}-[A-Z]{3}\.json$/.test(f))
let tried = 0, one = 0, two = 0
for (const f of files) {
  const b = load(f)
  const lines: string[] = []
  for (const t of b.trains) {
    // The train's known times in order (A, its stops, B), to find the pair either side of now.
    const aT = isTime(t.etd) ? t.etd : t.etd === 'On time' ? t.std : null
    const bT = isTime(t.ata) ? t.ata : t.ata === 'On time' ? t.sta : isTime(t.eta) ? t.eta : t.eta === 'On time' ? t.sta : null
    const seq: [string, string | null][] = [[b.a.fromCrs, aT], ...(t.calls ?? []).map(([c, , x]): [string, string | null] => [c, x]), [b.a.toCrs, bT]]
    for (let i = 0; i + 1 < seq.length; i++) {
      const [p, tp] = seq[i], [q, tq] = seq[i + 1]
      if (!tp || !tq) continue
      const from = mins(tp), to = mins(tq) < from ? mins(tq) + 1440 : mins(tq)
      const now = b.now < from - 720 ? b.now + 1440 : b.now
      if (!(now > from && now < to)) continue
      // Not just leaving A: there it's "still at A".
      const fr = (now - from) / (to - from)
      if (i === 0 && fr < 0.15) continue
      tried++
      const r = run(b, along(b, p, q, fr))
      const offered = r.kind === 'one' ? [r.id] : r.kind === 'two' ? r.ids : []
      ok(offered.includes(t.id), `${f}: the ${t.std} between ${p} and ${q} at ${b.a.now}: ${said(b, r)}`)
      if (r.kind === 'one') one++
      if (r.kind === 'two') two++
      // With -v, each offered train's minutes from you, as worked out (- for one already past you).
      lines.push(`  ${t.std} between ${p} and ${q}: ${said(b, r)} (${offered.map((id) => r.gaps[id]).join(', ')})`)
      break
    }
  }
  if (verbose && lines.length) console.log(`${f} (${b.a.now}):\n${lines.join('\n')}`)
}
ok(tried >= 40, `the sweep tried ${tried} trains (expected at least 40)`)
console.log(`Sweep: ${tried} trains between stations on ${files.length} saved boards: ${one} found alone, ${two} offered with one other train.`)
console.log(`check-find: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
