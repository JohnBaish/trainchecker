// A journey's page (SPEC §8.1, §9.2 and §10), top to bottom: the strip "TRAINS TO CHECK" with Swap
// and Change; the time fetched and Check again; the verdict; Share ("Copy a link to this journey"),
// straight under the verdict it quotes; "The next hour" with "The following three hours" beside it
// on a computer (John, November 24th 2026; before that, "The next four hours" and "Platforms": see
// git history before the merge of `claude/ecstatic-dijkstra-w0herd`); the quote of the day; "The last two hours" across the full
// width; "The days ahead" (DaysAhead.tsx); "The last week"; Arrivals; Exits; Fact of the Journey.
import { useEffect, useState } from 'react'
import { analyse, type Analysis } from '../lib/analyse.ts'
import { fetchDays, fetchLive } from '../lib/load.ts'
import { closedNow, forJourney } from '../lib/incidents.ts'
import { hashOf, remember, type Journey } from '../lib/route.ts'
import { useIsNarrow } from '../lib/responsive.ts'
import { NO_RECORD_AT, arrivals, listShareWords, platformsPicture, arrivalsPicture, boardSummary, type ListPicture, Cap, num, companyName, standIn, closedShare, closedVerdict, dayName, disruptionAdvice, lastTwoLines, shareWords, t12, verdict, type NextFour } from '../lib/sentences.ts'
import { deliverImage, isTouch, listFileName, listImage, shareText } from '../lib/share.ts'
import { nameOf } from '../lib/stations.ts'
import { toPlatform, type Fix, type Links } from '../lib/toPlatform.ts'
import type { ExitsTable } from '../lib/exits.ts'
import { Chooser } from './Chooser.tsx'
import { Icon } from './Icon.tsx'
import { DaysAhead, type DaysState } from './DaysAhead.tsx'
import { LastWeek } from './LastWeek.tsx'
import { FactCard, QuoteCard } from './Tail.tsx'
import { Connection } from './Connection.tsx'
import { Exits } from './Exits.tsx'
import { BoxShare } from './BoxShare.tsx'
import { firstPanel, firstShare, laterPanel, laterShare } from '../lib/windows.ts'


type State = { s: 'loading' } | { s: 'ok'; a: Analysis } | { s: 'failed'; why: string }

// The page's own title, as in index.html (search, stage 5).
const HOME_TITLE = 'Trainchecker – free train delays and disruption checker'

// When the live boards can't be had (agreed by John, November 17th 2026).
const FAILED: Record<string, string> = {
  unknown: 'National Rail doesn’t recognise one of these stations. Please choose again.',
  same: 'Please choose two different stations.',
  unavailable: 'Sorry, National Rail’s live departures couldn’t be reached just now. Please try again in a minute.',
}

/** Share for one of the lists, inside its fold: a picture of the list in the dark colours with a
 *  sentence and the link (John, November 19th 2026); the words alone when there's no list. */
function ListShare({ a, kind, prose }: { a: Analysis; kind: 'platforms' | 'arrivals'; prose: string }) {
  const [status, setStatus] = useState('')
  const touch = isTouch()
  const go = async () => {
    setStatus('')
    const pic = kind === 'platforms' ? platformsPicture(a) : arrivalsPicture(a)
    const w = pic ? pic.words : listShareWords(a, kind, prose)
    const words = { title: w.title, text: w.text, url: `${location.origin}/${w.hash}` }
    const r = pic ? await deliverImage(listImage(pic), listFileName(kind, w.hash), words) : await shareText(words)
    setStatus(r === 'copied' ? 'Copied' : r === 'saved' ? 'Saved as a picture' : r === 'failed' ? 'Sorry, this browser wouldn’t copy it.' : '')
  }
  const what = kind === 'platforms' ? 'these trains' : 'these arrivals'
  return (
    <div className="share-row in-fold">
      <button type="button" className="btn btn-secondary" onClick={go}><Icon name={touch ? 'share' : 'copy'} /> {touch ? `Share ${what}` : `Copy ${what}`}</button>
      <span className="share-status" role="status">{status}</span>
    </div>
  )
}

/** "am" or "pm" said once in a run of times, again only when it changes; on the hour it stays
 *  ("9pm"), as elsewhere (John, November 18th 2026). */
function onceAmPm(times: string[]): string[] {
  let last = ''
  return times.map((t) => {
    if (t === 'midday' || t === 'midnight') { last = t === 'midday' ? 'pm' : 'am'; return t }
    const m = t.match(/^(.*?)(am|pm)$/)
    if (!m) return t
    const out = t.includes('.') && last === m[2] ? m[1] : t
    last = m[2]
    return out
  })
}

/** The two lists laid out as the share pictures are, in the page's own colours (John, November
 *  19th 2026, option B). A simple one-platform list, with nothing to say about any train, is a
 *  line of times with dots instead. */
// Directions to a platform (John, November 24th 2026, option A): tap a platform on the Platforms
// board for a rough location guide, from the exits table read the other way round (lib/toPlatform.ts).
type Dirs = (platform: string) => string[] | null

function useDirs(crs: string): Dirs | null {
  const [got, setGot] = useState<{ t: ExitsTable; l: Record<string, Links>; f: Record<string, Fix> } | null>(null)
  useEffect(() => {
    if (!crs) return
    let current = true
    Promise.all([import('../data/exits.json'), import('../data/platform-links.json'), import('../data/to-platform.json')])
      .then(([t, l, f]) => current && setGot({ t: t.default as unknown as ExitsTable, l: l.default as unknown as Record<string, Links>, f: f.default as unknown as Record<string, Fix> }), () => {})
    return () => { current = false }
  }, [crs])
  const e = crs ? got?.t[crs] : undefined
  return e ? (pl: string) => toPlatform(e, pl, got!.l[crs], got!.f[crs]) : null
}

/** Where the boards' directions are for: the station they're at, for the Share (mock-up, November 25th 2026). */
type At = { station: string; hash: string; taken: string }

function DirLines({ lines, pl, at }: { lines: string[]; pl?: string; at?: At }) {
  const box = <div className="pdirs" aria-live="polite">{lines.map((l, i) => <p key={i}>{l}</p>)}</div>
  if (!at || !pl) return box
  // Share just below the box, on a line of its own (John, November 25th 2026).
  return (
    <div className="pdirs-block">
      {box}
      <BoxShare taken={at.taken} w={{
        kicker: 'PLATFORM GUIDE', heading: `Getting to platform ${pl} at ${at.station}`, text: lines.join(' '), paras: lines,
        sent: `Here’s how to find platform ${pl} at ${at.station}, from Trainchecker.`, what: 'these directions',
        file: `trainchecker-platform-${pl}-${at.hash.slice(1)}.png`, hash: at.hash,
      }} />
    </div>
  )
}

/** The platform badge is a button; its directions open under it (John, option A). */
function TapBadge({ pl, open, onTap }: { pl: string; open: boolean; onTap: () => void }) {
  return (
    <button type="button" className={`badge tapbadge${open ? ' on' : ''}`} aria-expanded={open} aria-label={`How to get to platform ${pl}`} onClick={onTap}>
      {pl}<Icon name="down" />
    </button>
  )
}

function Board({ p, dirs, at }: { p: ListPicture; dirs?: Dirs | null; at?: At }) {
  const [openRow, setOpenRow] = useState<string | null>(null)
  const tap = dirs ?? null
  const toggle = (k: string) => setOpenRow(openRow === k ? null : k)
  const second = p.rows.some((r) => r.platform || r.noPlat)
  const simple = !!p.one && p.rows.every((r) => !r.mid && !r.late)
  return (
    <div className="board" role={simple ? undefined : 'table'}>
      {simple ? (
        // Even columns on a computer, a tile for each time on a phone (John, November 19th 2026).
        <div className="simple">
          <p className="shead">All from platform {tap && tap(p.one!) ? <TapBadge pl={p.one!} open={openRow === 'one'} onTap={() => toggle('one')} /> : <span className="badge">{p.one}</span>}</p>
          {tap && openRow === 'one' && <DirLines lines={tap(p.one!)!} pl={p.one!} at={at} />}
          <div className="stimes" role="list">{onceAmPm(p.rows.map((r) => r.time)).map((t, i) => <b key={i} role="listitem">{t}</b>)}</div>
        </div>
      ) : <>
      <div className="bhead" role="row">
        <span role="columnheader">{p.heads[0]}</span>
        {/* Arrivals with platforms (November 25th 2026): "From Reading" over the trains, the platform on the right. */}
        {p.heads[2] && <span role="columnheader">{p.heads[1]}</span>}
        {p.one
          ? <span className={p.heads[2] ? 'bone b3' : 'bone'} role="columnheader">All from platform {tap && tap(p.one) ? <TapBadge pl={p.one} open={openRow === 'one'} onTap={() => toggle('one')} /> : <span className="badge">{p.one}</span>}</span>
          : p.heads[2] ? (second && <span role="columnheader" className="bright">{p.heads[2]}</span>)
          : <span role="columnheader" className={second ? 'bright' : ''}>{p.heads[1]}</span>}
      </div>
      {tap && p.one && openRow === 'one' && <DirLines lines={tap(p.one)!} pl={p.one} at={at} />}
      {p.rows.map((r, i) => (
        <div key={i} className={tap && openRow === String(i) ? 'brow open' : 'brow'} role="row">
          <span className={r.time === '?' ? 'bt q' : 'bt'} role="cell">{r.time}</span>
          <span className="bmid" role="cell">
            {r.mid && <span>{r.mid}</span>}
            {r.late && <span className={r.arrow ? 'blate own' : 'blate'}>{r.mid && !r.arrow && <span className="bsep" aria-hidden="true">{'\u00a0· '}</span>}{r.arrow && <span className="barrow"><Icon name="left" /></span>}{r.late.split(/(?<=,) /).map((x, j) => <span key={j} className="nw">{j ? ' ' : ''}{x}</span>)}</span>}
          </span>
          {r.platform && !p.one && (tap && tap(r.platform)
            ? <span role="cell" className="bcell"><TapBadge pl={r.platform} open={openRow === String(i)} onTap={() => toggle(String(i))} /></span>
            : <span className="badge" role="cell">{r.platform}</span>)}
          {r.noPlat && !p.one && <span className="bnoplat" role="cell">not yet</span>}
          {tap && r.platform && openRow === String(i) && <DirLines lines={tap(r.platform)!} pl={r.platform} at={at} />}
        </div>
      ))}
      </>}
      {p.note && <p className="tafter">{p.note}</p>}
    </div>
  )
}

/** Arrivals at B, after the last week: a sentence first, then the board folded under "Show the
 *  arrivals" (John, November 19th 2026, option B; the sentence is Claude's draft). */
function Arrivals({ a }: { a: Analysis }) {
  const x = arrivals(a)
  const pic = arrivalsPicture(a)
  if (!pic) return (
    <section className="card sec block">
      <h3>Arrivals</h3>
      <p>{x.text}</p>
    </section>
  )
  const known = pic.rows.filter((r) => r.time !== '?').length
  const limited = pic.words.text.startsWith('The first ten')
  const count = !known ? '' : pic.note ? (known === 1 ? 'Trainchecker can see one train due in the next hour.' : `Trainchecker can see ${num(known)} trains due in the next hour.`)
    : limited ? 'More than ten trains are due in the next hour.'
    : known === 1 ? 'One train is due in the next hour.' : `${Cap(num(known))} trains are due in the next hour.`
  const late = boardSummary(pic.rows, 'arrive')
  const say = known ? [count, limited && late ? `Of the first ten, ${late[0].toLowerCase()}${late.slice(1)}` : late].filter(Boolean).join(' ') : x.prose
  return (
    <section className="card sec block">
      <h3>Arrivals</h3>
      <p>{say}</p>
      <details className="advice arrivals-fold">
        <summary>{x.heading} <Icon name="down" /></summary>
        <Board p={pic} />
        {known > 0 && x.after && <p className="tafter">{x.after.replace(/ ?Trains that left .*$/, '')}</p>}
        <ListShare a={a} kind="arrivals" prose={x.text} />
      </details>
    </section>
  )
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

/** "The next hour" (or "The next three trains"), first: every train in it with its platform or "not yet",
 *  folded (John, November 24th 2026; it replaced "The next four hours" and "Platforms"). */
function FirstPanel({ a }: { a: Analysis }) {
  const f = firstPanel(a)
  const pic = f.picture
  const dirs = useDirs(pic && pic.rows.some((r) => r.platform) ? a.fromCrs : '')
  const k = pic?.rows.length ?? 0
  return (
    <section className="card sec">
      <h3>{f.heading}</h3>
      {/* One paragraph (John, November 24th 2026). */}
      <p className="lead">{f.lines.join(' ')}</p>
      {f.platLine && <p>{f.platLine}</p>}
      {(pic || f.cancelled) && (
        <details className="advice trains-fold">
          <summary>{k === 1 ? 'Show the train and its platform' : 'Show the trains and platforms'} <Icon name="down" /></summary>
          {pic && dirs && <p className="ptaphint">{pic.one ? `Tap “${pic.one}” for a rough platform location guide.` : 'Tap a platform for a rough location guide.'}</p>}
          {pic && <Board p={pic} dirs={dirs} at={{ station: a.from, hash: `#${a.fromCrs}-${a.toCrs}`, taken: a.taken }} />}
          {f.cancelled && <p className="tafter">{f.cancelled}</p>}
          {(() => { const sp = firstShare(a); return sp && <PicShare pic={sp} what="these trains" file="next-hour" /> })()}
        </details>
      )}
    </section>
  )
}

/** "The following three hours" (or "Later"): the rest of the four hours, the trains that aren't on time
 *  folded ("the bad news"), then every train with its platform or "not yet" ("everything", John). */
function LaterPanel({ a }: { a: Analysis }) {
  const l = laterPanel(a)
  const pic = l.picture
  const dirs = useDirs(pic && pic.rows.some((r) => r.platform) ? a.fromCrs : '')
  return (
    <section className="card sec">
      <h3>{l.heading}</h3>
      <p className="lead">{l.lines.join(' ')}</p>
      {l.next && <Trains n={l.next} />}
      {l.platLine && <p>{l.platLine}</p>}
      {pic && (
        <details className="advice trains-fold">
          <summary>{pic.rows.length === 1 ? 'Show the train and its platform' : 'Show the trains and platforms'} <Icon name="down" /></summary>
          {dirs && <p className="ptaphint">{pic.one ? `Tap “${pic.one}” for a rough platform location guide.` : 'Tap a platform for a rough location guide.'}</p>}
          <Board p={pic} dirs={dirs} at={{ station: a.from, hash: `#${a.fromCrs}-${a.toCrs}`, taken: a.taken }} />
          {l.cancelled && <p className="tafter">{l.cancelled}</p>}
          {(() => { const sp = laterShare(a); return sp && <PicShare pic={sp} what="these trains" file="later" /> })()}
        </details>
      )}
    </section>
  )
}

/** Share for a panel's board: its picture with the words and the journey's link (house style §17). */
function PicShare({ pic, what, file }: { pic: ListPicture; what: string; file: string }) {
  const [status, setStatus] = useState('')
  const touch = isTouch()
  const go = async () => {
    setStatus('')
    const w = pic.words
    const r = await deliverImage(listImage(pic), `trainchecker-${file}-${w.hash.slice(1)}.png`, { title: w.title, text: w.text, url: `${location.origin}/${w.hash}` })
    setStatus(r === 'copied' ? 'Copied' : r === 'saved' ? 'Saved as a picture' : r === 'failed' ? 'Sorry, this browser wouldn’t copy it.' : '')
  }
  return (
    <div className="share-row in-fold">
      <button type="button" className="btn btn-secondary" onClick={go}><Icon name={touch ? 'share' : 'copy'} /> {touch ? `Share ${what}` : `Copy ${what}`}</button>
      <span className="share-status" role="status">{status}</span>
    </div>
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
  // "Check again" keeps the page showing (and the last week's answer, and any open folds) while it
  // asks again (fresh look 6.1, John, November 18th 2026).
  const [refreshing, setRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const [changing, setChanging] = useState(false)
  // Asked when the page opens, and again with each "Check again" (round).
  const [round, setRound] = useState(0)
  // National Rail's incidents, asked at the same time as the trains (the verdict uses them too).
  const [days, setDays] = useState<DaysState>({ s: 'loading' })
  useEffect(() => {
    let current = true
    fetchDays().then((d) => current && setDays({ s: 'ok', d }), () => current && setDays((old) => (old.s === 'ok' ? old : { s: 'failed' })))
    return () => { current = false }
  }, [round])
  useEffect(() => {
    let current = true
    fetchLive(journey.from, journey.to).then(
      (snap) => {
        if (!current) return
        const a = analyse(snap)
        // Not kept in Recent when there's no direct train either way in the six hours (fresh look 3.2).
        if (a.ahead.length || a.past.length) remember({ ...journey, label: `${a.from} to ${a.to}` })
        setState({ s: 'ok', a })
        setRefreshing(false); setRefreshFailed(false)
      },
      (e) => {
        if (!current) return
        setRefreshing(false)
        // A failed "Check again" keeps the figures already shown, and says so.
        setState((old) => { if (old.s === 'ok') { setRefreshFailed(true); return old } return { s: 'failed', why: (e as Error).message } })
      },
    )
    return () => { current = false }
  }, [journey, round])
  const load = () => {
    if (state.s === 'ok') { setRefreshing(true); setRefreshFailed(false) } else { setState({ s: 'loading' }); setDays({ s: 'loading' }) }
    setRound(round + 1)
  }
  // The tab names the journey (fresh look 7.2), and goes back to index.html's title afterwards.
  const titleFrom = state.s === 'ok' ? state.a.from : nameOf(journey.from), titleTo = state.s === 'ok' ? state.a.to : nameOf(journey.to)
  useEffect(() => {
    document.title = `${titleFrom} to ${titleTo} – Trainchecker`
    return () => { document.title = HOME_TITLE }
  }, [titleFrom, titleTo])

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
    // MOCK-UP (November 25th 2026, for John): the quote flashed up while the trains loaded. A: the
    // line alone; B (the default here): the line and pale outlines of the page to come.
    const load = new URLSearchParams(location.search).get('load') === 'A' ? 'A' : 'B'
    return <>{strip}<p className="dateline muted" role="status"><span className="spinner" aria-hidden="true"></span>Asking National Rail for the trains…</p>
      {load === 'B' && <div className="skel" aria-hidden="true">
        <section className="card verdict"><span className="sk" style={{ width: '70%' }}></span><span className="sk" style={{ width: '45%' }}></span></section>
        <div className="grid">
          {[0, 1].map((k) => <section key={k} className="card sec"><span className="sk sk-h"></span><span className="sk"></span><span className="sk"></span><span className="sk" style={{ width: '60%' }}></span></section>)}
        </div>
      </div>}</>
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
  const elizabeth = [...an.ahead, ...an.past].some((s) => /Elizabeth/i.test(s.operator))
  // Where National Rail's record leaves the Elizabeth Line out at an end (Paddington, Bond Street):
  // measured to the nearest station it covers instead (John, November 18th 2026). Every train on the
  // Elizabeth Line: just that; other companies' trains too (Twyford to Paddington): those to the
  // real end, and the Elizabeth Line to the stand-in. With no stand-in, every train on the
  // Elizabeth Line: "Sorry, …" at once.
  const allTrains = [...an.ahead, ...an.past]
  const endOut = [an.fromCrs, an.toCrs].some((c) => NO_RECORD_AT.includes(c))
  const allEliz = allTrains.length > 0 && allTrains.every((s) => /Elizabeth/i.test(s.operator))
  const stand = endOut && elizabeth ? standIn(an) : null
  const noRecord = allEliz && endOut && !stand
  const otherCos = [...new Set(allTrains.filter((s) => !/Elizabeth/i.test(s.operator)).map((s) => s.operator))]
  const others = stand && !allEliz ? { company: otherCos.length === 1 ? companyName(otherCos[0]) : null } : null
  return (
    <>
      {strip}
      <div className="dateline">
        <p className="muted">{dayName(taken)}, {t12(an.now)}. Live from National Rail.</p>
        <button type="button" className="btn btn-ghost" onClick={load} disabled={refreshing}>
          {refreshing ? <><span className="spinner" aria-hidden="true"></span>Checking…</> : <><Icon name="refresh" /> Check again</>}
        </button>
        {refreshFailed && <p className="muted small" role="status">Sorry, National Rail couldn’t be reached just now, so these are the figures from before.</p>}
      </div>
      <section className={`card verdict state-${v.kind}`}>
        {v.lines.map((l, i) => <p key={i}>{l.bold && <b>{l.bold}</b>}{l.text}</p>)}
      </section>
      <ShareJourney a={an} text={closed ? closedShare(closed, an) : undefined} />
      {/* No direct train at all: the boxes to try another, and the quote. The line closed today:
          National Rail's advice, which the verdict points to. The last train gone for now: the last
          two hours, the days ahead and the last week, as people then plan for later (fresh look
          3.1, John, November 18th 2026). Otherwise the whole page. One list, so "The last week"
          keeps its answer when a check changes which of these it is. */}
      {an.verdict === 'none' && !closed && !an.lastGone && !changing && <Chooser journey={journey} />}
      {/* The next hour first, then the rest of the four hours (John, November 24th 2026). */}
      {an.verdict !== 'none' && (
        <div className="grid">
          <FirstPanel a={an} />
          <LaterPanel a={an} />
        </div>
      )}
      {!closed && <QuoteCard />}
      {/* "Connections", just under the quote (John, November 21st 2026; a prototype). No key of its
          own: it shared LastWeek's, and with two children of one key React left the old panel on the
          page after a change of journey. JourneyView is itself keyed by the journey. */}
      {!closed && an.verdict !== 'none' && <Connection a={an} />}
      {/* Across the full width, so a computer shows no gap beside it (John, November 17th
          2026, after trying the preview); after the quote (John, stage 4). */}
      {(an.verdict !== 'none' || (an.lastGone && !closed)) && <section className="card sec block"><h3>The last two hours</h3><p>{lastTwoLines(an).join(' ')}</p></section>}
      {(an.verdict !== 'none' || closed || an.lastGone) && <DaysAhead days={days} journey={journeyNames} />}
      {closed && <QuoteCard />}
      {(an.verdict !== 'none' || (an.lastGone && !closed)) && (
        <LastWeek key={hashOf(journey)} from={journey.from} to={journey.to} fromName={an.from} toName={an.to} elizabeth={elizabeth && endOut} noRecord={noRecord} standIn={stand ? { ...stand, left: stand.side === 'to' ? an.to : an.from } : null} others={others} />
      )}
      {(an.verdict !== 'none' || (an.lastGone && !closed)) && <Arrivals a={an} />}
      {(an.verdict !== 'none' || (an.lastGone && !closed)) && <Exits a={an} />}
      {/* Fact of the journey, last, just above "About these figures" (John, November 22nd 2026; it
          was under the quote). Only with a train in the next four hours (not once the last one has
          gone: John), as its stops say which way the journey goes. */}
      {!closed && an.verdict !== 'none' && <FactCard from={an.fromCrs} to={an.toCrs} fromName={an.from} toName={an.to} stops={an.stops.map(([c]) => c)} />}
    </>
  )
}
