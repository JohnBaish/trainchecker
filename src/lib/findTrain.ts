// "Find my train from my location" (John, November 26th 2026; design/find-my-train/README.md):
// which of the trains in the list you're probably on, from where your phone says you are. Only to
// narrow down the choice: two trains too close to tell apart are both offered (John: yes).
//
// Your position never leaves the phone: everything here runs in the page. How it works:
//  1. Each train's way from A to B is drawn as straight lines between its stations (the route's
//     stations, src/data/station-pos.json), with a time at each: its actual time at stops it has
//     passed, its expected time at stops ahead (National Rail's boards; api/live.ts `calls`).
//  2. Your position is placed on that line, and the time the train is (or was, or will be) there
//     is worked out between the two stations either side.
//  3. The difference from now is how far that train is from you, in minutes. The train on which
//     it's nearest nought is yours; any within TOL minutes count.
// No React and no location API here, so scripts/check-find.ts can try it on saved boards.
import { isTime, mins } from './analyse.ts'

export type LatLon = [number, number]
export type Positions = Record<string, LatLon>
/** Where the phone says you are, and how sure it is (metres). */
export type Fix = { lat: number; lon: number; accuracy: number }
/** What's needed of each train in the list (a Service). */
export type Candidate = {
  id: string; std: string; etd: string | null; sta: string | null; eta: string | null; ata: string | null
  calls?: [string, string, string | null][]
}
export type Found =
  /** Not near the line between A and B. */
  | { kind: 'far' }
  /** Still at A: `next` is the first train not yet gone, if any. */
  | { kind: 'atA'; next: string | null }
  | { kind: 'one'; id: string }
  /** Two trains too close to tell apart, nearer first. */
  | { kind: 'two'; ids: [string, string] }
  /** On the line, but no train in the list is near you. */
  | { kind: 'none' }

/** Minutes either side of now within which a train counts as yours: the board gives times only
 *  at stations, so where a train is between them is an estimate (Claude's, to tune on journeys). */
export const TOL = 4
/** How near A counts as still being there, in metres (or the phone's own uncertainty, if more). */
export const AT_A = 400

/** UK clock time of a moment, as minutes since midnight with the seconds as a fraction. */
export function ukMinutes(d: Date): number {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d)
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0)
  return n('hour') * 60 + n('minute') + n('second') / 60
}

/** Minutes from now to a clock time, wrapped to -12h..+12h (so just after midnight works). */
export function rel(now: number, t: string): number {
  let d = mins(t) - now
  if (d < -720) d += 1440
  if (d > 720) d -= 1440
  return d
}

/** Metres east and north of `o` (flat-earth: fine over a journey's few tens of kilometres). */
function local(o: LatLon, p: LatLon): [number, number] {
  return [(p[1] - o[1]) * 111320 * Math.cos((o[0] * Math.PI) / 180), (p[0] - o[0]) * 111320]
}

type Point = { crs: string; xy: [number, number]; t: number | null; st: number | null }
type Placed = { off: number; s: number; t: number; speed: number; seg: number }

/** Your place on a line of points: how far off it (metres), how far along, and the time there. */
function place(pts: Point[]): Placed | null {
  if (pts.length < 2) return null
  let best: Placed | null = null
  let along = 0
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i].xy, [bx, by] = pts[i + 1].xy
    const dx = bx - ax, dy = by - ay
    const len = Math.hypot(dx, dy)
    const f = len ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (len * len))) : 0
    const off = Math.hypot(ax + f * dx, ay + f * dy)
    const ta = pts[i].t!, tb = pts[i + 1].t!
    if (!best || off < best.off) best = { off, s: along + f * len, t: ta + f * (tb - ta), speed: len / Math.max(0.5, tb - ta), seg: len }
    along += len
  }
  return best
}

/** A train's points from A to B with a time at each, relative to now; null when it can't be
 *  placed (no time at A or B at all, or a station with no known position). */
function timeline(c: Candidate, from: string, to: string, stops: string[], pos: Positions, now: number, me: LatLon): Point[] | null {
  const aT = isTime(c.etd) ? c.etd : c.etd === 'On time' ? c.std : null
  const bT = isTime(c.ata) ? c.ata : c.ata === 'On time' ? c.sta : isTime(c.eta) ? c.eta : c.eta === 'On time' ? c.sta : null
  const calls = c.calls ?? []
  // The route's stations (the train with the most stops) when this train's stops are among them in
  // the same order, so a fast train's line follows the track's bends too; otherwise its own stops.
  let k = 0
  const onRoute = calls.every(([crs]) => { while (k < stops.length && stops[k] !== crs) k++; return k++ < stops.length })
  const own = new Map(calls.map(([crs, st, t]) => [crs, [st, t] as const]))
  const codes = [from, ...(onRoute ? stops : calls.map(([crs]) => crs)), to]
  const pts: Point[] = []
  for (const crs of codes) {
    const p = pos[crs]
    if (!p) return null
    const o = crs === from ? [c.std, aT] as const : crs === to ? [c.sta, bT] as const : own.get(crs)
    pts.push({ crs, xy: local(me, p), st: o?.[0] ? rel(now, o[0]) : null, t: o?.[1] ? rel(now, o[1]) : null })
  }
  // A stop with no time given: its timetabled time, as late as the nearest stop before it with
  // both (or after it, if none before).
  const known = pts.filter((p) => p.t !== null && p.st !== null)
  if (!known.length) return null
  pts.forEach((p, i) => {
    if (p.t !== null || p.st === null) return
    const before = pts.slice(0, i).reverse().find((q) => q.t !== null && q.st !== null)
    const after = pts.slice(i + 1).find((q) => q.t !== null && q.st !== null)
    const ref = before ?? after!
    p.t = p.st + (ref.t! - ref.st!)
  })
  // Stations this train passes without stopping: their time worked out from the distance between
  // the stops either side.
  const dist = (a: Point, b: Point) => Math.hypot(a.xy[0] - b.xy[0], a.xy[1] - b.xy[1])
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].t !== null) continue
    let j = i - 1, l = i + 1
    while (j >= 0 && pts[j].t === null) j--
    while (l < pts.length && pts[l].t === null) l++
    if (j < 0 || l >= pts.length) return null
    let whole = 0, part = 0
    for (let q = j; q < l; q++) { const d = dist(pts[q], pts[q + 1]); whole += d; if (q < i) part += d }
    pts[i].t = pts[j].t! + (whole ? part / whole : 0) * (pts[l].t! - pts[j].t!)
  }
  // Times never go backwards along the line (a board's odd answer would make the sums nonsense).
  for (let i = 1; i < pts.length; i++) if (pts[i].t! < pts[i - 1].t!) pts[i].t = pts[i - 1].t
  return pts
}

/** Which train you're probably on. `now` is UK minutes since midnight (ukMinutes()). */
export function findTrain(fix: Fix, now: number, from: string, to: string, stops: string[], trains: Candidate[], pos: Positions): Found & { gaps: Record<string, number> } {
  const me: LatLon = [fix.lat, fix.lon]
  const gaps: Record<string, number> = {}
  const a = pos[from]
  // Still at A: no train in the list can be told apart from another by where you are.
  if (a) {
    const [x, y] = local(me, a)
    if (Math.hypot(x, y) <= Math.max(AT_A, fix.accuracy)) {
      const next = trains.map((c) => ({ c, t: isTime(c.etd) ? c.etd : c.std })).filter(({ c, t }) => c.etd !== 'Delayed' && rel(now, t) >= -1)
        .sort((p, q) => rel(now, p.t) - rel(now, q.t))[0]
      return { kind: 'atA', next: next?.c.id ?? null, gaps }
    }
  }
  let nearest = Infinity
  const scored: { id: string; gap: number; tol: number }[] = []
  for (const c of trains) {
    const pts = timeline(c, from, to, stops, pos, now, me)
    const at = pts && place(pts)
    if (!at) continue
    // Off the line: two kilometres, or the phone's uncertainty, or a little of a long stretch
    // (drawn straight between stations, where the track may bend away).
    const allow = Math.max(2000, fix.accuracy * 1.5, at.seg * 0.15)
    nearest = Math.min(nearest, at.off / allow)
    if (at.off > allow) continue
    gaps[c.id] = Math.round(at.t * 10) / 10
    scored.push({ id: c.id, gap: at.t, tol: TOL + Math.min(3, fix.accuracy / Math.max(100, at.speed)) })
  }
  if (nearest > 1) return { kind: 'far', gaps }
  const fits = scored.filter((s) => Math.abs(s.gap) <= s.tol).sort((p, q) => Math.abs(p.gap) - Math.abs(q.gap))
  if (!fits.length) return { kind: 'none', gaps }
  if (fits.length === 1) return { kind: 'one', id: fits[0].id, gaps }
  return { kind: 'two', ids: [fits[0].id, fits[1].id], gaps }
}
