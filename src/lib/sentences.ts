// Every sentence on the page, from analyse.ts's figures. The wording was agreed with John at
// the mock-ups (design/mockups-2026-11-17.md, five rounds of answers; SPEC §8) and is ported
// from design/mockups/sentences.mjs, which made them. scripts/check-rules.ts holds the agreed
// sentences for the real snapshots, so a change of wording fails loudly.
//
// Sentences new in stage 3 (not on the mock-ups) are marked "Claude's draft, for John".

import type { Analysis, Train } from './analyse.ts'

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

/** The most common reason among some trains, if one covers at least half of them. Reasons that
 *  differ only by a place ("…signalling system" and "…signalling system at Gatley") count as
 *  one, in the shorter wording. */
function mainReason(trains: Train[]): string | null {
  const rs = trains.map((s) => reasonText(s.reason)).filter((r): r is string => !!r)
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
    // line, there may just be a long gap. Claude's draft wording, for John.
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
  // The last two hours, on a new line, only when they were bad (N5).
  if (a.worse) lines.push({ text: lastTwoLines(a).join(' ') })
  return { kind, lines }
}

/** "because of A and B", or "mostly because of A", or nothing. */
function because(trains: Train[]): string {
  const rs = [...new Set(trains.map((s) => reasonText(s.reason)).filter(Boolean))]
  if (!rs.length) return ''
  if (rs.length <= 2) return `, because of ${rs.join(' and ')}`
  const m = mainReason(trains)
  return m ? `, mostly because of ${m}` : ''
}

export type Row = { time: string; dest: string; operator: string; status: 'cancelled' | 'late' | 'unknown'; what: string; reason: string | null }
export type NextFour = { lines: string[]; rows: Row[]; fold: string | null }

export function nextFour(a: Analysis): NextFour | null {
  if (a.verdict === 'none') return null
  const n = a.ahead.length
  const v = (k: number) => (k === 1 ? 'is' : 'are')
  const lines = [n === 1 ? `There's one train from ${a.from} to ${a.to} in the next four hours.` : `There are ${num(n)} trains from ${a.from} to ${a.to} in the next four hours.`]
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
    }
  })
  const fold = !rows.length ? null : rows.length === 1 ? "Show the train that isn't on time" : `Show the ${num(rows.length)} trains that aren't on time`
  return { lines: [lines[0], lines.slice(1).join(' ')].filter(Boolean), rows, fold }
}

export function platforms(a: Analysis): string | null {
  if (a.verdict === 'none') return null
  if (!a.platKnown) return 'No platforms have been announced yet.'
  const [[p1, n1], ...rest] = a.platList
  const and = (xs: string[]) => xs.join(', ').replace(/, ([^,]*)$/, ' and $1')
  // One or two platforms known: say each, not "most" (Claude's drafts, for John).
  const running = a.ahead.filter((s) => !s.cancelled).length
  if (a.platKnown <= 2 && a.platKnown === running) {
    if (a.platKnown === 1) return `At the moment, the train is going from platform ${p1}.`
    return rest.length ? `At the moment, one train is going from platform ${p1} and the other from platform ${rest[0][0]}.` : `At the moment, both trains are going from platform ${p1}.`
  }
  if (a.platKnown === 1) return `So far, a platform has been announced for one train: platform ${p1}.`
  if (a.platKnown === 2) return rest.length ? `So far, platforms have been announced for two trains: platforms ${p1} and ${rest[0][0]}.` : `So far, platforms have been announced for two trains, both platform ${p1}.`
  if (n1 * 2 >= a.platKnown) {
    let s = `At the moment, most trains are going from platform ${p1}`
    if (rest.length === 1) s += `, and ${rest[0][1] === 1 ? 'one' : 'some'} from platform ${rest[0][0]}`
    else if (rest.length > 1) s += `; others from platforms ${and(rest.slice(0, 3).map((x) => x[0]))}`
    return s + '.'
  }
  return `At the moment, trains are going from platforms including ${and(a.platList.slice(0, 4).map((x) => x[0]))}.`
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
  // One train in all (Claude's draft, for John): "It was …".
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

/** The line under the hours (agreed for weekdays; Saturdays and Sundays Claude's draft). */
export function kindLine(kind: DayKind): string {
  if (kind === 'SATURDAY') return 'Today is a Saturday, so this looks at last Saturday (weekdays and Sundays have their own timetables).'
  if (kind === 'SUNDAY') return 'Today is a Sunday, so this looks at last Sunday (weekdays and Saturdays have their own timetables).'
  return 'Today is a weekday, so this looks at the weekdays of the last week (Saturdays and Sundays have their own timetables).'
}

/** The line while it loads (agreed for weekdays; Saturdays and Sundays Claude's draft). */
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
  // No trains (Claude's draft, for John).
  if (!c.n) return `${when}, no trains left ${o.from} for ${o.to} ${between}, as far as National Rail's record shows.`
  const k = c.w3, n = c.n
  if (n === 1) {
    return `${when}, the only train that left ${o.from} ${between} ${k ? 'reached' : "didn't reach"} ${o.to} within three minutes of the timetable.${k ? '' : ' ' + lastWeekOthers(n, c.w3, c.w10, c.w30, c.w120)}`
  }
  const who = k === n && n === 2 ? 'both trains' : k === n ? `all ${num(n)} trains` : k === 0 ? `none of the ${num(n)} trains` : n < 10 ? `${num(k)} of the ${num(n)} trains` : `${share(k, n).bare} of the ${num(n)} trains`
  const first = `${when}, ${who} that left ${o.from} ${between} reached ${o.to} within three minutes of the timetable.`
  let rest = lastWeekOthers(n, c.w3, c.w10, c.w30, c.w120)
  // When none were within three minutes there are no "others" (Claude's draft, for John).
  if (k === 0) rest = rest.replace(/^Of the others,/, 'Of these,').replace(/^The others were/, 'They were')
  return rest ? `${first} ${rest}` : first
}

/** The quote's Share words (SPEC §8.13). */
export const quoteShareText = (author: string, date: Date) => `The quote of the day on Trainchecker for ${dateShort(date)}, from ${author}.`
