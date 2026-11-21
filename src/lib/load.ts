// Asking Trainchecker's own functions (api/live.ts, api/week.ts and api/days.ts), which ask National Rail.
import type { Snap } from './analyse.ts'
import type { Days } from '../../api/days.ts'
import type { Connect, Places } from '../../api/connect.ts'
import type { DayKind, WeekCounts } from './sentences.ts'

export type LiveError = 'unknown' | 'same' | 'unavailable'

export async function fetchLive(from: string, to: string): Promise<Snap> {
  let r: Response
  try {
    r = await fetch(`/api/live?from=${from}&to=${to}`, { cache: 'no-store' })
  } catch {
    throw new Error('unavailable')
  }
  if (r.ok) return (await r.json()) as Snap
  const body = await r.json().catch(() => ({}))
  throw new Error(body.error === 'unknown' || body.error === 'same' ? body.error : 'unavailable')
}

export type WeekError = 'busy' | 'timeout' | 'unavailable'

export async function fetchWeek(o: { from: string; to: string; days: DayKind; start: string; end: string; first: string; last: string; only?: string; skip?: string }): Promise<WeekCounts> {
  const q = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]).toString()
  let r: Response
  try {
    r = await fetch(`/api/week?${q}`)
  } catch {
    throw new Error('unavailable')
  }
  if (r.ok) return (await r.json()) as WeekCounts
  const body = await r.json().catch(() => ({}))
  throw new Error(body.error === 'busy' || body.error === 'timeout' ? body.error : 'unavailable')
}

/** National Rail's live incidents to the end of Sunday (the same for every journey). */
export async function fetchDays(): Promise<Days> {
  const r = await fetch('/api/days').catch(() => null)
  if (!r || !r.ok) throw new Error('unavailable')
  return (await r.json()) as Days
}

/** "Check my connection" (api/connect.ts): the stations with a train from `at` in the next two hours. */
export async function fetchPlaces(at: string): Promise<Places> {
  const r = await fetch(`/api/connect?at=${at}`, { cache: 'no-store' }).catch(() => null)
  if (!r || !r.ok) throw new Error('unavailable')
  return (await r.json()) as Places
}
/** The trains from `at` to `to`, and the platform your train (from `from`) comes into. */
export async function fetchConnect(o: { at: string; to: string; from: string; train: string; arr: string }): Promise<Connect> {
  const r = await fetch(`/api/connect?${new URLSearchParams(o)}`, { cache: 'no-store' }).catch(() => null)
  if (!r || !r.ok) throw new Error('unavailable')
  return (await r.json()) as Connect
}
