// Trainchecker's last-week function: how the trains from A to B ran in one half hour of the day,
// on the same kind of day (weekdays, Saturdays or Sundays), over the last week, from National
// Rail's Historical Service Performance (SPEC §8.10; design/data-trial-2026-11-17.md §6 to §9).
//
// GET /api/week?from=RDG&to=PAD&days=WEEKDAY&start=1700&end=1730&first=2026-11-10&last=2026-11-16
//   &only=XR  (one company: the service's own toc_filter, checked November 18th 2026)
//   &skip=XR  (leave a company out: the record has only stray Elizabeth Line runs at Paddington)
//
// The page asks for each half hour in turn: the service takes one request at a time (others are
// refused at once with HTTP 503), and a busy line's whole hour can run past its 55-second
// limit. Margins of 3, 10, 30 and 120 minutes; a train that misses even 120 is taken as
// cancelled (checked November 17th 2026). The answer is kept by Vercel's servers until UK
// midnight (s-maxage), so later visitors asking the same get it at once; the dates are in the
// address, so the next day's is fresh. The key stays here (RDM_HSP_KEY). Nothing is logged.
//
// Self-contained on purpose (no imports from the page's code).

const URL_METRICS = 'https://api1.raildata.org.uk/1010-historical-service-performance-_hsp_1_1/serviceMetrics'
export const MARGINS = [3, 10, 30, 120] as const

export type WeekCounts = { n: number; w3: number; w10: number; w30: number; w120: number; dates: string[]; elizabeth: number }

type Raw = {
  Services?: {
    serviceAttributesMetrics?: { matched_services?: string; toc_code?: string; rids?: string[] }
    Metrics?: { tolerance_value?: string; num_tolerance?: string }[]
  }[]
}

/** Adds up the service's answer: every train run, and how many were within each margin. */
export function count(raw: Raw, skip?: string): WeekCounts {
  const c: WeekCounts = { n: 0, w3: 0, w10: 0, w30: 0, w120: 0, dates: [], elizabeth: 0 }
  const dates = new Set<string>()
  for (const s of raw.Services || []) {
    const a = s.serviceAttributesMetrics || {}
    if (skip && a.toc_code === skip) continue
    const n = Number(a.matched_services) || 0
    c.n += n
    if (a.toc_code === 'XR') c.elizabeth += n
    for (const r of a.rids || []) dates.add(`${r.slice(0, 4)}-${r.slice(4, 6)}-${r.slice(6, 8)}`)
    for (const m of s.Metrics || []) {
      const k = Number(m.num_tolerance) || 0
      const t = Number(m.tolerance_value)
      if (t === 3) c.w3 += k
      else if (t === 10) c.w10 += k
      else if (t === 30) c.w30 += k
      else if (t === 120) c.w120 += k
    }
  }
  c.dates = [...dates].sort()
  // An answer asked without the 120-minute margin can't tell cancelled trains (the stage 1
  // saved answers): take none as cancelled rather than all.
  if (!(raw.Services || []).some((s) => (s.Metrics || []).some((m) => Number(m.tolerance_value) === 120))) c.w120 = c.w30
  return c
}

/** Seconds from now to the next midnight in the UK. */
export function untilMidnight(now: Date): number {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).map((x) => [x.type, Number(x.value)]))
  return Math.max(60, 86400 - (p.hour * 3600 + p.minute * 60 + p.second))
}

const json = (body: unknown, status: number, cache = 'no-store') =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } })

export async function GET(request: Request): Promise<Response> {
  const q = new URL(request.url).searchParams
  const from = (q.get('from') || '').toUpperCase(), to = (q.get('to') || '').toUpperCase()
  const days = q.get('days') || '', start = q.get('start') || '', end = q.get('end') || ''
  const first = q.get('first') || '', last = q.get('last') || ''
  const ok = /^[A-Z]{3}$/.test(from) && /^[A-Z]{3}$/.test(to) && ['WEEKDAY', 'SATURDAY', 'SUNDAY'].includes(days) &&
    /^([01]\d|2[0-3])[0-5]\d$/.test(start) && /^([01]\d|2[0-3])[0-5]\d$/.test(end) &&
    /^\d{4}-\d\d-\d\d$/.test(first) && /^\d{4}-\d\d-\d\d$/.test(last)
  const only = (q.get('only') || '').toUpperCase(), skip = (q.get('skip') || '').toUpperCase()
  if (!ok || (only && !/^[A-Z]{2}$/.test(only)) || (skip && !/^[A-Z]{2}$/.test(skip))) return json({ error: 'request' }, 400)
  const key = process.env.RDM_HSP_KEY
  // Says which setting is missing (never its value), so a deployment without it is easy to spot.
  if (!key) return json({ error: 'unavailable', reason: 'no RDM_HSP_KEY setting in this deployment' }, 503)
  const body = JSON.stringify({ from_loc: from, to_loc: to, from_time: start, to_time: end, from_date: first, to_date: last, days, tolerance: MARGINS.map(String), ...(only ? { toc_filter: [only] } : {}) })
  const began = Date.now()
  // Another visitor's request may be running: the service then refuses at once (503), so wait a
  // little and try again, while there's still time for an answer within Vercel's 60 seconds.
  for (;;) {
    let r: Response
    try {
      r = await fetch(URL_METRICS, {
        method: 'POST', body,
        headers: { 'x-apikey': key, 'content-type': 'application/json', 'User-Agent': 'trainchecker.baish.net', Accept: 'application/json' },
        signal: AbortSignal.timeout(Math.max(5000, 56000 - (Date.now() - began))),
      })
    } catch {
      return json({ error: 'timeout' }, 504)
    }
    if (r.ok) return json(count((await r.json()) as Raw, skip || undefined), 200, `public, max-age=0, s-maxage=${untilMidnight(new Date())}`)
    if (r.status === 503 && Date.now() - began < 20000) {
      await new Promise((res) => setTimeout(res, 4000))
      continue
    }
    return json({ error: r.status === 503 ? 'busy' : r.status === 504 ? 'timeout' : 'unavailable', reason: `National Rail answered ${r.status}` }, 502)
  }
}
