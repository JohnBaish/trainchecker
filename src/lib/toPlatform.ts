// "How do I get to my platform?" (John, November 24th 2026: a trial, not agreed). The exits table
// (data/exits.json, built for "Exits") read the other way round: from each entrance of A to the
// platform a train leaves from. A line for each entrance (John); entrances with the same way are
// joined into one line. Every sentence here is Claude's draft.
import type { StationExits, Way } from './exits.ts'

const and = (xs: string[], word = 'and') => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ${word} ${xs[xs.length - 1]}` : xs[0] ?? '')

/** What an entrance is called, for "From …". */
export function entranceName(e: StationExits, i: number): string {
  const [n, by, building, near] = e.x[i]
  if (!n) {
    if (e.x.length === 1) return building ? 'the entrance by the station building' : 'the entrance'
    if (building) return 'the entrance by the station building'
    const p = by[0] ?? near
    return p ? `the entrance by platform ${p}` : 'the other entrance'
  }
  // Names from the station maps or John: "the town centre exit" → "the town centre entrance";
  // "the long-term car park" reads as it is ("From the long-term car park").
  if (/^the /.test(n)) return n.replace(/\bexit\b/, 'entrance')
  // "Station Approach (north)" → "the north entrance on Station Approach".
  const side = n.match(/^(.*) \((north|south|east|west)\)$/)
  if (side) return `the ${side[2]} entrance on ${side[1]}`
  // "Eastbourne Terrace (Elizabeth line)" → "the Eastbourne Terrace entrance (Elizabeth line)".
  const br = n.match(/^(.*) (\([^)]*\))$/)
  if (br) return `the ${br[1]} entrance ${br[2]}`
  return `the ${n} entrance`
}

/** "the Praed Street and Eastbourne Terrace entrances", "the Praed Street or Eastbourne Terrace
 *  entrance"; names that don't fit the pattern are listed in full. */
function joinNames(names: string[], word: 'and' | 'or'): string {
  const plain = names.length > 1 && names.every((s) => /^the [^(]* entrance$/.test(s) && !/ (by|between|on|near) /.test(s))
  if (!plain) return and(names, word)
  return `the ${and(names.map((s) => s.slice(4, -9)), word)} ${word === 'and' ? 'entrances' : 'entrance'}`
}

/** The way from platform P to each exit, as stored (a platform with a letter falls back to its
 *  number, as in Exits), plus an exit opening off P on the level where no route is stored. */
function waysFor(e: StationExits, platform: string): Way[] {
  const ws: Way[] = [...(e.p[platform] ?? e.p[platform.replace(/[A-Z]$/, '')] ?? [])]
  e.x.forEach((x, i) => { if (x[1].includes(platform) && !ws.some((w) => w[0] === i)) ws.push([i, 'l', null]) })
  return ws
}

const openLine = (e: StationExits, i: number) => {
  const h = e.h?.[String(i)]
  if (!h) return ''
  return /^\d/.test(h) ? ` It’s open from ${h}.` : ` It’s open at ${h}.`
}

/** The words for one platform at A: null where nothing is known. */
export function toPlatform(e: StationExits, platform: string): string[] | null {
  if (e.k === 'concourse') return [`Every platform is off the concourse, where the entrances are.`]
  const ways = waysFor(e, platform)
  if (!ways.length) return null
  const bridge = e.w ?? 'footbridge'
  const lines: string[] = []
  // On the level first: "Platform 4 is by the Forbury Road and Apex Plaza entrances."
  const level = ways.filter((w) => w[1] === 'l').map((w) => w[0])
  // An unnamed entrance opening off this very platform is "its own entrance" (Twyford's 4).
  const own = e.x.length > 1 ? level.filter((i) => !e.x[i][0] && !e.x[i][2] && e.x[i][1].includes(platform)) : []
  const by = level.filter((i) => !own.includes(i))
  const lc = e.lc ? ', by the level crossing' : ''
  if (level.length) {
    const joined = joinNames(by.map((i) => entranceName(e, i)), 'and')
    const opens = by.length === 1 ? openLine(e, by[0]) : ''
    lines.push(!by.length ? `Platform ${platform} has its own entrance${lc}.`
      : own.length ? `Platform ${platform} has its own entrance, and is right by ${joined}${lc}.${opens}`
      : `Platform ${platform} is right by ${joined}${lc}.${opens}`)
  }
  // The rest, a line for each way, entrances with the same way joined.
  const rest = new Map<string, number[]>()
  for (const w of ways) {
    if (w[1] === 'l') continue
    const s = how(w, platform, bridge, e)
    rest.set(s, [...(rest.get(s) ?? []), w[0]])
  }
  for (const [s, is] of rest) {
    lines.push(`From ${joinNames(is.map((i) => entranceName(e, i)), 'or')}, ${s}${is.length === 1 ? openLine(e, is[0]) : ''}`)
  }
  return lines
}

/** The way in, from an entrance to platform P (the stored way out, reversed). */
function how(w: Way, platform: string, bridge: string, e: StationExits): string {
  const [i, via, down] = w
  // "down": the platform the bridge or subway comes down by on the way out, so the first one
  // reached on the way in; left out where the entrance's own name already says it.
  const at = down && !entranceName(e, i).endsWith(`platform ${down}`) ? ` by platform ${down}` : ''
  if (via === 'b') return `go up to the ${bridge}${at} and cross to platform ${platform}.`
  if (via === 's') return `go down to the subway${at} and come up on platform ${platform}.`
  if (via === 'c') return `cross the concourse to platform ${platform}.`
  if (via === 'x') return `cross the line at the level crossing to platform ${platform}.`
  // Up or down: the way out went up, so the way in goes down, and the other way round.
  const dir = down === 'up' ? 'down' : down === 'down' ? 'up' : e.k === 'below' ? 'up' : e.k === 'above' ? 'down' : null
  return dir ? `go ${dir} to platform ${platform}.` : `the way in leads to platform ${platform}.`
}
