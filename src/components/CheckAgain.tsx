// "Check again" beside a section's own Share (John, November 26th 2026): Message home and Connections, so the
// time a train is expected in can be checked again later in the journey without going back to the top. It asks
// for the whole page again, the same as the button at the top.
import { Icon } from './Icon.tsx'

export type Again = { again: () => void; busy: boolean; failed: boolean; at: string }

export function CheckAgain({ again, busy, failed, at }: Again) {
  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={again} disabled={busy}>
        {busy ? <><span className="spinner" aria-hidden="true"></span>Checking…</> : <><Icon name="refresh" /> Check again</>}
      </button>
      {/* When it was last checked, so it's clear Check again has done something (John, November 26th 2026). */}
      {!busy && at && <span className="share-status" role="status">Checked at {at}.</span>}
      {failed && <span className="share-status" role="status">Sorry, National Rail couldn’t be reached just now.</span>}
    </>
  )
}
