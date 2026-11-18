// "The days ahead" (stage 4; SPEC §8.9): which of National Rail's live incidents (api/days.ts
// reads the feed) affect a journey. Run in the page, which holds the station list; no React, no
// fetching.
//
// The feed names places in words only (no station codes), so matching is done on the stations'
// names. John's rule (O2): only what affects the starting and ending stations, not stations
// between: an incident counts when it names both stations, or names one of them as "to / from
// (/ via)"; one amended train counts only in its own direction. Tested on the feed in stage 4
// (design/incidents-trial-2026-11-17.md).

import STATIONS from '../data/stations.json' with { type: 'json' }

import type { Days, Incident, Item } from '../../api/days.ts'
export { readIncidents, current, endOfSunday, cleanAdvice, liveItems, type Incident, type Item, type Days } from '../../api/days.ts'

// ---- Station names in National Rail's words ----

/** Lower case, with brackets, "&" and punctuation made into spaces, so "Gillingham (Kent)" in the
 *  feed meets "Gillingham Kent" in the station list. */
export const norm = (s: string) => ` ${s.toLowerCase().replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[()[\],.:;]/g, ' ').replace(/\s+/g, ' ').trim()} `

const strip = (n: string) => n.replace(/\s*\([^)]*\)\s*$/, '').trim()

/** The station list's names, each with the names the feed may use for it: the list's own name
 *  ("Heathrow Terminal 5 (Rail Station Only)"), and without its bracket ("Heathrow Terminal 5", "Sutton",
 *  "Swindon"), when no other station has that shorter name (so "Newport" is never taken for
 *  either Newport). */
function nameTable(extra: [string, string][] = []): [string, string][] {
  const out: [string, string][] = []
  const all = [...(STATIONS as [string, string][]), ...extra]
  const own = new Set(all.map(([, n]) => norm(n)))
  const short = new Map<string, Set<string>>()
  for (const [code, n] of all) {
    out.push([norm(n), code])
    const s = strip(n)
    if (s !== n) { const k = norm(s); if (!short.has(k)) short.set(k, new Set()); short.get(k)!.add(code) }
  }
  for (const [k, codes] of short) if (codes.size === 1 && !own.has(k)) out.push([k, [...codes][0]])
  // Longest first, so "reading west" is found before "reading".
  return out.sort((a, b) => b[0].length - a[0].length)
}
let TABLE = nameTable()
/** Adds names the live board uses that the station list doesn't (the page's headings). */
export function addNames(names: [code: string, name: string][]) { TABLE = nameTable(names) }

/** The stations a piece of text names, in order, each with the words just before it. A longer
 *  name wins, so "Reading West" is never taken for Reading. */
export function stationsIn(t: string): { code: string; at: number; before: string }[] {
  const s = norm(t)
  const taken: boolean[] = new Array(s.length).fill(false)
  const found: { code: string; at: number; end: number }[] = []
  for (const [k, code] of TABLE) {
    let from = 0
    for (;;) {
      const at = s.indexOf(k, from)
      if (at < 0) break
      from = at + 1
      // k starts and ends with a space, so this is a whole-word match; skip what a longer name took.
      if (taken[at + 1] || taken[at + k.length - 2]) continue
      for (let i = at + 1; i < at + k.length - 1; i++) taken[i] = true
      found.push({ code, at, end: at + k.length - 1 })
    }
  }
  found.sort((a, b) => a.at - b.at)
  return found.map((f, i) => {
    // The words before it, back to the previous station that isn't part of a "A / B" list.
    let j = i
    while (j > 0 && /^\s*\/\s*$/.test(s.slice(found[j - 1].end, found[j].at))) j--
    const before = s.slice(j > 0 ? found[j - 1].end : 0, found[j].at + 1)
    return { code: f.code, at: f.at, before }
  })
}

// ---- Which incidents count for a journey ----

export type Why = 'both' | 'to-from' | 'at' | 'via' | 'train'
const TO_FROM = /\bto \/ from( \/ via)? $|\bto and from $/
const AT = /\b(at|through|in) (the )?$/
const VIA = /\bvia $/

/** Why an incident counts for the journey from A to B (station codes), or null. */
export function matches(inc: Pick<Incident | Item, 'summary'>, from: string, to: string): Why | null {
  const s = stationsIn(inc.summary)
  const has = (c: string) => s.some((x) => x.code === c)
  // One train ("Amended 00:49 London Paddington to Reading service"): only in its own direction,
  // and only when it runs between the two stations.
  const one = inc.summary.match(/^Amended \d\d:\d\d (.+?) to (.+?)( service| on | from |$)/)
  if (one) {
    const a = stationsIn(one[1]).map((x) => x.code), b = stationsIn(one[2]).map((x) => x.code)
    return a.includes(from) && b.includes(to) ? 'train' : null
  }
  if (has(from) && has(to)) return 'both'
  for (const x of s) {
    if (x.code !== from && x.code !== to) continue
    if (TO_FROM.test(x.before)) return 'to-from'
    if (AT.test(x.before)) return 'at'
    if (VIA.test(x.before)) return 'via'
  }
  return null
}

/** One amended train ("Amended 05:31 Bedwyn to London Paddington service …"): its time, and the
 *  stations it runs from and to. */
export function singleTrain(summary: string): { time: string; from: string[]; to: string[] } | null {
  const m = summary.match(/^Amended (\d\d:\d\d) (.+?) to (.+?)( service| on | from |$)/)
  return m ? { time: m[1], from: stationsIn(m[2]).map((x) => x.code), to: stationsIn(m[3]).map((x) => x.code) } : null
}

const words = (i: Pick<Item, 'summary'> & Partial<Pick<Item, 'advice'>> & Partial<Pick<Incident, 'description'>>) => i.advice ?? i.description ?? ''

/** An incident that doesn't count by the rule but may still affect the journey (John, November
 *  17th 2026: say so in a friendly way): it names A or B, though not as the rule needs, and
 *  (November 18th 2026) it could touch this journey's trains. With the route (the stations the
 *  trains from A call at, from the live board), work naming other stations counts only if one of
 *  them is on it, so "Reading to Basingstoke" drops out for Reading to London Paddington. One
 *  amended train counts when it leaves from A or ends at B and its advice names the other end
 *  ("…will terminate at Reading"), as it may then run between them. */
export function mayAffect(inc: Pick<Item, 'summary'> & Partial<Pick<Item, 'advice'>> & Partial<Pick<Incident, 'description'>>, from: string, to: string, route?: string[]): boolean {
  if (matches(inc, from, to)) return false
  const one = singleTrain(inc.summary)
  if (one) {
    const other = one.from.includes(from) ? to : one.to.includes(to) ? from : null
    return !!other && stationsIn(text(words(inc))).some((x) => x.code === other)
  }
  const named = stationsIn(inc.summary).map((x) => x.code)
  if (!named.includes(from) && !named.includes(to)) return false
  const others = named.filter((c) => c !== from && c !== to)
  return !route || !others.length || others.some((c) => route.includes(c))
}

const text = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')

/** National Rail's advice as lines of plain text (paragraphs and list items). A sentence ending
 *  "will:" before a list is joined to it ("…service will not call at Taplow or Burnham and
 *  terminate at Ealing Broadway."), as National Rail often writes that way. */
export function adviceLines(advice: string): string[] {
  const out: string[] = []
  for (const [, p, ul] of advice.matchAll(/<p>([\s\S]*?)<\/p>|<[uo]l>([\s\S]*?)<\/[uo]l>/g)) {
    if (p !== undefined) { const t = text(p).trim(); if (t) out.push(t); continue }
    const items = [...ul.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]).trim()).filter(Boolean)
    const last = out[out.length - 1]
    if (last && /\bwill:$/i.test(last) && items.length) {
      const bits = items.map((x) => { const f = (sentences(x)[0] ?? x).replace(/[.!?]+$/, ''); return f[0].toLowerCase() + f.slice(1) })
      out[out.length - 1] = `${last.slice(0, -1)} ${bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}` : bits[0]}.`
    } else out.push(...items)
  }
  return out
}

/** A line of text as sentences. */
const sentences = (l: string) => l.match(/[^.!?]+(?:[.!?]+(?=\s+[A-Z"“(]|\s*$)|$)/g)?.map((x) => x.trim()).filter(Boolean) ?? []
const ALTERNATIVE = /no extra cost|alternative|you can (use|travel)|tickets? (will be|are|is) (accepted|valid)|metrolink|bee network|london buses|underground/i
const CHANGE = /will not run|will (start|terminate|depart|arrive|run|call|divert|be (diverted|retimed|cancelled|revised|delayed))|will not call|may be (delayed|cancelled|revised)|replace|bus|cancel|delay|divert|retimed|earlier|later/i

/** A short summary above the fold (John, November 18th 2026: option A, National Rail's own
 *  sentences): the advice's first sentence (what and where), then the first sentence that names
 *  this journey's trains (A then B, or "between" them either way round) and says what changes (for one
 *  amended train, the sentence about it),
 *  leaving out ways round it ("you can use … at no extra cost"). At most two sentences. One tidy
 *  (John): "…, and run later than usual throughout" dropped, as it goes without saying. */
export function gist({ advice, summary }: Pick<Item, 'advice' | 'summary'>, from: string, to: string): string[] {
  const all = adviceLines(advice).flatMap(sentences)
  if (!all.length) return []
  const out = [all[0]]
  const mine = all.slice(1).filter((l) => {
    if (ALTERNATIVE.test(l)) return false
    const c = stationsIn(l).map((x) => x.code), i = c.indexOf(from), j = c.indexOf(to)
    return i >= 0 && j >= 0 && (j > i || /\bbetween\b/i.test(l))
  })
  // One amended train: the sentence about that train ("The 05:31 Bedwyn to London Paddington will
  // terminate at Reading.").
  const one = singleTrain(summary)
  let second = (one && all.slice(1).find((l) => l.includes(one.time))) || mine.find((l) => CHANGE.test(l)) || mine[0]
  if (second) {
    second = second.replace(/^As a result,?\s+/i, '').replace(/,? and (will )?run (later|earlier) than usual throughout(?=\.$)/i, '')
    out.push(second[0].toUpperCase() + second.slice(1))
  }
  return out.map((x) => (/[.!?]$/.test(x) ? x : x + '.'))
}

export type DaysJourney = { fromCrs: string; toCrs: string; from: string; to: string; route?: string[] }

/** Single trains very early or late (before 7am, or from 10pm), grouped as one entry when there
 *  are two or more (John, November 18th 2026). */
export const earlyOrLate = (i: Pick<Item, 'summary'>) => {
  const t = singleTrain(i.summary)
  if (!t) return false
  const h = Number(t.time.slice(0, 2))
  return h < 7 || h >= 22
}

/** The journey's items: those that count (disruption first, then planned work by date), and those
 *  that may affect it, with the stations they involve. */
export function forJourney(d: Days, p: DaysJourney) {
  addNames([[p.fromCrs, p.from], [p.toCrs, p.to]])
  const byStart = (a: Item, b: Item) => (a.planned === b.planned ? (a.start ?? '').localeCompare(b.start ?? '') : a.planned ? 1 : -1)
  const counted = d.items.filter((i) => matches(i, p.fromCrs, p.toCrs)).sort(byStart)
  const may = d.items.filter((i) => mayAffect(i, p.fromCrs, p.toCrs, p.route)).sort(byStart)
  const codes = new Set(may.flatMap((i) => stationsIn(i.summary).map((x) => x.code)))
  const involved = [codes.has(p.fromCrs) && p.from, codes.has(p.toCrs) && p.to].filter((x): x is string => !!x)
  return { now: counted.filter((i) => !i.planned), planned: counted.filter((i) => i.planned), may, involved }
}

/** Whether an item counted for the journey closes the line today, for the verdict (SPEC §7 answer
 *  4; John, November 18th 2026): applying now, saying buses replace the trains or there are no
 *  trains, and not only at some hours ("late night", "before 06:30"). 'buses', 'none' or null. */
export function closedNow(items: Item[], now: Date): 'buses' | 'none' | null {
  for (const i of items) {
    if (i.start && new Date(i.start) > now) continue
    if (i.end && new Date(i.end) < now) continue
    const s = i.summary
    if (/late night|early morning|very early|evening|overnight|morning|night|before \d|after \d|from \d\d:\d\d|until \d\d:\d\d/i.test(s)) continue
    if (/\b(buses|coaches|taxis) replace (all )?trains\b/i.test(s)) return 'buses'
    if (/\bno\b[^.]{0,40}\btrains\b/i.test(s)) return 'none'
  }
  return null
}
