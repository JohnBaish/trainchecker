// Trainchecker's live function: the trains from one station to another, from National Rail's
// Live Departure Board (SPEC §8; design/handover-stage-3-2026-11-17.md, point 3).
//
// GET /api/live?from=RDG&to=PAD
//
// Asks the board five times (the last two hours and the next four: it gives at most two hours a
// request, and the furthest start it takes is 119 minutes ahead; design/data-trial-2026-11-17.md
// §1 and §7), keeps only what the page needs, and sends that back. The key stays here, in
// Vercel's settings (RDM_LDB_KEY), sent in an x-apikey header. Nothing is stored or logged:
// the two station codes are used only to ask National Rail. Runs in London (vercel.json), as
// two of the licences allow UK use only.
//
// Self-contained on purpose (no imports from the page's code), so Vercel builds it as it is.
// scripts/check-api.ts tries trim() on the real answers saved in design/mockups/snapshots/.

const BASE = 'https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120'
// [start, length] in minutes from now, as in design/mockups/fetch-snapshot.mjs.
export const WINDOWS: [number, number][] = [[-120, 60], [-60, 60], [0, 60], [60, 60], [119, 120]]
// B's Live Arrival Board, asked only for trains that came from A (John, November 25th 2026): the
// platform each train comes into at B, those that end there included, which the departure boards
// can't give. Same limits as the departure board (25 rows, two hours back to two hours ahead;
// tested November 25th 2026). Its own key (RDM_ARR_KEY); without it, or if it fails, the page
// works as before. The last hour too, for trains running late.
const ARR_BASE = 'https://api1.raildata.org.uk/1010-live-arrival-board-arr/LDBWS/api/20220120'
export const ARR_WINDOWS: [number, number][] = [[-60, 60], [0, 60], [60, 60]]

/** One train, with just what the page uses. Times are "HH:MM" (UK time) or National Rail's
 *  words ("On time", "Delayed", "Cancelled", "No report"). */
export type Service = {
  id: string
  std: string // timetabled departure from A
  etd: string | null // expected (or actual, once gone) departure from A
  platform: string | null
  operator: string
  destination: string
  cancelled: boolean
  reason: string | null
  sta: string | null // timetabled arrival at B
  eta: string | null // expected arrival at B
  ata: string | null // actual arrival at B, once there
  /** Its stops between A and B, in order: [code, timetabled, actual or expected, passed]. The third is
   *  "HH:MM", or null when the board gives no time there ("Delayed", "No report", or nothing); the
   *  fourth is 1 once the train has passed it (the board gives an actual time, or "No report").
   *  For "Find my train from my location" and "Follow my progress" (John, November 26th 2026). */
  calls?: Call[]
}

/** `route`: every station the trains from A call at before B (John, November 18th 2026: work
 *  beyond B, such as Southampton to Bournemouth for Basingstoke to Southampton, can't touch it), so "The
 *  days ahead" can tell whether work elsewhere could touch this journey (John, November 18th 2026). */
/** `stops`: the stations, in order, that the train with the most stops calls at between A and B, with their names
 *  (for the last week's stand-in station when National Rail's record leaves out an end: John,
 *  November 18th 2026). */
/** `arrivals`: the trains due at B from A, from B's arrival board; each `platform` is B's, and
 *  `std`/`etd` are A's. Null when the arrival board couldn't be had. */
export type Snap = { taken: string; from: string; to: string; fromName: string; toName: string; services: Service[]; route: string[]; stops: [string, string][]; arrivals?: Service[] | null }

/** A stop: [code, timetabled, actual or expected, passed (1) or not (0)]. */
export type Call = [string, string, string | null, 0 | 1]

type CallingPoint = { crs?: string; locationName?: string; st?: string; et?: string; at?: string; isCancelled?: boolean; cancelReason?: string; delayReason?: string }
type RawService = {
  serviceID: string; std: string; etd?: string; platform?: string; operator?: string
  sta?: string; eta?: string; ata?: string
  previousCallingPoints?: { callingPoint?: CallingPoint[] }[]
  destination?: { locationName?: string }[]
  isCancelled?: boolean; cancelReason?: string; delayReason?: string
  subsequentCallingPoints?: { callingPoint?: CallingPoint[] }[]
}
export type RawBoard = { locationName?: string; filterLocationName?: string; trainServices?: RawService[] | null }

const hhmm = (t?: string) => (t && /^\d\d:\d\d$/.test(t) ? t : null)
/** A stop's actual time once passed, else its expected time; "On time" is the timetabled time. */
function best(c: CallingPoint): string | null {
  if (c.at) return hhmm(c.at) ?? (c.at === 'On time' ? c.st ?? null : null)
  return hhmm(c.et) ?? (c.et === 'On time' ? c.st ?? null : null)
}

/** A train's stops between A and B, as `calls`. */
const callsOf = (cps: CallingPoint[]): Call[] => cps.filter((c) => c.crs && c.st && !c.isCancelled).map((c) => [c.crs!, c.st!, best(c), c.at ? 1 : 0])

/** The boards' answers, made into one list of trains (each once), with names for A and B. */
export function trim(from: string, to: string, taken: string, boards: RawBoard[]): Snap {
  const seen = new Map<string, Service>()
  const route = new Set<string>()
  let stops: [string, string][] = []
  for (const board of boards) {
    for (const s of board.trainServices || []) {
      const cps = (s.subsequentCallingPoints || []).flatMap((g) => g.callingPoint || [])
      const at = cps.findIndex((c) => c.crs === to)
      for (const c of at >= 0 ? cps.slice(0, at) : []) if (c.crs) route.add(c.crs)
      // The train with the most stops (an Elizabeth Line train, where one runs).
      if (at > stops.length) stops = cps.slice(0, at).filter((c) => c.crs).map((c): [string, string] => [c.crs!, c.locationName || c.crs!])
      const p = cps.find((c) => c.crs === to) || {}
      seen.set(s.serviceID, {
        id: s.serviceID, std: s.std, etd: s.etd ?? null, platform: s.platform || null,
        operator: s.operator || '', destination: (s.destination || []).map((x) => x.locationName).filter(Boolean).join(' and '),
        cancelled: Boolean(s.isCancelled || p.isCancelled),
        reason: s.cancelReason || p.cancelReason || s.delayReason || p.delayReason || null,
        sta: p.st || null, eta: p.et || null, ata: p.at || null,
        calls: callsOf(at >= 0 ? cps.slice(0, at) : []),
      })
    }
  }
  const named = boards.find((b) => b.locationName) || {}
  return { taken, from, to, fromName: named.locationName || from, toName: named.filterLocationName || to, services: [...seen.values()], route: [...route].sort(), stops }
}

/** B's arrival boards made into one list (each train once): A's times from its stops, B's own. */
export function trimArr(from: string, boards: RawBoard[]): Service[] {
  const seen = new Map<string, Service>()
  for (const board of boards) {
    for (const s of board.trainServices || []) {
      const cps = (s.previousCallingPoints || []).flatMap((g) => g.callingPoint || [])
      const i = cps.findIndex((c) => c.crs === from)
      const a = cps[i]
      if (!a?.st || !s.sta) continue
      seen.set(s.serviceID, {
        id: s.serviceID, std: a.st, etd: a.at ?? a.et ?? null, platform: s.platform || null,
        operator: s.operator || '', destination: (s.destination || []).map((x) => x.locationName).filter(Boolean).join(' and '),
        cancelled: Boolean(s.isCancelled || a.isCancelled),
        reason: s.cancelReason || s.delayReason || a.cancelReason || a.delayReason || null,
        sta: s.sta, eta: s.eta ?? null, ata: s.ata ?? null,
        // Its stops after A, for "Follow my progress" when the train has gone from A's board.
        calls: callsOf(cps.slice(i + 1)),
      })
    }
  }
  return [...seen.values()]
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

class BoardError extends Error {
  status: number
  constructor(status: number) { super(`board ${status}`); this.status = status }
}

async function board(key: string, from: string, to: string, off: number, win: number, arr = false): Promise<RawBoard> {
  const url = arr
    ? `${ARR_BASE}/GetArrBoardWithDetails/${to}?numRows=150&filterCrs=${from}&filterType=from&timeOffset=${off}&timeWindow=${win}`
    : `${BASE}/GetDepBoardWithDetails/${from}?numRows=150&filterCrs=${to}&filterType=to&timeOffset=${off}&timeWindow=${win}`
  let last = 0
  for (let i = 0; i < 3; i++) {
    // The board refuses some default User-Agents (stage 1), so it gets its own.
    const r = await fetch(url, { headers: { 'x-apikey': key, 'User-Agent': 'trainchecker.baish.net', Accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
    if (r.ok) return (await r.json()) as RawBoard
    last = r.status
    // An unknown station is HTTP 400 ("Invalid crs code supplied", checked November 17th 2026);
    // trying again won't help.
    if (r.status >= 400 && r.status < 500 && r.status !== 429) break
    await new Promise((res) => setTimeout(res, 800 * (i + 1)))
  }
  throw new BoardError(last)
}

export async function GET(request: Request): Promise<Response> {
  const q = new URL(request.url).searchParams
  const from = (q.get('from') || '').toUpperCase()
  const to = (q.get('to') || '').toUpperCase()
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) return json({ error: 'stations' }, 400)
  if (from === to) return json({ error: 'same' }, 400)
  const key = process.env.RDM_LDB_KEY
  // Says which setting is missing (never its value), so a deployment without it is easy to spot.
  if (!key) return json({ error: 'unavailable', reason: 'no RDM_LDB_KEY setting in this deployment' }, 503)
  const taken = new Date().toISOString()
  try {
    const arrKey = process.env.RDM_ARR_KEY
    // If the arrival board fails, the page goes on without it (null), as before November 25th 2026.
    const arrivals = arrKey
      ? Promise.all(ARR_WINDOWS.map(([off, win]) => board(arrKey, from, to, off, win, true))).then((b) => trimArr(from, b), () => null)
      : Promise.resolve(null)
    const [boards, arr] = await Promise.all([Promise.all(WINDOWS.map(([off, win]) => board(key, from, to, off, win))), arrivals])
    return json({ ...trim(from, to, taken, boards), arrivals: arr })
  } catch (e) {
    const status = e instanceof BoardError ? e.status : 0
    // National Rail answers an unknown station code with an error, not an empty board.
    return status === 400 ? json({ error: 'unknown' }, 404) : json({ error: 'unavailable', reason: `National Rail answered ${status || 'nothing'}` }, 502)
  }
}
