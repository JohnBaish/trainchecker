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
 *  (November 18th 2026) it could touch this journey's trains: it names no other station, or one
 *  the trains call at between A and B (`route`, from the live board), or its advice has a sentence
 *  about trains between A and B that doesn't say they carry on as normal. So "Reading to
 *  Basingstoke" drops out for Reading to London Paddington, and Southampton to Bournemouth for
 *  Basingstoke to Southampton Central: its advice says "Trains will continue to run between
 *  Reading and Southampton Central", and a sentence like that, naming A or B, means it's left out. One amended train counts when it leaves from A or ends at B and its
 *  advice names the other end ("…will terminate at Reading"). */
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
  const all = adviceLines(words(inc)).flatMap(sentences)
  // National Rail saying the journey's trains carry on ("Trains will continue to run between Reading
  // and Southampton Central"): not shown.
  const fine = (l: string) => FINE.test(l) && !/reduced|fewer|amended|revised|delay|later|earlier|bus/i.test(l)
  if (all.some((l) => fine(l) && stationsIn(l).some((x) => x.code === from || x.code === to))) return false
  if (!route || !others.length || others.some((c) => route.includes(c))) return true
  return all.some((l) => {
    // "…via Bath Spa (not calling)" passes through without stopping.
    if (ALTERNATIVE.test(l) || FINE.test(l) || /not calling/i.test(l)) return false
    const c = stationsIn(l).map((x) => x.code), i = c.indexOf(from), j = c.indexOf(to)
    return i >= 0 && j >= 0 && (j > i || /\bbetween\b/i.test(l))
  })
}

const FINE = /continue to run|as normal|as usual|not (be )?affected|unaffected|(are|is|remain) available|still run/i

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
    const join = (bits: string[]) => (bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}` : bits[0])
    if (last && /\bwill:$/i.test(last) && items.length) {
      const bits = items.map((x) => { const f = (sentences(x)[0] ?? x).replace(/[.!?]+$/, ''); return f[0].toLowerCase() + f.slice(1) })
      out[out.length - 1] = `${last.slice(0, -1)} ${join(bits)}.`
    } else if (last && /:$/.test(last) && items.length && items.length <= 3 && items.every((x) => x.length <= 80 && !/[.!?]\s+\S/.test(x))) {
      // A short list after a colon joined on (fresh look 5.3): "The following trains will not call
      // at Burnham or Taplow: the 00:01 London Paddington to Reading, the 00:19 …".
      const bits = items.map((x) => { const f = x.replace(/[.!?]+$/, '').replace(/ (service|services|train)$/i, ''); return /^The\b/.test(f) ? 'the' + f.slice(3) : f })
      out[out.length - 1] = `${last} ${join(bits)}.`
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
export function gist({ advice, summary }: Pick<Item, 'advice' | 'summary'>, from: string, to: string, now = new Date()): string[] {
  // A sentence ending in a colon before a longer list (kept in the fold) ends at the colon ("…will
  // run to a temporary timetable, as follows:" → "…timetable."), or, when it only introduces the
  // list ("The following trains …:"), isn't used (fresh look 5.3).
  const all = adviceLines(advice).flatMap(sentences)
    .filter((l) => !(/:$/.test(l) && /\bfollowing\b/i.test(l)))
    .map((l) => l.replace(/,? as follows:$|:$/, '.'))
    .map((l) => sincePast(l, now))
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
  return out.map((x) => slashes(houseStyle(/[.!?]$/.test(x) ? x : x + '.')))
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** Whether "10 August" (no year) is before today: in the year that puts it nearest to now. */
function passed(day: number, month: string, now: Date): boolean {
  const ymd = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(d)
  const y = Number(ymd(now).slice(0, 4)), m = MONTHS.indexOf(month)
  const cands = [y - 1, y, y + 1].map((yy) => new Date(Date.UTC(yy, m, day, 12)))
  const near = cands.sort((a, b) => Math.abs(a.getTime() - now.getTime()) - Math.abs(b.getTime() - now.getTime()))[0]
  return ymd(near) < ymd(now)
}

/** A start date that has passed isn't worth saying (fresh look, John, November 18th 2026): "From
 *  Monday 10 August, train services … will run to a temporary timetable" → "Train services … are
 *  running to a temporary timetable"; "From Monday 9 to Tuesday 17 November, buses will replace
 *  trains" → "Until Tuesday 17 November, buses are replacing trains". Only that sentence, and only
 *  "will run", "will operate" and "will replace" change tense. */
export function sincePast(l: string, now: Date): string {
  const D = `${DAY} (\\d{1,2})(?: (${MONTH}))?(?: \\d{4})?`
  const range = l.match(new RegExp(`^From ${D} (?:to|until) (${DAY} \\d{1,2} (${MONTH})(?: \\d{4})?),?\\s+`))
  const one = l.match(new RegExp(`^From ${D},?\\s+`))
  const tense = (t: string) => t.replace(/\bwill run\b/, 'are running').replace(/\bwill operate\b/, 'are operating').replace(/\bwill replace\b/, 'are replacing')
  if (range && passed(Number(range[1]), range[2] ?? range[4], now)) return `Until ${range[3]}, ${tense(l.slice(range[0].length))}`
  if (one && !range && one[2] && passed(Number(one[1]), one[2], now)) { const r = tense(l.slice(one[0].length)); return r[0].toUpperCase() + r.slice(1) }
  return l
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

/** How many entries a list shows: two or more single services very early or late make one. */
export function entries(items: Pick<Item, 'summary'>[]): number {
  const singles = items.filter(earlyOrLate).length
  return items.length - (singles >= 2 ? singles - 1 : 0)
}

/** The house number rule (one to nine in words) in National Rail's sentences, where a number
 *  counts something: "closing 2 out of 4 lines" → "closing two out of four lines" (John, November
 *  18th 2026). Times, dates, platforms and bus routes keep their digits. */
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
export function wordNumbers(t: string): string {
  return t.replace(/\b([1-9])(?= out of \d)/g, (_, d) => NUM[+d])
    .replace(/(\bout of )([1-9])\b/g, (_, a, d) => a + NUM[+d])
    .replace(/\b([1-9]) (lines?|tracks?|trains?|services?|minutes?|hours?|stations?|coaches|carriages|platforms?|stops?|days?|nights?|weeks?)\b/g, (_, d, w) => `${NUM[+d]} ${w}`)
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

// ---- National Rail's summaries in the house style (John, November 18th 2026) ----

const DAY = '(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day'
const MONTH = '(?:January|February|March|April|May|June|July|August|September|October|November|December)'
const DATE = `${DAY} \\d{1,2}(?: ${MONTH})?(?: \\d{4})?`
const ordinal = (d: number) => d + (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th')
const clock12 = (h: number, m: number) => (m === 0 && h === 12 ? 'midday' : m === 0 && h === 0 ? 'midnight' : `${h % 12 || 12}${m ? '.' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`)

/** A summary as the page shows it (matching always uses National Rail's own words):
 *  1. the date at the end dropped, as the line above says when ("…on Sunday 22 November",
 *     "…from Monday 16 to Thursday 19 November"), but "until further notice" kept;
 *  2. other dates in house style ("Wednesday November 18th"), times too ("5.31am");
 *  3. National Rail's slashes as words: "to / from / via" → "to, from and through", "to / from" →
 *     "to and from", other lists "A, B or C";
 *  4. numbers one to nine in words where they count something. */
export function plainSummary(summary: string): string {
  let s = summary.trim()
  s = s.replace(new RegExp(`\\s+from ${DATE}(?: ${MONTH})?(?: \\d{4})? until further notice$`), ' until further notice')
  // Not after a time ("…to 04:40 on Monday 23 November"), where the date belongs to the time.
  const cut = s.replace(new RegExp(`\\s+(?:on|from|between) ${DATE}(?:,? (?:and|to|until) ${DATE})*$`), '')
  if (!/\d\d:\d\d$/.test(cut)) s = cut
  return slashes(houseStyle(s))
}

/** National Rail's slashes as words, in the summaries and their two sentences (fresh look 5.2):
 *  "to / from / via" → "to, from and through", "to / from" → "to and from", other lists "A, B or C". */
export function slashes(s: string): string {
  s = s.replace(/\bto \/ from \/ via\b/g, 'to, from and through').replace(/\bto \/ from\b/g, 'to and from')
  // Other "A / B / C" lists, a word or name either side.
  return s.replace(/((?:[^\s/][^/]*?)(?: \/ [^/]+?)+)(?=$| (?:on|from|via|between|and|until|expected|before|after|service|services|trains?)\b|[,:.])/g, (m) => {
    const parts = m.split(' / ')
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}` : m
  })
}

/** Dates, times and numbers in National Rail's words in the house style: "Wednesday 18 November"
 *  → "Wednesday November 18th", "06:39" → "6.39am", "2 out of 4" → "two out of four". */
export function houseStyle(t: string): string {
  return wordNumbers(t
    // A range with the month once: "Monday 9 to Tuesday 17 November" → "Monday November 9th to
    // Tuesday November 17th" (fresh look 5.2).
    .replace(new RegExp(`\\b(${DAY}) (\\d{1,2}) (to|and|until) (${DAY}) (\\d{1,2}) (${MONTH})`, 'g'), (_, d1, n1, w, d2, n2, m) => `${d1} ${n1} ${m} ${w} ${d2} ${n2} ${m}`)
    .replace(new RegExp(`\\b(${DAY}) (\\d{1,2}) (${MONTH})(?: (\\d{4}))?`, 'g'), (_, d, n, m, y) => `${d} ${m} ${ordinal(+n)}${y ? ' ' + y : ''}`)
    .replace(/\b([01]\d|2[0-3]):([0-5]\d)\b/g, (_, h, m) => clock12(+h, +m)))
}
