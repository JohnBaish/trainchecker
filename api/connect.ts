// Trainchecker's connection function ("Check my connection": John, November 21st 2026), from
// National Rail's Live Departure Board, as api/live.ts.
//
// GET /api/connect?at=NTA
//   The stations with a train from Newton Abbot in the next two hours, for the "next destination"
//   box. A board gives 25 rows at most, so the two hours are asked as eight 15-minute pieces at
//   once (tested November 21st 2026: complete for Reading, cut short at Clapham Junction, so the
//   page offers these first but takes any station).
//
// GET /api/connect?at=NTA&to=TQY&from=IVY&train=10918949&arr=15:29
//   The trains from Newton Abbot to Torquay in the next four hours, and the platform the train
//   you're on (from Ivybridge, id starting 10918949, due in at 15:29) comes into. That platform is
//   on Newton Abbot's own board, asked only for trains that came from Ivybridge; a train that ends
//   at Newton Abbot isn't on it, and then the platform is null.
//
// GET /api/connect?at=RDG&from=MDG&train=10918949&arr=15:29&only=platform
//   Only the platform that train comes into at Reading, for "Station exits" (November 22nd 2026).
//
// The key stays here (RDM_LDB_KEY, an x-apikey header). Nothing is stored or logged. Runs in
// London (vercel.json). Self-contained on purpose, as api/live.ts.
// scripts/check-connection.ts tries places() and trimConnect() on real boards.

const BASE = 'https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120'
/** [start, length] in minutes from now. */
export const PLACE_WINDOWS: [number, number][] = [0, 15, 30, 45, 60, 75, 90, 105].map((o): [number, number] => [o, 15])
export const ONWARD_WINDOWS: [number, number][] = [[-10, 40], [30, 30], [60, 60], [119, 120]]

/** A train from the changing station (B) to the next destination (C). Times "HH:MM" or National
 *  Rail's words. */
export type Onward = {
  id: string // the first eight digits: the same on every station's board
  std: string
  etd: string | null
  platform: string | null
  destination: string
  operator: string // to tell Elizabeth Line trains from the others
  cancelled: boolean
  sta: string | null // timetabled arrival at C
  eta: string | null // expected (or actual) arrival at C
}
export type Connect = { taken: string; at: string; to: string; atName: string; toName: string; arrPlatform: string | null; trains: Onward[] }
export type Places = { taken: string; at: string; places: string[] }

type CallingPoint = { crs?: string; st?: string; et?: string; at?: string; isCancelled?: boolean }
type RawService = {
  serviceID: string; std: string; etd?: string; platform?: string; operator?: string
  destination?: { locationName?: string }[]
  isCancelled?: boolean
  subsequentCallingPoints?: { callingPoint?: CallingPoint[] }[]
}
export type RawBoard = { locationName?: string; filterLocationName?: string; trainServices?: RawService[] | null }

const short = (id: string) => id.slice(0, 8)
const stops = (s: RawService) => (s.subsequentCallingPoints || []).flatMap((g) => g.callingPoint || [])

/** Every station the boards' trains call at, each once, sorted. */
export function places(boards: RawBoard[]): string[] {
  const out = new Set<string>()
  for (const b of boards) for (const s of b.trainServices || []) if (!s.isCancelled) for (const c of stops(s)) if (c.crs && !c.isCancelled) out.add(c.crs)
  return [...out].sort()
}

/** The boards from B to C made into one list (each train once, in the order asked), and the
 *  platform at B of the train with this id on the boards of trains that came from A. */
export function trimConnect(at: string, to: string, taken: string, onward: RawBoard[], incoming: RawBoard[], train: string): Connect {
  const seen = new Map<string, Onward>()
  for (const b of onward) {
    for (const s of b.trainServices || []) {
      const p = stops(s).find((c) => c.crs === to) || {}
      seen.set(short(s.serviceID), {
        id: short(s.serviceID), std: s.std, etd: s.etd ?? null, platform: s.platform || null,
        destination: (s.destination || []).map((x) => x.locationName).filter(Boolean).join(' and '),
        operator: s.operator || '', cancelled: Boolean(s.isCancelled || p.isCancelled), sta: p.st || null, eta: p.et || p.at || null,
      })
    }
  }
  const mine = incoming.flatMap((b) => b.trainServices || []).find((s) => short(s.serviceID) === short(train))
  const named = onward.find((b) => b.locationName) || {}
  return { taken, at, to, atName: named.locationName || at, toName: named.filterLocationName || to, arrPlatform: mine?.platform || null, trains: [...seen.values()] }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

class BoardError extends Error {
  status: number
  constructor(status: number) { super(`board ${status}`); this.status = status }
}

async function board(key: string, at: string, off: number, win: number, filter = ''): Promise<RawBoard> {
  const url = `${BASE}/GetDepBoardWithDetails/${at}?numRows=150${filter}&timeOffset=${off}&timeWindow=${win}`
  let last = 0
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: { 'x-apikey': key, 'User-Agent': 'trainchecker.baish.net', Accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
    if (r.ok) return (await r.json()) as RawBoard
    last = r.status
    if (r.status >= 400 && r.status < 500 && r.status !== 429) break
    await new Promise((res) => setTimeout(res, 800 * (i + 1)))
  }
  throw new BoardError(last)
}

const ukMinutes = (d: Date) => {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d).split(':').map(Number)
  return h * 60 + m
}

/** B's board for trains that came from A, from just before the train is due in. */
function incomingBoard(key: string, at: string, from: string, arr: string, now: Date): Promise<RawBoard> {
  const [h, m] = arr.split(':').map(Number)
  let rel = h * 60 + m - ukMinutes(now)
  if (rel < -720) rel += 1440
  if (rel > 720) rel -= 1440
  const off = Math.max(-120, Math.min(119, rel - 5))
  return board(key, at, off, 60, `&filterCrs=${from}&filterType=from`)
}

export async function GET(request: Request): Promise<Response> {
  const q = new URL(request.url).searchParams
  const code = (k: string) => (q.get(k) || '').toUpperCase()
  const at = code('at'), to = code('to'), from = code('from')
  const train = q.get('train') || '', arr = q.get('arr') || ''
  const ok = (c: string) => /^[A-Z]{3}$/.test(c)
  if (!ok(at)) return json({ error: 'stations' }, 400)
  const key = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.RDM_LDB_KEY
  if (!key) return json({ error: 'unavailable', reason: 'no RDM_LDB_KEY setting in this deployment' }, 503)
  const now = new Date()
  const taken = now.toISOString()
  try {
    if (q.get('only') === 'platform') {
      if (!ok(from) || !/^\d{6,8}$/.test(train) || !/^\d\d:\d\d$/.test(arr)) return json({ error: 'stations' }, 400)
      const inc = await incomingBoard(key, at, from, arr, now).then((b) => [b], () => [])
      return json({ taken, at, arrPlatform: trimConnect(at, at, taken, [], inc, train).arrPlatform })
    }
    if (!to) {
      const boards = await Promise.all(PLACE_WINDOWS.map(([off, win]) => board(key, at, off, win)))
      return json({ taken, at, places: places(boards) } satisfies Places)
    }
    if (!ok(to) || to === at) return json({ error: 'stations' }, 400)
    // The train you're on: B's board for trains that came from A, from just before it's due in.
    let incoming: Promise<RawBoard[]> = Promise.resolve([])
    if (ok(from) && /^\d{6,8}$/.test(train) && /^\d\d:\d\d$/.test(arr)) {
      // If this board can't be had, the answer goes without the arrival platform.
      incoming = incomingBoard(key, at, from, arr, now).then((b) => [b], () => [])
    }
    const [onward, inc] = await Promise.all([Promise.all(ONWARD_WINDOWS.map(([off, win]) => board(key, at, off, win, `&filterCrs=${to}&filterType=to`))), incoming])
    return json(trimConnect(at, to, taken, onward, inc, train))
  } catch (e) {
    const status = e instanceof BoardError ? e.status : 0
    return status === 400 ? json({ error: 'unknown' }, 404) : json({ error: 'unavailable', reason: `National Rail answered ${status || 'nothing'}` }, 502)
  }
}
