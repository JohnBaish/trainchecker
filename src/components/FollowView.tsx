// "Follow my progress" (John, November 26th 2026): the page the link in Message home's share opens, about one
// train: a heading, when it was checked with "Check again" (it doesn't update by itself, John), the sentences
// (lib/follow.ts) in a box with the train's line as Message home shows it (option B, John, November 26th 2026),
// and the journey's full page below.
import { useCallback, useEffect, useState } from 'react'
import { analyse, type Analysis } from '../lib/analyse.ts'
import { followFor, ukDay, type FollowLink } from '../lib/follow.ts'
import { fetchLive } from '../lib/load.ts'
import { dayName, t12 } from '../lib/sentences.ts'
import { nameOf } from '../lib/stations.ts'
import { hashOf } from '../lib/route.ts'
import { Icon } from './Icon.tsx'

type State = { s: 'loading' } | { s: 'failed' } | { s: 'ok'; a: Analysis }

export function FollowView({ link }: { link: FollowLink }) {
  const [state, setState] = useState<State>({ s: 'loading' })
  const [busy, setBusy] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const load = useCallback(() => {
    fetchLive(link.from, link.to)
      .then((snap) => { setState({ s: 'ok', a: analyse(snap) }); setRefreshFailed(false) })
      .catch(() => setState((was) => { if (was.s === 'ok') { setRefreshFailed(true); return was } return { s: 'failed' } }))
      .finally(() => setBusy(false))
  }, [link.from, link.to])
  useEffect(() => { load() }, [load])
  const again = () => { setBusy(true); load() }

  const a = state.s === 'ok' ? state.a : null
  const f = a ? followFor(a, link, ukDay(new Date(a.taken))) : null
  const fromName = a ? a.from : nameOf(link.from), toName = a ? a.to : nameOf(link.to)
  const head = (
    <section className="card strip">
      <div><div className="card-kicker">Following a train</div><h2>{f?.heading ?? `The ${t12(link.std)} from ${fromName}`}</h2></div>
    </section>
  )
  // The journey's full page, below (John: "if we can make it look nice"; wording John's, November 26th 2026).
  const more = (
    <section className="card follow-more">
      <div className="card-kicker">Trains to check</div>
      <h3>{fromName} to {toName}</h3>
      <p className="muted">Check how all the trains on this route are doing, including engineering work in the days ahead, recent reliability figures and bonus content.</p>
      <a className="btn btn-secondary" href={hashOf({ from: link.from, to: link.to })}>More about the route <Icon name="right" /></a>
    </section>
  )

  if (state.s === 'loading') {
    return <>{head}<p className="dateline muted" role="status"><span className="spinner" aria-hidden="true"></span>Asking National Rail where the train is…</p></>
  }
  if (state.s === 'failed' || !a || !f) {
    return <>{head}<section className="card load-failed" role="alert">
      <p>Sorry, National Rail couldn’t be reached just now. Please try again in a minute.</p>
      <button type="button" className="btn btn-secondary" onClick={again}><Icon name="refresh" /> Try again</button>
    </section>{more}</>
  }
  const l = f.line
  const lateNote = l && l.late !== 'on time' && l.late !== 'got in' ? l.late : ''
  return (
    <>
      {head}
      <section className={`card verdict follow state-${f.tone}`}>
        <p>{f.text}</p>
        {l && (
          <div className="home"><div className="home-box">
            <div className="board" role="table">
              <div className="bhead" role="row">
                <span role="columnheader">From {a.from}</span>
                <span role="columnheader">{l.arrived ? 'Got in' : 'Expected in'}</span>
                {(l.platform || l.noPlat) && <span role="columnheader" className="bright">Platform</span>}
              </div>
              <div className="brow" role="row">
                <span className="bmid" role="cell"><span>The {t12(link.std)}</span>{lateNote && <span className="blate own">{lateNote.replace(/\s+\S+$/, ' ')}<span className="nw">{lateNote.match(/\S+$/)![0]}</span></span>}</span>
                <span className={l.exp ? 'bt' : 'bt q'} role="cell">{l.exp ? t12(l.exp) : '?'}</span>
                {l.platform && <span className="badge" role="cell">{l.platform}</span>}
                {l.noPlat && <span className="bnoplat" role="cell">not yet</span>}
              </div>
            </div>
          </div></div>
        )}
      </section>
      {/* Under the box, not above it: the page is short, and it's checked again and again (John, November 26th 2026). */}
      <div className="dateline">
        <p className="muted">{dayName(new Date(a.taken))}, {t12(a.now)}. Live from National Rail.</p>
        <button type="button" className="btn btn-ghost" onClick={again} disabled={busy}>
          {busy ? <><span className="spinner" aria-hidden="true"></span>Checking…</> : <><Icon name="refresh" /> Check again</>}
        </button>
        {refreshFailed && <p className="muted small" role="status">Sorry, National Rail couldn’t be reached just now, so this is where the train was before.</p>}
      </div>
      {more}
    </>
  )
}
