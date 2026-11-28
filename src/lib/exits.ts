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
import { numberWord } from './words.ts'

export type ExitRow = [name: string | null, by: string[], building: 0 | 1, near: string | null]
/** A way from a platform to an exit: the exit's number, how (l level, b footbridge, s subway, x
 *  level crossing, c concourse, u up or down), and the platform a footbridge or subway comes down
 *  by, where known (for u: 'up', 'down' or 'unknown'). */
export type Way = [exit: number, via: string, down: string | null]
/** w: John's word for the station's footbridge ("bridge" at Reading, which has shops on it);
 *  here: for an exit given a descriptive name, how to say it's right there (exit number → words). */
export type StationExits = { x: ExitRow[]; p: Record<string, Way[]>; k: 'by' | 'concourse' | 'above' | 'below' | 'mixed'; h?: Record<string, string>; m?: 1; w?: string; here?: Record<string, string>; lc?: 1; say?: Record<string, string>; other?: 1; eo?: number[]; sl?: string; nw?: Record<string, string>; far?: Record<string, number>; dq?: Record<string, number[]> }
// say: John's own words for a platform, after "Your train is due into platform 1." (Ivybridge).
// other: by an exit on the level, also say the other one over the bridge or through the subway
// (Southampton Central: "…is right there, or you can go over the footbridge for the town centre exit").
// nw: for an unnamed exit by no platform, the platform it's nearest on foot ("the exit nearest platform 2").
// sl: John's own sentence for the station as a whole (Reading).
// eo: exits people come out of but wouldn't go in by (Reading's Apex Plaza); never offered as a way in.
// dq: level ways from a platform that the platform links contradict (the exit's platform is across the line
// there), so one of the two tables is wrong; only where the exit is is said, not the way to it (John,
// November 27th 2026: "simplify everything enough to make what we say true even if it's less detailed").
// lc: John has confirmed the exits are either side of a public level crossing (Midgham).
export type ExitsTable = Record<string, StationExits>

const numOf = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 999
const byNum = (a: string, b: string) => numOf(a) - numOf(b) || a.localeCompare(b)
const and = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '')
const plats = (ps: string[]) => (ps.length === 1 ? `platform ${ps[0]}` : `platforms ${and(ps)}`)

// "Exits" (John, November 22nd 2026: the sentence under it already names the station).
export const heading = (_name: string, e: StationExits) => (e.x.length === 1 ? 'Exit' : 'Exits')

/** The sentence about the station as a whole. */
export function stationLine(name: string, e: StationExits): string {
  if (e.sl) return e.sl
  if (e.k === 'concourse') return `At ${name}, every platform leads to the concourse, where the exits are.`
  // Draft: John agreed "up on the bridge" and "up on the concourse" for these; the table doesn't
  // say which, so neither is named.
  // (Not where some exit is on the level by a platform: Edinburgh's are, so this was untrue there.)
  const someLevel = e.x.some((x) => x[1].length)
  if (e.k === 'above' && !someLevel) return `At ${name}, the exits are up above the platforms.`
  if (e.k === 'below' && !someLevel) return `At ${name}, the exits are down below the platforms.`
  // One platform for each exit, as John's "the exits are by platforms 1, 4 and 15" (Reading):
  // the nearest it opens off, or for an exit up on a footbridge, the platform it comes down by.
  const reps = e.x.map((x) => x[1][0] ?? x[3])
  const by = [...new Set(reps.filter((p): p is string => !!p))].sort(byNum)
  const one = e.x.length === 1
  // Only where every exit has a platform to name; otherwise how you get to them (Drafts).
  // Some exits by a platform and some not (Guildford, Newbury, Tonbridge: John, November 24th 2026):
  // name only the ones by a platform, as a catch-all below would ignore them and say something untrue.
  // "There's an exit by platform 1." leaves room for the others, which each platform's own line names.
  if (by.length && reps.some((p) => !p)) {
    const n = reps.filter((p) => p).length
    // The rest off the concourse, where that's the way to them (King's Cross, Aberdeen), as before.
    const loose = reps.filter((p) => !p).length
    const viaC = Object.values(e.p).some((ws) => ws.some((w) => w[1] === 'c' && !reps[w[0]]))
    const rest = viaC ? `, and ${loose === 1 ? 'another' : 'others'} off the concourse` : ''
    if (n === 1) return `At ${name}, there’s an exit by platform ${by[0]}${rest}.`
    if (by.length === 1) return `At ${name}, there are ${numberWord(n)} exits by platform ${by[0]}${rest}.`
    return `At ${name}, there are exits by ${plats(by)}${rest}.`
  }
  if (!by.length) {
    const vias = new Set(Object.values(e.p).flatMap((ws) => ws.map((w) => w[1])))
    if (vias.has('c')) return `At ${name}, the ${one ? 'exit is' : 'exits are'} off the concourse.`
    if (vias.size === 1 && vias.has('b')) return `At ${name}, every platform reaches the ${one ? 'exit' : 'exits'} over the ${e.w ?? 'footbridge'}.`
    if (vias.size === 1 && vias.has('s')) return `At ${name}, every platform reaches the ${one ? 'exit' : 'exits'} through the subway.`
    return `At ${name}, the ${one ? 'exit isn’t' : 'exits aren’t'} on the platforms themselves.`
  }
  // Every platform with its own exit (Midgham, Dean, Darsham: John, November 22nd 2026).
  const all = new Set([...Object.keys(e.p), ...e.x.flatMap((x) => x[1])])
  if (!one && all.size >= 2 && e.x.every((x) => x[1].length) && [...all].every((p) => e.x.some((x) => x[1].includes(p)))
    && Object.entries(e.p).every(([p, ws]) => ws.filter((w) => !(w[1] === 'l' && e.dq?.[p]?.includes(w[0])))[0]?.[1] === 'l'))
    return `At ${name}, there’s an exit by each platform${e.lc ? ', either side of the level crossing' : ''}.`
  // Every exit by the same one platform: "both exits", "all the exits" (John, November 22nd 2026).
  // In doubt (dq): an exit may be missing from the map, so not "the exit is", "both exits are" (Hersham).
  if (e.dq) {
    if (one) return `At ${name}, there’s an exit by ${plats(by)}.`
    if (by.length === 1) return `At ${name}, there are ${numberWord(e.x.length)} exits by platform ${by[0]}.`
    return `At ${name}, there are exits by ${plats(by)}.`
  }
  if (!one && by.length === 1) return `At ${name}, ${e.x.length === 2 ? 'both exits are' : 'all the exits are'} by platform ${by[0]}.`
  if (one) return `At ${name}, the exit is by ${e.x[0][2] ? `the station building on ${plats(by)}` : plats(by)}.`
  return `At ${name}, the exits are by ${plats(by)}.`
}

// How an exit's name reads in a sentence (John, November 22nd 2026: trap the ones that read oddly).
// A street reads as it is ("for Station Road", "The exit on Station Road"); a place takes "the …
// exit" ("for the University of Bristol exit"); a name already starting "the" stays ("for the car
// park", "The exit to the car park"); a road number takes "the" ("the A82").
const STREET = /\b(Road|Street|Lane|Avenue|Hill|Way|Place|Square|Terrace|Close|Approach|Bridge|Row|Walk|Drive|Crescent|Parade|Yard|Boulevard|Queensway|Hollow|Green|Gardens|Grove|Mews|Wharf|Quay|Court|View|Gate|Broadway|Promenade|Esplanade|Wynd|Brae|Vale|Side|Rise|Park Road|Hill South|Road South|Road North|South|North|East|West)\b( \([^)]*\))?$/
const isRoadNumber = (n: string) => /^[ABM]\d+/.test(n)
/** After "to" or "for". `street`: the name came from the map data, so it's always a street. */
export function toName(n: string, street = false): string {
  if (/^the /.test(n)) return n            // also "the town centre exit", named by what's near it
  if (street) return n
  if (isRoadNumber(n)) return `the ${n}`
  if (STREET.test(n)) return n
  return `the ${n} exit`
}
/** Before "is right there". */
export function hereName(n: string, street = false): string {
  if (/^the /.test(n)) return /\b(exit|entrance)\b/.test(n) ? n[0].toUpperCase() + n.slice(1) : `The exit to ${n}`
  if (street) return `The exit on ${n}`
  if (isRoadNumber(n)) return `The exit on the ${n}`
  if (STREET.test(n)) return `The exit on ${n}`
  return `The ${n} exit`
}

/** "Station Hill", "Hurst Road", or for an exit with no name "the exit", or "the exit by platform
 *  4" where there are others (Draft). */
/** Two exits onto the same road, on different sides (Broadbottom's two Moss Lanes): which platform this
 *  one is by, so a sentence never names the same exit twice (John, November 24th 2026). */
export function twinTag(e: StationExits, i: number, shown?: Set<number>): string {
  const x = e.x[i]
  if (!hasTwin(e, i, shown)) return ''
  const p = x[1][0] ?? x[3]
  return p ? ` by platform ${p}` : ''
}
/** Another exit of the same name, among those this answer names (all of them when not given). */
export const hasTwin = (e: StationExits, i: number, shown?: Set<number>) =>
  !!e.x[i][0] && e.x.some((y, j) => j !== i && y[0] === e.x[i][0] && (!shown || shown.has(j)))
/** An exit isn't named after the platform you're on (John, Putney, November 25th 2026): "the
 *  subway to the exit nearest platform 3" from platform 3. Its way out crosses the line (a footbridge
 *  or subway) in all but a few cases, so it's "the exit across the line"; otherwise "the other exit"
 *  beside one more, "another exit" beside two or more, or "the exit" alone (drafts). */
const target = (e: StationExits, i: number, shown?: Set<number>, asked?: string) => {
  const n = targetName(e, i, shown)
  if (!asked || n !== `the exit by platform ${asked}` && n !== `the exit nearest platform ${asked}`) return n
  const ws = e.p[asked] ?? e.p[asked.replace(/[A-Z]$/, '')] ?? []
  if (ws.some((w) => w[0] === i && (w[1] === 'b' || w[1] === 's'))) return 'the exit across the line'
  const k = shown?.size ?? 1
  return k === 1 ? 'the exit' : k === 2 ? 'the other exit' : 'another exit'
}
const targetName = (e: StationExits, i: number, shown?: Set<number>) => {
  const x = e.x[i]
  if (x[0]) {
    const tag = twinTag(e, i, shown)
    if (!tag && hasTwin(e, i, shown)) return `the other ${toName(x[0], !e.m && !e.here).replace(/^the /, '')}${/ exit$/.test(toName(x[0], !e.m && !e.here)) ? '' : ' exit'}`
    return toName(x[0], !e.m && !e.here) + tag
  }
  const p = x[1][0] ?? x[3]
  if (e.x.length > 1 && !p && e.nw?.[String(i)]) return `the exit nearest platform ${e.nw[String(i)]}`
  return e.x.length === 1 || !p ? 'the exit' : `the exit by platform ${p}`
}
const hoursLine = (e: StationExits, ways: Way[]) => {
  const i = ways.map((w) => w[0]).find((x) => e.h?.[String(x)])
  const n = i === undefined ? null : e.x[i][0]
  const called = !n ? 'The exit' : /^the /.test(n) ? (/\b(exit|entrance)\b/.test(n) ? n[0].toUpperCase() + n.slice(1) : `The exit to ${n}`) : `The ${n} exit`
  return i === undefined ? '' : ` ${called} is open from ${e.h![String(i)]}.` // Draft
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
  // John's words for the whole answer, opening included, where they begin "Your train" (Paddington's "platform 1,
  // the one with the big clock"); otherwise his words follow the usual opening.
  if (e.say?.[platform]) return e.say[platform].startsWith('Your train') ? e.say[platform] : `${start} ${e.say[platform]}`
  // A lettered platform (9B) takes its platform's own words, with its label.
  const plain = platform.replace(/[A-Za-z]+$/, '')
  if (plain && plain !== platform && e.say?.[plain]) {
    const own = e.say[plain].replace(new RegExp(`(platform) ${plain}\\b`, 'gi'), `$1 ${platform}`)
    return own.startsWith('Your train') ? own : `${start} ${own}`
  }
  let ways = (e.p[platform] ?? e.p[platform.replace(/[A-Z]$/, '')] ?? [])
  // An exit that opens off this platform is right there, even where no route is stored (Southend
  // Airport: John, "the exit is by platform 1").
  if (!ways.length) {
    const i = e.x.findIndex((x) => x[1].includes(platform))
    if (i >= 0) ways = [[i, 'l', null]]
  }
  // Ways in doubt (dq): only where the exit is, not the way to it (John, November 27th 2026). Drafts.
  const doubt = e.dq?.[e.p[platform] ? platform : platform.replace(/[A-Z]$/, '')] ?? []
  const trimmed = ways.length > 0 && doubt.length > 0
  if (doubt.length) ways = ways.filter((w) => !(w[1] === 'l' && doubt.includes(w[0])))
  // Not one with the same name as an exit this platform still reaches: the same road on the other side of
  // the line (Bilbrook's Duck Lane, Riddlesdown's Lower Barn Road, as at Hersham), which adds nothing.
  const kept = new Set(ways.map((w) => e.x[w[0]][0]).filter(Boolean))
  const reached = new Set(ways.map((w) => w[0]))
  const whereOnly = exitsWhere(e, doubt.filter((k) => !kept.has(e.x[k][0]) && !reached.has(k)))
  if (trimmed && !ways.length) return `${start} ${whereOnly}`
  if (trimmed && whereOnly) return `${trainLineFrom(e, platform, ways, start, true)} ${whereOnly.replace(/^There’s an exit/, 'There’s also an exit')}`
  return trainLineFrom(e, platform, ways, start, trimmed)
}

/** "There’s an exit on Braywick Road by platform 1.", "The town centre exit is by platform 2.", and for
 *  more than one by the same platform "The university exit and Forest Lane are by platform 4." (Maryland). */
function exitsWhere(e: StationExits, ks: number[]): string {
  const groups = new Map<string, number[]>()
  for (const k of ks) groups.set(e.x[k][1][0] ?? '', [...(groups.get(e.x[k][1][0] ?? '') ?? []), k])
  return [...groups].sort((a, b) => byNum(a[0], b[0])).map(([p, is]) => {
    const at = p ? ` by platform ${p}` : ' there'
    const one = (k: number) => (e.x[k][0] ? toName(e.x[k][0]!, !e.m && !e.here) : null)
    if (is.length > 1) {
      const t = and(is.map((k) => one(k) ?? 'an exit'))
      return `${t[0].toUpperCase()}${t.slice(1)} are${at}.`
    }
    const t = one(is[0])
    if (!t) return `There’s an exit${p ? at : ''}.`
    if (/^the .* exit$/.test(t)) return `${t[0].toUpperCase()}${t.slice(1)} is${at}.`
    return `There’s an exit ${/^the /.test(t) ? 'to' : 'on'} ${t}${p ? at : ''}.`
  }).join(' ')
}

function trainLineFrom(e: StationExits, platform: string, ways: Way[], start: string, trimmed: boolean): string {
  // No route known from this platform: say only what is known, the station's own sentence without
  // "At Midgham," (John, November 22nd 2026: show what we know, don't say what we don't).
  if (!ways.length) {
    const line = stationLine('', e).replace(/^At , (\w)/, (_, c: string) => c.toUpperCase())
    return `${start} ${line}`
  }
  const [i, via, down] = ways[0]
  if (via === 'l') {
    const x = e.x[i]
    const by = e.lc ? ', by the level crossing' : ''
    // The other exit over the bridge or through the subway, everywhere (John, November 22nd 2026:
    // "even if we only have street names", so people can look on a map for the one that suits them).
    const alt = ways.find((w) => w[0] !== i && (w[1] === 'b' || w[1] === 's'))
    const also = alt ? `, or you can go ${alt[1] === 'b' ? `over the ${e.w ?? 'footbridge'}` : 'through the subway'} for ${target(e, alt[0], new Set([i, alt[0]]), platform)}` : ''
    // "Rectory Hill (platform 1)" names it for the station's list; from that platform it's just Rectory Hill.
    const nm = x[0]?.replace(/ \(platform [0-9A-Za-z]+( side)?\)$/, '') ?? null
    const here = e.here?.[String(i)]
    // An exit by another platform more than 60 metres' walk away isn't "right there": "a short walk along", or
    // over 120 metres "a walk along" (John, November 27th 2026; the metres from the map data's paths).
    const far = trimmed ? undefined : e.far?.[e.p[platform] ? platform : platform.replace(/[A-Z]$/, '')]
    // With a way in doubt taken out, the next exit's walk wasn't measured: where it is, not "right there"
    // (Inverness's 1: the city centre exit, by platform 2). Draft.
    if (trimmed && x[1].length && !x[1].includes(platform)) {
      const it = nm ? (here ?? hereName(nm, !e.m)) : 'There’s an exit'
      const at = /\bplatform\b/.test(it) ? '' : ` by platform ${x[1][0]}`
      return nm ? `${start} ${it} is${at}, on the same level${by}${also}.${hoursLine(e, [ways[0]])}`
        : `${start} ${it}${at}, on the same level${by}.${hoursLine(e, [ways[0]])}`
    }
    if (far) {
      const lc = (t: string) => t[0].toLowerCase() + t.slice(1)
      const it = nm ? lc(here ?? hereName(nm, !e.m)) : 'the exit'
      const at = /\bplatform\b/.test(it) ? '' : ` by platform ${x[1][0]}`
      return `${start} It’s ${far > 120 ? 'a walk' : 'a short walk'} along to ${it}${at}, on the same level${by}${nm ? also : ''}.${hoursLine(e, [ways[0]])}`
    }
    if (!nm) return `${start} ${e.x.length === 1 ? 'The exit is' : 'There’s an exit'} right there${by}.${hoursLine(e, [ways[0]])}`
    return `${start} ${here ?? hereName(nm, !e.m)} is right there${by}${also}.${hoursLine(e, [ways[0]])}`
  }
  if (via === 'c') return `${start} The exits are across the concourse at the end of the platform.${hoursLine(e, ways)}` // Draft
  if (via === 'u') {
    // Up or down, where the station map shows which (John, November 22nd 2026, from Paddington:
    // "The way out is up from the Elizabeth Line platforms to the Eastbourne Terrace exit.");
    // otherwise only where it leads, never "up or down".
    const dir = down === 'up' || down === 'down' ? down : down === 'unknown' ? null : e.k === 'below' ? 'down' : e.k === 'above' ? 'up' : null
    return `${start} ${dir ? `The way out is ${dir} from the platform to` : 'The way out from the platform leads to'} ${target(e, i, new Set([i]), platform)}.${hoursLine(e, [ways[0]])}` // Draft
  }
  if (via === 'x') return `${start} Cross the line at the level crossing for ${target(e, i, new Set([i]), platform)}.${hoursLine(e, [ways[0]])}` // Draft
  // A footbridge or subway: either way, when two ways the same kind lead to different exits.
  const same = ways.filter((w) => w[1] === via)
  const bridge = e.w ?? 'footbridge'
  const thing = via === 'b' ? bridge : 'subway'
  const off = via === 'b' ? 'coming down from the bridge' : 'coming up from the subway'
  const offAgain = via === 'b' ? 'coming down' : 'coming up'
  if (same.length >= 2 && same[0][0] !== same[1][0]) {
    const [a, b] = same
    const pair = new Set([a[0], b[0]])
    // Both exits reached by coming down (or up) at the same platform: not "either way", but one way, then a
    // choice there (John, November 27th 2026, Exeter St Davids: Isambard Parade and Kingdom Mews, both by
    // platform 1). Draft wording.
    const byA = e.x[a[0]][1], byB = e.x[b[0]][1]
    // Where the bridge comes down isn't stored for an exit by just one platform: it's that platform.
    const lands = (w: Way) => w[2] ?? (e.x[w[0]][1].length === 1 ? e.x[w[0]][1][0] : null)
    const meet = lands(a) && lands(a) === lands(b) ? lands(a) : !a[2] && !b[2] && byA.length && byA.join() === byB.join() ? byA[0] : null
    // Two exits that can't be told apart (both unnamed, by no platform): one way to them, not "either way".
    const ta = target(e, a[0], pair, platform)
    if (!meet && ta === target(e, b[0], pair, platform)) {
      return `${start} Go ${via === 'b' ? `up to the ${bridge}` : 'down to the subway'} for ${ta.replace(/^the exit\b/, 'the exits')}.${hoursLine(e, same.slice(0, 2))}`
    }
    if (meet) {
      const go = via === 'b' ? `Go up to the ${bridge} and come down by platform ${meet}` : `Go down to the subway and come up by platform ${meet}`
      const names = [target(e, a[0], pair, platform), target(e, b[0], pair, platform)]
      const named = names.filter((t) => !/^the exit\b/.test(t) || /^the exit to\b/.test(t))
      const end = named.length === 2 ? ` for ${named[0]} or ${named[1]}` : named.length === 1 ? ` for ${named[0]} or the other exit there` : e.x.length === 2 ? ', where both exits are' : ', where there are two exits'
      return `${start} ${go}${end}.${hoursLine(e, same.slice(0, 2))}`
    }
    const said = (w: Way) => w[2] && !target(e, w[0], pair, platform).endsWith(`platform ${w[2]}`)
    const one = `to ${target(e, a[0], pair, platform)}${said(a) ? `, ${off} by platform ${a[2]}` : ''}`
    const two = `to ${target(e, b[0], pair, platform)}${said(b) ? `, ${said(a) ? offAgain : off} by platform ${b[2]}` : ''}`
    return `${start} Go ${via === 'b' ? `up to the ${bridge}` : 'down to the subway'}, where you can turn either way: ${one}, or ${two}.${hoursLine(e, same.slice(0, 2))}`
  }
  const alt0 = ways.find((w) => w[0] !== i && (w[1] === 'b' || w[1] === 's') && w[1] !== via)
  const shown = new Set([i, ...(alt0 ? [alt0[0]] : [])])
  const t = target(e, i, shown, platform)
  // The other exit, the other way (John, November 24th 2026, Guildford: the footbridge to Guildford Park
  // Road wasn't mentioned for the platforms reached by the subway), as the level answers already do.
  const alt = ways.find((w) => w[0] !== i && (w[1] === 'b' || w[1] === 's') && w[1] !== via)
  const also = alt ? `, or the ${alt[1] === 'b' ? bridge : 'subway'} to ${target(e, alt[0], shown, platform)}` : ''
  return `Your train is due into platform ${platform}, so you’ll want the ${thing} to ${t}${down && !t.endsWith(`platform ${down}`) ? `, ${off} by platform ${down}` : ''}${also}.${hoursLine(e, [ways[0]])}`
}

/** When the trains in Exits' list whose platforms have been announced all share one (John, November
 *  28th 2026): "All the trains whose platforms have been announced are coming into platform 2.", or for
 *  a single train "The only train whose platform has been announced is coming into platform 2.". Null
 *  when none is announced or they're on different platforms. */
export function sharedPlatform(platforms: (string | null)[]): { platform: string; line: string } | null {
  const known = platforms.filter((p): p is string => !!p)
  if (!known.length || new Set(known).size > 1) return null
  const platform = known[0]
  return {
    platform,
    line: known.length === 1
      ? `The only train whose platform has been announced is coming into platform ${platform}.`
      : `All the trains whose platforms have been announced are coming into platform ${platform}.`,
  }
}

/** The way out from a platform, as trainLine() gives it for a train, without "Your train is due into
 *  platform 2." (the line above has said which platform); "…, so you’ll want the footbridge…" becomes
 *  "You’ll want the footbridge…". */
export function platformWayOut(e: StationExits, platform: string): string {
  return trainLine(e, platform, false)
    .replace(/^Your train is due into platform [^.,]+, so you’ll want/, 'You’ll want')
    .replace(/^Your train is due into platform [^.]+\.\s*/, '')
}
