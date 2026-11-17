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
}

export type Snap = { taken: string; from: string; to: string; fromName: string; toName: string; services: Service[] }

type CallingPoint = { crs?: string; st?: string; et?: string; at?: string; isCancelled?: boolean; cancelReason?: string; delayReason?: string }
type RawService = {
  serviceID: string; std: string; etd?: string; platform?: string; operator?: string
  destination?: { locationName?: string }[]
  isCancelled?: boolean; cancelReason?: string; delayReason?: string
  subsequentCallingPoints?: { callingPoint?: CallingPoint[] }[]
}
export type RawBoard = { locationName?: string; filterLocationName?: string; trainServices?: RawService[] | null }

/** The boards' answers, made into one list of trains (each once), with names for A and B. */
export function trim(from: string, to: string, taken: string, boards: RawBoard[]): Snap {
  const seen = new Map<string, Service>()
  for (const board of boards) {
    for (const s of board.trainServices || []) {
      const cps = (s.subsequentCallingPoints || []).flatMap((g) => g.callingPoint || [])
      const p = cps.find((c) => c.crs === to) || {}
      seen.set(s.serviceID, {
        id: s.serviceID, std: s.std, etd: s.etd ?? null, platform: s.platform || null,
        operator: s.operator || '', destination: (s.destination || []).map((x) => x.locationName).filter(Boolean).join(' and '),
        cancelled: Boolean(s.isCancelled || p.isCancelled),
        reason: s.cancelReason || p.cancelReason || s.delayReason || p.delayReason || null,
        sta: p.st || null, eta: p.et || null, ata: p.at || null,
      })
    }
  }
  const named = boards.find((b) => b.locationName) || {}
  return { taken, from, to, fromName: named.locationName || from, toName: named.filterLocationName || to, services: [...seen.values()] }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

class BoardError extends Error {
  status: number
  constructor(status: number) { super(`board ${status}`); this.status = status }
}

async function board(key: string, from: string, to: string, off: number, win: number): Promise<RawBoard> {
  const url = `${BASE}/GetDepBoardWithDetails/${from}?numRows=150&filterCrs=${to}&filterType=to&timeOffset=${off}&timeWindow=${win}`
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
    const boards = await Promise.all(WINDOWS.map(([off, win]) => board(key, from, to, off, win)))
    return json(trim(from, to, taken, boards))
  } catch (e) {
    const status = e instanceof BoardError ? e.status : 0
    // National Rail answers an unknown station code with an error, not an empty board.
    return status === 400 ? json({ error: 'unknown' }, 404) : json({ error: 'unavailable', reason: `National Rail answered ${status || 'nothing'}` }, 502)
  }
}
