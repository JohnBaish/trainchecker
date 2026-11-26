// "Message home" (John, November 26th 2026), after The last week: "Check your arrival and share", the
// same "Which train are you on…?" and list as Exits (with Find my train from my location), and for the
// train chosen its line from the arrivals board at B, in a box, with "Share this journey": a picture
// (TRAINCHECKER · MY TRAIN, "The 10.02am from Reading", "Expected into London Paddington at 10.26am, on
// platform 11.", "Checked at …") and a sentence. The line and words are in lib/messageHome.ts.
import { Fragment, useMemo, useState } from 'react'
import { clock, diff, type Analysis } from '../lib/analyse.ts'
import { mineOf, shownTrains, whichTrain } from '../lib/connection.ts'
import { followHash, ukDay } from '../lib/follow.ts'
import { homeFor } from '../lib/messageHome.ts'
import { dateShort, kindOf, t12 } from '../lib/sentences.ts'
import { rowEnd, useGridCols } from '../lib/useGridCols.ts'
import { BoxShare } from './BoxShare.tsx'
import { FindMyTrain } from './FindMyTrain.tsx'
import { Icon } from './Icon.tsx'

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
  // "Follow my progress" (John, November 26th 2026): until the train is in, the message ends with a link to
  // that train's own page, not the journey's.
  const follows = !!pick && !!home && !home.row.late.startsWith('arrived')
  const link = pick && follows ? followHash({ from: a.fromCrs, to: a.toCrs, std: pick.s.std, id: pick.s.id.slice(0, 8), date: ukDay(new Date(a.taken)) }) : `#${a.fromCrs}-${a.toCrs}`
  // The train's line, laid out for this box (John, November 26th 2026, on his phone): the train first ("The
  // 5.05pm · Fast", and how late with an arrow pointing on to the time), then when it's expected in, then the
  // platform, read left to right.
  const r = home?.row
  const reply = !home || !r ? null : (
    <div className="tap-reply">
      <div className="home-box">
        <div className="board" role="table">
          <div className="bhead" role="row">
            <span role="columnheader">From {a.from}</span>
            <span role="columnheader">Expected in</span>
            {home.fromArr && <span role="columnheader" className="bright">Platform</span>}
          </div>
          <div className="brow" role="row">
            <span className="bmid" role="cell">
              <span>{r.mid}</span>
              {r.late && <span className="blate own">{r.arrow ? <>{r.late.replace(/\s+\S+$/, ' ')}<span className="nw">{r.late.match(/\S+$/)![0]}<span className="barrow after"><Icon name="right" /></span></span></> : r.late}</span>}
            </span>
            <span className={r.time === '?' ? 'bt q' : 'bt'} role="cell">{r.time}</span>
            {r.platform && <span className="badge" role="cell">{r.platform}</span>}
            {r.noPlat && <span className="bnoplat" role="cell">not yet</span>}
          </div>
        </div>
      </div>
      <BoxShare taken={a.taken} w={{
        kicker: 'MY TRAIN', heading: home.heading, text: home.line, sent: follows ? `${home.sent} Follow my progress on Trainchecker:` : home.sent, what: 'this journey',
        file: `trainchecker-my-train-${a.fromCrs}-${a.toCrs}.png`, hash: link,
        title: `Trainchecker: my train from ${a.from}`, when: '',
        // MOCK-UP: ?copy=B or ?copy=C (John, November 26th 2026).
        linkCopy: (['B', 'C'] as const).find((x) => new URLSearchParams(location.search).get('copy') === x),
        foot: `Checked at ${t12(clock(a.taken))} on ${dateShort(new Date(a.taken))}`,
      }} />
    </div>
  )
  // The trains found go first, with "Or choose another" above the rest, as in Exits.
  const found = all.filter(({ s }) => near.includes(s.id))
  const rest = mines.filter(({ s }) => !near.includes(s.id))
  // Fast, slower or Elizabeth Line, when the journey has more than one kind (two "4.42pm"s told apart).
  const kind = kindOf(a, all.map(({ s }) => s))
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
