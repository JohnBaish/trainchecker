// The real lists from saved boards, for the share-picture mock-ups (November 19th 2026).
import { readFileSync, writeFileSync } from 'node:fs'
import { trim } from '../../api/live.ts'
import { analyse } from '../../src/lib/analyse.ts'
import { platformTrains, arrivals, t12, dateShort, speedGroups } from '../../src/lib/sentences.ts'
import { diff, type Analysis } from '../../src/lib/analyse.ts'
const A = (f: string) => { const s = JSON.parse(readFileSync(new URL(`../mockups/snapshots/${f}`, import.meta.url), 'utf8')); return analyse(trim(s.from, s.to, s.taken, s.boards.map((b: { board: unknown }) => b.board))) }
const isT = (s?: string | null) => !!s && /^\d\d:\d\d$/.test(s)
// Option B's rows: one train a row, time, platform (or where from), and anything to say.
function boardP(a: Analysis) {
  const leaves = (t: any) => diff(a.now, t.late > 0 && isT(t.etd) ? t.etd : t.std)
  const ts = a.ahead.filter((t) => !t.cancelled && t.platform && !t.unknown).sort((x, y) => leaves(x) - leaves(y)).slice(0, 10)
  const g = speedGroups(a).filter((x) => x.kind !== 'all')
  const kind = (t: any) => { const k = g.find((x) => x.trains.includes(t))?.kind; return k === 'fast' ? 'Fast' : k === 'slower' ? 'Slower' : k === 'elizabeth' ? 'Elizabeth Line' : '' }
  return ts.map((t: any) => ({ time: t12(t.late > 0 && isT(t.etd) ? t.etd : t.std), platform: t.platform, kind: kind(t), note: t.late > 0 && isT(t.etd) ? `${t.late} min late` : '' }))
}
function boardA(a: Analysis) {
  const when = (t: any) => (isT(t.eta) ? t.eta : t.sta)
  const ts = [...a.past, ...a.ahead].filter((t: any) => t.sta && !t.ata && !t.cancelled && (t.eta === 'On time' || isT(t.eta) || !t.eta)).filter((t: any) => { const d = diff(a.now, when(t)); return d >= 0 && d <= 60 }).sort((x: any, y: any) => diff(a.now, when(x)) - diff(a.now, when(y))).slice(0, 10)
  return ts.map((t: any) => { const late = isT(t.eta) ? diff(t.sta, t.eta) : 0; return { time: t12(when(t)), left: t12(t.std), note: late > 0 ? `${late} min late` : '' } })
}
const out: unknown[] = []
for (const [f, kind] of [['20261117-1824-RDG-PAD.json', 'platforms'], ['20261117-1824-BTH-BRI.json', 'platforms'], ['20261117-2059-RDG-PAD.json', 'arrivals']] as const) {
  const a = A(f), x = kind === 'platforms' ? platformTrains(a)! : arrivals(a)
  out.push({ board: kind === 'platforms' ? boardP(a) : boardA(a), kind, from: a.from, to: a.to, at: t12(a.now), date: dateShort(new Date(a.taken)), blocks: x.blocks, after: x.after, text: x.text })
}
writeFileSync(new URL('data.json', import.meta.url), JSON.stringify(out, null, 1))
