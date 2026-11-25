// "Station exits" (John, November 22nd 2026), under Arrivals: where B's ways out are, then "Which
// train are you on?" and, for that train, the way out from the platform it comes into. Left off
// where the exits aren't known. The wording is in lib/exits.ts.
import { useEffect, useMemo, useState } from 'react'
import { diff, type Analysis } from '../lib/analyse.ts'
import { mineOf, whichTrain } from '../lib/connection.ts'
import { heading, stationLine, trainLine, type ExitsTable } from '../lib/exits.ts'
import { fetchArrPlatform } from '../lib/load.ts'
import { t12 } from '../lib/sentences.ts'

type Got = { s: 'idle' } | { s: 'ok'; platform: string | null } | { s: 'failed' }

export function Exits({ a }: { a: Analysis }) {
  const [table, setTable] = useState<ExitsTable | null>(null)
  const [mineId, setMineId] = useState<string | null>(null)
  const [got, setGot] = useState<Got>({ s: 'idle' })
  useEffect(() => {
    let current = true
    import('../data/exits.json').then((m) => current && setTable(m.default as unknown as ExitsTable), () => {})
    return () => { current = false }
  }, [])
  // The trains you might be on, as in Connections.
  const mines = useMemo(() => [...a.past, ...a.ahead].filter((s) => !s.cancelled && s.sta && s.rel <= 120).map((s) => ({ s, m: mineOf(s) }))
    .filter(({ m, s }) => (m.exp ? diff(a.now, m.exp) >= -3 : s.rel >= -120))
    // A train that ends here isn't offered when its platform can't be seen (John, November 22nd 2026:
    // "we don't ask what train they're on, so then we don't have to say we don't know"). With the
    // arrival board (November 25th 2026) it can be, so every train is offered.
    .filter(({ s }) => a.arr !== null || s.destination !== a.to).slice(0, 8), [a])
  const pick = mines.find(({ m }) => m.id === mineId)
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
  return (
    <section className="card sec block exits">
      <h3>{heading(a.to, e)}</h3>
      <p>{stationLine(a.to, e)}</p>
      {mines.length > 0 && e.k !== 'concourse' && (
        <div className="cstep">
          <p className="cq">{whichTrain(a.now, mines.map(({ s }) => s))}</p>
          <div className="cmines" role="group" aria-label={`Trains from ${a.from}`}>
            {mines.map(({ s, m }) => (
              <button key={m.id} type="button" className={`cmine${m.id === mineId ? ' on' : ''}`} aria-pressed={m.id === mineId}
                onClick={() => { if (m.id !== mineId) setGot({ s: 'idle' }); setMineId(m.id) }}>
                <b>{t12(s.std)}</b> from {a.from}
                <span className="muted small">{!m.exp ? 'delayed, no time given yet' : m.arrived ? `got in at ${t12(m.exp)}` : `due into ${a.to} at ${t12(m.exp)}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {pick && got.s === 'idle' && e.k !== 'concourse' && <p className="muted" role="status"><span className="spinner" aria-hidden="true"></span>Asking National Rail which platform it’s coming into…</p>}
      {pick && got.s === 'failed' && <p role="alert">Sorry, National Rail’s live arrivals couldn’t be reached just now. Please try again in a minute.</p>}
      {answer && <p className="exit-answer" aria-live="polite">{answer}</p>}
    </section>
  )
}
