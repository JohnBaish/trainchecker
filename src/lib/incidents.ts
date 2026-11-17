// "The days ahead" (stage 4; SPEC §8.9): National Rail's incidents (the Knowledgebase Incidents
// feed) that affect a journey, from now to the end of the coming Sunday. Used by the function
// (api/days.ts) and the checks; no React, no fetching.
//
// The feed names places in words only (no station codes), so matching is done on the stations'
// names. John's rule (O2): only what affects the starting and ending stations, not stations
// between: an incident counts when it names both stations, or names one of them as "to / from
// (/ via)"; one amended train counts only in its own direction. Tested on the feed in stage 4
// (design/incidents-trial-2026-11-17.md).

import STATIONS from '../data/stations.json' with { type: 'json' }

/** One incident, as read from the feed. */
export type Incident = {
  id: string
  planned: boolean
  cleared: boolean
  summary: string
  description: string // National Rail's HTML
  routes: string // "Routes affected", as text
  link: string
  start: Date | null
  end: Date | null
}

const unescape = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const text = (h: string) => unescape(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/** Every incident in the feed's XML. */
export function readIncidents(xml: string): Incident[] {
  return [...xml.matchAll(/<PtIncident>([\s\S]*?)<\/PtIncident>/g)].map(([, i]) => {
    const g = (re: RegExp) => (i.match(re) || [])[1] || ''
    const cdata = (tag: string) => g(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`))
    const start = g(/<com:StartTime>(.*?)<\/com:StartTime>/), end = g(/<com:EndTime>(.*?)<\/com:EndTime>/)
    return {
      id: g(/<IncidentNumber>(.*?)<\/IncidentNumber>/),
      planned: g(/<Planned>(.*?)<\/Planned>/) === 'true',
      cleared: g(/<ClearedIncident>(.*?)<\/ClearedIncident>/) === 'true',
      summary: text(cdata('Summary')),
      description: cdata('Description'),
      routes: text(cdata('RoutesAffected')),
      link: unescape(g(/<Uri>(.*?)<\/Uri>/)),
      start: start ? new Date(start) : null,
      end: end ? new Date(end) : null,
    }
  })
}

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
export function matches(inc: Incident, from: string, to: string): Why | null {
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

/** The end of the coming Sunday, UK time (on a Sunday, that Sunday): 23:59:59 on the UK date,
 *  whether the clocks are on GMT or British Summer Time. */
export function endOfSunday(now: Date): Date {
  const wd = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short' }).format(now)
  const add = ({ Mon: 6, Tue: 5, Wed: 4, Thu: 3, Fri: 2, Sat: 1, Sun: 0 } as Record<string, number>)[wd]
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date(now.getTime() + add * 864e5))
  // 23:59:59 UTC on that date, then back by the UK's offset from UTC at that moment (0 or 1 hour).
  const utc = new Date(`${ymd}T23:59:59Z`)
  const ukHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hourCycle: 'h23' }).format(utc))
  return new Date(utc.getTime() - ((ukHour + 24 - 23) % 24) * 3600e3)
}

/** Whether an incident is live between now and the end of the coming Sunday. Unplanned ones
 *  count until National Rail marks them cleared; planned work cancelled by National Rail
 *  ("CANCELLED: Engineering work …") doesn't count. */
export function current(inc: Incident, now: Date, until: Date): boolean {
  if (inc.cleared || /^CLEARED\b/i.test(inc.summary) || /^CANCELLED\b/i.test(inc.summary)) return false
  if (!inc.planned) return !inc.end || inc.end >= now
  return !!inc.start && inc.start <= until && (!inc.end || inc.end >= now)
}

/** An incident that doesn't count by the rule but may still affect the journey (John, November
 *  17th 2026: say so in a friendly way): it names A or B, though not as the rule needs. One amended
 *  train only when it leaves from A or ends at B, so it may call at the other station. */
export function mayAffect(inc: Incident, from: string, to: string): boolean {
  if (matches(inc, from, to)) return false
  const one = inc.summary.match(/^Amended \d\d:\d\d (.+?) to (.+?)( service| on | from |$)/)
  if (one) return stationsIn(one[1]).some((x) => x.code === from) || stationsIn(one[2]).some((x) => x.code === to)
  return stationsIn(inc.summary).some((x) => x.code === from || x.code === to)
}
