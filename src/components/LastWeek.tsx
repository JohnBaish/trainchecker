// "The last week" (SPEC §8.10): the visitor chooses an hour of departure, and the page asks
// National Rail's record for each half hour of it (a busy line's whole hour can run past the
// record's 55-second limit; handover point 4). Answers already given today
// come back at once from Vercel's servers (api/week.ts).
import { useRef, useState } from 'react'
import { clock } from '../lib/analyse.ts'
import { fetchWeek } from '../lib/load.ts'
import { HOURS, hourLabel, kindLine, lastWeekText, loadingLine, weekFor, type WeekCounts } from '../lib/sentences.ts'

const INTRO = "If you'd like to see the reliability history of trains making this journey over the last week, choose an hour of departure and the results should load in under a minute."
// The Elizabeth line note (stage 1 recommendation §2.5; agreed at the mock-ups).
const ELIZABETH = "Some Elizabeth line trains may be missing from these figures: National Rail's history often leaves them out when Paddington or Bond Street is one end of the journey."
// When the record can't answer (Claude's drafts, for John).
const FAILED: Record<string, string> = {
  busy: 'National Rail’s record is busy answering another request. Please try again in a minute.',
  timeout: 'National Rail’s record took too long to answer, which can happen on busy lines in the evening. Please try again later, or choose another hour.',
  unavailable: 'National Rail’s record couldn’t be reached just now. Please try again in a minute.',
}

type State = { s: 'choose' } | { s: 'loading'; hour: number } | { s: 'done'; text: string; note: string | null } | { s: 'failed'; text: string }

const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`
const colon = (t: string) => `${t.slice(0, 2)}:${t.slice(2)}`

export function LastWeek({ from, to, fromName, toName, elizabeth }: { from: string; to: string; fromName: string; toName: string; elizabeth: boolean }) {
  const [now] = useState(() => new Date())
  const wk = weekFor(now)
  const h = Number(clock(now).slice(0, 2))
  const [hour, setHour] = useState(Math.min(23, Math.max(5, h)))
  const [state, setState] = useState<State>({ s: 'choose' })
  const asking = useRef(0)

  const show = async () => {
    const ask = ++asking.current
    const chosen = hour
    setState({ s: 'loading', hour: chosen })
    const end = chosen === 23 ? '2359' : hhmm(chosen + 1, 0)
    const halves: [string, string][] = [[hhmm(chosen, 0), hhmm(chosen, 30)], [hhmm(chosen, 30), end]]
    // Both halves asked together, which was accepted on the evening of November 17th (40 seconds
    // each on Reading to Paddington); a half refused as busy is asked again once the other has
    // answered, as the record took only one request at a time earlier that day.
    const one = ([start, stop]: [string, string]) => fetchWeek({ from, to, days: wk.kind, start, end: stop, first: wk.first, last: wk.last })
    const tries = await Promise.allSettled(halves.map(one))
    const got: WeekCounts[] = []
    let failure: string | null = null
    for (let i = 0; i < 2; i++) {
      let t = tries[i]
      if (t.status === 'rejected' && (t.reason as Error).message === 'busy') t = (await Promise.allSettled([one(halves[i])]))[0]
      if (t.status === 'fulfilled') got.push(t.value)
      else { failure = (t.reason as Error).message; break }
    }
    if (ask !== asking.current) return
    const o = { from: fromName, to: toName, kind: wk.kind, days: wk.days }
    const sum = (cs: WeekCounts[]): WeekCounts => cs.reduce((a, c) => ({
      n: a.n + c.n, w3: a.w3 + c.w3, w10: a.w10 + c.w10, w30: a.w30 + c.w30, w120: a.w120 + c.w120, dates: [...a.dates, ...c.dates], elizabeth: a.elizabeth + c.elizabeth,
    }))
    if (!got.length) { setState({ s: 'failed', text: FAILED[failure ?? 'unavailable'] ?? FAILED.unavailable }); return }
    // The hour as a whole; or, if its second half couldn't be had, the first half, said plainly.
    const endLabel = got.length === 2 ? colon(end === '2359' ? '0000' : end) : colon(halves[0][1])
    let text = lastWeekText(sum(got), { ...o, start: colon(halves[0][0]), end: endLabel })
    if (got.length === 1) text += ` National Rail’s record didn’t answer for the half hour after that, so it isn’t included.`
    setState({ s: 'done', text, note: elizabeth ? ELIZABETH : null })
  }

  const loading = state.s === 'loading'
  return (
    <section className="card sec block">
      <h3>The last week</h3>
      <p>{INTRO}</p>
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
            <p className="big">{state.text}</p>
            {state.note && <p className="small muted">{state.note}</p>}
          </div>
        )}
        {state.s === 'failed' && <p className="hist-result hist-failed">{state.text}</p>}
      </div>
      <p className="src">{kindLine(wk.kind)}</p>
    </section>
  )
}
