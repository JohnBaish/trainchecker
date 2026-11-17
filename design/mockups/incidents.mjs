// Stage 2 mock-ups: National Rail's incidents (Knowledgebase Incidents feed) for a journey,
// from now to the end of the coming Sunday. The matching is Claude's first draft, for the
// mock-ups only; stage 4 tests it properly (the feed describes routes in words only).
// Draft rule: an incident counts when its summary or its "routes affected" names both
// stations, or its summary names one of them as "to / from / via".
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { dayName } from './sentences.mjs'

const unescape = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const text = (h) => unescape(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

// National Rail's description, kept as simple HTML: paragraphs, headings as bold lines,
// lists and links only (links open National Rail's pages).
export function cleanAdvice(h) {
  let s = h.replace(/\r/g, '')
  s = s.replace(/<h\d[^>]*>/g, '<p><b>').replace(/<\/h\d>/g, '</b></p>')
  s = s.replace(/<(\/?)(strong|em|span|div|br|u|i)\b[^>]*>/g, (m, c, t) => (t === 'br' ? ' ' : t === 'div' ? (c ? '</p>' : '<p>') : t === 'strong' ? `<${c}b>` : ''))
  s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>/g, '<a href="$1" target="_blank" rel="noopener">')
  s = s.replace(/<(?!\/?(p|b|ul|ol|li|a)\b)[^>]+>/g, '')
  s = s.replace(/<p>\s*<\/p>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
  s = s.replace(/<p>\s*<b>\s*<\/b>\s*<\/p>/g, '')
  return s.trim()
}

export function readIncidents(file) {
  const raw = readFileSync(file)
  const x = (file.endsWith('.gz') ? gunzipSync(raw) : raw).toString('utf8')
  return [...x.matchAll(/<PtIncident>([\s\S]*?)<\/PtIncident>/g)].map(([, i]) => {
    const g = (re) => (i.match(re) || [])[1] || ''
    return {
      id: g(/<IncidentNumber>(.*?)<\/IncidentNumber>/),
      planned: g(/<Planned>(.*?)<\/Planned>/) === 'true',
      summary: text(g(/<Summary><!\[CDATA\[([\s\S]*?)\]\]>/)),
      description: g(/<Description><!\[CDATA\[([\s\S]*?)\]\]>/),
      routes: text(g(/<RoutesAffected><!\[CDATA\[([\s\S]*?)\]\]>/)),
      link: g(/<Uri>(.*?)<\/Uri>/),
      periods: [...i.matchAll(/<com:StartTime>(.*?)<\/com:StartTime>\s*<com:EndTime>(.*?)<\/com:EndTime>/g)].map((m) => [new Date(m[1]), new Date(m[2])]),
    }
  })
}

// The end of the coming Sunday, UK time (on a Sunday, that Sunday).
export function endOfSunday(now) {
  const d = new Date(now)
  const wd = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short' }).format(d)
  const add = { Mon: 6, Tue: 5, Wed: 4, Thu: 3, Fri: 2, Sat: 1, Sun: 0 }[wd]
  const day = new Date(d.getTime() + add * 864e5)
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(day)
  return new Date(`${ymd}T23:59:59Z`) // November: GMT, so UTC is UK time
}

export function forJourney(all, a) {
  const now = new Date(a.taken)
  const until = endOfSunday(now)
  const names = [a.from, a.to]
  const out = []
  for (const inc of all) {
    const ov = inc.periods.filter(([s, e]) => s <= until && e >= now)
    if (inc.planned && !ov.length) continue
    if (/^CLEARED/i.test(inc.summary)) continue
    const inSummary = names.every((n) => inc.summary.includes(n))
    // One "between X and Y" in the routes, naming both stations.
    const inRoute = inc.routes.split(/\bbetween /).slice(1).some((c) => names.every((n) => c.includes(n)))
    const tfv = names.some((n) => inc.summary.includes(`to / from / via ${n}`))
    if (!inSummary && !inRoute && !tfv) continue
    // One train ("Amended 00:49 London Paddington to Reading service"): only in its direction.
    if (/^Amended \d\d:\d\d /.test(inc.summary) && inSummary && inc.summary.indexOf(a.from) > inc.summary.indexOf(a.to)) continue
    const [s, e] = ov[0] || [now, now]
    const sd = dayName(s), ed = dayName(e)
    const when = !inc.planned ? 'Now' : s <= now ? (ed === dayName(now) ? 'Until the end of today' : `Now until ${ed}`) : sd === ed ? sd : `${sd} to ${ed}`
    out.push({ when, planned: inc.planned, summary: inc.summary, advice: cleanAdvice(inc.description), link: inc.link, start: s.getTime() })
  }
  out.sort((x, y) => (x.planned === y.planned ? x.start - y.start : x.planned ? 1 : -1))
  return { until: dayName(until), items: out }
}
