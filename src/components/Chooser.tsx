// The station boxes (SPEC §8.1): "From", "To", swap, "Show trains" and the recent journeys. Each
// box suggests stations as you type; the arrow keys move through the suggestions and Enter
// chooses one; a tap or click chooses straight away.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { nameOf, resolve, suggest } from '../lib/stations.ts'
import { hashOf, recentJourneys, type Journey } from '../lib/route.ts'
import { Icon } from './Icon.tsx'

function StationBox({ label, value, onChange, error, go }: { label: string; value: string; onChange: (v: string) => void; error: string | null; go?: () => void }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [at, setAt] = useState(-1)
  // Leaving the box closes the list a moment later: on an iPhone, tapping a suggestion first
  // takes the cursor out of the box, and closing at once removed the list before the tap
  // arrived (John, November 17th 2026).
  const closing = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(closing.current), [])
  const list = open ? suggest(value) : []
  const exact = list.length === 1 && resolve(value) === list[0][0]
  const shown = exact ? [] : list
  const choose = (name: string) => { window.clearTimeout(closing.current); onChange(name); setOpen(false); setAt(-1) }
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && shown.length) { e.preventDefault(); setOpen(true); setAt((at + 1) % shown.length) }
    else if (e.key === 'ArrowUp' && shown.length) { e.preventDefault(); setAt(at <= 0 ? shown.length - 1 : at - 1) }
    else if (e.key === 'Escape') { setOpen(false); setAt(-1) }
    else if (e.key === 'Enter') {
      if (at >= 0 && shown[at]) { e.preventDefault(); choose(shown[at][1]) }
      else if (go) { e.preventDefault(); setOpen(false); go() }
    }
  }
  return (
    <div className="station">
      <label htmlFor={id}>{label}</label>
      <input
        id={id} className="input" value={value} placeholder="A station" autoComplete="off" autoCorrect="off" spellCheck={false}
        autoCapitalize="words" enterKeyHint={go ? 'go' : 'next'} role="combobox" aria-expanded={shown.length > 0} aria-controls={`${id}-list`}
        aria-activedescendant={at >= 0 && shown[at] ? `${id}-${at}` : undefined} aria-invalid={!!error}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setAt(-1) }}
        onFocus={() => { window.clearTimeout(closing.current); setOpen(true) }}
        onBlur={() => { closing.current = window.setTimeout(() => setOpen(false), 300) }} onKeyDown={key}
      />
      {shown.length > 0 && (
        <ul className="suggest" id={`${id}-list`} role="listbox">
          {shown.map(([code, name], i) => (
            <li key={code} id={`${id}-${i}`} role="option" aria-selected={i === at} className={i === at ? 'at' : undefined}
              onMouseDown={(e) => e.preventDefault()} onClick={() => choose(name)}>
              {name} <span className="muted small">{code}</span>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="err">{error}</p>}
    </div>
  )
}

export function Chooser({ journey, first, onClose }: { journey?: Journey; first?: boolean; onClose?: () => void }) {
  const [from, setFrom] = useState(journey ? nameOf(journey.from) : '')
  const [to, setTo] = useState(journey ? nameOf(journey.to) : '')
  const [errors, setErrors] = useState<[string | null, string | null]>([null, null])
  const recent = recentJourneys()
  // Wording of the two messages: Claude's draft, for John.
  const go = () => {
    const a = resolve(from), b = resolve(to)
    const e: [string | null, string | null] = [
      a ? null : from.trim() ? 'Choose a station from the list.' : 'Type a station.',
      b ? null : to.trim() ? 'Choose a station from the list.' : 'Type a station.',
    ]
    if (a && b && a === b) e[1] = 'Choose a different station from the first.'
    setErrors(e)
    if (e[0] || e[1]) return
    const h = hashOf({ from: a!, to: b! })
    if (location.hash === h) onClose?.()
    else location.hash = h
  }
  return (
    <section className="card chooser">
      {first ? <h2>How are the trains running?</h2> : <div className="card-kicker">Choose a journey</div>}
      <div className="pick">
        <div className="from"><StationBox label="From" value={from} onChange={setFrom} error={errors[0]} /></div>
        <button type="button" className="btn btn-secondary swap" aria-label="Swap the stations" title="Swap the stations"
          onClick={() => { setFrom(to); setTo(from); setErrors([errors[1], errors[0]]) }}>
          <Icon name="swap" />
        </button>
        <div className="to"><StationBox label="To" value={to} onChange={setTo} error={errors[1]} go={go} /></div>
        <div className="go"><button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={go}>Show trains</button></div>
      </div>
      {recent.length > 0 && (
        <div className="recent">
          <span className="small muted">Recent:</span>
          {recent.map((r) => <a key={hashOf(r)} className="chip" href={hashOf(r)} onClick={() => { if (location.hash === hashOf(r)) onClose?.() }}>{r.label}</a>)}
        </div>
      )}
    </section>
  )
}
