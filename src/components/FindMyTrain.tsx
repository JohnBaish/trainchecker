// "Find my train from my location" (John, November 26th 2026; design/find-my-train/README.md): a
// button at the top of the train list in Connections and Exits that narrows down which train
// you're on. The sums are in lib/findTrain.ts; your position is used only here, on the device,
// and never sent anywhere. Shown only when at least one train in the list has left A (where none
// has, where you are can't tell them apart). The wording: Claude's drafts with John's changes
// (November 26th 2026; design/find-my-train/README.md). The trains found are moved to the top of
// the list, with "Or choose another" above the rest (John).
import { useState } from 'react'
import { diff, isTime, type Analysis, type Service } from '../lib/analyse.ts'
import { findTrain, ukMinutes, type Found, type Positions } from '../lib/findTrain.ts'
import { t12 } from '../lib/sentences.ts'
import { Icon } from './Icon.tsx'

type State =
  | { s: 'idle' }
  | { s: 'busy' }
  | { s: 'done'; found: Found }
  | { s: 'denied' }
  | { s: 'lost' }

/** Whether a train has left A by now (its expected time, or timetabled when it has none). */
const gone = (now: string, t: Service) => t.etd !== 'Delayed' && diff(now, isTime(t.etd) ? t.etd : t.std) < 0

/** The sentence for what was found. */
function said(st: State, a: Analysis, trains: Service[]): string | null {
  const time = (id: string | null) => t12(trains.find((t) => t.id === id)?.std ?? '')
  if (st.s === 'denied') return 'Trainchecker wasn’t allowed to see where you are. You can change that in your browser’s settings, or choose your train below.'
  if (st.s === 'lost') return 'Your location couldn’t be found. Please try again, or choose your train below.'
  if (st.s !== 'done') return null
  const f = st.found
  switch (f.kind) {
    case 'one': return `From your location, you’re probably on the ${time(f.id)}.`
    case 'two': {
      // In time order, as the list is ("the 3.03pm or the 3.07pm"), not nearer first.
      const [p, q] = [...f.ids].sort((x, y) => diff(trains.find((t) => t.id === y)!.std, trains.find((t) => t.id === x)!.std))
      return `From your location, you’re probably on the ${time(p)} or the ${time(q)}, which are close together at the moment. Please choose one below.`
    }
    case 'atA': return f.next ? `You seem to be at the station still, so here’s the next train, the ${time(f.next)}.` : 'You seem to be at the station still. Please choose the train you’re planning to take.'
    case 'far': return `You don’t seem to be near the line from ${a.from} to ${a.to} at the moment, so please choose your train below.`
    case 'none': return 'None of these trains seems to be near you at the moment, so please choose yours below.'
  }
}

/** `onFound` gets the train to choose (one, or the next at A) and the trains to mark (two). */
export function FindMyTrain({ a, trains, onFound }: { a: Analysis; trains: Service[]; onFound: (pick: string | null, near: string[]) => void }) {
  const [st, setSt] = useState<State>({ s: 'idle' })
  if (typeof navigator === 'undefined' || !navigator.geolocation || !trains.some((t) => gone(a.now, t))) return null

  const find = () => {
    setSt({ s: 'busy' })
    onFound(null, [])
    const pos = import('../data/station-pos.json').then((m) => m.default as unknown as Positions)
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          const found = findTrain({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }, ukMinutes(new Date()),
            a.fromCrs, a.toCrs, a.stops.map(([c]) => c), trains, await pos)
          setSt({ s: 'done', found })
          if (found.kind === 'one') onFound(found.id, [found.id])
          else if (found.kind === 'two') onFound(null, found.ids)
          else if (found.kind === 'atA' && found.next) onFound(found.next, [found.next])
        } catch {
          setSt({ s: 'lost' })
        }
      },
      (e) => setSt(e.code === e.PERMISSION_DENIED ? { s: 'denied' } : { s: 'lost' }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }
  const text = said(st, a, trains)
  return (
    <div className="findme">
      <button type="button" className="btn btn-secondary" onClick={find} disabled={st.s === 'busy'}>
        <Icon name="locate" /> Find my train from my location
      </button>
      {st.s === 'idle' && <p className="small muted">Your location stays on this device.</p>}
      {st.s === 'busy' && <p className="small muted" role="status"><span className="spinner" aria-hidden="true"></span>Finding your location…</p>}
      {text && <p className="findme-said" role="status">{text}</p>}
    </div>
  )
}
