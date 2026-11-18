// Every sentence on the page, from analyse.ts's figures. The wording was agreed with John at
// the mock-ups (design/mockups-2026-11-17.md, five rounds of answers; SPEC §8) and is ported
// from design/mockups/sentences.mjs, which made them. scripts/check-rules.ts holds the agreed
// sentences for the real snapshots, so a change of wording fails loudly.
//
// Sentences new in stage 3 (not on the mock-ups) were agreed by John on November 17th 2026 too.

import { diff, type Analysis, type Train } from './analyse.ts'

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
/** One to nine as words, 10 and above as digits (house style §13). */
export const num = (n: number) => (Number.isInteger(n) && n >= 0 && n < 10 ? WORDS[n] : n.toLocaleString('en-GB'))
export const Cap = (s: string) => s[0].toUpperCase() + s.slice(1)

/** "18:26" → "6.26pm"; "19:00" → "7pm"; "12:00" → "midday"; "00:00" → "midnight" (§15). */
export function t12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  if (m === 0 && h === 12) return 'midday'
  if (m === 0 && h === 0) return 'midnight'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}${m ? '.' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`
}

const ORD = (d: number) => d + (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th')
function parts(date: Date) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .formatToParts(date).map((x) => [x.type, x.value]))
}
/** "Tuesday November 17th" in UK time (§15: month first, with an ordinal). */
export function dayName(date: Date): string {
  const p = parts(date)
  return `${p.weekday} ${p.month} ${ORD(Number(p.day))}`
}
/** "November 17th" in UK time. */
export const dateShort = (date: Date) => dayName(date).replace(/^\w+ /, '')

/** The part of the day: before midday, before 5pm, after (M1). */
export function partOfDay(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2))
  if (h < 12) return 'this morning'
  if (h < 17) return 'this afternoon'
  return 'this evening'
}

/** National Rail's reason, without its opening words (N13): "This service has been delayed by a
 *  fault on a train" → "a fault on a train". */
export function reasonText(r: string | null): string | null {
  if (!r) return null
  return r.replace(/^This (service|train) (has been|is being|was) (delayed|cancelled) (by|because of|due to) /i, '')
}

/** A reason as the summaries give it: "a fault on this train" becomes "a fault on the train",
 *  which reads better in a list of reasons (John, November 18th 2026). The train list keeps "this". */
const summaryReason = (r: string | null) => reasonText(r)?.replace(/\bthis (train|service)\b/gi, 'the $1') ?? null

/** The most common reason among some trains, if one covers at least half of them. Reasons that
 *  differ only by a place ("…signalling system" and "…signalling system at Gatley") count as
 *  one, in the shorter wording. */
function mainReason(trains: Train[]): string | null {
  const rs = trains.map((s) => summaryReason(s.reason)).filter((r): r is string => !!r)
  let best: [string, number] | null = null
  for (const r of new Set(rs)) {
    const n = rs.filter((x) => x === r || x.startsWith(r + ' ')).length
    if (!best || n > best[1] || (n === best[1] && r.length < best[0].length)) best = [r, n]
  }
  return best && best[1] * 2 >= trains.length ? best[0] : null
}

// Rounded shares (N1, N2, John): with 10 or more trains, the nearest of these, with "about"
// unless exact; with fewer, the real count. "All" and "none" said plainly.
const SHARES: [number, number, string, 'in' | 'of'][] = [[1, 20, 'one in twenty', 'in'], [1, 10, 'one in ten', 'in'], [1, 4, 'a quarter', 'of'], [1, 3, 'a third', 'of'],
  [1, 2, 'half', 'of'], [2, 3, 'two thirds', 'of'], [3, 4, 'three quarters', 'of'], [9, 10, 'nine in ten', 'in'], [19, 20, 'nineteen in twenty', 'in']]
/** The phrase for "<share> trains" ("about half of the trains", "five of the nine trains",
 *  "all 19 trains") and the bare share ("about half", "five of the nine", "all"). */
export function share(k: number, n: number): { trains: string; bare: string } {
  // Two of two is "both" (John, November 17th 2026).
  if (k === n && n === 2) return { trains: 'both trains', bare: 'both' }
  if (k === n) return { trains: `all ${num(n)} trains`, bare: 'all' }
  if (k === 0) return { trains: `none of the ${num(n)} trains`, bare: 'none' }
  if (n < 10) return { trains: `${num(k)} of the ${num(n)} trains`, bare: `${num(k)} of the ${num(n)}` }
  let best = SHARES[0]
  for (const x of SHARES) if (Math.abs(k / n - x[0] / x[1]) < Math.abs(k / n - best[0] / best[1])) best = x
  const about = k * best[1] === n * best[0] ? '' : 'about '
  return { trains: best[3] === 'in' ? `${about}${best[2]} trains` : `${about}${best[2]} of the trains`, bare: `${about}${best[2]}` }
}

/** How the last two hours went, as sentences (John's wording, N3 to N7, O1). */
export function lastTwoLines(a: Analysis): string[] {
  const L = a.last
  if (!L.known && !L.cancelled.length) return ['No trains made this journey in the last two hours.']
  const out: string[] = []
  if (L.known) {
    const sh = share(L.within3, L.known)
    if (L.byArrivals) out.push(`${Cap(sh.trains)} on this route in the last couple of hours got to ${a.to} within three minutes of their timetabled arrival.`)
    else {
      const reach = { past: 'reached', future: 'are expected to reach', mixed: 'have reached or are expected to reach' }[L.tense]
      out.push(`Of the trains that left ${a.from} in the last couple of hours, ${sh.bare} ${reach} ${a.to} within three minutes of their timetabled arrival.`)
    }
    const n = L.lates.length, them = L.within3 === 0 ? 'They' : n === 1 ? 'The other' : n === 2 ? 'The other two' : 'The others'
    const was = { past: n === 1 ? 'was' : 'were', future: n === 1 ? 'is expected to be' : 'are expected to be', mixed: n === 1 ? 'was or is expected to be' : 'were or are expected to be' }[L.tense]
    if (n === 1) out.push(`${them} ${was} ${num(L.worst!)} minutes late.`)
    else if (n === 2) out.push(`${them} ${was} ${num(L.lates[0])} and ${num(L.lates[1])} minutes late.`)
    else if (n > 2) out.push(L.usual === L.worst ? `${them} ${was} about ${num(L.usual!)} minutes late.` : `${them} ${was} mostly about ${num(L.usual!)} minutes late, and the latest ${L.tense === 'future' ? 'is expected to be' : 'was'} ${num(L.worst!)} minutes late.`)
  }
  const c = L.cancelled.length
  if (c) out.push(`${Cap(num(c))}${L.known ? ' more' : ''} ${c === 1 ? (L.known ? 'was' : 'train was') : (L.known ? 'were' : 'trains were')} cancelled.`)
  return out
}

/** A line of the verdict: an opening in bold ("Good news:") and the rest. */
export type Line = { bold?: string; text: string }
export type Verdict = { kind: Analysis['verdict']; lines: Line[] }

export function verdict(a: Analysis): Verdict {
  const when = partOfDay(a.now)
  const journey = `trains from ${a.from} to ${a.to}`
  if (a.verdict === 'none' && a.lastGone) {
    // Trains ran in the last two hours, and none in the next four. In the evening (6pm to 4am)
    // the last one has gone for the night (John, November 17th 2026); in the day, on a quiet
    // line, there may just be a long gap. Wording agreed by John, November 17th 2026.
    const h = Number(a.now.slice(0, 2))
    const gone = t12(a.lastGone.std)
    if (h >= 18 || h < 4) {
      return {
        kind: 'none', lines: [
          { text: `The last direct train from ${a.from} to ${a.to} seems to have gone: the latest left at ${gone}, and there isn't another in the next four hours.` },
          { text: 'Trainchecker looks four hours ahead, so check again later for the first trains tomorrow.' },
        ],
      }
    }
    return {
      kind: 'none', lines: [
        { text: `The latest direct train from ${a.from} to ${a.to} left at ${gone}, and there isn't another in the next four hours.` },
        { text: 'Trainchecker looks four hours ahead, so check again later.' },
      ],
    }
  }
  if (a.verdict === 'none') {
    return {
      kind: 'none', lines: [
        { text: `We can't find a direct train from ${a.from} to ${a.to} in the next four hours.` },
        { text: 'Trainchecker only covers direct journeys – if you know part of the route, try that.' },
      ],
    }
  }
  const lines: Line[] = []
  const kind = a.verdict
  if (kind === 'good') {
    lines.push({ bold: 'Good news:', text: a.worse ? ` ${journey} are leaving on time ${when}.` : ` ${journey} are running well ${when}.` })
  } else if (kind === 'mixed') {
    const bits: string[] = []
    if (a.cancelled.length) bits.push(`${num(a.cancelled.length)} ${a.cancelled.length === 1 ? 'is' : 'are'} cancelled`)
    const late = a.late5.length + a.unknown.length
    if (late) bits.push(`${num(late)} ${late === 1 ? 'is' : 'are'} running late`)
    lines.push({ bold: "It's a mixed bag:", text: ` most ${journey} are running ${when}, but ${bits.join(' and ').replace(/^(\w+)/, `$1 of the ${num(a.ahead.length)} in the next four hours`)}.` })
  } else {
    const r = mainReason([...a.cancelled, ...a.late5])
    let s = ` ${journey} ${a.badly ? 'are badly disrupted' : 'are disrupted'} ${when}. Of the next ${num(a.ahead.length)}, ${num(a.cancelled.length)} ${a.cancelled.length === 1 ? 'is' : 'are'} cancelled`
    if (a.late5.length) s += ` and ${num(a.late5.length)} ${a.late5.length === 1 ? 'is' : 'are'} running late`
    s += r ? `, mostly because of ${r}.` : '.'
    lines.push({ bold: 'Be prepared:', text: s })
  }
  // The last two hours are never in the verdict now: they stay in their own box, and when they
  // were bad, "Good news" says "leaving on time" instead of "running well" (John, November 17th
  // 2026, stage 4; replaces N5).
  return { kind, lines }
}

/** "because of A and B", or "mostly because of A", or nothing. */
function because(trains: Train[]): string {
  const rs = [...new Set(trains.map((s) => summaryReason(s.reason)).filter(Boolean))]
  if (!rs.length) return ''
  if (rs.length <= 2) return `, because of ${rs.join(' and ')}`
  const m = mainReason(trains)
  return m ? `, mostly because of ${m}` : ''
}

export type Row = { time: string; dest: string; operator: string; status: 'cancelled' | 'late' | 'unknown'; what: string; reason: string | null; why: string }
export type NextFour = { lines: string[]; rows: Row[]; fold: string | null }

// ---- Trains an hour, fast and slower (John, November 18th 2026) ----

/** A company's name as people know it: "Elizabeth Line" as National Rail writes it, "Lumo" for
 *  the board's "Lumo Stirling"; a name shared by two brands ("LNR & WMR") isn't named at all. */
export function companyName(op: string): string | null {
  // National Rail's capital L (John, November 18th 2026).
  if (/elizabeth/i.test(op)) return 'Elizabeth Line'
  if (/&/.test(op)) return null
  return op.replace(/^Lumo\b.*$/, 'Lumo')
}

type Group = { k: number; kind: 'fast' | 'slower' | 'elizabeth' | 'all'; company: string | null; mins: number; trains: Train[] }

/** The next four hours' trains in groups by journey time (to B): fast (no more than a quarter
 *  longer than the quickest, or within 10 minutes of it), slower, and the Elizabeth Line on its own
 *  when it's slower. Each group's company when the whole group is one company and the groups
 *  differ, and its middle journey time. */
export function speedGroups(a: Analysis): Group[] {
  const t = a.ahead.filter((x) => x.sta).map((x) => ({ mins: diff(x.std, x.sta!), op: x.operator, x }))
  if (!t.length) return [{ k: a.ahead.length, kind: 'all', company: null, mins: 0, trains: a.ahead }]
  const q = Math.min(...t.map((x) => x.mins)), lim = Math.max(q * 1.25, q + 10)
  const eliz = t.filter((x) => /elizabeth/i.test(x.op) && x.mins > lim)
  const rest = t.filter((x) => !eliz.includes(x))
  const mid = (g: typeof t) => g.map((x) => x.mins).sort((m, n) => m - n)[Math.floor(g.length / 2)]
  let fast = rest.filter((x) => x.mins <= lim), slow = rest.filter((x) => x.mins > lim)
  // Slower only if they usually take 10 minutes or more longer than the fast ones; otherwise one
  // group (Manchester to the Airport: 13 to 24 minutes, no real split).
  if (slow.length && fast.length && mid(slow) - mid(fast) < 10) { fast = rest; slow = [] }
  const raw: [typeof t, Group['kind']][] = slow.length || eliz.length ? [[fast, 'fast'], [slow, 'slower'], [eliz, 'elizabeth']] : [[fast, 'all']]
  const groups = raw.filter(([g]) => g.length).map(([g, kind]) => {
    const ops = [...new Set(g.map((x) => x.op))]
    return { k: g.length, kind, company: ops.length === 1 ? companyName(ops[0]) : null, mins: mid(g), ops, trains: g.map((y) => y.x) }
  })
  // Name the companies only when every named group is one company and they differ.
  const named = groups.length > 1 && groups.every((g) => g.ops.length === 1) && new Set(groups.map((g) => g.ops[0])).size === groups.length
  return groups.map(({ k, kind, company, mins, trains }) => ({ k, kind, company: kind === 'elizabeth' ? 'Elizabeth Line' : named ? company : null, mins, trains }))
}

/** "about eight" a hour from k trains in four hours ("about" unless exact); fewer than four: the
 *  real count, "three … in all". */
const perHour = (k: number) => (k % 4 ? 'about ' : '') + num(Math.round(k / 4))

/** The first line of "The next four hours" with more than eight trains (John, November 18th 2026):
 *  "There are about eight fast trains an hour from Reading to London Paddington in the next four
 *  hours, about two slower ones an hour (taking about 40 minutes) and three an hour on the Elizabeth
 *  Line." "An hour" after every group (John, November 18th 2026); one "and"; journey times only for the groups in the middle (people know the fastest
 *  and slowest). A group of fewer than four trains: "three on the Elizabeth Line in that time"
 *  (Claude's draft). */
export function trainsAnHour(a: Analysis): string | null {
  if (a.ahead.length <= 8) return null
  const gs = speedGroups(a)
  const phrase = (g: Group, i: number) => {
    const few = g.k < 4
    const n = few ? num(g.k) : perHour(g.k)
    const one = few ? g.k === 1 : Math.round(g.k / 4) === 1
    const time = i > 0 && i < gs.length - 1 ? ` (taking about ${num(Math.round(g.mins / 5) * 5)} minutes)` : ''
    // "An hour" after every group (John, November 18th 2026), so no figure can be read as a total.
    const all = few && i > 0 ? ' in that time' : ''
    const hr = few ? '' : ' an hour'
    if (g.kind === 'elizabeth') return `${n}${hr} on the Elizabeth Line${all}${time}`
    const co = g.company ? `${g.company} ` : ''
    const adj = g.kind === 'all' ? '' : `${g.kind} `
    if (i === 0) return `${n} ${adj}${co}${one ? 'train' : 'trains'}${few ? '' : ' an hour'} from ${a.from} to ${a.to} in the next four hours`
    return `${n} ${adj}${co}${one ? (co ? 'train' : 'one') : (co ? 'trains' : 'ones')}${hr}${all}${time}`
  }
  const ps = gs.map(phrase)
  const list = ps.length > 1 ? `${ps.slice(0, -1).join(', ')} and ${ps[ps.length - 1]}` : ps[0]
  return `There ${gs[0].k === 1 || (gs[0].k >= 4 && Math.round(gs[0].k / 4) === 1) ? 'is' : 'are'} ${list}.`
}

/** What follows "Cancelled" or "Expected 6.45pm, 7 minutes late" on the same line, in the
 *  explanation's font (John, November 18th 2026): " because of a fault on this train (Great Western
 *  Railway)." National Rail's own words when they can't follow "because of"; the company alone when
 *  there's no reason. */
export function why(reason: string | null, operator: string): string {
  const co = `(${companyName(operator) ?? operator})`
  const r = reasonText(reason)
  if (!r) return ` ${co}.`
  if (r !== reason) return ` because of ${r.replace(/[.\s]+$/, '')} ${co}.`
  return `. ${Cap(r.replace(/[.\s]+$/, ''))} ${co}.`
}

export function nextFour(a: Analysis): NextFour | null {
  if (a.verdict === 'none') return null
  const n = a.ahead.length
  const v = (k: number) => (k === 1 ? 'is' : 'are')
  const lines = [trainsAnHour(a) ?? (n === 1 ? `There's one train from ${a.from} to ${a.to} in the next four hours.` : `There are ${num(n)} trains from ${a.from} to ${a.to} in the next four hours.`)]
  const onTime = a.ahead.filter((s) => s.late !== null && s.late <= 3).length
  const little = a.ahead.filter((s) => s.late !== null && s.late > 3 && s.late <= 5)
  if (onTime === n) lines.push(n === 1 ? "It's expected on time." : n === 2 ? 'Both are expected on time.' : 'All are expected on time.')
  else {
    const g: [number, string][] = []
    if (a.cancelled.length) g.push([a.cancelled.length, `${v(a.cancelled.length)} cancelled${because(a.cancelled)}`])
    if (a.late5.length) g.push([a.late5.length, `${v(a.late5.length)} expected to be more than five minutes late${because(a.late5)}`])
    if (little.length) g.push([little.length, `${v(little.length)} expected to be a few minutes late`])
    if (a.unknown.length) g.push([a.unknown.length, `${v(a.unknown.length)} delayed with no time given yet`])
    const ps = g.map(([k, t]) => `${num(k)} ${t}`)
    let s = ps.length > 1 ? `${ps.slice(0, -1).join(', ')}, and ${ps[ps.length - 1]}` : ps[0]
    s = g[0][0] >= 10 ? `Of these, ${s}.` : `${Cap(s)}.`
    lines.push(s)
    if (onTime) lines.push(onTime === 1 ? 'The other is expected on time.' : 'The rest are expected on time.')
  }
  const rows: Row[] = [...a.cancelled, ...a.late5, ...a.unknown].sort((x, y) => x.rel - y.rel).map((s) => {
    const r = reasonText(s.reason)
    return {
      time: t12(s.std), dest: s.destination, operator: s.operator,
      status: s.cancelled ? 'cancelled' : s.unknown ? 'unknown' : 'late',
      what: s.cancelled ? 'Cancelled' : s.unknown ? 'Delayed, no time given yet' : `Expected ${t12(s.etd!)}, ${s.late} minutes late`,
      reason: r ? Cap(r) + '.' : null,
      why: why(s.reason, s.operator),
    }
  })
  const fold = !rows.length ? null : rows.length === 1 ? "Show the train that isn't on time" : `Show the ${num(rows.length)} trains that aren't on time`
  return { lines: [lines[0], lines.slice(1).join(' ')].filter(Boolean), rows, fold }
}

/** Platforms for each kind of train, when the trains fall into groups (John, November 18th 2026:
 *  "accurate but not all that precise"): "Most fast trains are currently going from platforms 10
 *  and 11, with slower ones using platforms 13A and 15A and Elizabeth Line trains using platforms 13
 *  and 14." For each group, the platforms most used, up to two, covering at least two thirds of
 *  its trains with a platform; "Most" unless they cover all. "10A" counts as 10 where plain 10 is
 *  in use too (at Reading, 10A is one end of platform 10). Null when there's only one group, or
 *  fewer than two groups have a platform yet. */
export function platformsByKind(a: Analysis): string | null {
  const groups = speedGroups(a).filter((g) => g.kind !== 'all')
  if (groups.length < 2) return null
  const used = new Set(a.ahead.filter((t) => t.platform && !t.cancelled).map((t) => t.platform!))
  const base = (p: string) => { const m = p.match(/^(\d+)[A-Z]$/); return m && used.has(m[1]) ? m[1] : p }
  const parts: { kind: Group['kind']; text: string; most: boolean }[] = []
  for (const g of groups) {
    const counts = new Map<string, number>()
    for (const t of g.trains) if (t.platform && !t.cancelled) counts.set(base(t.platform), (counts.get(base(t.platform)) ?? 0) + 1)
    const known = [...counts.values()].reduce((x, y) => x + y, 0)
    if (!known) continue
    const top = [...counts].sort((x, y) => y[1] - x[1])
    const pick: string[] = []
    let covered = 0
    for (const [p, n] of top) { if (pick.length === 2 || covered * 3 >= known * 2) break; pick.push(p); covered += n }
    pick.sort((x, y) => parseInt(x) - parseInt(y) || x.localeCompare(y))
    const list = pick.length === 1 ? `platform ${pick[0]}` : `platforms ${pick[0]} and ${pick[1]}`
    parts.push({ kind: g.kind, text: list, most: covered < known })
  }
  if (parts.length < 2) return null
  const name = (k: Group['kind'], first: boolean) => (k === 'elizabeth' ? 'Elizabeth Line trains' : k === 'fast' ? 'fast trains' : first ? 'slower trains' : 'slower ones')
  const [f, ...rest] = parts
  const others = rest.map((p) => `${name(p.kind, false)} using ${p.most ? 'mostly ' : ''}${p.text}`)
  return `${f.most ? 'Most ' : ''}${f.most ? name(f.kind, true) : Cap(name(f.kind, true))} ${f.most ? 'are' : 'are'} currently going from ${f.text}, with ${others.length > 1 ? `${others.slice(0, -1).join(', ')} and ${others[others.length - 1]}` : others[0]}.`
}

export function platforms(a: Analysis): string | null {
  if (a.verdict === 'none') return null
  if (!a.platKnown) return 'No platforms have been announced yet.'
  const [[p1, n1], ...rest] = a.platList
  const and = (xs: string[]) => xs.join(', ').replace(/, ([^,]*)$/, ' and $1')
  // One or two platforms known: say each, not "most" (agreed by John, November 17th 2026).
  // "Currently" rather than "At the moment" (John, November 18th 2026).
  const running = a.ahead.filter((s) => !s.cancelled).length
  if (a.platKnown <= 2 && a.platKnown === running) {
    if (a.platKnown === 1) return `The train is currently going from platform ${p1}.`
    return rest.length ? `One train is currently going from platform ${p1} and the other from platform ${rest[0][0]}.` : `Both trains are currently going from platform ${p1}.`
  }
  if (a.platKnown === 1) return `So far, a platform has been announced for one train: platform ${p1}.`
  if (a.platKnown === 2) return rest.length ? `So far, platforms have been announced for two trains: platforms ${p1} and ${rest[0][0]}.` : `So far, platforms have been announced for two trains, both platform ${p1}.`
  const byKind = platformsByKind(a)
  if (byKind) return byKind
  if (n1 * 2 >= a.platKnown) {
    let s = `Most trains are currently going from platform ${p1}`
    if (rest.length === 1) s += `, and ${rest[0][1] === 1 ? 'one' : 'some'} from platform ${rest[0][0]}`
    else if (rest.length > 1) s += `; others from platforms ${and(rest.slice(0, 3).map((x) => x[0]))}`
    return s + '.'
  }
  return `Trains are currently going from platforms including ${and(a.platList.slice(0, 4).map((x) => x[0]))}.`
}

/** The Share button's words (P2, John): a friendly opening, a short summary, then the link,
 *  sent separately. Past tense and a date, as a message is often read later (§17). */
export function shareWords(a: Analysis): { text: string; title: string; hash: string } {
  const taken = new Date(a.taken)
  const at = `${t12(a.now)} on ${dateShort(taken)}`
  const title = `Trainchecker: ${a.from} to ${a.to}`, hash = `#${a.fromCrs}-${a.toCrs}`
  if (a.verdict === 'none' && a.lastGone) return { text: `Here's what Trainchecker found at ${at}: the last direct train from ${a.from} to ${a.to} had gone, at ${t12(a.lastGone.std)}, with no other in the following four hours.`, title, hash }
  if (a.verdict === 'none') return { text: `Here's what Trainchecker found at ${at}: no direct train from ${a.from} to ${a.to} in the following four hours.`, title, hash }
  const lead = `Here's how the trains from ${a.from} to ${a.to} were looking at ${at}: `
  const was = (k: number) => (k === 1 ? 'was' : 'were')
  let body: string
  if (a.verdict === 'good' && !a.worse) body = 'good news, they were running well.'
  else if (a.verdict === 'good') {
    const L = a.last
    const why = L.known && L.within3 / L.known < 0.75
      ? `only ${share(L.within3, L.known).bare} of the trains in the couple of hours before got there within three minutes of the timetable`
      : `${num(L.cancelled.length)} trains were cancelled in the couple of hours before`
    body = `good news, they were leaving on time, though ${why}.`
  } else if (a.verdict === 'mixed') {
    const bits: string[] = []
    if (a.cancelled.length) bits.push(`${num(a.cancelled.length)} ${was(a.cancelled.length)} cancelled`)
    const late = a.late5.length + a.unknown.length
    if (late) bits.push(`${num(late)} ${was(late)} running late`)
    body = `a mixed bag. Most were running, but ${bits.join(' and ').replace(/^(\w+)/, `$1 of the ${num(a.ahead.length)} in the following four hours`)}.`
  } else {
    const r = mainReason([...a.cancelled, ...a.late5])
    body = `be prepared. Of the next ${num(a.ahead.length)}, ${num(a.cancelled.length)} ${was(a.cancelled.length)} cancelled${r ? `, mostly because of ${r}` : ''}.`
  }
  return { text: lead + body + ' From Trainchecker.', title, hash }
}

// ---- The last week (SPEC §8.10) ----

export type DayKind = 'WEEKDAY' | 'SATURDAY' | 'SUNDAY'
export type WeekCounts = { n: number; w3: number; w10: number; w30: number; w120: number; dates: string[]; elizabeth: number }

/** What happened to the trains that weren't within three minutes (Q1, John), from the counts
 *  within 3, 10, 30 and 120 minutes; a train missing even 120 is taken as cancelled. The
 *  sentence after the first. */
export function lastWeekOthers(n: number, w3: number, w10: number, w30: number, w120 = w30): string {
  const others = n - w3
  if (!others) return ''
  const groups = ([
    [w10 - w3, 'less than 10 minutes late'],
    [w30 - w10, '10 to 30 minutes late'],
    [w120 - w30, 'more than half an hour late'],
    [n - w120, 'cancelled'],
  ] as [number, string][]).filter(([k]) => k > 0)
  // One train in all (agreed by John, November 17th 2026): "It was …".
  if (n === 1) return `It was ${groups[0][1]}.`
  if (groups.length === 1) return others === 1 ? `The other was ${groups[0][1]}.` : `The others were ${groups[0][1]}.`
  const [first, ...rest] = groups
  const sh = share(first[0], others).bare
  const v = first[0] === 1 && others < 10 ? 'was' : 'were'
  if (rest.length === 1) return `Of the others, ${sh} ${v} ${first[1]}, and the rest ${rest[0][1]}.`
  const ps = [`${sh} ${v} ${first[1]}`, ...rest.map(([k, t]) => `${num(k)} ${k === 1 ? 'was' : 'were'} ${t}`)]
  return `Of the others, ${ps.slice(0, -1).join(', ')} and ${ps[ps.length - 1]}.`
}

/** Today's kind of day in the UK, and the dates of the last week before today. */
export function weekFor(now: Date): { kind: DayKind; first: string; last: string; days: Date[] } {
  const iso = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(d)
  // Midday UTC on the UK date, so stepping a day at a time never trips over a clock change.
  const today = new Date(`${iso(now)}T12:00:00Z`)
  const wd = today.getUTCDay()
  const kind: DayKind = wd === 6 ? 'SATURDAY' : wd === 0 ? 'SUNDAY' : 'WEEKDAY'
  const back = (k: number) => new Date(today.getTime() - k * 86400e3)
  const days: Date[] = []
  for (let k = 7; k >= 1; k--) {
    const d = back(k), w = d.getUTCDay()
    if (kind === 'WEEKDAY' ? w >= 1 && w <= 5 : kind === 'SATURDAY' ? w === 6 : w === 0) days.push(d)
  }
  return { kind, first: iso(back(7)), last: iso(back(1)), days }
}

/** "5pm to 6pm", for the list of hours (5am to midnight). */
export const hourLabel = (h: number) => `${t12(`${String(h).padStart(2, '0')}:00`)} to ${t12(`${String((h + 1) % 24).padStart(2, '0')}:00`)}`
export const HOURS = Array.from({ length: 19 }, (_, i) => i + 5)

/** The line under the hours (agreed for weekdays; Saturdays and Sundays agreed by John, November 17th 2026). */
export function kindLine(kind: DayKind): string {
  if (kind === 'SATURDAY') return 'Today is a Saturday, so this looks at last Saturday (weekdays and Sundays have their own timetables).'
  if (kind === 'SUNDAY') return 'Today is a Sunday, so this looks at last Sunday (weekdays and Saturdays have their own timetables).'
  return 'Today is a weekday, so this looks at the weekdays of the last week (Saturdays and Sundays have their own timetables).'
}

/** The line while it loads (agreed for weekdays; Saturdays and Sundays agreed by John, November 17th 2026). */
export function loadingLine(kind: DayKind, hour: number): string {
  const h = hourLabel(hour).replace(' to ', ' and ')
  if (kind === 'WEEKDAY') return `Fetching weekday trains between ${h} over the last week from National Rail. This usually takes less than a minute.`
  return `Fetching last ${kind === 'SATURDAY' ? 'Saturday' : 'Sunday'}’s trains between ${h} from National Rail. This usually takes less than a minute.`
}

/** The result (John's wording, O4 and Q1): "On the five weekdays from Tuesday November 10th to
 *  Monday November 16th, about a third of the 26 trains that left Reading between 5pm and
 *  5.30pm reached London Paddington within three minutes of the timetable. Of the others, …" */
export function lastWeekText(c: WeekCounts, o: { from: string; to: string; kind: DayKind; days: Date[]; start: string; end: string }): string {
  const between = `between ${t12(o.start)} and ${t12(o.end)}`
  const ds = o.days
  const when = ds.length === 1 ? `On ${dayName(ds[0])}` : `On the ${num(ds.length)} ${o.kind === 'WEEKDAY' ? 'weekdays' : o.kind === 'SATURDAY' ? 'Saturdays' : 'Sundays'} from ${dayName(ds[0])} to ${dayName(ds[ds.length - 1])}`
  // No trains (agreed by John, November 17th 2026).
  if (!c.n) return `${when}, no trains left ${o.from} for ${o.to} ${between}, as far as National Rail's record shows.`
  const k = c.w3, n = c.n
  if (n === 1) {
    return `${when}, the only train that left ${o.from} ${between} ${k ? 'reached' : "didn't reach"} ${o.to} within three minutes of the timetable.${k ? '' : ' ' + lastWeekOthers(n, c.w3, c.w10, c.w30, c.w120)}`
  }
  const who = k === n && n === 2 ? 'both trains' : k === n ? `all ${num(n)} trains` : k === 0 ? `none of the ${num(n)} trains` : n < 10 ? `${num(k)} of the ${num(n)} trains` : `${share(k, n).bare} of the ${num(n)} trains`
  const first = `${when}, ${who} that left ${o.from} ${between} reached ${o.to} within three minutes of the timetable.`
  let rest = lastWeekOthers(n, c.w3, c.w10, c.w30, c.w120)
  // When none were within three minutes there are no "others" (agreed by John, November 17th 2026).
  if (k === 0) rest = rest.replace(/^Of the others,/, 'Of these,').replace(/^The others were/, 'They were')
  return rest ? `${first} ${rest}` : first
}

/** The quote's Share words (SPEC §8.13). */
export const quoteShareText = (author: string, date: Date) => `The quote of the day on Trainchecker for ${dateShort(date)}, from ${author}.`

// ---- The days ahead (SPEC §8.9; stage 4) ----

/** A day with the year when it isn't this year's: "Friday April 30th 2027". */
function dayYear(d: Date, now: Date): string {
  const y = (x: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric' }).format(x)
  return y(d) === y(now) ? dayName(d) : `${dayName(d)} ${y(d)}`
}

/** "November 22nd", or "November 21st to 24th", "November 30th to December 2nd". */
function monthDays(s: Date, e?: Date): string {
  const md = (d: Date) => dayName(d).replace(/^\w+ /, '')
  if (!e || md(s) === md(e)) return md(s)
  const [ms, ds] = md(s).split(' '), [me, de] = md(e).split(' ')
  return ms === me ? `${ms} ${ds} to ${de}` : `${md(s)} to ${md(e)}`
}
const weekday = (d: Date) => dayName(d).split(' ')[0]
const withinWeek = (d: Date, now: Date) => d.getTime() - now.getTime() < 6 * 864e5

/** When an incident applies, as people say it (John, November 18th 2026): the words, shown in
 *  capitals, then the date in brackets in ordinary type: "On Sunday (November 22nd)", "Now until
 *  Thursday (November 19th)", "From Saturday to Tuesday (November 21st to 24th)", "Tomorrow
 *  (November 19th)", "Later today", "Until the end of today", "Now". Beyond the coming week, the full
 *  date as before ("Now until Friday April 30th 2027"). */
export function whenLabel(i: { planned: boolean; start: string | null; end: string | null }, now: Date): { main: string; date?: string } {
  if (!i.planned) return { main: 'Now' }
  const s = i.start ? new Date(i.start) : now, e = i.end ? new Date(i.end) : null
  const today = (d: Date) => dayName(d) === dayName(now)
  const tomorrow = (d: Date) => dayName(d) === dayName(new Date(now.getTime() + 864e5))
  if (s <= now) {
    if (!e) return { main: 'Now' }
    if (today(e)) return { main: 'Until the end of today' }
    if (tomorrow(e)) return { main: 'Now until tomorrow', date: `(${monthDays(e)})` }
    return withinWeek(e, now) ? { main: `Now until ${weekday(e)}`, date: `(${monthDays(e)})` } : { main: `Now until ${dayYear(e, now)}` }
  }
  if (!e || dayName(s) === dayName(e)) {
    if (today(s)) return { main: e ? 'Later today' : 'From later today' }
    const day = tomorrow(s) ? 'Tomorrow' : `On ${weekday(s)}`
    return e ? { main: day, date: `(${monthDays(s)})` } : { main: `From ${tomorrow(s) ? 'tomorrow' : weekday(s)}`, date: `(${monthDays(s)})` }
  }
  if (!withinWeek(e, now)) return { main: `${dayYear(s, now)} to ${dayYear(e, now)}` }
  const from = today(s) ? 'later today' : tomorrow(s) ? 'tomorrow' : weekday(s)
  return { main: `From ${from} to ${weekday(e)}`, date: `(${monthDays(s, e)})` }
}

/** The section's heading (agreed at the mock-ups). */
export const daysHeading = (now: boolean) => (now ? 'Disruption now, and the days ahead' : 'The days ahead')
/** The line before planned work, and the line when there's none (agreed at the mock-ups). */
/** "this weekend", or "today" on a Sunday (John, November 18th 2026: as people say it, no date). */
const weekend = (until: Date, now: Date) => (dayName(until) === dayName(now) ? 'today' : 'this weekend')
export const plannedIntro = (until: Date, now: Date) => `Planned engineering work and changes from National Rail, to the end of ${weekend(until, now)}:`
export const noPlanned = (until: Date, now: Date) => `National Rail isn't listing any planned engineering work for this journey between now and the end of ${weekend(until, now)}.`
/** Before what may affect the journey (John, November 17th 2026: option 2): "These might affect
 *  some trains from London Victoria to Brighton too, as they involve Brighton:" */
export function mayIntro(n: number, from: string, to: string, involved: string[]): string {
  return `${n === 1 ? 'This' : 'These'} might affect some trains from ${from} to ${to} too, as ${n === 1 ? 'it involves' : 'they involve'} ${involved.join(' or ')}:`
}

/** The verdict when no train runs in the next four hours because National Rail says the line is
 *  closed today (John, November 18th 2026: his words for buses; the "no trains" words are
 *  Claude's draft to match). Replaces "We can't find a direct train…", which would mislead. */
export function closedVerdict(how: 'buses' | 'none', from: string, to: string): Line[] {
  return [{ bold: 'Be prepared:', text: how === 'buses'
    ? ` National Rail says buses are replacing trains between ${from} and ${to} today. Their advice is under “The days ahead” below.`
    : ` National Rail says no trains are running between ${from} and ${to} today. Their advice is under “The days ahead” below.` }]
}
/** Added to "Be prepared" when National Rail lists disruption now for the journey (John,
 *  November 18th 2026). */
export const disruptionAdvice = 'National Rail’s advice, including other ways to travel with your ticket, is under “Disruption now” below.'
/** The Share words for a closed line (Claude's draft, to match the agreed Share sentences). */
export function closedShare(how: 'buses' | 'none', a: { from: string; to: string; now: string; taken: string }): string {
  const at = `${t12(a.now)} on ${dateShort(new Date(a.taken))}`
  return how === 'buses'
    ? `Here's what Trainchecker found at ${at}: National Rail said buses were replacing trains between ${a.from} and ${a.to} that day.`
    : `Here's what Trainchecker found at ${at}: National Rail said no trains were running between ${a.from} and ${a.to} that day.`
}

/** A day by name when it's within the coming week ("Friday"), otherwise in full. */
function dayWord(d: Date, now: Date): string {
  if (dayName(d) === dayName(now)) return 'today'
  return d.getTime() - now.getTime() < 6 * 864e5 ? dayName(d).split(' ')[0] : dayName(d)
}

/** Single services very early or late, grouped (John, November 18th 2026): "Two single services"
 *  above one sentence, "If you're travelling before 6am between now and Friday or after 11pm on
 *  Saturday you may be affected – see more details." Early trains (before 7am) say "before" the
 *  next hour; late ones (10pm to 4am) "after" the hour. */
export function singlesKicker(n: number): string {
  return `${Cap(num(n))} single services`
}
export function singlesLine(items: { summary: string; start: string | null; end: string | null }[], now: Date): string {
  const phrases: string[] = []
  for (const i of items) {
    const t = i.summary.match(/^Amended (\d\d):(\d\d)/)
    if (!t) continue
    const h = Number(t[1])
    const hour = (x: number) => t12(`${String(x % 24).padStart(2, '0')}:00`)
    const at = h >= 4 && h < 12 ? `before ${hour(h + 1)}` : `after ${hour(h)}`
    const s = i.start ? new Date(i.start) : now, e = i.end ? new Date(i.end) : s
    const when = s <= now
      ? (dayName(e) === dayName(now) ? 'today' : `between now and ${dayWord(e, now)}`)
      : dayName(s) === dayName(e) ? `on ${dayWord(s, now)}` : `between ${dayWord(s, now)} and ${dayWord(e, now)}`
    // Between midnight and 4am, the night before, so "after midnight on Friday night" isn't read as
    // Saturday night.
    const night = h < 4 && dayName(s) === dayName(e) && s > now ? `on ${dayWord(new Date(s.getTime() - 864e5), now)} night` : null
    const p = `${at} ${night ?? when}`.replace(/ on today$/, ' today').replace(/ on today night$/, ' tonight')
    if (!phrases.includes(p)) phrases.push(p)
  }
  const list = phrases.length > 1 ? `${phrases.slice(0, -1).join(', ')} or ${phrases[phrases.length - 1]}` : phrases[0]
  return `If you're travelling ${list} you may be affected – see more details.`
}
