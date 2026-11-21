// "Connections" (John, November 21st 2026), under the quote of the day, laid out as Arrivals is: a
// heading, a line, and a fold ("Check trains leaving B"); inside it, step by step: where you're going next from B, which train from A you're on, and the answer
// in a sentence, with the other trains you could change onto. A prototype: the headings, questions
// and messages here are Claude's drafts; the answer's wording is in lib/connection.ts.
import { useEffect, useMemo, useState } from 'react'
import { clock, diff, type Analysis } from '../lib/analyse.ts'
import { answer, choices, firstChoice, mineOf, type Mine } from '../lib/connection.ts'
import { fetchConnect, fetchPlaces } from '../lib/load.ts'
import { t12 } from '../lib/sentences.ts'
import { nameOf, resolve } from '../lib/stations.ts'
import type { Connect } from '../../api/connect.ts'
import { StationBox } from './Chooser.tsx'
import { Icon } from './Icon.tsx'

type Result = { s: 'idle' } | { s: 'ok'; d: Connect } | { s: 'failed' }
const EDGE = { fine: 'good', tight: 'mixed', unlikely: 'prepared', missed: 'prepared', through: 'good', none: 'none', unknown: 'none' } as const

export function Connection({ a }: { a: Analysis }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [dest, setDest] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mineId, setMineId] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [places, setPlaces] = useState<Set<string> | undefined>(undefined)
  const [result, setResult] = useState<Result>({ s: 'idle' })

  // The trains you might be on: not cancelled, leaving A within two hours, and not long arrived.
  const mines = useMemo(() => [...a.past, ...a.ahead].filter((s) => !s.cancelled && s.sta && s.rel <= 120).map((s) => ({ s, m: mineOf(s) }))
    .filter(({ m, s }) => (m.exp ? diff(a.now, m.exp) >= -5 : s.rel >= -120)).slice(0, 8), [a])
  const mine: Mine | null = mines.find(({ m }) => m.id === mineId)?.m ?? null

  useEffect(() => {
    if (!open) return
    let current = true
    fetchPlaces(a.toCrs).then((p) => { if (current) setPlaces(new Set(p.places.filter((c) => c !== a.toCrs))) }, () => {})
    return () => { current = false }
  }, [open, a.toCrs])

  const arr = mine ? mine.exp ?? mine.sta ?? '' : ''
  useEffect(() => {
    if (!dest || !mineId) return
    let current = true
    fetchConnect({ at: a.toCrs, to: dest, from: a.fromCrs, train: mineId, arr }).then((d) => current && setResult({ s: 'ok', d }), () => current && setResult({ s: 'failed' }))
    return () => { current = false }
    // a.taken: asked again with each "Check again".
  }, [dest, mineId, arr, a.toCrs, a.fromCrs, a.taken])

  if (!mines.length) return null

  const go = () => {
    const c = resolve(text)
    const e = !c ? (text.trim() ? 'Choose a station from the list.' : 'Type a station.') : c === a.toCrs || c === a.fromCrs ? 'Choose a different station.' : null
    setError(e)
    if (e || !c) return
    if (c !== dest) { setResult({ s: 'idle' }); setChosen(null) }
    setDest(c)
  }
  const ans = result.s === 'ok' && mine && dest === result.d.to
    ? answer({ now: clock(result.d.taken), from: a.from, at: a.to, to: result.d.toName, mine, arrPlatform: result.d.arrPlatform, trains: result.d.trains, chosen })
    : null
  const others = result.s === 'ok' && mine ? choices(mine, result.d.trains) : []
  const picked = result.s === 'ok' && mine ? chosen ?? firstChoice(mine, result.d.trains)?.id ?? null : null

  return (
    <section className="card sec block connect">
      <h3>Connections</h3>
      <p>Changing trains at {a.to}? See whether you’ll make your next one.</p>
      <details className="advice connect-fold" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Check trains leaving {a.to} <Icon name="down" /></summary>
      <div className="cstep">
        <p className="cq">Where are you going next?</p>
        <div className="cpick">
          <StationBox label={`From ${a.to} to`} value={text} onChange={(v) => { setText(v); setError(null) }} error={error} go={go} prefer={places} />
          <button type="button" className="btn btn-primary" onClick={go}>Next</button>
        </div>
      </div>
      {dest && (
        <div className="cstep">
          <p className="cq">Which train are you on, or planning to take?</p>
          <div className="cmines" role="group" aria-label={`Trains from ${a.from}`}>
            {mines.map(({ s, m }) => (
              <button key={m.id} type="button" className={`cmine${m.id === mineId ? ' on' : ''}`} aria-pressed={m.id === mineId}
                onClick={() => { if (m.id !== mineId) { setResult({ s: 'idle' }); setChosen(null) } setMineId(m.id) }}>
                <b>{t12(s.std)}</b> from {a.from}
                <span className="muted small">{!m.exp ? 'delayed, no time given yet' : m.arrived ? `got in at ${t12(m.exp)}` : m.lateBy >= 1 ? `now expected into ${a.to} at ${t12(m.exp)}` : `due into ${a.to} at ${t12(m.exp)}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {dest && mineId && result.s === 'idle' && <p className="muted" role="status"><span className="spinner" aria-hidden="true"></span>Asking National Rail about trains to {nameOf(dest)}…</p>}
      {dest && mineId && result.s === 'failed' && <p role="alert">Sorry, National Rail’s live departures couldn’t be reached just now. Please try again in a minute.</p>}
      {ans && (
        <div className="cstep" aria-live="polite">
          <div className={`card verdict state-${EDGE[ans.kind]} canswer`}><p>{ans.text}</p></div>
          {others.length > 1 && (
            <div className="recent">
              <span className="small muted">Or ask about a different train to {result.s === 'ok' ? result.d.toName : ''}:</span>
              {others.map((t) => (
                <button key={t.id} type="button" className={`chip${t.id === picked ? ' on' : ''}`} aria-pressed={t.id === picked} onClick={() => setChosen(t.id)}>
                  {t12(t.std)}{t.cancelled ? ' (cancelled)' : mine && t.id === mine.id ? ' (the train you’re on)' : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      </details>
    </section>
  )
}
