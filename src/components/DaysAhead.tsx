// "The days ahead" (SPEC §8.9 and §10; stage 4), between "The last two hours" and "The last
// week": National Rail's disruption now and planned work to the end of the coming Sunday, for
// this journey (src/lib/incidents.ts), each with National Rail's advice folded away (O3); then
// what may affect it (John, November 17th 2026: option 2).
import { useEffect, useState } from 'react'
import type { Days, Item } from '../../api/days.ts'
import type { DaysJourney as Journey } from '../lib/incidents.ts'
import { forJourney } from '../lib/incidents.ts'
import { fetchDays } from '../lib/load.ts'
import { daysHeading, mayIntro, noPlanned, plannedIntro, whenLabel } from '../lib/sentences.ts'

type Props = Journey
type State = { s: 'loading' } | { s: 'ok'; d: Days } | { s: 'failed' }

function Incident({ i, now }: { i: Item; now: Date }) {
  return (
    <div className="inc">
      <p className={`when${i.planned ? '' : ' now'}`}>{whenLabel(i, now)}</p>
      <h4>{i.summary}</h4>
      {(i.advice || i.link) && (
        <details className="advice">
          <summary>National Rail's advice</summary>
          <div className="raised">
            {/* Cleaned in api/days.ts: paragraphs, bold, lists and https links only. */}
            {i.advice && <div dangerouslySetInnerHTML={{ __html: i.advice }} />}
            {i.link && <p><a href={i.link} target="_blank" rel="noopener noreferrer">More on National Rail's website</a></p>}
          </div>
        </details>
      )}
    </div>
  )
}

export function DaysAhead(p: Props) {
  const [state, setState] = useState<State>({ s: 'loading' })
  useEffect(() => {
    let current = true
    fetchDays().then((d) => current && setState({ s: 'ok', d }), () => current && setState({ s: 'failed' }))
    return () => { current = false }
  }, [])
  if (state.s !== 'ok') {
    return (
      <section className="card sec block days">
        <h3>{daysHeading(false)}</h3>
        {state.s === 'loading'
          ? <p className="muted" role="status"><span className="spinner" aria-hidden="true"></span>Asking National Rail for engineering work and disruption…</p>
          : <p role="alert">Sorry, National Rail’s list of engineering work and disruption couldn’t be reached just now. Check again in a minute.</p>}
      </section>
    )
  }
  const now = new Date(state.d.taken), until = new Date(state.d.until)
  const j = forJourney(state.d, p)
  return (
    <section className="card sec block days">
      <h3>{daysHeading(j.now.length > 0)}</h3>
      {j.now.map((i) => <Incident key={i.id} i={i} now={now} />)}
      <p className={j.now.length ? 'sub' : ''}>{j.planned.length ? plannedIntro(until) : noPlanned(until)}</p>
      {j.planned.map((i) => <Incident key={i.id} i={i} now={now} />)}
      {j.may.length > 0 && (
        <>
          <p className="sub">{mayIntro(j.may.length, p.from, p.to, j.involved)}</p>
          {j.may.map((i) => <Incident key={i.id} i={i} now={now} />)}
        </>
      )}
    </section>
  )
}
