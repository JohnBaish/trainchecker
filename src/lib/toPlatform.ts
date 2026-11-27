// "How do I get to my platform?" (John, November 24th 2026: a trial, not agreed). The exits table
// (data/exits.json, built for "Exits") read the other way round: from each entrance of A to the
// platform a train leaves from. A line for each entrance (John); entrances with the same way are
// joined into one line. Every sentence here is Claude's draft.
import { hasTwin, twinTag, type StationExits, type Way } from './exits.ts'
import { howToGet } from './platformLinks.ts'

const and = (xs: string[], word = 'and') => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ${word} ${xs[xs.length - 1]}` : xs[0] ?? '')

/** What an entrance is called, for "From …". */
export function entranceName(e: StationExits, i: number, fix?: Fix, shown?: Set<number>): string {
  const own = fix?.names?.[String(i)]
  if (own) return own
  const tag = twinTag(e, i, shown)
  // A twin by no platform, beside one that is (Benfleet's second Ferry Road): "the other …".
  if (!tag && hasTwin(e, i, shown)) return baseName(e, i).replace(/^the /, 'the other ')
  return baseName(e, i) + tag
}
function baseName(e: StationExits, i: number): string {
  const [n, by, building, near] = e.x[i]
  if (!n) {
    if (e.x.length === 1) return building ? 'the entrance by the station building' : 'the entrance'
    // Two unnamed entrances by the station building (Berkhamsted): told apart by their platforms.
    const twins = e.x.filter((y) => !y[0] && y[2]).length > 1
    if (building && !(twins && (by[0] ?? near))) return 'the entrance by the station building'
    const p = by[0] ?? near
    if (!p && e.nw?.[String(i)]) return `the entrance nearest platform ${e.nw[String(i)]}`
    return p ? `the entrance by platform ${p}` : 'the other entrance'
  }
  // Names from the station maps or John: "the town centre exit" → "the town centre entrance";
  // "the long-term car park" reads as it is ("From the long-term car park").
  if (/^the /.test(n)) return n.replace(/\bexit\b/, 'entrance')
  // "Station Approach (north)" → "the north entrance on Station Approach".
  const side = n.match(/^(.*) \((north|south|east|west)\)$/)
  if (side) return `the ${side[2]} entrance on ${side[1]}`
  // "Eastbourne Terrace (Elizabeth line)" → "the Eastbourne Terrace entrance (Elizabeth line)".
  const br = n.match(/^(.*) (\([^)]*\bline\))$/)
  if (br) return `the ${br[1]} entrance ${br[2]}`
  return `the ${n} entrance`
}

/** "the Praed Street and Eastbourne Terrace entrances", "the Praed Street or Eastbourne Terrace
 *  entrance"; names that don't fit the pattern are listed in full. */
function joinNames(names: string[], word: 'and' | 'or'): string {
  const plain = names.length > 1 && names.every((s) => /^the .* entrance$/.test(s) && !/ (by|between|on|near|at) /.test(s))
  if (!plain) return and(names, word)
  return `the ${and(names.map((s) => s.slice(4, -9)), word)} ${word === 'and' ? 'entrances' : 'entrance'}`
}

/** "the Praed Street or Eastbourne Terrace entrance"; otherwise "the town centre and Station Hill,
 *  or from the north entrance by the car park" (John, November 24th 2026: the comma, and "or from"). */
function fromNames(names: string[]): string {
  const j = joinNames(names, 'or')
  if (names.length < 2 || !j.endsWith(names[names.length - 1])) return j
  return names.join(', or from ')
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

/** Platform links (data/platform-links.json): level groups, each a list of islands. */
export type Links = { g: string[][][] }
/** John's own corrections for a station (data/to-platform.json): only these entrances named on
 *  the level for these platforms (Reading 4 to 7: the south entrance on Station Hill). */
export type Fix = {
  level?: Record<string, string[]>
  /** An entrance's name in these sentences, by its number in exits.json (Twyford's town side;
   *  Bath Spa's two rear entrances, named alike and so said once). */
  names?: Record<string, string>
  /** Up or down from the entrance, where the table doesn't say (Paddington A and B: down). */
  dir?: Record<string, 'up' | 'down'>
  /** John's own words for a platform, in place of the generated ones (Putney, November 25th 2026). */
  say?: Record<string, string>
}

const base = (p: string) => p.replace(/(\d)[A-Z]$/, '$1')
const has = (isl: string[], p: string) => isl.includes(p) || isl.includes(base(p))
const levelGroup = (links: Links | undefined, p: string) => links?.g.find((grp) => grp.some((isl) => has(isl, p))) ?? null

/** A bridge or subway's way down by the entrance where this platform's own record lacks it: the
 *  one every other platform's way to that entrance agrees on (Reading 14 and 15: platform 7 for
 *  the town centre, platform 15 for the north entrance). */
function downFor(e: StationExits, i: number, via: string, own: string | null): string | null {
  if (own) return own
  const ds = new Set(Object.values(e.p).flatMap((ws) => ws.filter((w) => w[0] === i && w[1] === via && w[2]).map((w) => w[2]!)))
  return ds.size === 1 ? [...ds][0] : null
}

/** The words for one platform at A: null where nothing is known. */
export function toPlatform(e: StationExits, platform: string, links?: Links, fix?: Fix, fill = false): string[] | null {
  if (e.k === 'concourse') return [`Every platform is off the concourse, where the entrances are.`]
  if (fix?.say?.[platform]) return [fix.say[platform]]
  const eo = new Set(e.eo ?? [])
  const ways = waysFor(e, platform).filter((w) => !eo.has(w[0]))
  if (!ways.length) return null
  const bridge = e.w ?? 'footbridge'
  const lines: string[] = []
  // On the level first: "Platform 4 is by the Forbury Road and Apex Plaza entrances."
  let level = ways.filter((w) => w[1] === 'l').map((w) => w[0])
  const only = fix?.level && Object.entries(fix.level).find(([ps]) => ps.split(',').includes(base(platform)))?.[1]
  if (only) level = level.filter((i) => only.includes(e.x[i][0] ?? ''))
  // An unnamed entrance opening off this very platform is "its own entrance" (Twyford's 4).
  const own = e.x.length > 1 ? level.filter((i) => !e.x[i][0] && !fix?.names?.[String(i)] && !e.x[i][2] && e.x[i][1].includes(platform)) : []
  const by = level.filter((i) => !own.includes(i))
  const lc = e.lc ? ', by the level crossing' : ''
  // The rest, a line for each way, entrances with the same way joined. An entrance reached by a
  // bridge or subway elsewhere at the station but with no way stored from this platform is added
  // (Reading's north entrance to platforms 4 to 7), where the bridge's other end comes down on
  // the level with this platform.
  const onLevel = new Set(ways.filter((w) => w[1] === 'l').map((w) => w[0]))
  const all: Way[] = ways.filter((w) => w[1] !== 'l')
  e.x.forEach((_, i) => {
    if (eo.has(i) || onLevel.has(i) || all.some((w) => w[0] === i)) return
    const via = ['b', 's'].find((v) => Object.values(e.p).some((ws) => ws.some((w) => w[0] === i && w[1] === v)))
    if (via) all.push([i, via, null])
  })
  // A line for each entrance; an entrance reached two ways gets both in one sentence ("…, or go up to the
  // footbridge…": Carlisle's Station Approach); entrances with the same ways are joined.
  const hows = new Map<number, string[]>()
  const fillFrom = new Map<number, string>()
  for (const w of all) {
    const s = how(w, platform, bridge, e, links, fix)
    if (s && !(hows.get(w[0]) ?? []).includes(s)) hows.set(w[0], [...(hows.get(w[0]) ?? []), s])
  }
  // Entrances on the level with another platform, with no way stored from this one (Acklington's car park,
  // by platform 2, for platform 1): the way between the two platforms, from the platform links
  // (Connections' table). Drafts, for John (November 24th 2026); off until he agrees.
  // Not where John has corrected the station: those answers stay as he agreed them (Reading's list).
  if (fill && links && !fix) {
    e.x.forEach((x, i) => {
      if (eo.has(i) || hows.has(i) || level.includes(i) || !x[1].length || x[1].includes(platform)) return
      // Not a second St George's Square when one is already named here (Huddersfield).
      if (x[0] && [...level, ...hows.keys()].some((j) => e.x[j][0] === x[0])) return
      const q = x[1][0]
      const h = howToGet({ ...links, x: (links as Links & { x: string }).x } as never, q, platform)
      const s = fillWords(h, platform, bridge)
      if (s) hows.set(i, [`${s}`])
      if (s) fillFrom.set(i, q)
    })
  }
  const rest = new Map<string, number[]>()
  for (const [i, hs] of hows) {
    const s = hs.length === 1 ? hs[0] : hs.map((h, k) => (k < hs.length - 1 ? h.replace(/\.$/, '') : h)).join(', or ')
    rest.set(s, [...(rest.get(s) ?? []), i])
  }
  // The entrances this answer names: a name shared with another of them gets its platform.
  const shown = new Set([...by, ...hows.keys()])
  // An entrance isn't named after the platform being asked about: "From the entrance nearest
  // platform 2, the way in leads to platform 2" said it twice, and beside "Platform 2 is right by the
  // Disraeli Road entrance" it read as if that one were further away (John, Putney, November 25th
  // 2026). Its way in crosses the line (a footbridge or subway) in all but one case, so it's "the
  // entrance across the line"; otherwise "the other entrance" beside one more, "another entrance"
  // beside two or more, or "the entrance" alone. Drafts.
  const self = new RegExp(`^the entrance (by|nearest) platform ${platform.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  const named = (i: number) => {
    const n = withPlatform(entranceName(e, i, fix, shown), fillFrom.get(i))
    if (!self.test(n)) return n
    if (all.some((w) => w[0] === i && (w[1] === 'b' || w[1] === 's'))) return 'the entrance across the line'
    return shown.size === 1 ? 'the entrance' : shown.size === 2 ? 'the other entrance' : 'another entrance'
  }
  for (const [s, is] of rest) {
    lines.push(`From ${fromNames([...new Set(is.map(named))])}, ${s}${is.length === 1 ? openLine(e, is[0]) : ''}`)
  }
  if (level.length) {
    // An entrance by another platform more than 60 metres' walk away isn't "right by" this one: "a short walk
    // along", or over 120 metres "a walk along" (John, November 27th 2026; as in Exits).
    const farM = e.far?.[e.p[platform] ? platform : platform.replace(/[A-Z]$/, '')]
    const farI = farM ? (e.p[platform] ?? e.p[platform.replace(/[A-Z]$/, '')])?.[0]?.[0] : undefined
    const near = farI !== undefined && by.includes(farI) ? by.filter((i) => i !== farI) : by
    let farLine = ''
    if (farI !== undefined && near !== by) {
      let n = entranceName(e, farI, fix, shown)
      const at = /\bplatform\b/.test(n) ? '' : ` by platform ${e.x[farI][1][0]}`
      // Another entrance already called the same (Darlington's two unnamed entrances by platform 4): this
      // one is the one on the level. Draft.
      if (lines.some((l) => l.startsWith(`From ${n}${at},`))) n = n.replace(/^the entrance\b/, 'the entrance on the level')
      farLine = `From ${n}${at}, it’s ${farM! > 120 ? 'a walk' : 'a short walk'} along to platform ${platform}, on the same level.${openLine(e, farI)}`
    }
    const joined = joinNames([...new Set(near.map((i) => entranceName(e, i, fix, shown).replace(` by platform ${platform}`, '')))], 'and')
    const opens = near.length === 1 ? openLine(e, near[0]) : ''
    const first = farLine && !near.length && !own.length ? null
      : !near.length || joined === 'the entrance' ? `Platform ${platform} has its own entrance${lc}.`
      : own.length ? `Platform ${platform} has its own entrance, and is right by ${joined}${lc}.${opens}`
      : `Platform ${platform} is right by ${joined}${lc}.${opens}`
    if (farLine) lines.unshift(farLine)
    if (first) lines.unshift(first)
  }
  return lines
}

const withPlatform = (name: string, q?: string) => (q && !/platform/.test(name) ? `${name} by platform ${q}` : name)

/** The words for the walk between two platforms (platformLinks' phrases), from an entrance by one of them. */
function fillWords(h: string, p: string, bridge: string): string | null {
  if (!h) return null
  if (h === 'just across the platform') return `platform ${p} is just across the platform.`
  if (h === 'on the same level') return `walk along to platform ${p}, on the same level.`
  if (h.startsWith('which means going out')) return `there's no way through the station: go out and round by the road to platform ${p}.`
  if (h === 'across the level crossing') return `cross the line at the level crossing to platform ${p}.`
  return `go ${h.replace('footbridge', bridge)} to platform ${p}.`
}

/** The way in, from an entrance to platform P (the stored way out, reversed); null for an added
 *  way that can't be worked out. */
function how(w: Way, platform: string, bridge: string, e: StationExits, links?: Links, fix?: Fix): string | null {
  const [i, via, stored] = w
  const added = !(e.p[platform] ?? e.p[base(platform)] ?? []).some((x) => x[0] === i)
  if (via === 'b' || via === 's') {
    // "down": the platform the bridge or subway comes down by on the way out, so the first one
    // reached on the way in; left out where the entrance's own name already says it.
    const near = downFor(e, i, via, stored)
    const at = near && !entranceName(e, i, fix).endsWith(`platform ${near}`) ? ` by platform ${near}` : ''
    const thing = via === 'b' ? bridge : 'subway'
    const start = via === 'b' ? `go up to the ${bridge}${at}` : `go down to the subway${at}`
    // The bridge's other ends: where it comes down for the other entrances. If one of them is on
    // the level with this platform but isn't it, walk from there (John, Reading's platform 4).
    const far = [...new Set(Object.values(e.p).flatMap((ws) => ws.filter((x) => x[0] !== i && x[1] === via && x[2]).map((x) => x[2]!)))]
      .filter((d) => d !== near)
    // Only at stations whose maps were read by eye (John, November 24th 2026: none of the six
    // map-data stations it reached could be checked).
    const grp = e.m ? levelGroup(links, platform) : null
    const land = grp ? far.find((d) => grp.some((isl) => isl.includes(d))) : undefined
    // On the same island as where it comes down, the bridge reaches the platform itself.
    const sameIsland = !!land && !!grp?.some((isl) => isl.includes(land) && has(isl, platform))
    if (land && !sameIsland) {
      const down = via === 'b' ? `cross the ${thing} and go down by platform ${land}` : `go through it and come up by platform ${land}`
      return `${start}, ${down}, then walk to platform ${platform}.`
    }
    // The bridge's far end comes down on this very platform (John, Reading's 7: "go down to platform 7").
    if (land && land === base(platform)) return via === 'b' ? `${start}, cross the ${thing} and go down to platform ${platform}.` : `${start}, go through it and come up on platform ${platform}.`
    if (added && !(land && sameIsland)) return null
    // The bridge comes down by this very platform on the way out (Reading's 15 for the north entrance).
    if (near === base(platform)) return via === 'b' ? `go up to the ${bridge} and come down on platform ${platform}.` : `go down to the subway and come up on platform ${platform}.`
    return via === 'b' ? `${start} and cross to platform ${platform}.` : `${start} and come up on platform ${platform}.`
  }
  if (added) return null
  if (via === 'c') return `cross the concourse to platform ${platform}.`
  if (via === 'x') return `cross the line at the level crossing to platform ${platform}.`
  // Up or down: the way out went up, so the way in goes down, and the other way round.
  const given = fix?.dir && Object.entries(fix.dir).find(([ps]) => ps.split(',').includes(base(platform)))?.[1]
  const dir = given ? given : stored === 'up' ? 'down' : stored === 'down' ? 'up' : e.k === 'below' ? 'up' : e.k === 'above' ? 'down' : null
  return dir ? `go ${dir} to platform ${platform}.` : `the way in leads to platform ${platform}.`
}
