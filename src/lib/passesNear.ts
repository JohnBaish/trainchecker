// "Fact of the journey" (John, November 22nd 2026; design/passes-near/README.md): one interesting
// thing near a stretch of the journey, with the train's side, picked at random on each visit.
// The data is src/data/passes-near.json (design/passes-near/to_site.py), loaded only when needed.
import { nameOf } from './stations.ts'

export type PnItem = { a: string; b: string; kind: 'near' | 'crosses' | 'boundary' | 'station'; side?: 'left' | 'right'; text: string; textReverse?: string }
export type PnData = { stretches: [string, string, number][]; items: Record<string, PnItem> }
/** A stretch as the train runs it: from `from` to `to`. */
export type Leg = { id: string; from: string; to: string }

export const stretchId = (a: string, b: string) => [a, b].sort().join('-')

/** Each station's neighbours along the track, with the stretch's length in metres. */
function graph(d: PnData): Map<string, [string, number][]> {
  const g = new Map<string, [string, number][]>()
  for (const [a, b, m] of d.stretches) {
    if (!g.has(a)) g.set(a, [])
    if (!g.has(b)) g.set(b, [])
    g.get(a)!.push([b, m])
    g.get(b)!.push([a, m])
  }
  return g
}
const cache = new WeakMap<PnData, Map<string, [string, number][]>>()

/** The shortest way between two stations through the network, by length, as legs; [] when there
 *  isn't one (a station outside the network, in Wales or Scotland, say). */
export function shortestLegs(d: PnData, from: string, to: string): Leg[] {
  if (!cache.has(d)) cache.set(d, graph(d))
  const g = cache.get(d)!
  if (!g.has(from) || !g.has(to) || from === to) return []
  const dist = new Map<string, number>([[from, 0]])
  const prev = new Map<string, string>()
  const done = new Set<string>()
  // A plain Dijkstra: the network is small (a few thousand stretches), and a journey asks once.
  for (;;) {
    let at: string | null = null, best = Infinity
    for (const [s, v] of dist) if (!done.has(s) && v < best) { best = v; at = s }
    if (at === null || at === to) break
    done.add(at)
    for (const [n, m] of g.get(at)!) {
      if (best + m < (dist.get(n) ?? Infinity)) { dist.set(n, best + m); prev.set(n, at) }
    }
  }
  if (!dist.has(to)) return []
  const legs: Leg[] = []
  for (let s = to; s !== from; s = prev.get(s)!) {
    const p = prev.get(s)!
    legs.unshift({ id: stretchId(p, s), from: p, to: s })
  }
  return legs
}

/** Every stretch the journey's train runs along: for each pair of calling points in a row (A, the
 *  stops of the train with the most stops, then B), the shortest way between them. A pair with no
 *  way through the network is skipped rather than guessed. */
export function journeyLegs(d: PnData, from: string, stops: string[], to: string): Leg[] {
  const calls = [from, ...stops, to]
  const legs: Leg[] = []
  for (let i = 0; i + 1 < calls.length; i++) legs.push(...shortestLegs(d, calls[i], calls[i + 1]))
  return legs
}

/** The item's sentence for the way the train is going: its own text from a to b, the side swapped
 *  (or textReverse, for a boundary) from b to a. */
export function sentenceFor(item: PnItem, leg: Leg): string {
  const forwards = leg.from === item.a
  const side = item.side ? (forwards ? item.side : item.side === 'left' ? 'right' : 'left') : null
  const text = !forwards && item.textReverse ? item.textReverse : side ? item.text.replace('{side}', side) : item.text
  return curly(text)
}

/** Curly apostrophes and quotation marks, as the page's other text has (the data has straight ones). */
export const curly = (s: string) => s.replace(/(\w)'/g, '$1’').replace(/'(\w)/g, '‘$1').replace(/'/g, '’').replace(/"(\S)/g, '“$1').replace(/"/g, '”')

/** A station's name for the middle of a sentence: the list's bracketed note dropped ("Bramley
 *  (Hampshire)", "Woolwich (Elizabeth line)"), as the stretch's neighbour already places it. */
export const placeName = (code: string) => nameOf(code).replace(/\s*\([^)]*\)/g, '').replace(/^(Earlswood|Gillingham|Seaford) (Surrey|Kent|Sussex)$/, '$1').trim()

/** "Between Southall and Hayes & Harlington, your train passes…" (John, November 23rd 2026), the
 *  stations in the order the train meets them. Only for a fact that starts "Your train" (the
 *  others already say where they are: "Mortimer station, at one end of this stretch…", "While
 *  your train is in Box Tunnel…", the boundaries' own "Between…"), and not when the stretch is the
 *  whole journey, where it would only repeat the journey. */
export function withPlace(text: string, leg: Leg, journey: { from: string; to: string }): string {
  if (!/^Your train\b/.test(text)) return text
  if (leg.from === journey.from && leg.to === journey.to) return text
  // A fact about one of the two stations' own places ("Your train passes Newington, on the train's
  // left…") already says where it is: "Between Newington and Rainham" would only repeat it.
  const a = placeName(leg.from), b = placeName(leg.to)
  const what = text.split(/[,.]/)[0].replace(/^Your train (passes|runs|crosses)( near| past| along| through| over| under)? (the site of )?/, '')
  if (what === a || what === b) return text
  return `Between ${a} and ${b}, y${text.slice(1)}`
}

/** The journey's facts, one per stretch that has an item, in the order the train meets them. */
export function journeyFacts(d: PnData, from: string, stops: string[], to: string): { id: string; text: string }[] {
  const seen = new Set<string>()
  const out: { id: string; text: string }[] = []
  for (const leg of journeyLegs(d, from, stops, to)) {
    const item = d.items[leg.id]
    if (!item || seen.has(leg.id)) continue
    seen.add(leg.id)
    out.push({ id: leg.id, text: withPlace(sentenceFor(item, leg), leg, { from, to }) })
  }
  return out
}

/** One of them, at random (John: a fresh one on each visit). `r` is for the checks. */
export function pickFact<T>(facts: T[], r = Math.random()): T | null {
  return facts.length ? facts[Math.min(facts.length - 1, Math.floor(r * facts.length))] : null
}
