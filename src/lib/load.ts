// Asking Trainchecker's own functions (api/live.ts and api/week.ts), which ask National Rail.
import type { Snap } from './analyse.ts'
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

export async function fetchWeek(o: { from: string; to: string; days: DayKind; start: string; end: string; first: string; last: string }): Promise<WeekCounts> {
  const q = new URLSearchParams(o).toString()
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
