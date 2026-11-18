// A journey's page (SPEC §8.1, §9.2 and §10), top to bottom: the strip "TRAINS TO CHECK" with Swap
// and Change; the time fetched and Check again; the verdict; Share ("Copy a link to this journey"),
// straight under the verdict it quotes; "The next four hours" with "Platforms" beside it on a
// computer, the two the same height; the quote of the day; "The last two hours" across the full
// width; "The days ahead" (DaysAhead.tsx); "The last week".
import { useEffect, useState } from 'react'
import { analyse, type Analysis } from '../lib/analyse.ts'
import { fetchDays, fetchLive } from '../lib/load.ts'
import { closedNow, forJourney } from '../lib/incidents.ts'
import { hashOf, remember, type Journey } from '../lib/route.ts'
import { useIsNarrow } from '../lib/responsive.ts'
import { closedShare, closedVerdict, dayName, disruptionAdvice, lastTwoLines, nextFour, platforms, shareWords, t12, verdict, type NextFour } from '../lib/sentences.ts'
import { isTouch, shareText } from '../lib/share.ts'
import { nameOf } from '../lib/stations.ts'
import { Chooser } from './Chooser.tsx'
import { Icon } from './Icon.tsx'
import { DaysAhead, type DaysState } from './DaysAhead.tsx'
import { LastWeek } from './LastWeek.tsx'
import { QuoteCard } from './Tail.tsx'

type State = { s: 'loading' } | { s: 'ok'; a: Analysis } | { s: 'failed'; why: string }

// When the live boards can't be had (agreed by John, November 17th 2026).
const FAILED: Record<string, string> = {
  unknown: 'National Rail doesn’t recognise one of these stations. Please choose again.',
  same: 'Please choose two different stations.',
  unavailable: 'Sorry, National Rail’s live departures couldn’t be reached just now. Please try again in a minute.',
}

function Trains({ n }: { n: NextFour }) {
  const narrow = useIsNarrow(720)
  if (!n.rows.length) return null
  return (
    <details className="advice trains-fold">
      <summary>{n.fold} <Icon name="down" /></summary>
      {/* Each train: "Cancelled" (or how late) and, on the same line in the explanation's font,
          why and the company (John, November 18th 2026). */}
      {narrow ? n.rows.map((r, i) => (
        <div key={i} className={`trow t-${r.status}`}>
          <div className="top"><span className="time">{r.time} to {r.dest}</span></div>
          <p><span className="what">{r.what}</span><span className="why">{r.why}</span></p>
        </div>
      )) : (
        <table className="trains">
          <thead><tr><th>Leaves</th><th>To</th><th>What's happening</th></tr></thead>
          <tbody>
            {n.rows.map((r, i) => (
              <tr key={i} className={`t-${r.status}`}>
                <td>{r.time}</td>
                <td>{r.dest}</td>
                <td><span className="what">{r.what}</span><span className="why">{r.why}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </details>
  )
}

function ShareJourney({ a, text }: { a: Analysis; text?: string }) {
  const [status, setStatus] = useState('')
  const touch = isTouch()
  const go = async () => {
    setStatus('')
    const w = shareWords(a)
    const r = await shareText({ title: w.title, text: text ?? w.text, url: `${location.origin}/${w.hash}` })
    setStatus(r === 'copied' ? 'Copied' : r === 'failed' ? 'Sorry, this browser wouldn’t copy it.' : '')
  }
  return (
    <div className="share-row under-verdict">
      <button type="button" className="btn btn-secondary" onClick={go}><Icon name={touch ? 'share' : 'copy'} /> {touch ? 'Share this journey' : 'Copy a link to this journey'}</button>
      <span className="share-status" role="status">{status}</span>
    </div>
  )
}

export function JourneyView({ journey }: { journey: Journey }) {
  const [state, setState] = useState<State>({ s: 'loading' })
  const [changing, setChanging] = useState(false)
  // Asked when the page opens, and again with each "Check again" (round).
  const [round, setRound] = useState(0)
  // National Rail's incidents, asked at the same time as the trains (the verdict uses them too).
  const [days, setDays] = useState<DaysState>({ s: 'loading' })
  useEffect(() => {
    let current = true
    fetchDays().then((d) => current && setDays({ s: 'ok', d }), () => current && setDays({ s: 'failed' }))
    return () => { current = false }
  }, [round])
  useEffect(() => {
    let current = true
    fetchLive(journey.from, journey.to).then(
      (snap) => {
        if (!current) return
        const a = analyse(snap)
        remember({ ...journey, label: `${a.from} to ${a.to}` })
        setState({ s: 'ok', a })
      },
      (e) => { if (current) setState({ s: 'failed', why: (e as Error).message }) },
    )
    return () => { current = false }
  }, [journey, round])
  const load = () => { setState({ s: 'loading' }); setDays({ s: 'loading' }); setRound(round + 1) }

  const a = state.s === 'ok' ? state.a : null
  const fromName = a ? a.from : nameOf(journey.from), toName = a ? a.to : nameOf(journey.to)
  const strip = (
    <>
      <section className="card strip">
        <div><div className="card-kicker">Trains to check</div><h2>{fromName} to {toName}</h2></div>
        <div className="acts">
          <a className="btn btn-ghost" href={hashOf({ from: journey.to, to: journey.from })}><Icon name="swap" /> Swap</a>
          <button type="button" className="btn btn-ghost" aria-expanded={changing} onClick={() => setChanging(!changing)}>Change</button>
        </div>
      </section>
      {changing && <Chooser journey={journey} onClose={() => setChanging(false)} />}
    </>
  )

  if (state.s === 'loading') {
    return <>{strip}<p className="dateline muted" role="status"><span className="spinner" aria-hidden="true"></span>Asking National Rail for the trains…</p><QuoteCard /></>
  }
  if (state.s === 'failed') {
    return (
      <>
        {strip}
        <section className="card load-failed" role="alert">
          <p>{FAILED[state.why] ?? FAILED.unavailable}</p>
          {state.why === 'unavailable' && <button type="button" className="btn btn-secondary" onClick={load}><Icon name="refresh" /> Try again</button>}
        </section>
        {state.why !== 'unavailable' && !changing && <Chooser journey={journey} />}
        <QuoteCard />
      </>
    )
  }

  const an = state.a
  const journeyNames = { fromCrs: an.fromCrs, toCrs: an.toCrs, from: an.from, to: an.to, route: an.route }
  const mine = days.s === 'ok' ? forJourney(days.d, journeyNames) : null
  const v = verdict(an)
  // The line closed today (John, November 18th 2026): with no train in the next four hours, say
  // so rather than "We can't find a direct train". And with "Be prepared", point to National
  // Rail's advice when it lists disruption now.
  const closed = mine && v.kind === 'none' && days.s === 'ok' ? closedNow([...mine.now, ...mine.planned], new Date(days.d.taken)) : null
  if (closed) { v.kind = 'prepared'; v.lines = closedVerdict(closed, an.from, an.to) }
  else if (v.kind === 'prepared' && mine?.now.length) v.lines = [...v.lines, { text: disruptionAdvice }]
  const taken = new Date(an.taken)
  const next = nextFour(an)
  const elizabeth = [...an.ahead, ...an.past].some((s) => /Elizabeth/i.test(s.operator))
  // Every train on the Elizabeth Line, with Paddington or Bond Street one end: National Rail's
  // record leaves them out (stage 1), so the last week says so at once (John, November 18th 2026).
  const allTrains = [...an.ahead, ...an.past]
  const noRecord = allTrains.length > 0 && allTrains.every((s) => /Elizabeth/i.test(s.operator)) && [an.fromCrs, an.toCrs].some((c) => c === 'PAD' || c === 'BDS')
  return (
    <>
      {strip}
      <div className="dateline">
        <p className="muted">{dayName(taken)}, {t12(an.now)}. Live from National Rail.</p>
        <button type="button" className="btn btn-ghost" onClick={load}><Icon name="refresh" /> Check again</button>
      </div>
      <section className={`card verdict state-${v.kind}`}>
        {v.lines.map((l, i) => <p key={i}>{l.bold && <b>{l.bold}</b>}{l.text}</p>)}
      </section>
      <ShareJourney a={an} text={closed ? closedShare(closed, an) : undefined} />
      {an.verdict === 'none' ? (
        closed ? (
          // No trains because the line is closed today: National Rail's advice, which the verdict
          // points to.
          <>
            <DaysAhead days={days} journey={journeyNames} />
            <QuoteCard />
          </>
        ) : (
          <>
            {!changing && <Chooser journey={journey} />}
            <QuoteCard />
          </>
        )
      ) : (
        <>
          <div className="grid">
            <section className="card sec">
              <h3>The next four hours</h3>
              {next!.lines.map((l) => <p key={l} className="lead">{l}</p>)}
              <Trains n={next!} />
            </section>
            <section className="card sec"><h3>Platforms</h3><p>{platforms(an)}</p></section>
          </div>
          <QuoteCard />
          {/* Across the full width, so a computer shows no gap beside it (John, November 17th
              2026, after trying the preview); after the quote (John, stage 4). */}
          <section className="card sec block"><h3>The last two hours</h3><p>{lastTwoLines(an).join(' ')}</p></section>
          <DaysAhead days={days} journey={journeyNames} />
          <LastWeek key={hashOf(journey)} from={journey.from} to={journey.to} fromName={an.from} toName={an.to} elizabeth={elizabeth} noRecord={noRecord} />
        </>
      )}
    </>
  )
}
