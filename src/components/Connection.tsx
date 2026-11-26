// "Connections" (John, November 21st 2026), under the quote of the day, laid out as Arrivals is: a
// heading, a line, and a fold ("Check trains leaving B"); inside it, step by step: where you're going next from B, which train from A you're on, and the answer
// in a sentence, with the other trains you could change onto. A prototype: the headings, questions
// and messages here are Claude's drafts; the answer's wording is in lib/connection.ts.
import { Fragment, useEffect, useMemo, useState } from 'react'
import { clock, diff, type Analysis } from '../lib/analyse.ts'
import { answer, chipLabel, choices, firstChoice, mineOf, shownTrains, speeds, whichTrain, type Mine } from '../lib/connection.ts'
import { fetchConnect, fetchPlaces } from '../lib/load.ts'
import { dayName, t12 } from '../lib/sentences.ts'
import { answerImage, deliverImage, isTouch } from '../lib/share.ts'
import { nameOf, resolve } from '../lib/stations.ts'
import type { Connect } from '../../api/connect.ts'
import { StationBox } from './Chooser.tsx'
import { FindMyTrain } from './FindMyTrain.tsx'
import { Icon } from './Icon.tsx'
import type { LinksTable } from '../lib/platformLinks.ts'
import { rowEnd, useGridCols } from '../lib/useGridCols.ts'

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
  const [shared, setShared] = useState('')
  // The trains "Find my train from my location" found near you (full ids), marked in the list.
  const [near, setNear] = useState<string[]>([])
  // How the changing station's platforms connect, loaded only once the card is opened.
  const [links, setLinks] = useState<LinksTable | null>(null)
  useEffect(() => {
    if (!open || links) return
    let current = true
    import('../data/platform-links.json').then((m) => current && setLinks(m.default as LinksTable), () => {})
    return () => { current = false }
  }, [open, links])

  // The trains you might be on: not cancelled, leaving A within two hours, and still on their way or
  // arrived within the last three minutes (John, November 21st 2026).
  const all = useMemo(() => [...a.past, ...a.ahead].filter((s) => !s.cancelled && s.sta && s.rel <= 120).map((s) => ({ s, m: mineOf(s) }))
    .filter(({ m, s }) => (m.exp ? diff(a.now, m.exp) >= -3 : s.rel >= -120)), [a])
  // What the list shows: the first eight, or at A only the trains still to leave (FindMyTrain).
  const [only, setOnly] = useState<string[] | null>(null)
  const mines = useMemo(() => (only ? all.filter(({ s }) => only.includes(s.id)).slice(0, 8) : shownTrains(a.now, all, ({ s }) => s)), [all, only, a.now])
  const mine: Mine | null = all.find(({ m }) => m.id === mineId)?.m ?? null

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

  // How many trains sit side by side in the list (before any early return: it's a hook).
  const [grid, cols] = useGridCols([open, dest, a])

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
    ? answer({ now: clock(result.d.taken), from: a.from, at: a.to, to: result.d.toName, mine, arrPlatform: result.d.arrPlatform, trains: result.d.trains, chosen, links: links?.[a.toCrs] ?? null })
    : null
  const others = result.s === 'ok' && mine ? choices(mine, result.d.trains) : []
  const sp = result.s === 'ok' ? speeds(result.d.trains) : new Map()
  const picked = result.s === 'ok' && mine ? chosen ?? firstChoice(mine, result.d.trains)?.id ?? null : null

  // Share: a picture of the answer's box with a sentence and the journey's link (John, November
  // 21st 2026). The sentence is Claude's draft.
  const share = async () => {
    if (!ans || result.s !== 'ok') return
    setShared('')
    const d = result.d, taken = new Date(d.taken)
    const left = all.find(({ m }) => m.id === mineId)?.s.std
    // The heading is John's (November 21st 2026).
    const canvas = answerImage({ heading: `Changing at ${a.to} for ${d.toName}${left ? ` from the ${t12(left)} ${a.from} train` : ''}`, text: ans.text, edge: EDGE[ans.kind], when: `${dayName(taken)}, ${t12(clock(d.taken))}` })
    const r = await deliverImage(canvas, `trainchecker-connection-${a.fromCrs}-${a.toCrs}-${d.to}.png`,
      { title: 'Trainchecker: connections', text: `Here’s how my change at ${a.to} for ${d.toName} looks on Trainchecker.`, url: `${location.origin}/#${a.fromCrs}-${a.toCrs}` })
    setShared(r === 'copied' ? 'Copied' : r === 'saved' ? 'Saved as a picture' : '')
  }
  const touch = isTouch()

  // The answer straight under the train you tapped, as in Exits (John, November 25th 2026); on a
  // computer, under the end of that row.
  const reply = !dest || !mineId ? null : (
    <div className="tap-reply">
      {result.s === 'idle' && <p className="muted" role="status"><span className="spinner" aria-hidden="true"></span>Asking National Rail about trains to {nameOf(dest)}…</p>}
      {result.s === 'failed' && <p role="alert">Sorry, National Rail’s live departures couldn’t be reached just now. Please try again in a minute.</p>}
      {ans && (
        <div className="cstep" aria-live="polite">
          <div className={`card verdict state-${EDGE[ans.kind]} canswer`}><p>{ans.text}</p></div>
          {others.length > 1 && (
            <div className="recent">
              <span className="small muted">Or ask about a different train to {result.s === 'ok' ? result.d.toName : ''}:</span>
              {others.map((t) => (
                <button key={t.id} type="button" className={`chip${t.id === picked ? ' on' : ''}`} aria-pressed={t.id === picked} onClick={() => setChosen(t.id)}>
                  {chipLabel(t, sp)}{t.cancelled ? ' (cancelled)' : mine && t.id === mine.id ? ' (the train you’re on)' : ''}
                </button>
              ))}
            </div>
          )}
          <div className="share-row in-fold">
            <button type="button" className="btn btn-secondary" onClick={share}><Icon name={touch ? 'share' : 'copy'} /> {touch ? 'Share this answer' : 'Copy this answer'}</button>
            <span className="share-status" role="status">{shared}</span>
          </div>
        </div>
      )}
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
          onClick={() => { if (m.id !== mineId) { setResult({ s: 'idle' }); setChosen(null) } setMineId(m.id) }}>
          <b>{t12(s.std)}</b> from {a.from}
          <span className="muted small">{!m.exp ? 'delayed, no time given yet' : m.arrived ? `got in at ${t12(m.exp)}` : m.lateBy >= 1 ? `now expected into ${a.to} at ${t12(m.exp)}` : `expected into ${a.to} at ${t12(m.exp)}`}</span>
        </button>
        {i === after && reply}
      </Fragment>
    ))
  }

  return (
    <section className="card sec block connect">
      <h3>Connections</h3>
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
          <p className="cq">{whichTrain(a.now, mines.map(({ s }) => s))}</p>
          <FindMyTrain a={a} trains={all.map(({ s }) => s)} onFound={(pick, ids, show) => {
            setNear(ids)
            setOnly(show)
            const m = all.find(({ s }) => s.id === pick)?.m
            if (m) { if (m.id !== mineId) { setResult({ s: 'idle' }); setChosen(null) } setMineId(m.id) }
          }} />
          {found.length > 0 && <div className="cmines" role="group" aria-label={`Trains near you from ${a.from}`}>{list(found)}</div>}
          {found.length > 0 && rest.length > 0 && <p className="small muted cor">Or choose another</p>}
          <div className="cmines" ref={grid} role="group" aria-label={`Trains from ${a.from}`}>{list(rest)}</div>
        </div>
      )}
      </details>
    </section>
  )
}
