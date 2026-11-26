// "Station exits" (John, November 22nd 2026), under Arrivals: where B's ways out are, then "Which
// train are you on?" and, for that train, the way out from the platform it comes into. Left off
// where the exits aren't known. The wording is in lib/exits.ts.
import { Fragment, useEffect, useMemo, useState } from 'react'
import { diff, type Analysis } from '../lib/analyse.ts'
import { mineOf, whichTrain } from '../lib/connection.ts'
import { heading, stationLine, trainLine, type ExitsTable } from '../lib/exits.ts'
import { fetchArrPlatform } from '../lib/load.ts'
import { t12 } from '../lib/sentences.ts'
import { rowEnd, useGridCols } from '../lib/useGridCols.ts'
import { BoxShare } from './BoxShare.tsx'
import { FindMyTrain } from './FindMyTrain.tsx'
import { Icon } from './Icon.tsx'

type Got = { s: 'idle' } | { s: 'ok'; platform: string | null } | { s: 'failed' }

export function Exits({ a }: { a: Analysis }) {
  const [table, setTable] = useState<ExitsTable | null>(null)
  const [mineId, setMineId] = useState<string | null>(null)
  const [got, setGot] = useState<Got>({ s: 'idle' })
  // The trains "Find my train from my location" found near you (full ids), marked in the list.
  const [near, setNear] = useState<string[]>([])
  // How many trains sit side by side in the list (one on a phone).
  const [grid, cols] = useGridCols([table, a])
  useEffect(() => {
    let current = true
    import('../data/exits.json').then((m) => current && setTable(m.default as unknown as ExitsTable), () => {})
    return () => { current = false }
  }, [])
  // The trains you might be on, as in Connections.
  const all = useMemo(() => [...a.past, ...a.ahead].filter((s) => !s.cancelled && s.sta && s.rel <= 120).map((s) => ({ s, m: mineOf(s) }))
    .filter(({ m, s }) => (m.exp ? diff(a.now, m.exp) >= -3 : s.rel >= -120))
    // A train that ends here isn't offered when its platform can't be seen (John, November 22nd 2026:
    // "we don't ask what train they're on, so then we don't have to say we don't know"). With the
    // arrival board (November 25th 2026) it can be, so every train is offered.
    .filter(({ s }) => a.arr !== null || s.destination !== a.to), [a])
  // What the list shows: the first eight, or at A only the trains still to leave (FindMyTrain).
  const [only, setOnly] = useState<string[] | null>(null)
  const mines = useMemo(() => (only ? all.filter(({ s }) => only.includes(s.id)) : all).slice(0, 8), [all, only])
  const pick = all.find(({ m }) => m.id === mineId)
  const e = table?.[a.toCrs]
  const arr = pick ? pick.m.exp ?? pick.m.sta ?? '' : ''
  useEffect(() => {
    if (!mineId || !arr || !e || e.k === 'concourse') return
    let current = true
    fetchArrPlatform({ at: a.toCrs, from: a.fromCrs, train: mineId, arr }).then((platform) => current && setGot({ s: 'ok', platform }), () => current && setGot({ s: 'failed' }))
    return () => { current = false }
  }, [mineId, arr, a.toCrs, a.fromCrs, a.taken, e])
  if (!e) return null
  // Only without the arrival board is a train that ends here one whose platform can't be seen.
  const ends = !!pick && pick.s.destination === a.to && a.arr === null
  const answer = !pick ? null
    : e.k === 'concourse' ? trainLine(e, null, ends)
    : got.s === 'ok' ? trainLine(e, got.platform, ends) : null
  // The answer straight under the train you tapped (John, November 25th 2026: with many trains it
  // appeared below the whole list, out of sight on a phone). On a computer the trains sit in
  // columns, so it goes under the end of that row, across the full width.
  const reply = !pick ? null : (
    <div className="tap-reply">
      {got.s === 'idle' && e.k !== 'concourse' && <p className="muted" role="status"><span className="spinner" aria-hidden="true"></span>Asking National Rail which platform it’s coming into…</p>}
      {got.s === 'failed' && <p role="alert">Sorry, National Rail’s live arrivals couldn’t be reached just now. Please try again in a minute.</p>}
      {answer && <p className="exit-answer" aria-live="polite">{answer}</p>}
      {/* Share just below the answer (John, November 25th 2026: "Share these directions", the rest of the wording agreed). */}
      {answer && pick && <BoxShare taken={a.taken} w={{
        kicker: 'EXITS', heading: `Arriving at ${a.to} on the ${t12(pick.s.std)} from ${a.from}`, text: answer,
        sent: `Here’s the way out at ${a.to} from the ${t12(pick.s.std)} ${a.from} train, from Trainchecker.`, what: 'these directions',
        file: `trainchecker-exits-${a.fromCrs}-${a.toCrs}.png`, hash: `#${a.fromCrs}-${a.toCrs}`,
      }} />}
    </div>
  )
  // The trains "Find my train from my location" found go first, with "Or choose another" above the
  // rest (John, November 26th 2026); each list puts the answer under its own row.
  const found = all.filter(({ s }) => near.includes(s.id))
  const rest = mines.filter(({ s }) => !near.includes(s.id))
  const list = (l: typeof mines) => {
    const after = rowEnd(l.findIndex(({ m }) => m.id === mineId), cols, l.length)
    return l.map(({ s, m }, i) => (
      <Fragment key={m.id}>
        <button type="button" className={`cmine${m.id === mineId ? ' on' : ''}${near.includes(s.id) ? ' near' : ''}`} aria-pressed={m.id === mineId}
          onClick={() => { if (m.id !== mineId) setGot({ s: 'idle' }); setMineId(m.id) }}>
          <b>{t12(s.std)}</b> from {a.from}
          <span className="muted small">{!m.exp ? 'delayed, no time given yet' : m.arrived ? `got in at ${t12(m.exp)}` : `due into ${a.to} at ${t12(m.exp)}`}</span>
        </button>
        {i === after && reply}
      </Fragment>
    ))
  }
  return (
    <section className="card sec block exits">
      <h3>{heading(a.to, e)}</h3>
      <p>{stationLine(a.to, e)}</p>
      {/* The trains folded away, as Arrivals and Connections are (John, November 25th 2026). */}
      {mines.length > 0 && e.k !== 'concourse' && (
        <details className="advice exits-fold">
        <summary>Check directions from your train <Icon name="down" /></summary>
        <div className="cstep">
          <p className="cq">{whichTrain(a.now, mines.map(({ s }) => s))}</p>
          <FindMyTrain a={a} trains={all.map(({ s }) => s)} onFound={(pick, ids, show) => {
            setNear(ids)
            setOnly(show)
            const m = all.find(({ s }) => s.id === pick)?.m
            if (m) { if (m.id !== mineId) setGot({ s: 'idle' }); setMineId(m.id) }
          }} />
          {found.length > 0 && <div className="cmines" role="group" aria-label={`Trains near you from ${a.from}`}>{list(found)}</div>}
          {found.length > 0 && rest.length > 0 && <p className="small muted cor">Or choose another</p>}
          <div className="cmines" ref={grid} role="group" aria-label={`Trains from ${a.from}`}>{list(rest)}</div>
        </div>
        </details>
      )}
    </section>
  )
}
