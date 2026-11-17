// Trainchecker's days-ahead function: National Rail's incidents (the Knowledgebase Incidents feed)
// that are live between now and the end of the coming Sunday (SPEC §8.9; stage 4).
//
// GET /api/days
//
// The feed is one file of every incident in Britain (2.8 MB, 0.3 MB compressed). This keeps only
// the ones live in the window, with National Rail's advice cleaned to simple HTML, and sends them
// all (about 30 KB compressed); the page picks the journey's own (src/lib/incidents.ts), as it
// already holds the station list. So the answer is the same for every journey, and Vercel's
// servers keep it for five minutes. The key stays here (RDM_KB_KEY, in an x-apikey header).
// Nothing is stored or logged. Runs in London (vercel.json): the licence allows UK use only.
//
// Self-contained on purpose (no imports), so Vercel builds it as it is. src/lib/incidents.ts and
// scripts/check-days.ts use what it exports.

const FEED = 'https://api1.raildata.org.uk/1010-knowlegebase-incidents-xml-feed1_0/incidents.xml'

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

/** One incident as sent to the page: dates as ISO text, the advice cleaned. */
export type Item = { id: string; planned: boolean; summary: string; advice: string; link: string; start: string | null; end: string | null }
export type Days = { taken: string; until: string; items: Item[] }

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
 *  count until National Rail marks them cleared; planned work National Rail has called off
 *  ("CANCELLED: Engineering work …") doesn't count. */
export function current(inc: Incident, now: Date, until: Date): boolean {
  if (inc.cleared || /^CLEARED\b/i.test(inc.summary) || /^CANCELLED\b/i.test(inc.summary)) return false
  if (!inc.planned) return !inc.end || inc.end >= now
  return !!inc.start && inc.start <= until && (!inc.end || inc.end >= now)
}

/** National Rail's advice kept as simple HTML: paragraphs, bold, lists and links only, with no
 *  attributes but a link's address (https only), and links opening National Rail's pages in a
 *  new tab. Headings become bold paragraphs. Safe to put in the page. */
export function cleanAdvice(h: string): string {
  let s = h.replace(/\r/g, '')
  s = s.replace(/<h\d[^>]*>/gi, '<p><b>').replace(/<\/h\d\s*>/gi, '</b></p>')
  s = s.replace(/<(\/?)(strong|b)\b[^>]*>/gi, '<$1b>')
  s = s.replace(/<br\b[^>]*>/gi, ' ').replace(/<div\b[^>]*>/gi, '<p>').replace(/<\/div\s*>/gi, '</p>')
  // Links: only an https address survives; anything else loses its tags but keeps its words.
  s = s.replace(/<a\b(?![^>]*?href="https?:\/\/[^"<>]+")[^>]*>([\s\S]*?)<\/a\s*>/gi, '$1')
  s = s.replace(/<a\b[^>]*?href="(https?:\/\/[^"<>]+)"[^>]*>/gi, (_, u: string) => `<a href="${u.replace(/^http:/, 'https:')}" target="_blank" rel="noopener noreferrer">`)
  s = s.replace(/<a\b(?![^>]*target="_blank" rel="noopener noreferrer")[^>]*>/gi, '')
  s = s.replace(/<(\/?)(p|ul|ol|li)\b[^>]*>/gi, '<$1$2>')
  s = s.replace(/<(?!\/?(p|b|ul|ol|li)>|a href="https:\/\/[^"<>]+" target="_blank" rel="noopener noreferrer">|\/a>)[^>]*>/gi, '')
  s = s.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
  for (let k = 0; k < 3; k++) s = s.replace(/<(p|b|li)>\s*<\/\1>/g, '').replace(/<p>\s*<b>\s*<\/b>\s*<\/p>/g, '')
  return s.trim()
}

/** The live items, from the feed's XML. */
export function liveItems(xml: string, now: Date): Days {
  const until = endOfSunday(now)
  const items = readIncidents(xml).filter((i) => current(i, now, until)).map((i): Item => ({
    id: i.id, planned: i.planned, summary: i.summary, advice: cleanAdvice(i.description), link: /^https:\/\//.test(i.link) ? i.link : '',
    start: i.start ? i.start.toISOString() : null, end: i.end ? i.end.toISOString() : null,
  }))
  return { taken: now.toISOString(), until: until.toISOString(), items }
}

const json = (body: unknown, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } })

export async function GET(): Promise<Response> {
  // Read through globalThis, as the page's code also imports this file (and has no Node types).
  const key = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.RDM_KB_KEY
  // Says which setting is missing (never its value), so a deployment without it is easy to spot.
  if (!key) return json({ error: 'unavailable', reason: 'no RDM_KB_KEY setting in this deployment' }, 503)
  let status = 0
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(FEED, { headers: { 'x-apikey': key, 'User-Agent': 'trainchecker.baish.net' }, signal: AbortSignal.timeout(15000) })
      status = r.status
      // Kept by Vercel's servers for five minutes, and used for five more while a fresh copy is fetched.
      if (r.ok) return json(liveItems(await r.text(), new Date()), 200, 'public, max-age=0, s-maxage=300, stale-while-revalidate=300')
      if (r.status >= 400 && r.status < 500 && r.status !== 429) break
    } catch { /* tried again once */ }
    await new Promise((res) => setTimeout(res, 800))
  }
  return json({ error: 'unavailable', reason: `National Rail answered ${status || 'nothing'}` }, 502)
}
