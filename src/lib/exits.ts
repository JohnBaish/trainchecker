// "Station exits" (John, November 22nd 2026): where the ways out of B are, and, for the train
// you're on, how to reach them from the platform it comes into. The table (data/exits.json) is
// built by design/platform-links-trial/build_exits_table.py from the station maps read by eye
// (the biggest and the hardest stations) and OpenStreetMap (everywhere else).
//
// Agreed with John: "At Reading, the exits are by platforms 1, 4 and 15."; "At London Victoria,
// every platform leads to the concourse, where the exits are."; "At Newton Abbot, the exit is by
// the station building on platform 3."; "Your train is due into platform 4. The exit on Forbury
// Road is right there."; "Your train is due into platform 9. Go up to the footbridge, where you can
// turn either way: to Station Hill, coming down from the bridge by platform 7, or to the Station
// Car Park, coming down by platform 15."; "Your train is due into platform 7, so you'll want the
// subway to the main exit."; "The platform for your train hasn't been announced yet. Check again
// nearer the time."; the heading "Station exit at Reading" ("Station exits" for more); the station
// maps' names where read; footbridge, subway or level only, no steps, lifts or escalators. The
// rest (marked "Draft") is Claude's.

/** Each exit: its name (null when not known), the platforms it opens off on the level (nearest
 *  first), 1 when it's by the station building, and for an exit by no platform, the platform people
 *  come down by on the way to it (or null). */
export type ExitRow = [name: string | null, by: string[], building: 0 | 1, near: string | null]
/** A way from a platform to an exit: the exit's number, how (l level, b footbridge, s subway, x
 *  level crossing, c concourse, u up or down), and the platform a footbridge or subway comes down
 *  by, where known. */
export type Way = [exit: number, via: string, down: string | null]
/** w: John's word for the station's footbridge ("bridge" at Reading, which has shops on it);
 *  here: for an exit given a descriptive name, how to say it's right there (exit number → words). */
export type StationExits = { x: ExitRow[]; p: Record<string, Way[]>; k: 'by' | 'concourse' | 'above' | 'below' | 'mixed'; h?: Record<string, string>; m?: 1; w?: string; here?: Record<string, string> }
export type ExitsTable = Record<string, StationExits>

const numOf = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 999
const byNum = (a: string, b: string) => numOf(a) - numOf(b) || a.localeCompare(b)
const and = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '')
const plats = (ps: string[]) => (ps.length === 1 ? `platform ${ps[0]}` : `platforms ${and(ps)}`)

export const heading = (name: string, e: StationExits) => `Station ${e.x.length === 1 ? 'exit' : 'exits'} at ${name}`

/** The sentence about the station as a whole. */
export function stationLine(name: string, e: StationExits): string {
  if (e.k === 'concourse') return `At ${name}, every platform leads to the concourse, where the exits are.`
  // Draft: John agreed "up on the bridge" and "up on the concourse" for these; the table doesn't
  // say which, so neither is named.
  if (e.k === 'above') return `At ${name}, the exits are up above the platforms.`
  if (e.k === 'below') return `At ${name}, the exits are down below the platforms.`
  // One platform for each exit, as John's "the exits are by platforms 1, 4 and 15" (Reading):
  // the nearest it opens off, or for an exit up on a footbridge, the platform it comes down by.
  const reps = e.x.map((x) => x[1][0] ?? x[3])
  const by = [...new Set(reps.filter((p): p is string => !!p))].sort(byNum)
  const one = e.x.length === 1
  // Only where every exit has a platform to name; otherwise how you get to them (Drafts).
  if (!by.length || reps.some((p) => !p)) {
    const vias = new Set(Object.values(e.p).flatMap((ws) => ws.map((w) => w[1])))
    if (vias.has('c')) return `At ${name}, the ${one ? 'exit is' : 'exits are'} off the concourse.`
    if (vias.size === 1 && vias.has('b')) return `At ${name}, every platform reaches the ${one ? 'exit' : 'exits'} over the ${e.w ?? 'footbridge'}.`
    if (vias.size === 1 && vias.has('s')) return `At ${name}, every platform reaches the ${one ? 'exit' : 'exits'} through the subway.`
    return `At ${name}, the ${one ? 'exit isn’t' : 'exits aren’t'} on the platforms themselves.`
  }
  if (one) return `At ${name}, the exit is by ${e.x[0][2] ? `the station building on ${plats(by)}` : plats(by)}.`
  return `At ${name}, the exits are by ${plats(by)}.`
}

/** "Station Hill", "Hurst Road", or for an exit with no name "the exit", or "the exit by platform
 *  4" where there are others (Draft). */
const target = (e: StationExits, i: number) => {
  const x = e.x[i]
  if (x[0]) return x[0]
  const p = x[1][0] ?? x[3]
  return e.x.length === 1 || !p ? 'the exit' : `the exit by platform ${p}`
}
const hoursLine = (e: StationExits, ways: Way[]) => {
  const i = ways.map((w) => w[0]).find((x) => e.h?.[String(x)])
  return i === undefined ? '' : ` The ${e.x[i][0] ? `${e.x[i][0]} exit` : 'exit'} is open from ${e.h![String(i)]}.` // Draft
}

/** For the train you're on. `platform` null: not known yet; `ends` true when the train ends at B. */
export function trainLine(e: StationExits, platform: string | null, ends: boolean): string {
  if (!platform) {
    // At a terminus every platform leads the same way, so the platform doesn't matter (John).
    if (e.k === 'concourse') return 'Every platform leads to the concourse, where the exits are.'
    return ends
      ? 'Trainchecker can’t see which platform your train will come into, as it ends here. Check the screens as you arrive.' // Draft
      : 'The platform for your train hasn’t been announced yet. Check again nearer the time.'
  }
  const start = `Your train is due into platform ${platform}.`
  let ways = (e.p[platform] ?? e.p[platform.replace(/[A-Z]$/, '')] ?? [])
  // An exit that opens off this platform is right there, even where no route is stored (Southend
  // Airport: John, "the exit is by platform 1").
  if (!ways.length) {
    const i = e.x.findIndex((x) => x[1].includes(platform))
    if (i >= 0) ways = [[i, 'l', null]]
  }
  // No route known from this platform: say only what is known, the station's own sentence without
  // "At Midgham," (John, November 22nd 2026: show what we know, don't say what we don't).
  if (!ways.length) {
    const line = stationLine('', e).replace(/^At , (\w)/, (_, c: string) => c.toUpperCase())
    return `${start} ${line}`
  }
  const [i, via, down] = ways[0]
  if (via === 'l') {
    const x = e.x[i]
    if (!x[0]) return `${start} ${e.x.length === 1 ? 'The exit is' : 'There’s an exit'} right there.${hoursLine(e, [ways[0]])}` // the second: Draft
    const here = e.here?.[String(i)]
    return `${start} ${here ?? `The exit on ${x[0]}`} is right there.${hoursLine(e, [ways[0]])}`
  }
  if (via === 'c') return `${start} The exits are across the concourse at the end of the platform.${hoursLine(e, ways)}` // Draft
  if (via === 'u') return `${start} The way out is ${e.k === 'below' ? 'down' : e.k === 'above' ? 'up' : 'up or down'} from the platform, to ${target(e, i)}.${hoursLine(e, [ways[0]])}` // Draft
  if (via === 'x') return `${start} Cross the line at the level crossing for ${target(e, i)}.${hoursLine(e, [ways[0]])}` // Draft
  // A footbridge or subway: either way, when two ways the same kind lead to different exits.
  const same = ways.filter((w) => w[1] === via)
  const bridge = e.w ?? 'footbridge'
  const thing = via === 'b' ? bridge : 'subway'
  const off = via === 'b' ? 'coming down from the bridge' : 'coming up from the subway'
  const offAgain = via === 'b' ? 'coming down' : 'coming up'
  if (same.length >= 2 && same[0][0] !== same[1][0]) {
    const [a, b] = same
    const said = (w: Way) => w[2] && !target(e, w[0]).endsWith(`platform ${w[2]}`)
    const one = `to ${target(e, a[0])}${said(a) ? `, ${off} by platform ${a[2]}` : ''}`
    const two = `to ${target(e, b[0])}${said(b) ? `, ${said(a) ? offAgain : off} by platform ${b[2]}` : ''}`
    return `${start} Go ${via === 'b' ? `up to the ${bridge}` : 'down to the subway'}, where you can turn either way: ${one}, or ${two}.${hoursLine(e, same.slice(0, 2))}`
  }
  const t = target(e, i)
  return `Your train is due into platform ${platform}, so you’ll want the ${thing} to ${t}${down && !t.endsWith(`platform ${down}`) ? `, ${off} by platform ${down}` : ''}.${hoursLine(e, [ways[0]])}`
}
