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

/** An incident that doesn't count by the rule but may still affect the journey (John, November
 *  17th 2026: say so in a friendly way): it names A or B, though not as the rule needs. One amended
 *  train only when it leaves from A or ends at B, so it may call at the other station. */
export function mayAffect(inc: Pick<Incident | Item, 'summary'>, from: string, to: string): boolean {
  if (matches(inc, from, to)) return false
  const one = inc.summary.match(/^Amended \d\d:\d\d (.+?) to (.+?)( service| on | from |$)/)
  if (one) return stationsIn(one[1]).some((x) => x.code === from) || stationsIn(one[2]).some((x) => x.code === to)
  return stationsIn(inc.summary).some((x) => x.code === from || x.code === to)
}

export type DaysJourney = { fromCrs: string; toCrs: string; from: string; to: string }

/** The journey's items: those that count (disruption first, then planned work by date), and those
 *  that may affect it, with the stations they involve. */
export function forJourney(d: Days, p: DaysJourney) {
  addNames([[p.fromCrs, p.from], [p.toCrs, p.to]])
  const byStart = (a: Item, b: Item) => (a.planned === b.planned ? (a.start ?? '').localeCompare(b.start ?? '') : a.planned ? 1 : -1)
  const counted = d.items.filter((i) => matches(i, p.fromCrs, p.toCrs)).sort(byStart)
  const may = d.items.filter((i) => mayAffect(i, p.fromCrs, p.toCrs)).sort(byStart)
  const codes = new Set(may.flatMap((i) => stationsIn(i.summary).map((x) => x.code)))
  const involved = [codes.has(p.fromCrs) && p.from, codes.has(p.toCrs) && p.to].filter((x): x is string => !!x)
  return { now: counted.filter((i) => !i.planned), planned: counted.filter((i) => i.planned), may, involved }
}
