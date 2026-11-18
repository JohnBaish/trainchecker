// "The days ahead" (SPEC §8.9 and §10; stage 4), between "The last two hours" and "The last
// week": National Rail's disruption now and planned work to the end of the coming Sunday, for
// this journey (src/lib/incidents.ts); then what may affect it (John, November 17th 2026: option
// 2). Each item: when, National Rail's summary, a two-sentence summary of their advice in their own
// words (John, November 18th 2026: option A), and the advice folded away (O3) with an arrow. Two or
// more single services very early or late are grouped under one sentence (John, November 18th).
import type { Days, Item } from '../../api/days.ts'
import type { DaysJourney as Journey } from '../lib/incidents.ts'
import { earlyOrLate, forJourney, gist } from '../lib/incidents.ts'
import { Icon } from './Icon.tsx'
import { daysHeading, mayIntro, noPlanned, plannedIntro, singlesKicker, singlesLine, whenLabel } from '../lib/sentences.ts'

export type DaysState = { s: 'loading' } | { s: 'ok'; d: Days } | { s: 'failed' }

/** National Rail's advice, as cleaned in api/days.ts (paragraphs, bold, lists and https links). */
function Advice({ i }: { i: Item }) {
  return (
    <>
      {i.advice && <div dangerouslySetInnerHTML={{ __html: i.advice }} />}
      {i.link && <p><a href={i.link} target="_blank" rel="noopener noreferrer">More on National Rail's website</a></p>}
    </>
  )
}

function Incident({ i, now, j }: { i: Item; now: Date; j: Journey }) {
  const g = gist(i, j.fromCrs, j.toCrs)
  return (
    <div className="inc">
      <p className={`when${i.planned ? '' : ' now'}`}>{whenLabel(i, now)}</p>
      <h4>{i.summary}</h4>
      {g.length > 0 && <p className="gist">{g.join(' ')}</p>}
      {(i.advice || i.link) && (
        <details className="advice">
          <summary>National Rail's advice <Icon name="down" /></summary>
          <div className="raised"><Advice i={i} /></div>
        </details>
      )}
    </div>
  )
}

/** Two or more single services very early or late, as one entry: one sentence, and a fold with
 *  each service's summary and National Rail's advice. */
function Singles({ items, now, j }: { items: Item[]; now: Date; j: Journey }) {
  return (
    <div className="inc">
      <p className="when">{singlesKicker(items.length)}</p>
      <h4>{singlesLine(items, now)}</h4>
      <details className="advice">
        <summary>More details <Icon name="down" /></summary>
        <div className="raised">
          {items.map((i) => (
            <div key={i.id} className="single">
              <p className="when">{whenLabel(i, now)}</p>
              <p><b>{i.summary}</b></p>
              <p>{gist(i, j.fromCrs, j.toCrs).join(' ')}</p>
              <details className="advice">
                <summary>National Rail's advice <Icon name="down" /></summary>
                <Advice i={i} />
              </details>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

/** A list of items, with any single services very early or late grouped where the first was. */
function Items({ items, now, j }: { items: Item[]; now: Date; j: Journey }) {
  const singles = items.filter(earlyOrLate)
  const first = singles.length >= 2 ? singles[0].id : null
  return (
    <>
      {items.map((i) => {
        if (!first || !earlyOrLate(i)) return <Incident key={i.id} i={i} now={now} j={j} />
        if (i.id !== first) return null
        return <Singles key={`singles-${i.id}`} items={singles} now={now} j={j} />
      })}
    </>
  )
}

/** The section. JourneyView fetches the incidents (the verdict uses them too) and passes them in. */
export function DaysAhead({ days, journey: p }: { days: DaysState; journey: Journey }) {
  if (days.s !== 'ok') {
    return (
      <section className="card sec block days">
        <h3>{daysHeading(false)}</h3>
        {days.s === 'loading'
          ? <p className="muted" role="status"><span className="spinner" aria-hidden="true"></span>Asking National Rail for engineering work and disruption…</p>
          : <p role="alert">Sorry, National Rail’s list of engineering work and disruption couldn’t be reached just now. Check again in a minute.</p>}
      </section>
    )
  }
  const now = new Date(days.d.taken), until = new Date(days.d.until)
  const j = forJourney(days.d, p)
  return (
    <section className="card sec block days">
      <h3>{daysHeading(j.now.length > 0)}</h3>
      <Items items={j.now} now={now} j={p} />
      <p className={j.now.length ? 'sub' : ''}>{j.planned.length ? plannedIntro(until) : noPlanned(until)}</p>
      <Items items={j.planned} now={now} j={p} />
      {j.may.length > 0 && (
        <>
          <p className="sub">{mayIntro(j.may.length, p.from, p.to, j.involved)}</p>
          <Items items={j.may} now={now} j={p} />
        </>
      )}
    </section>
  )
}
