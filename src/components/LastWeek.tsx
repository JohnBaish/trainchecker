// "The last week" (SPEC §8.10): the visitor chooses an hour of departure, and the page asks
// National Rail's record for each half hour of it (a busy line's whole hour can run past the
// record's 55-second limit; handover point 4). Answers already given today
// come back at once from Vercel's servers (api/week.ts).
import { useRef, useState } from 'react'
import { clock } from '../lib/analyse.ts'
import { fetchWeek } from '../lib/load.ts'
import { HOURS, hourLabel, kindLine, lastWeekText, loadingLine, standInLine, standInMixedLine, weekFor, type WeekCounts } from '../lib/sentences.ts'

const INTRO = "If you'd like to see the reliability history of trains making this journey over the last week, choose an hour of departure and the results should load in under a minute."
// The Elizabeth Line note (stage 1 recommendation §2.5; agreed at the mock-ups). "Elizabeth Line" with a
// capital L, as National Rail shows it (John, November 18th 2026).
const ELIZABETH = "Some Elizabeth Line trains may be missing from these figures: National Rail's history often leaves them out when Paddington or Bond Street is one end of the journey."
// No record for these trains (John, November 18th 2026), shown instead of the choice when every
// train is on the Elizabeth Line and Paddington or Bond Street is one end (stage 1: the record leaves
// them out), and instead of "no trains left" when an Elizabeth Line journey's answer is empty.
const NO_RECORD = 'Sorry, National Rail isn’t offering historical data between these two stations.'
// When the record can't answer (agreed by John, November 17th 2026).
const FAILED: Record<string, string> = {
  busy: 'National Rail’s record is busy answering another request. Please try again in a minute.',
  timeout: 'National Rail’s record took too long to answer, which can happen on busy lines in the evening. Please try again later, or choose another hour.',
  unavailable: 'National Rail’s record couldn’t be reached just now. Please try again in a minute.',
}

type State = { s: 'choose' } | { s: 'loading'; hour: number } | { s: 'done'; paras: { lead?: string; text: string }[]; note: string | null } | { s: 'failed'; text: string }

const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`
const colon = (t: string) => `${t.slice(0, 2)}:${t.slice(2)}`

type StandIn = { crs: string; name: string; side: 'from' | 'to'; left: string }
/** One part of the answer: a journey, perhaps for one company or leaving one out, with its words. */
type Part = { from: string; to: string; fromName: string; toName: string; only?: string; skip?: string; noun?: [string, string]; lead?: string }


/** The last week. With a stand-in station (John, November 18th 2026): every train on the Elizabeth
 *  Line, measured to the stand-in; or, with `others` (other companies’ trains run too), those trains
 *  to the real end (any stray Elizabeth Line runs left out) and the Elizabeth Line to the stand-in. */
export function LastWeek({ from, to, fromName, toName, elizabeth, noRecord, standIn, others }: { from: string; to: string; fromName: string; toName: string; elizabeth: boolean; noRecord: boolean; standIn?: StandIn | null; others?: { company: string | null } | null }) {
  const sFrom = standIn?.side === 'from' ? standIn.crs : from, sTo = standIn?.side === 'to' ? standIn.crs : to
  const sFromName = standIn?.side === 'from' ? standIn.name : fromName, sToName = standIn?.side === 'to' ? standIn.name : toName
  const parts: Part[] = !standIn ? [{ from, to, fromName, toName }]
    : !others ? [{ from: sFrom, to: sTo, fromName: sFromName, toName: sToName }]
    : [
        { from, to, fromName, toName, skip: 'XR', noun: others.company ? [`${others.company} train`, `${others.company} trains`] : undefined },
        { from: sFrom, to: sTo, fromName: sFromName, toName: sToName, only: 'XR', noun: ['Elizabeth Line train', 'Elizabeth Line trains'], lead: standInMixedLine(standIn.left, standIn) },
      ]
  const [now] = useState(() => new Date())
  const wk = weekFor(now)
  const h = Number(clock(now).slice(0, 2))
  const [hour, setHour] = useState(Math.min(23, Math.max(5, h)))
  const [state, setState] = useState<State>({ s: 'choose' })
  const asking = useRef(0)

  /** One part for the chosen hour: both halves asked together; a half refused as busy asked again
   *  once the other has answered. The text, or the reason it failed. */
  const askPart = async (p: Part, chosen: number): Promise<{ text?: string; failure?: string; empty?: boolean }> => {
    const end = chosen === 23 ? '2359' : hhmm(chosen + 1, 0)
    const halves: [string, string][] = [[hhmm(chosen, 0), hhmm(chosen, 30)], [hhmm(chosen, 30), end]]
    const one = ([start, stop]: [string, string]) => fetchWeek({ from: p.from, to: p.to, days: wk.kind, start, end: stop, first: wk.first, last: wk.last, only: p.only, skip: p.skip })
    const tries = await Promise.allSettled(halves.map(one))
    const got: WeekCounts[] = []
    let failure: string | null = null
    for (let i = 0; i < 2; i++) {
      let t = tries[i]
      if (t.status === 'rejected' && (t.reason as Error).message === 'busy') t = (await Promise.allSettled([one(halves[i])]))[0]
      if (t.status === 'fulfilled') got.push(t.value)
      else { failure = (t.reason as Error).message; break }
    }
    if (!got.length) return { failure: failure ?? 'unavailable' }
    const sum = got.reduce((a, c) => ({
      n: a.n + c.n, w3: a.w3 + c.w3, w10: a.w10 + c.w10, w30: a.w30 + c.w30, w120: a.w120 + c.w120, dates: [...a.dates, ...c.dates], elizabeth: a.elizabeth + c.elizabeth,
    }))
    // The hour as a whole; or, if its second half couldn't be had, the first half, said plainly.
    const endLabel = got.length === 2 ? colon(end === '2359' ? '0000' : end) : colon(halves[0][1])
    let text = lastWeekText(sum, { from: p.fromName, to: p.toName, kind: wk.kind, days: wk.days, start: colon(halves[0][0]), end: endLabel, noun: p.noun })
    if (got.length === 1) text += ` National Rail’s record didn’t answer for the half hour after that, so it isn’t included.`
    return { text, empty: !sum.n }
  }

  const show = async () => {
    const ask = ++asking.current
    const chosen = hour
    setState({ s: 'loading', hour: chosen })
    const results = await Promise.all(parts.map((p) => askPart(p, chosen)))
    if (ask !== asking.current) return
    if (results.every((r) => r.failure)) { setState({ s: 'failed', text: FAILED[results[0].failure!] ?? FAILED.unavailable }); return }
    if (elizabeth && !others && results[0].empty) { setState({ s: 'failed', text: NO_RECORD }); return }
    const paras = results.map((r, i) => ({ lead: parts[i].lead, text: r.text ?? FAILED[r.failure!] ?? FAILED.unavailable }))
    setState({ s: 'done', paras, note: elizabeth && !standIn ? ELIZABETH : null })
  }

  const loading = state.s === 'loading'
  if (noRecord) {
    return (
      <section className="card sec block">
        <h3>The last week</h3>
        <p>{NO_RECORD}</p>
      </section>
    )
  }
  return (
    <section className="card sec block">
      <h3>The last week</h3>
      <p>{INTRO}</p>
      {standIn && !others && <p>{standInLine(standIn.left, standIn)}</p>}
      <div className="hist-row">
        <select aria-label="An hour of departure" value={hour} onChange={(e) => setHour(Number(e.target.value))} disabled={loading}>
          {HOURS.map((x) => <option key={x} value={x}>{hourLabel(x)}</option>)}
        </select>
        <button type="button" className="btn btn-primary" onClick={show} disabled={loading}>Show the last week</button>
      </div>
      <div aria-live="polite">
        {state.s === 'loading' && <p className="hist-result"><span className="spinner" aria-hidden="true"></span>{loadingLine(wk.kind, state.hour)}</p>}
        {state.s === 'done' && (
          <div className="hist-result">
            {state.paras.map((p, i) => (
              <div key={i}>
                {p.lead && <p className="small muted">{p.lead}</p>}
                <p className="big">{p.text}</p>
              </div>
            ))}
            {state.note && <p className="small muted">{state.note}</p>}
          </div>
        )}
        {state.s === 'failed' && <p className="hist-result hist-failed">{state.text}</p>}
      </div>
      <p className="src">{kindLine(wk.kind)}</p>
    </section>
  )
}
