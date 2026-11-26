// "Message home" (John, November 26th 2026), after The last week: "Check your arrival and share", the
// same "Which train are you on…?" and list as Exits (with Find my train from my location), and for the
// train chosen its line from the arrivals board at B, in a box, with "Share this journey": a picture
// (TRAINCHECKER · MY TRAIN, "The 10.02am from Reading", "Expected into London Paddington at 10.26am, on
// platform 11.", "Checked at …") and a sentence. The line and words are in lib/messageHome.ts.
import { Fragment, useMemo, useState } from 'react'
import { clock, diff, type Analysis } from '../lib/analyse.ts'
import { mineOf, shownTrains, whichTrain } from '../lib/connection.ts'
import { homeFor } from '../lib/messageHome.ts'
import { apart, dateShort, type ListPicture, t12 } from '../lib/sentences.ts'
import { rowEnd, useGridCols } from '../lib/useGridCols.ts'
import { BoxShare } from './BoxShare.tsx'
import { FindMyTrain } from './FindMyTrain.tsx'
import { Icon } from './Icon.tsx'
import { Board } from './JourneyView.tsx'

export function MessageHome({ a }: { a: Analysis }) {
  const [mineId, setMineId] = useState<string | null>(null)
  // The trains "Find my train from my location" found near you (full ids), marked in the list.
  const [near, setNear] = useState<string[]>([])
  // At A, Find my train shows only the trains still to leave.
  const [only, setOnly] = useState<string[] | null>(null)
  const [grid, cols] = useGridCols([a])
  // The trains you might be on, as in Connections: every one on its way, then the next four.
  const all = useMemo(() => [...a.past, ...a.ahead].filter((s) => !s.cancelled && s.sta && s.rel <= 120).map((s) => ({ s, m: mineOf(s) }))
    .filter(({ m, s }) => (m.exp ? diff(a.now, m.exp) >= -3 : s.rel >= -120)), [a])
  const mines = useMemo(() => (only ? all.filter(({ s }) => only.includes(s.id)).slice(0, 8) : shownTrains(a.now, all, ({ s }) => s)), [all, only, a.now])
  if (!all.length) return null
  const pick = all.find(({ m }) => m.id === mineId)
  const home = pick ? homeFor(a, pick.s, a.now) : null
  const from = a.from.toUpperCase()
  const board: ListPicture | null = home && {
    kicker: '', title: '', when: '', one: null, note: null, words: { text: '', title: '', hash: '' },
    heads: home.fromArr ? ['EXPECTED IN', `FROM ${from}`, 'PLATFORM'] : ['EXPECTED IN', `FROM ${from}`], rows: [home.row],
  }
  const reply = !home || !board ? null : (
    <div className="tap-reply">
      <div className="home-box"><Board p={board} /></div>
      <BoxShare taken={a.taken} w={{
        kicker: 'MY TRAIN', heading: home.heading, text: home.line, sent: home.sent, what: 'this journey',
        file: `trainchecker-my-train-${a.fromCrs}-${a.toCrs}.png`, hash: `#${a.fromCrs}-${a.toCrs}`,
        title: `Trainchecker: my train from ${a.from}`, when: '',
        foot: `Checked at ${t12(clock(a.taken))} on ${dateShort(new Date(a.taken))}`,
      }} />
    </div>
  )
  // The trains found go first, with "Or choose another" above the rest, as in Exits.
  const found = all.filter(({ s }) => near.includes(s.id))
  const rest = mines.filter(({ s }) => !near.includes(s.id))
  // The company, where another company's train leaves at the same time (two "7.48pm"s told apart).
  const kind = apart(all.map(({ s }) => s))
  const list = (l: typeof mines) => {
    const after = rowEnd(l.findIndex(({ m }) => m.id === mineId), cols, l.length)
    return l.map(({ s, m }, i) => (
      <Fragment key={m.id}>
        <button type="button" className={`cmine${m.id === mineId ? ' on' : ''}${near.includes(s.id) ? ' near' : ''}`} aria-pressed={m.id === mineId} onClick={() => setMineId(m.id)}>
          <b>{t12(s.std)}</b> from {a.from}{kind(s) && <span className="ckind">{'· '}{kind(s)}</span>}
          <span className="muted small">{!m.exp ? 'delayed, no time given yet' : m.arrived ? `got in at ${t12(m.exp)}` : m.lateBy >= 1 ? `now expected into ${a.to} at ${t12(m.exp)}` : `expected into ${a.to} at ${t12(m.exp)}`}</span>
        </button>
        {i === after && reply}
      </Fragment>
    ))
  }
  return (
    <section className="card sec block exits home">
      <h3>Message home</h3>
      <details className="advice exits-fold">
        <summary>Check your arrival and share <Icon name="down" /></summary>
        <div className="cstep">
          <p className="cq">{whichTrain(a.now, mines.map(({ s }) => s))}</p>
          <FindMyTrain a={a} trains={all.map(({ s }) => s)} onFound={(pick, ids, show) => {
            setNear(ids)
            setOnly(show)
            const m = all.find(({ s }) => s.id === pick)?.m
            if (m) setMineId(m.id)
          }} />
          {found.length > 0 && <div className="cmines" role="group" aria-label={`Trains near you from ${a.from}`}>{list(found)}</div>}
          {found.length > 0 && rest.length > 0 && <p className="small muted cor">Or choose another</p>}
          <div className="cmines" ref={grid} role="group" aria-label={`Trains from ${a.from}`}>{list(rest)}</div>
        </div>
      </details>
    </section>
  )
}
