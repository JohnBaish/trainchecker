// Every sentence on the page, from analyse.ts's figures. The wording was agreed with John at
// the mock-ups (design/mockups-2026-11-17.md, five rounds of answers; SPEC §8) and is ported
// from design/mockups/sentences.mjs, which made them. scripts/check-rules.ts holds the agreed
// sentences for the real snapshots, so a change of wording fails loudly.
//
// Sentences new in stage 3 (not on the mock-ups) were agreed by John on November 17th 2026 too.

import { diff, isTime, type Analysis, type Train } from './analyse.ts'
import { onceSay, rangeSay } from './timesSaid.ts'
export { rangeSay }

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
/** One to nine as words, 10 and above as digits (house style §13). */
export const num = (n: number) => (Number.isInteger(n) && n >= 0 && n < 10 ? WORDS[n] : n.toLocaleString('en-GB'))
export const Cap = (s: string) => s[0].toUpperCase() + s.slice(1)

/** "10" spelt "ten" when it follows a spelt number closely, within two words (John, November 18th
 *  2026): "nine in ten", "four and ten minutes late". Not a time ("10.30pm"), a platform, or a
 *  band ("10 to 30 minutes late"). */
export function tenAfterWords(s: string): string {
  return s.replace(/\b(one|two|three|four|five|six|seven|eight|nine)\b((?:\s+\S+){0,2}?)\s+10\b(?![.:]\d|\s*[ap]m| to \d)/gi,
    (m, w: string, mid: string) => (/platforms?$/i.test(mid.trim()) ? m : `${w}${mid} ten`))
}

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

/** The part of the day: before midday, before 5pm, after (M1); "tonight" from midnight to 4am
 *  (fresh look 2.4, John, November 18th 2026). */
export function partOfDay(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2))
  if (h < 4) return 'tonight'
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
// In digits from 10 up, by the house number rule (John, November 18th 2026): "19 in 20".
const SHARES: [number, number, string, 'in' | 'of'][] = [[1, 20, 'one in 20', 'in'], [1, 10, 'one in 10', 'in'], [1, 4, 'a quarter', 'of'], [1, 3, 'a third', 'of'],
  [1, 2, 'half', 'of'], [2, 3, 'two thirds', 'of'], [3, 4, 'three quarters', 'of'], [9, 10, 'nine in 10', 'in'], [19, 20, '19 in 20', 'in']]
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
  const c = L.cancelled.length
  if (L.known === 1) {
    // One train (only when fewer than three have arrived): "The only train leaving A in the last
    // couple of hours got to B within three minutes of its planned time." (John, November 18th 2026.)
    // With cancellations, "The only train that ran from A…" (John), as "only" would jar beside them.
    const lead = `The only train ${c ? 'that ran from' : 'leaving'} ${a.from} in the last couple of hours`
    const done = L.tense === 'past'
    out.push(L.within3
      ? `${lead} ${done ? 'got to' : 'is expected to get to'} ${a.to} within three minutes of its planned time.`
      : `${lead} ${done ? 'was' : 'is expected to be'} ${num(L.worst!)} minutes late getting to ${a.to}.`)
  } else if (L.known) {
    // The share first, then the trains (John, November 18th 2026): "All four trains leaving A…",
    // "Five of the nine trains leaving A…", "About three quarters of the trains leaving A…", but
    // "None of the four trains that left A…". With three or more arrived, only those are counted
    // ("on this route"); with cancellations as well, "that ran on this route" (so the cancelled
    // ones aren't read as part of the share), and "Two more didn't run at all."
    const sh = share(L.within3, L.known)
    const one = L.within3 === 1 && L.known < 10 // "One of the nine trains … is expected to reach"
    const planned = 'within three minutes of their planned time.'
    if (L.byArrivals) {
      out.push(`${Cap(sh.trains)} ${c ? 'that ran ' : ''}on this route in the last couple of hours reached ${a.to} ${planned}`)
    } else {
      const reach = {
        past: `reached ${a.to}`,
        future: `${one ? 'is' : 'are'} expected to reach ${a.to}`,
        // "have reached (or look like they will reach) B" (John, November 18th 2026).
        mixed: `${one ? 'has reached (or looks like it will reach)' : 'have reached (or look like they will reach)'} ${a.to}`,
      }[L.tense]
      out.push(`${Cap(sh.trains)} ${L.within3 === 0 ? 'that left' : 'leaving'} ${a.from} in the last couple of hours ${reach} ${planned}`)
    }
    const n = L.lates.length, them = L.within3 === 0 ? 'They' : n === 1 ? 'The other' : n === 2 ? 'The other two' : 'The others'
    // "Expected" once in the paragraph; after that "set to be", so it isn't repeated (John, November
    // 18th 2026). Only the first sentence of trains still on their way says "expected" now.
    const exp = !L.byArrivals && L.tense === 'future'
    const toBe = (k: number) => (exp ? (k === 1 ? 'is set to be' : 'are set to be') : (k === 1 ? 'is expected to be' : 'are expected to be'))
    const was = { past: n === 1 ? 'was' : 'were', future: toBe(n), mixed: n === 1 ? 'was, or is set to be,' : 'were, or are set to be,' }[L.tense]
    // One or two late: each one's own tense, as we know whether it has arrived (John).
    const own = (i: number) => (L.lateArrived[i] ? 'was' : toBe(1))
    if (n === 1) out.push(`${them} ${own(0)} ${num(L.worst!)} minutes late.`)
    else if (n === 2 && L.lateArrived[0] !== L.lateArrived[1]) {
      const [x, y] = L.lateArrived[0] ? [0, 1] : [1, 0]
      out.push(`${L.within3 === 0 ? 'One' : 'Of the other two, one'} ${own(x)} ${num(L.lates[x])} minutes late and the other ${own(y)} ${num(L.lates[y])} minutes late.`)
    } else if (n === 2) out.push(`${them} ${L.lateArrived[0] ? 'were' : toBe(2)} ${num(L.lates[0])} and ${num(L.lates[1])} minutes late.`)
    else if (n > 2) {
      // The range, and where most fell when it's wide (John, November 18th 2026): "The others were
      // between four and 23 minutes late, most of them less than 10." The middle figure read as
      // typical when it wasn't ("mostly about 23").
      const lo = L.lates[0], hi = L.worst!
      const most = hi - lo > 10 ? [10, 15, 20, 30, 60].find((t) => t < hi && L.lates.filter((l) => l < t).length > n / 2) : undefined
      out.push(lo === hi ? `${them} ${was} ${num(lo)} minutes late.` : `${them} ${was} between ${num(lo)} and ${num(hi)} minutes late${most ? `, most of them less than ${num(most)}` : ''}.`)
    }
  }
  // "Two more didn't run at all." whenever trains are counted before it (John, November 18th 2026).
  if (c) out.push(!L.known ? `${Cap(num(c))} ${c === 1 ? 'train was' : 'trains were'} cancelled.` : `${Cap(num(c))} more didn't run at all.`)
  return out.map(tenAfterWords)
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
      // After midnight the first trains run later today, not "tomorrow" (fresh look 2.4).
      return {
        kind: 'none', lines: [
          { text: `The last direct train from ${a.from} to ${a.to} seems to have gone: the latest left at ${gone}, and there isn't another in the next four hours.` },
          { text: `Trainchecker looks four hours ahead, so check again later for the first trains ${h < 4 ? 'of the day' : 'tomorrow'}.` },
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
        { text: 'Trainchecker only covers direct journeys – please try another.' },
      ],
    }
  }
  const lines: Line[] = []
  const kind = a.verdict
  if (kind === 'good') {
    lines.push({ bold: 'Good news:', text: a.worse ? ` ${journey} are leaving on time ${when}.` : ` ${journey} are running well ${when}.` })
  } else if (kind === 'mixed' && a.byNext) {
    lines.push({ bold: "It's a mixed bag:", text: ` most ${journey} are running ${when}, but ${nextSaid(a, 'present')}` })
  } else if (kind === 'mixed') {
    const bits: string[] = []
    if (a.cancelled.length) bits.push(`${num(a.cancelled.length)} ${a.cancelled.length === 1 ? 'is' : 'are'} cancelled`)
    const late = a.late5.length + a.unknown.length
    if (late) bits.push(`${num(late)} ${late === 1 ? 'is' : 'are'} running late`)
    lines.push({ bold: "It's a mixed bag:", text: ` most ${journey} are running ${when}, but ${bits.join(' and ').replace(/^(\w+)/, `$1 of the ${num(a.ahead.length)} in the next four hours`)}.` })
  } else {
    lines.push({ bold: 'Be prepared:', text: ` ${journey} ${a.badly ? 'are badly disrupted' : 'are disrupted'} ${when}.${preparedCounts(a, 'present')}${arrivingNow(a, 'present')}` })
  }
  // The last two hours are never in the verdict now: they stay in their own box, and when they
  // were bad, "Good news" says "leaving on time" instead of "running well" (John, November 17th
  // 2026, stage 4; replaces N5).
  return { kind, lines: lines.map((l) => ({ ...l, text: tenAfterWords(l.text) })) }
}

/** "the next one to leave, originally scheduled for 8.03pm, is running 18 minutes late. It's now expected to go at
 *  8.21pm." (John, November 26th 2026: we're often checking after a train's booked time, so its booked and expected
 *  times both need saying), then any other train not on time as a sentence of its own ("One more is cancelled.").
 *  "A mixed bag" because of the train that will leave next. Ends with a full stop. */
function nextSaid(a: Analysis, tense: 'present' | 'past'): string {
  const t = a.nextBad!
  const past = tense === 'past'
  const is = past ? 'was' : 'is'
  // "Delayed" is Claude's draft in John's pattern.
  // Cancelled (John, November 26th 2026): said only until its booked time, when it moves into the last two hours.
  const what = t.cancelled ? `the train scheduled to leave at ${t12(t.std)} was cancelled.`
    : t.unknown ? `the next one to leave, originally scheduled for ${t12(t.std)}, ${is} delayed, with no new time given yet.`
    : `the next one to leave, originally scheduled for ${t12(t.std)}, ${is} running ${num(t.late!)} minutes late. ${past ? 'It was then' : 'It\'s now'} expected to go at ${t12(t.etd!)}.`
  const others = [...a.cancelled, ...a.late5, ...a.unknown].filter((x) => x.id !== t.id)
  const c = others.filter((x) => x.cancelled).length, l = others.length - c
  const be = (k: number) => (past ? (k === 1 ? 'was' : 'were') : k === 1 ? 'is' : 'are')
  const more = !others.length ? '' : ` ${Cap(num(others.length))} more ${be(others.length)} ${!l ? 'cancelled' : !c ? 'running late' : 'cancelled or running late'}.`
  return what + more
}

/** How many of n: "all four", "both", or the number (fresh look 2.3). */
const howMany = (k: number, n: number) => (k === n ? (n === 2 ? 'both' : `all ${num(n)}`) : num(k))

/** "Be prepared"'s counts: " Of the next six, two are cancelled and all six are running late,
 *  mostly because of …", saying only what applies, and nothing when no train is cancelled or late
 *  (fresh look 2.1 and 2.3: never "zero are cancelled"). Late includes "Delayed" with no time. */
function preparedCounts(a: Analysis, tense: 'present' | 'past'): string {
  const n = a.ahead.length, c = a.cancelled.length, l = a.late5.length + a.unknown.length
  const be = (k: number) => (tense === 'past' ? (k === 1 ? 'was' : 'were') : k === 1 ? 'is' : 'are')
  const bits: string[] = []
  if (c) bits.push(`${howMany(c, n)} ${be(c)} cancelled`)
  if (l) bits.push(`${howMany(l, n)} ${be(l)} running late`)
  if (!bits.length) return ''
  const r = mainReason([...a.cancelled, ...a.late5])
  return ` Of the next ${num(n)}, ${bits.join(' and ')}${r ? `, mostly because of ${r}` : ''}.`
}

/** When someone arriving at the station now would reach B 45 minutes or more late (the rule for
 *  "badly disrupted"), say so, as nothing else on the page may (fresh look 2.2). */
function arrivingNow(a: Analysis, tense: 'present' | 'past'): string {
  const g = a.why.gap
  if (g === null || g < 45) return ''
  const m = num(Math.round(g / 5) * 5)
  return tense === 'present'
    ? ` Someone arriving at the station now is expected to reach ${a.to} about ${m} minutes later than the timetable says.`
    : ` Someone arriving at the station then was expected to reach ${a.to} about ${m} minutes later than the timetable said.`
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
const perHour = (k: number, h = 4) => (k % h ? 'about ' : '') + num(Math.round(k / h))

/** The first line of "The next four hours" with more than eight trains (John, November 18th 2026):
 *  "There are about eight fast trains an hour from Reading to London Paddington in the next four
 *  hours, about two slower ones an hour (taking about 40 minutes) and three an hour on the Elizabeth
 *  Line." "An hour" after every group (John, November 18th 2026); one "and"; journey times only for the groups in the middle (people know the fastest
 *  and slowest). A group of fewer than four trains: "three on the Elizabeth Line in that time"
 *  (Claude's draft). */
export function trainsAnHour(a: Analysis, h = 4, span = 'in the next four hours', short = false): string | null {
  if (a.ahead.length <= 2 * h) return null
  const gs = speedGroups(a)
  // In the shorter wording (the later panel; John, November 24th 2026), when any group has fewer than one
  // train an hour, every group is said as a total ("There's one fast train and nine slower ones."),
  // never totals and "an hour" mixed.
  const totals = short && gs.some((g) => g.k < h)
  const phrase = (g: Group, i: number) => {
    const few = totals || g.k < h
    const n = few ? num(g.k) : perHour(g.k, h)
    const one = few ? g.k === 1 : Math.round(g.k / h) === 1
    const time = i > 0 && i < gs.length - 1 ? ` (taking about ${num(Math.round(g.mins / 5) * 5)} minutes)` : ''
    // "An hour" after every group (John, November 18th 2026), so no figure can be read as a total.
    const all = few && !totals && i > 0 ? ' in that time' : ''
    const hr = few ? '' : ' an hour'
    if (g.kind === 'elizabeth') return `${n}${hr} on the Elizabeth Line${all}${time}`
    const co = g.company ? `${g.company} ` : ''
    const adj = g.kind === 'all' ? '' : `${g.kind} `
    if (i === 0) return `${n} ${adj}${co}${one ? 'train' : 'trains'}${few ? '' : ' an hour'}${short ? '' : ` from ${a.from} to ${a.to} ${span}`}`
    return `${n} ${adj}${co}${one ? (co ? 'train' : 'one') : (co ? 'trains' : 'ones')}${hr}${all}${time}`
  }
  const single = totals ? gs[0].k === 1 : gs[0].k === 1 || (gs[0].k >= h && Math.round(gs[0].k / h) === 1)
  if (short && !totals) {
    // "There's about one fast train and five slower ones per hour." (John, November 24th 2026): the
    // rate said once at the end, "about" once at the start when any figure is rounded.
    const about = gs.some((g) => g.k % h) ? 'about ' : ''
    const rate = gs.map((g, i) => {
      const n = num(Math.round(g.k / h)), one = Math.round(g.k / h) === 1
      const time = i > 0 && i < gs.length - 1 ? ` (taking about ${num(Math.round(g.mins / 5) * 5)} minutes)` : ''
      if (g.kind === 'elizabeth') return `${n} on the Elizabeth Line${time}`
      const co = g.company ? `${g.company} ` : ''
      const adj = g.kind === 'all' ? '' : `${g.kind} `
      if (i === 0) return `${n} ${adj}${co}${one ? 'train' : 'trains'}`
      return `${n} ${adj}${co}${one ? (co ? 'train' : 'one') : (co ? 'trains' : 'ones')}${time}`
    })
    const rl = rate.length > 1 ? `${rate.slice(0, -1).join(', ')} and ${rate[rate.length - 1]}` : rate[0]
    return `${single ? "There's" : 'There are'} ${about}${rl} per hour.`
  }
  const ps = gs.map(phrase)
  const list = ps.length > 1 ? `${ps.slice(0, -1).join(', ')} and ${ps[ps.length - 1]}` : ps[0]
  return short ? `${single ? "There's" : 'There are'} ${list}.` : `There ${single ? 'is' : 'are'} ${list}.`
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

/** The first and later panels (windows.ts) pass their own opening line (November 24th 2026). */
/** `more`: the opening counted only the trains running, so the cancelled ones are "more" ("Seven more in
 *  that time are cancelled", John, November 24th 2026); its text goes after "more" (" in that time" or ""). */
export type Span = { first: string | null; hours?: number; span?: string; short?: boolean; more?: string }
export function nextFour(a: Analysis, o?: Span): NextFour | null {
  if (a.verdict === 'none' || !a.ahead.length) return null
  const n = a.ahead.length
  const v = (k: number) => (k === 1 ? 'is' : 'are')
  const lines = [o ? (o.hours ? trainsAnHour(a, o.hours, o.span, o.short) : null) ?? o.first ?? '' : trainsAnHour(a) ?? (n === 1 ? `There's one train from ${a.from} to ${a.to} in the next four hours.` : `There are ${num(n)} trains from ${a.from} to ${a.to} in the next four hours.`)]
  // Trains leaving on time but expected at B more than five minutes late are said apart (fresh
  // look 2.2), so this never says they're all on time under "badly disrupted".
  const onTime = a.ahead.filter((s) => s.late !== null && s.late <= 3 && !a.arrLate.includes(s)).length
  const little = a.ahead.filter((s) => s.late !== null && s.late > 3 && s.late <= 5 && !a.arrLate.includes(s))
  // "…expected to be on time", like "expected to be more than five minutes late" (John, November 18th 2026).
  if (onTime === n) lines.push(n === 1 ? "It's expected to be on time." : n === 2 ? 'Both of them are expected to be on time.' : "They're all expected to be on time.")
  else {
    const g: [number, string][] = []
    const more = o?.more !== undefined && a.cancelled.length < n
    if (a.cancelled.length) g.push([a.cancelled.length, `${more ? `more${o!.more} ` : ''}${v(a.cancelled.length)} cancelled${because(a.cancelled)}`])
    if (a.late5.length) g.push([a.late5.length, `${v(a.late5.length)} expected to be more than five minutes late${because(a.late5)}`])
    if (a.arrLate.length) g.push([a.arrLate.length, `${v(a.arrLate.length)} expected to leave on time but reach ${a.to} more than five minutes late${because(a.arrLate)}`])
    if (little.length) g.push([little.length, `${v(little.length)} expected to be a few minutes late`])
    if (a.unknown.length) g.push([a.unknown.length, `${v(a.unknown.length)} delayed with no time given yet`])
    // "All four are cancelled" when every train is (fresh look 2.3).
    const ps = g.map(([k, t]) => `${k === n && g.length === 1 ? howMany(k, n) : num(k)} ${t}`)
    let s = ps.length > 1 ? `${ps.slice(0, -1).join(', ')}, and ${ps[ps.length - 1]}` : ps[0]
    s = g[0][0] >= 10 && !(more && a.cancelled.length) ? `Of these, ${s}.` : `${Cap(s)}.`
    lines.push(s)
    if (onTime) lines.push(onTime === 1 ? 'The other one is expected to be on time.' : 'The rest are expected to be on time.')
  }
  const rows: Row[] = [...a.cancelled, ...a.late5, ...a.arrLate, ...a.unknown].sort((x, y) => x.rel - y.rel).map((s) => {
    const r = reasonText(s.reason)
    const arr = a.arrLate.includes(s)
    return {
      time: t12(s.std), dest: s.destination, operator: s.operator,
      status: s.cancelled ? 'cancelled' : s.unknown ? 'unknown' : 'late',
      what: s.cancelled ? 'Cancelled' : s.unknown ? 'Delayed, no time given yet'
        : arr ? `Expected at ${a.to} ${t12(s.eta!)}, ${diff(s.sta!, s.eta!)} minutes late` : `Expected ${t12(s.etd!)}, ${s.late} minutes late`,
      reason: r ? Cap(r) + '.' : null,
      why: why(s.reason, s.operator),
    }
  })
  const fold = !rows.length ? null : rows.length === 1 ? "Show the train that isn't on time" : `Show the ${num(rows.length)} trains that aren't on time`
  return { lines: [lines[0], lines.slice(1).join(' ')].filter(Boolean).map(tenAfterWords), rows, fold }
}
export { because as becauseOf }

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
  // The same platforms for every kind (Tiverton Parkway: "platform 2, with slower ones using platform
  // 2", John): nothing to tell apart, so the plain sentence instead.
  if (parts.length < 2 || parts.every((p) => p.text === parts[0].text)) return null
  const name = (k: Group['kind'], first: boolean) => (k === 'elizabeth' ? 'Elizabeth Line trains' : k === 'fast' ? 'fast trains' : first ? 'slower trains' : 'slower ones')
  const [f, ...rest] = parts
  const others = rest.map((p) => `${name(p.kind, false)} ${p.most ? 'mostly ' : ''}using ${p.text}`)
  return `${f.most ? 'Most ' : ''}${f.most ? name(f.kind, true) : Cap(name(f.kind, true))} ${f.most ? 'are' : 'are'} currently going from ${f.text}, with ${others.length > 1 ? `${others.slice(0, -1).join(', ')} and ${others[others.length - 1]}` : others[0]}.`
}

/** Trains still to leave before the first train with a platform, with no platform yet (John,
 *  November 22nd 2026: at Paddington the Elizabeth Line's platform is shown an hour ahead, the main
 *  line's much nearer the time, so a list of trains with platforms can start an hour after the next
 *  train). In the order they're expected to leave. */
export function earlierNoPlatform(a: Analysis): Train[] {
  const leaves = (t: Train) => diff(a.now, t.late !== null && t.late > 0 && isTime(t.etd) ? t.etd : t.std)
  const running = a.ahead.filter((t) => !t.cancelled)
  const withP = running.filter((t) => t.platform)
  if (!withP.length) return []
  const first = Math.min(...withP.map(leaves))
  return running.filter((t) => !t.platform && leaves(t) < first).sort((x, y) => leaves(x) - leaves(y))
}

/** The line above the list of trains with platforms (option A, John, November 22nd 2026): "Five
 *  earlier trains, at 7.36am, 7.38, 7.50, 7.51 and 7.53, don't have platforms yet." More than six:
 *  the first and last times (Claude's choice, so the line stays short). */
export function earlierLine(a: Analysis): string | null {
  const ts = earlierNoPlatform(a)
  if (!ts.length) return null
  const say = clockSay()
  const raw = ts.map((t) => (t.late !== null && t.late > 0 && isTime(t.etd) ? t.etd : t.std))
  const times = raw.map(say)
  if (ts.length === 1) return `One earlier train, at ${times[0]}, doesn't have a platform yet.`
  const when = ts.length > 6 ? `from ${rangeSay(t12(raw[0]), t12(raw[raw.length - 1]))}` : `at ${andList(times)}`
  return tenAfterWords(`${Cap(num(ts.length))} earlier trains, ${when}, don't have platforms yet.`)
}

/** "So far, …" when earlier trains have no platform yet (John, November 22nd 2026): "So far,
 *  platforms have only been announced for the Elizabeth Line trains, which are going from platform
 *  B." or "So far, platforms have only been announced for later trains: from 8.15am, all from
 *  platform B." */
function soFarLater(a: Analysis): string | null {
  if (!earlierNoPlatform(a).length) return null
  const known = a.ahead.filter((t) => !t.cancelled && t.platform)
  const used = new Set(known.map((t) => t.platform!))
  const base = (p: string) => { const m = p.match(/^(\d+)[A-Z]$/); return m && used.has(m[1]) ? m[1] : p }
  const counts = new Map<string, number>()
  for (const t of known) counts.set(base(t.platform!), (counts.get(base(t.platform!)) ?? 0) + 1)
  const top = [...counts].sort((x, y) => y[1] - x[1])
  const sorted = (ps: string[]) => [...ps].sort((x, y) => parseInt(x) - parseInt(y) || x.localeCompare(y))
  const and = (xs: string[]) => xs.join(', ').replace(/, ([^,]*)$/, ' and $1')
  const where = (all: boolean) => top.length === 1 ? `${all ? 'all ' : ''}from platform ${top[0][0]}`
    : top.length === 2 ? `from platforms ${and(sorted(top.map((x) => x[0])))}`
    : top[0][1] * 2 >= known.length ? `mostly from platform ${top[0][0]}`
    : `from platforms including ${and(top.slice(0, 4).map((x) => x[0]))}`
  const groups = speedGroups(a).filter((g) => g.kind !== 'all')
  const withP = groups.filter((g) => g.trains.some((t) => !t.cancelled && t.platform))
  if (groups.length > 1 && withP.length === 1) {
    const name = { fast: 'fast trains', slower: 'slower trains', elizabeth: 'Elizabeth Line trains' }[withP[0].kind as 'fast' | 'slower' | 'elizabeth']
    return `So far, platforms have only been announced for the ${name}, which are going ${where(false)}.`
  }
  const leaves = (t: Train) => diff(a.now, t.late !== null && t.late > 0 && isTime(t.etd) ? t.etd : t.std)
  const first = [...known].sort((x, y) => leaves(x) - leaves(y))[0]
  const at = first.late !== null && first.late > 0 && isTime(first.etd) ? first.etd : first.std
  return `So far, platforms have only been announced for later trains: from ${t12(at)}, ${where(true)}.`
}

export function platforms(a: Analysis): string | null {
  if (a.verdict === 'none') return null
  // Every train cancelled: no platforms to wait for (fresh look 2.3).
  if (a.ahead.every((s) => s.cancelled)) return a.ahead.length === 1 ? "This train is cancelled, so there's no platform to show." : 'None of these trains is running, so there are no platforms to show.'
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
  if (a.platKnown === 1) return `So far, a platform has only been announced for one train: platform ${p1}.`
  if (a.platKnown === 2) return rest.length ? `So far, platforms have been announced for two trains: platforms ${p1} and ${rest[0][0]}.` : `So far, platforms have been announced for two trains, both platform ${p1}.`
  const later = soFarLater(a)
  if (later) return later
  const byKind = platformsByKind(a)
  if (byKind) return byKind
  // Every announced train from one platform: no "Most" (John, November 18th 2026).
  if (!rest.length) return `Trains are currently going from platform ${p1}.`
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
  if (a.verdict === 'none' && a.lastGone) return { text: `Here's what Trainchecker found at ${at}: the last direct train from ${a.from} to ${a.to} had gone, at ${t12(a.lastGone.std)}, with no other in the next four hours.`, title, hash }
  if (a.verdict === 'none') return { text: `Here's what Trainchecker found at ${at}: no direct train from ${a.from} to ${a.to} in the next four hours.`, title, hash }
  // The verdict first (John, November 24th 2026): "Good news, when the trains … were checked at
  // 6.39am on November 24th they were running well."; "It's a mixed bag for trains …, according to
  // a check at …"; "Be prepared for the train journey from … At … a check showed that, …".
  const was = (k: number) => (k === 1 ? 'was' : 'were')
  let text: string
  if (a.verdict === 'good') {
    const L = a.last
    const why = !a.worse ? '' : L.known && L.within3 / L.known < 0.75
      ? `, though only ${share(L.within3, L.known).bare} of the trains in the couple of hours before got there within three minutes of their planned time`
      : `, though ${num(L.cancelled.length)} trains were cancelled in the couple of hours before`
    text = `Good news, when the trains from ${a.from} to ${a.to} were checked at ${at} they were ${a.worse ? 'leaving on time' : 'running well'}${why}.`
  } else if (a.verdict === 'mixed' && a.byNext) {
    text = `It's a mixed bag for trains from ${a.from} to ${a.to}, according to a check at ${at}. Most were running, but ${nextSaid(a, 'past')}`
  } else if (a.verdict === 'mixed') {
    const bits: string[] = []
    if (a.cancelled.length) bits.push(`${num(a.cancelled.length)} ${was(a.cancelled.length)} cancelled`)
    const late = a.late5.length + a.unknown.length
    if (late) bits.push(`${num(late)} ${was(late)} running late`)
    text = `It's a mixed bag for trains from ${a.from} to ${a.to}, according to a check at ${at}. Most were running, but ${bits.join(' and ').replace(/^(\w+)/, `$1 of the ${num(a.ahead.length)} in the next four hours`)}.`
  } else {
    // The same counts as the verdict, never "zero were cancelled" (fresh look 2.1).
    const n = a.ahead.length
    const counts = preparedCounts(a, 'past').replace(/^ Of the next (\w+),/, (_m, w) => ` of the next ${w}${n === 1 ? '' : ' trains'},`)
    const now = arrivingNow(a, 'past')
    const showed = counts ? `a check showed that,${counts}${now}` : now ? `a check showed that ${now.trim().replace(/^S/, 's')}` : ''
    text = `Be prepared for the train journey from ${a.from} to ${a.to}.` + (showed ? ` At ${at} ${showed}` : ` That's according to a check at ${at}.`)
  }
  return { text: tenAfterWords(text + ' From Trainchecker.'), title, hash }
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
  // Few trains (up to 20 not on time; fewer than 10 until the fresh look, 6.3): counts, following on from the on-time ones (John,
  // November 18th 2026): "Another two were less than 10 minutes late, and the other one was 10 to
  // 30 minutes late."; "One more was…"; "The other three were…"; with none on time, "One was less
  // than 10 minutes late, and the other three were 10 to 30 minutes late."
  if (others <= 20) {
    const was = (k: number) => (k === 1 ? 'was' : 'were')
    if (groups.length === 1) {
      if (others === 1) return `The other was ${groups[0][1]}.`
      return w3 ? `The other ${num(others)} were ${groups[0][1]}.` : `They were all ${groups[0][1]}.`
    }
    const [[c1, b1], ...more] = groups
    const lead = w3 ? (c1 === 1 ? 'One more' : `Another ${num(c1)}`) : Cap(num(c1))
    if (more.length === 1) {
      const [c2, b2] = more[0]
      return `${lead} ${was(c1)} ${b1}, and the other ${c2 === 1 ? 'one' : num(c2)} ${was(c2)} ${b2}.`
    }
    const ps = [`${lead} ${was(c1)} ${b1}`, ...more.map(([k, t]) => `${num(k)} ${was(k)} ${t}`)]
    return `${ps.slice(0, -1).join(', ')} and ${ps[ps.length - 1]}.`
  }
  // More than 20: rounded shares, and "the rest" (John: kept, as the shares are approximate).
  if (groups.length === 1) return `The others were ${groups[0][1]}.`
  const [first, ...rest] = groups
  const sh = share(first[0], others).bare
  const v = 'were'
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
  // John, November 18th 2026: the bracket a sentence of its own, with its full stop inside.
  if (kind === 'SATURDAY') return "Today is a Saturday, so that's what this checks. (Weekdays and Sundays have their own timetables.)"
  if (kind === 'SUNDAY') return "Today is a Sunday, so that's what this checks. (Weekdays and Saturdays have their own timetables.)"
  return "Today is a weekday, so that's what this checks. (Saturdays and Sundays have their own timetables.)"
}

/** The line while it loads (agreed for weekdays; Saturdays and Sundays agreed by John, November 17th 2026). */
export function loadingLine(kind: DayKind, hour: number): string {
  const h = hourLabel(hour).replace(' to ', ' and ')
  if (kind === 'WEEKDAY') return `Fetching weekday trains between ${h} over the last week from National Rail. This usually takes less than a minute.`
  return `Fetching last ${kind === 'SATURDAY' ? 'Saturday' : 'Sunday'}’s trains between ${h} from National Rail. This usually takes less than a minute.`
}

/** The result (John's wording, O4 and Q1, revised November 18th 2026): "On the weekdays from last
 *  Tuesday until yesterday, about a third of the 26 trains leaving Reading between 5pm and 5.30pm
 *  got to London Paddington within three minutes of their planned time. Of the others, …" */
/** `noun` names the trains when the result is for one kind ("Great Western Railway trains",
 *  "Elizabeth Line trains": John, November 18th 2026). */
export function lastWeekText(c: WeekCounts, o: { from: string; to: string; kind: DayKind; days: Date[]; start: string; end: string; noun?: [string, string] }): string {
  const [one, many] = o.noun ?? ['train', 'trains']
  const between = `between ${rangeSay(t12(o.start), t12(o.end), ' and ')}`
  const ds = o.days
  // The days as we'd say them (John, November 18th 2026; no dates): "Last Saturday", "From last
  // Monday to Friday" (on a Monday), "On the weekdays from last Wednesday until yesterday".
  const when = o.kind === 'SATURDAY' ? 'Last Saturday' : o.kind === 'SUNDAY' ? 'Last Sunday'
    : weekday(ds[0]) === 'Monday' ? 'From last Monday to Friday' : `On the weekdays from last ${weekday(ds[0])} until yesterday`
  // No trains (agreed by John, November 17th 2026).
  if (!c.n) return `${when}, no ${many} left ${o.from} for ${o.to} ${between}, as far as National Rail's record shows.`
  // A cancelled train didn't leave (John, November 18th 2026): the share is of the trains that ran,
  // and the cancelled ones (missing even the 120-minute margin) get a sentence of their own.
  const cancelled = c.n - c.w120, n = c.w120, k = c.w3
  const more = cancelled ? ` ${Cap(num(cancelled))} more ${cancelled === 1 ? 'was' : 'were'} cancelled.` : ''
  if (!n) return `${when}, ${cancelled === 1 ? `the only ${one} due to leave` : cancelled === 2 ? `both ${many} due to leave` : `all ${num(cancelled)} ${many} due to leave`} ${o.from} ${between} ${cancelled === 1 ? 'was' : 'were'} cancelled.`
  if (n === 1) {
    // "…the only train leaving A between 11am and midday got to B within three minutes of its planned
    // time." / "…was less than 10 minutes late getting to B."; "that ran from" with cancellations (John).
    const lead = `${when}, the only ${one} ${cancelled ? 'that ran from' : 'leaving'} ${o.from} ${between}`
    const late = lastWeekOthers(1, c.w3, c.w10, c.w30, c.w120).replace(/^It was (.*)\.$/, '$1')
    return tenAfterWords(`${lead} ${k ? `got to ${o.to} within three minutes of its planned time.` : `was ${late} getting to ${o.to}.`}${more}`)
  }
  // The share as in the last two hours (John, November 18th 2026): "all five trains leaving A",
  // "none of the four trains that left A"; "38 of the 40" rather than "about 19 in 20 of the 40".
  const sh = share(k, n)
  const counted = /\bin\b/.test(sh.bare) ? `${num(k)} of the ${num(n)} ${many}` : `${sh.bare} of the ${num(n)} ${many}`
  const who = k === n && n === 2 ? `both ${many}` : k === n ? `all ${num(n)} ${many}` : k === 0 ? `none of the ${num(n)} ${many}` : n < 10 ? `${num(k)} of the ${num(n)} ${many}` : counted
  const first = `${when}, ${who} ${k === 0 ? 'that left' : 'leaving'} ${o.from} ${between} got to ${o.to} within three minutes of their planned time.`
  let rest = lastWeekOthers(n, c.w3, c.w10, c.w30, c.w120)
  // When none were within three minutes there are no "others" (agreed by John, November 17th 2026).
  if (k === 0) rest = rest.replace(/^Of the others,/, 'Of these,').replace(/^The others were/, 'They were all')
  return tenAfterWords(`${first}${rest ? ' ' + rest : ''}${more}`)
}

// ---- The trains with platforms, and arrivals (John, November 18th 2026) ----

export const andList = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0])

/** A list as the page lays it out (John's option D, November 18th 2026): a lead line, then the
 *  times in bold, each with something to say on its own line, the rest run together with dots. */
export type TimeRow = { time: string; note?: string }
export type ListBlock = { lead: string; rows: TimeRow[]; head?: boolean }
export type Listing = { text: string; blocks: ListBlock[] | null; after: string | null; prose: string }

/** Times in reading order, "am" or "pm" said once and again only when it changes; on the hour it
 *  stays ("9pm"), as a bare "9" could read as a count (John, November 18th 2026). */
export function clockSay() {
  const once = onceSay()
  return (hhmm: string) => once(t12(hhmm))
}
const said = (r: TimeRow) => `${r.time}${r.note ? ` (${r.note})` : ''}`

/** The timetabled time beside the time a train is now expected (John, November 20th 2026: the big
 *  time is the one to act on, "was due 12.47" beside it). "am" or "pm" said once: left off when it
 *  matches the expected time's, kept across midday or midnight ("was due 11.58am" by 12.04pm). */
export function dueSay(now: string, due: string): string {
  const d = t12(due), m = d.match(/^(.*\.\d\d)(am|pm)$/)
  return m && t12(now).endsWith(m[2]) ? m[1] : d
}

/** The fold under "Platforms": the next ten trains with a platform, cancelled ones left out, in the
 *  order they're expected to leave; fast, slower and Elizabeth Line trains apart when the Platforms
 *  sentence groups them. Null when none has a platform. */
export function platformTrains(a: Analysis): (Listing & { fold: string }) | null {
  const leaves = (t: Train) => diff(a.now, t.late !== null && t.late > 0 && isTime(t.etd) ? t.etd : t.std)
  const ts = a.ahead.filter((t) => !t.cancelled && t.platform).sort((x, y) => leaves(x) - leaves(y))
  if (!ts.length) return null
  const first = ts.slice(0, 10), limited = ts.length > first.length
  // "Delayed" with no time: not leaving at its timetabled time, so not in the list; a sentence of
  // its own after it (John, November 18th 2026).
  const shown = first.filter((t) => !t.unknown), held = first.filter((t) => t.unknown)
  // One or two platforms for them all: said once, at the start, and people check which when they get
  // there; "10A" counts as 10 where plain 10 is in use too. Two trains on two platforms keep their own.
  const used = new Set(a.ahead.filter((t) => t.platform && !t.cancelled).map((t) => t.platform!))
  const base = (p: string) => { const m = p.match(/^(\d+)[A-Z]$/); return m && used.has(m[1]) ? m[1] : p }
  const say = clockSay()
  const groupsOf = speedGroups(a).filter((g) => g.kind !== 'all').map((g) => ({ kind: g.kind, ts: shown.filter((t) => g.trains.includes(t)) })).filter((g) => g.ts.length)
  const grouped = groupsOf.length > 1 && groupsOf.reduce((n, g) => n + g.ts.length, 0) === shown.length
  const parts = (grouped ? groupsOf : [{ kind: 'all' as const, ts: shown }]).map((g) => {
    const plats = [...new Set(g.ts.map((t) => base(t.platform!)))].sort((x, y) => parseInt(x) - parseInt(y) || x.localeCompare(y))
    const once = plats.length === 1 || (plats.length === 2 && g.ts.length > 2)
    const rows = g.ts.map((t): TimeRow => {
      const late = t.late !== null && t.late > 0 && isTime(t.etd)
      const bits = [late ? wasDue(t.etd!, t.std) : '', once ? '' : `platform ${t.platform}`].filter(Boolean)
      return { time: say(late ? t.etd! : t.std), note: bits.length ? bits.join(', ') : undefined }
    })
    const where = once ? (plats.length === 1 ? `platform ${plats[0]}` : `platforms ${plats[0]} and ${plats[1]}`) : null
    return { kind: g.kind, rows, where }
  })
  const name = { fast: ['fast train', 'fast trains', 'fast one', 'fast ones'], slower: ['slower train', 'slower trains', 'slower one', 'slower ones'], elizabeth: ['Elizabeth Line train', 'Elizabeth Line trains', 'Elizabeth Line train', 'Elizabeth Line trains'] } as const
  const article = (w: string) => (/^[aeiouAEIOU]/.test(w) ? 'an' : 'a')
  let prose = '', blocks: ListBlock[] = []
  if (!shown.length) { /* only delayed trains: their sentence alone */ }
  else if (grouped) {
    const ps = parts.map((g, i) => {
      const n = name[g.kind as 'fast' | 'slower' | 'elizabeth'], one = g.rows.length === 1
      // With more trains after these ten (John, November 19th 2026): "Of the next ten trains, fast ones…".
      const who = i === 0
        ? (limited ? `Of the next ten trains, ${one ? `${article(n[2])} ${n[2]} is` : `${n[3]} are`} leaving` : one ? `${Cap(article(n[0]))} ${n[0]} is leaving` : `${Cap(n[1])} are leaving`)
        : (one ? `${article(n[2])} ${n[2]}` : n[3])
      return `${who} ${g.where ? `from ${g.where} ` : ''}at ${andList(g.rows.map(said))}`
    })
    prose = `${ps.slice(0, -1).join(', ')}, and ${ps[ps.length - 1]}.`
    blocks = // In bold with no colon, so it doesn't read as a second lead (John, November 19th 2026).
    (limited ? [{ lead: 'The next ten trains', rows: [], head: true }] as ListBlock[] : []).concat(parts.map((g) => {
      const n = name[g.kind as 'fast' | 'slower' | 'elizabeth'], one = g.rows.length === 1
      return { lead: `${one ? `${Cap(article(n[0]))} ${n[0]}` : Cap(n[1])}${g.where ? `, from ${g.where}` : ''}:`, rows: g.rows }
    }))
  } else {
    const g = parts[0], from = g.where ? `from ${g.where} ` : ''
    // More after these ten: "The next ten trains are leaving at:", and no sentence about the rest
    // (John, November 19th 2026).
    const lead = limited ? `The next ten trains are leaving ${from}at` : `There are trains leaving ${from}at`
    prose = shown.length === 1 && !limited ? `There's a train leaving ${from}at ${said(g.rows[0])}.` : `${lead} ${andList(g.rows.map(said))}.`
    blocks = [{ lead: `${lead}:`, rows: g.rows }]
  }
  const sayH = clockSay()
  const heldLine = !held.length ? '' : held.length === 1
    ? `The ${sayH(held[0].std)}, from platform ${held[0].platform}, is delayed, with no new time given yet${because(held)}.`
    : `The ${andList(held.map((t) => `${sayH(t.std)} (platform ${t.platform})`))} are delayed, with no new times given yet${because(held)}.`
  prose = [earlierLine(a) ?? '', prose, heldLine].filter(Boolean).join(' ')
  const after = heldLine || null
  return {
    fold: ts.length === 1 ? 'Show the train with a platform' : 'Show the trains with platforms',
    prose: tenAfterWords(prose), text: tenAfterWords(prose),
    blocks: shown.length > 2 ? blocks.map((b) => ({ ...b, rows: b.rows.map((x) => ({ ...x, note: x.note && tenAfterWords(x.note) })) })) : null, after,
  }
}

/** Arrivals at B from A in the next hour, up to 10, the hour said up front (John, November 18th
 *  2026), the brackets in sequence ("the one due to leave Oxford at 7.30", "the 7.16 from Oxford",
 *  "the 8.08"); trains on their way and still to leave; cancelled ones left out, except that with
 *  none expected a cancelled one is mentioned. On a long journey Trainchecker can't see them all,
 *  so it says what it can see, then a note. */
export function arrivals(a: Analysis): Listing & { heading: string } {
  const heading = `At ${a.to} from ${a.from}`
  const fromNow = (t: string) => diff(a.now, t)
  // From B's arrival board when there is one (November 25th 2026): it sees every train due, however
  // long ago it left A, so the long-journey note isn't needed.
  const pool = a.arr ?? [...a.past, ...a.ahead]
  const longest = Math.max(0, ...pool.filter((t) => t.sta).map((t) => diff(t.std, t.sta!)))
  const partial = !a.arr && longest >= 120
  const note = `Trains that left ${a.from} more than two hours ago aren't included, as Trainchecker can't see them.`
  const when = (t: Train) => (isTime(t.eta) ? t.eta : t.sta!)
  const due = pool.filter((t) => t.sta && !t.ata)
  // "Delayed" with no time: not expected at its timetabled time, so not in the list; a sentence of its
  // own after it, with the reason when there is one (John, November 18th 2026).
  const delayed = (t: Train) => !!t.eta && t.eta !== 'On time' && !isTime(t.eta)
  const coming = due.filter((t) => !t.cancelled && !delayed(t) && fromNow(when(t)) >= 0).sort((x, y) => fromNow(when(x)) - fromNow(when(y)))
  const inHour = coming.filter((t) => fromNow(when(t)) <= 60)
  const held = due.filter((t) => !t.cancelled && delayed(t) && fromNow(t.sta!) >= 0 && fromNow(t.sta!) <= 60).sort((x, y) => fromNow(x.sta!) - fromNow(y.sta!))
  const sayH = clockSay()
  const heldLine = !held.length ? '' : held.length === 1
    ? `The ${sayH(held[0].std)} from ${a.from}, due at ${sayH(held[0].sta!)}, is delayed, with no new time given yet${because(held)}.`
    : !inHour.length
      ? `The trains due in the next hour are delayed, with no new times given yet: ${((xs: string[]) => `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`)(held.map((t, i) => `the ${sayH(t.std)}${i === 0 ? ` from ${a.from}` : ''}, due at ${sayH(t.sta!)}`))}${because(held)}.`
      : `The ${andList(held.map((t) => sayH(t.std)))} from ${a.from}, due at ${andList(held.map((t) => sayH(t.sta!)))}, are delayed, with no new times given yet${because(held)}.`
  const plain = (text: string) => ({ heading, text: tenAfterWords(text), prose: tenAfterWords(text), blocks: null, after: null })
  if (!inHour.length && held.length) return plain(heldLine + (partial ? ' ' + note : ''))
  if (!inHour.length && partial) return plain(`Trainchecker can only see trains that left ${a.from} in the last two hours, so it can't say which trains are expected at ${a.to} in the next hour.`)
  if (!inHour.length) {
    let text = `No direct trains from ${a.from} are expected at ${a.to} in the next hour.`
    const gone = due.filter((t) => t.cancelled && fromNow(t.sta!) >= 0 && fromNow(t.sta!) <= 60).sort((x, y) => fromNow(x.sta!) - fromNow(y.sta!))
    const say = clockSay()
    if (gone.length === 1) text += ` The one due in at ${say(gone[0].sta!)} was cancelled.`
    else if (gone.length > 1) text += ` The ${num(gone.length)} due in at ${andList(gone.map((t) => say(t.sta!)))} were cancelled.`
    // The next one after the hour, so Station exits' list of later trains doesn't seem to argue with
    // this (John agreed, November 22nd 2026; the sentence is Claude's draft).
    if (coming[0]) text += ` The next one is expected at ${t12(when(coming[0]))}.`
    return plain(text)
  }
  const shown = inHour.slice(0, 10), n = inHour.length
  const say = clockSay()
  const rows = shown.map((t, i): TimeRow => {
    const time = say(when(t))
    const which = i === 0 ? `the one due to leave ${a.from} at ${say(t.std)}` : i === 1 ? `the ${say(t.std)} from ${a.from}` : `the ${say(t.std)}`
    const late = isTime(t.eta) ? diff(t.sta!, t.eta) : null
    // The timetabled arrival beside the expected one (John, November 20th 2026; Claude's draft wording).
    const extra = late !== null && late > 0 ? `, ${lateBy(late)}`
      : t.eta && t.eta !== 'On time' && !isTime(t.eta) ? ', delayed with no time given yet' : ''
    return { time, note: tenAfterWords(which + extra) }
  })
  const list = andList(rows.map(said))
  // With delayed trains too, "The only train…" and "There are two trains…" would be untrue.
  const others = held.length > 0
  const lead = partial
    ? (n === 1 ? null : `Trainchecker can see ${num(n)} trains arriving in the next hour. ${n > 10 ? 'The first ten are' : "They're"} expected at`)
    : n > 10 ? 'The first ten trains in the next hour are expected at'
    : n > 2 ? (others ? 'Trains are expected in the next hour at' : 'The trains arriving in the next hour are expected at')
    : n === 2 ? (others ? 'Two trains are expected in the next hour, at' : "There are two trains arriving in the next hour. They're expected at")
    : others ? 'One train is expected in the next hour, at' : 'The only train arriving in the next hour is expected at'
  const prose = (lead === null ? `Trainchecker can see one train arriving in the next hour, expected at ${list}.` : `${lead} ${list}.`) + (heldLine ? ' ' + heldLine : '')
  const after = [heldLine, partial ? note : ''].filter(Boolean).join(' ') || null
  return { heading, prose: tenAfterWords(prose), text: tenAfterWords(prose + (partial ? ' ' + note : '')), blocks: shown.length > 2 && lead ? [{ lead: `${lead}:`, rows }] : null, after }
}

/** The two lists' Share words (Claude's drafts, for John): a line saying what and when, the
 *  sentence, and the journey's link sent separately (house style §17). */
export function listShareWords(a: Analysis, kind: 'platforms' | 'arrivals', prose: string): { text: string; title: string; hash: string } {
  const at = `${t12(a.now)} on ${dateShort(new Date(a.taken))}`
  const head = kind === 'platforms' ? `Here are the trains from ${a.from} to ${a.to} with platforms, as of ${at}.` : `Here are the trains expected at ${a.to} from ${a.from}, as of ${at}.`
  return { text: tenAfterWords(`${head} ${prose} From Trainchecker.`), title: `Trainchecker: ${a.from} to ${a.to}`, hash: `#${a.fromCrs}-${a.toCrs}` }
}

/** The two lists as a picture (John, November 19th 2026): a row per train, in the dark colours.
 *  The big time is the one to act on, when the train is expected to leave or arrive, and a late
 *  one says "was due 12.47, running late" (John, November 20th 2026). Platforms: the kind of train
 *  when the list is grouped, and the platform (said once in the heading when all share one).
 *  Arrivals: "the 8.47pm" from A, its timetabled departure. Delayed trains with no time are rows
 *  of their own. */
export type PicRow = { time: string; mid: string; late: string; platform?: string; lateBy?: number; arrow?: boolean; noPlat?: boolean }
export type ListPicture = {
  kicker: string; title: string; when: string; heads: [string, string] | [string, string, string]
  one: string | null; rows: PicRow[]; note: string | null; words: { text: string; title: string; hash: string }
  /** A line above the rows: earlier trains with no platform yet (John, November 22nd 2026). */
  before?: string | null
  /** "hours": the later panel's hour-by-hour picture (option C, November 24th 2026). */
  layout?: 'hours'
}
// Platforms: "was due to go at 1.42" (the heading says "Expected to leave", so it's plainly late; it
// fits on one line beside the badge on a 390px phone); arrivals: "running 15 minutes late", the train
// named by its departure (John, November 20th 2026).
const wasDue = (now: string, due: string) => `was due to go at ${dueSay(now, due)}`
const lateBy = (k: number) => `running ${num(k)} ${k === 1 ? 'minute' : 'minutes'} late`
// On the arrivals board an arrow points at the big time: "← two minutes late" (John, November 20th
// 2026, option D: closer to what people say; the arrow ties the lateness to the time).
const minutesLate = (k: number) => `${num(k)} ${k === 1 ? 'minute' : 'minutes'} late`
const NO_TIME = 'delayed, no new time yet'

export function platformsPicture(a: Analysis): ListPicture | null {
  const leaves = (t: Train) => diff(a.now, t.late !== null && t.late > 0 && isTime(t.etd) ? t.etd : t.std)
  const ts = a.ahead.filter((t) => !t.cancelled && t.platform).sort((x, y) => leaves(x) - leaves(y))
  if (!ts.length) return null
  const first = ts.slice(0, 10), limited = ts.length > 10
  const groups = speedGroups(a).filter((g) => g.kind !== 'all' && first.some((t) => g.trains.includes(t)))
  const label = { fast: 'Fast', slower: 'Slower', elizabeth: 'Elizabeth Line', all: '' } as const
  // A delayed train with no time: "?" for its time, at the bottom, so the times above run in
  // order (John, November 19th 2026).
  const kindOf = (t: Train) => (groups.length > 1 ? label[groups.find((g) => g.trains.includes(t))?.kind ?? 'all'] : '')
  const rows = [...first.filter((t) => !t.unknown), ...first.filter((t) => t.unknown)].map((t): PicRow => {
    const late = t.late !== null && t.late > 0 && isTime(t.etd)
    if (t.unknown) return { time: '?', mid: [kindOf(t), `the ${t12(t.std)}`].filter(Boolean).join(' · '), late: NO_TIME, platform: t.platform! }
    return { time: t12(late ? t.etd! : t.std), mid: kindOf(t), late: late ? wasDue(t.etd!, t.std) : '', platform: t.platform!, lateBy: late ? t.late! : undefined }
  })
  const one = rows.every((r) => r.platform === rows[0].platform) && rows.length > 1 ? rows[0].platform! : null
  const at = `${t12(a.now)} on ${dateShort(new Date(a.taken))}`
  return {
    kicker: 'TRAINCHECKER · PLATFORMS', title: `${a.from} to ${a.to}`, when: at,
    heads: ['EXPECTED TO LEAVE', 'PLATFORM'], one, rows, note: null, before: earlierLine(a),
    words: { text: `${limited ? 'The next ten trains' : 'The trains'} from ${a.from} to ${a.to} with platforms, at ${at}, from Trainchecker.`, title: `Trainchecker: ${a.from} to ${a.to}`, hash: `#${a.fromCrs}-${a.toCrs}` },
  }
}

export function arrivalsPicture(a: Analysis): ListPicture | null {
  const fromNow = (t: string) => diff(a.now, t)
  const when = (t: Train) => (isTime(t.eta) ? t.eta : t.sta!)
  const pool = a.arr ?? [...a.past, ...a.ahead]
  const due = pool.filter((t) => t.sta && !t.ata && !t.cancelled)
  const delayed = (t: Train) => !!t.eta && t.eta !== 'On time' && !isTime(t.eta)
  const inHour = due.filter((t) => !delayed(t) && fromNow(when(t)) >= 0 && fromNow(when(t)) <= 60).sort((x, y) => fromNow(when(x)) - fromNow(when(y)))
  const held = due.filter((t) => delayed(t) && fromNow(t.sta!) >= 0 && fromNow(t.sta!) <= 60)
  const bySta = (x: Train, y: Train) => fromNow(x.sta!) - fromNow(y.sta!)
  // In the order they're expected; delayed ones with no time at the bottom, "?" for their time
  // (John, November 19th and 20th 2026).
  const shown = [...inHour.slice(0, 10), ...held.sort(bySta)]
  if (!shown.length) return null
  // The kind of train, when the journey has more than one (two "8.58am" trains can be different).
  const kinds = speedGroups({ ...a, ahead: pool }).filter((g) => g.kind !== 'all')
  const label = { fast: 'Fast', slower: 'Slower', elizabeth: 'Elizabeth Line', all: '' } as const
  const kindOf = (t: Train) => (kinds.length > 1 ? label[kinds.find((g) => g.trains.includes(t))?.kind ?? 'all'] : '')
  const longest = a.arr ? 0 : Math.max(0, ...pool.filter((t) => t.sta).map((t) => diff(t.std, t.sta!)))
  // The platform at B, from the arrival board, or "not yet" (November 25th 2026).
  const plat = (t: Train): Partial<PicRow> => (!a.arr ? {} : t.platform ? { platform: t.platform } : { noPlat: true })
  const rows = shown.map((t): PicRow => {
    const late = isTime(t.eta) ? diff(t.sta!, t.eta) : 0
    const mid = [`the ${t12(t.std)}`, kindOf(t)].filter(Boolean).join(' · ')
    if (delayed(t)) return { time: '?', mid, late: `delayed, was due ${t12(t.sta!)}, no new time yet`, ...plat(t) }
    return late > 0 ? { time: t12(when(t)), mid, late: minutesLate(late), lateBy: late, arrow: true, ...plat(t) } : { time: t12(when(t)), mid, late: '', ...plat(t) }
  })
  const pls = rows.map((r) => r.platform)
  const one = a.arr && rows.length > 1 && pls.every((x) => x && x === pls[0]) ? pls[0]! : null
  const at = `${t12(a.now)} on ${dateShort(new Date(a.taken))}`
  return {
    kicker: 'TRAINCHECKER · ARRIVALS', title: `At ${a.to} from ${a.from}`, when: at,
    heads: a.arr ? ['EXPECTED IN', `FROM ${a.from.toUpperCase()}`, 'PLATFORM'] : ['EXPECTED IN', `FROM ${a.from.toUpperCase()}`], one, rows,
    note: longest >= 120 ? `Trains that left ${a.from} more than two hours ago aren't included, as Trainchecker can't see them.` : null,
    words: {
      text: inHour.length > 10 ? `The first ten trains expected at ${a.to} from ${a.from} after ${at}, from Trainchecker.` : `The trains expected at ${a.to} from ${a.from}, at ${at}, from Trainchecker.`,
      title: `Trainchecker: ${a.from} to ${a.to}`, hash: `#${a.fromCrs}-${a.toCrs}`,
    },
  }
}

/** PROTOTYPE (November 19th 2026, for John to compare): a spoken line about a board's rows, as
 *  "Seven are expected to leave on time, and three are running two minutes late." */
export function boardSummary(rows: PicRow[], verb: 'leave' | 'arrive'): string {
  const known = rows.filter((r) => r.time !== '?')
  const mins = known.map((r) => r.lateBy).filter((m): m is number => !!m)
  const k = mins.length, n = known.length
  if (!n) return ''
  const on = verb === 'leave' ? 'expected to leave on time' : 'expected on time'
  if (!k) return n === 1 ? `It's ${on}.` : n === 2 ? `Both are ${on}.` : `They're all ${on}.`
  const lo = Math.min(...mins), hi = Math.max(...mins)
  const range = lo === hi ? `${num(lo)} ${lo === 1 ? 'minute' : 'minutes'}` : `between ${num(lo)} and ${num(hi)} minutes`
  if (k === n) return tenAfterWords(`${n === 1 ? "It's" : n === 2 ? 'Both are' : "They're all"} running ${range} late.`)
  return tenAfterWords(`${Cap(num(n - k))} ${n - k === 1 ? 'is' : 'are'} ${on}, and ${num(k)} ${k === 1 ? 'is' : 'are'} running ${range} late.`)
}

/** The quote's Share words (SPEC §8.13). */
/** The words sent with the fact's picture (Claude's draft, November 22nd 2026, for John). */
export const factShareText = (from: string, to: string) => `A fact for the journey from ${from} to ${to}, from Trainchecker.`
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
export const plannedIntro = (until: Date, now: Date) => `Planned engineering work and changes on this route from National Rail, to the end of ${weekend(until, now)}:`
export const noPlanned = (until: Date, now: Date) => `National Rail isn't listing any planned engineering work for this journey between now and the end of ${weekend(until, now)}.`
/** Before what may affect the journey, in the same type as the line above it (John, November 18th
 *  2026): "Other changes involving London Paddington which might also affect this route:"; one:
 *  "Another change involving …"; with nothing listed above: "Changes involving … which might affect
 *  this route:" or "A change involving …". */
export function mayIntro(n: number, involved: string[], above: boolean): string {
  const who = involved.join(' or ')
  if (above) return `${n === 1 ? 'Another change' : 'Other changes'} involving ${who} which might also affect this route:`
  return `${n === 1 ? 'A change' : 'Changes'} involving ${who} which might affect this route:`
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
  // The same time on different days said once: "after midnight on Friday or Saturday night", not
  // "after midnight on Friday night or after midnight on Saturday night" (fresh look 5.1).
  const merged: string[] = []
  for (const p of phrases) {
    const m = p.match(/^(.*) on (\w+)( night)?$/)
    const j = m ? merged.findIndex((q) => q.startsWith(`${m[1]} on `) && q.endsWith(m[3] ?? '') && (!!m[3] === / night$/.test(q))) : -1
    if (!m || j < 0) { merged.push(p); continue }
    const q = merged[j], tail = m[3] ?? ''
    const days = q.slice(`${m[1]} on `.length, q.length - tail.length)
    merged[j] = `${m[1]} on ${days.replace(/ or /g, ', ')} or ${m[2]}${tail}`.replace(/^(.* on )(.*), (\w+) or (\w+)/, '$1$2, $3 or $4')
  }
  phrases.splice(0, phrases.length, ...merged)
  const list = phrases.length > 1 ? `${phrases.slice(0, -1).join(', ')} or ${phrases[phrases.length - 1]}` : phrases[0]
  return `If you're travelling ${list} you may be affected – see more details.`
}

// ---- The last week where National Rail's record leaves out an end (John, November 18th 2026) ----

/** Stations where the record leaves out Elizabeth Line trains (stage 1; Bond Street checked again
 *  November 18th 2026: none, while Ealing Broadway and Tottenham Court Road had them). */
export const NO_RECORD_AT = ['PAD', 'BDS']

/** For an all-Elizabeth Line journey with an end the record leaves out: the station to measure to
 *  (or from) instead: Ealing Broadway when the trains call there, otherwise the nearest stop to
 *  that end that the record covers. Null when both ends are left out or there's no such stop. */
export function standIn(a: { fromCrs: string; toCrs: string; stops: [string, string][] }): { crs: string; name: string; side: 'from' | 'to' } | null {
  const fromOut = NO_RECORD_AT.includes(a.fromCrs), toOut = NO_RECORD_AT.includes(a.toCrs)
  if (fromOut === toOut) return null
  const ok = a.stops.filter(([c]) => !NO_RECORD_AT.includes(c))
  const pick = ok.find(([c]) => c === 'EAL') ?? (toOut ? ok[ok.length - 1] : ok[0])
  return pick ? { crs: pick[0], name: pick[1], side: toOut ? 'to' : 'from' } : null
}

/** Before the Elizabeth Line's part when other trains run too (Claude's draft, November 18th 2026):
 *  "National Rail’s record leaves Elizabeth Line trains out at London Paddington, so for those this
 *  shows how they ran as far as Ealing Broadway." */
export function standInMixedLine(left: string, s: { name: string; side: 'from' | 'to' }): string {
  return `National Rail’s record leaves Elizabeth Line trains out at ${left}, so for those this shows how they ran ${s.side === 'to' ? 'as far as' : 'from'} ${s.name}.`
}

/** The line before the hours: "National Rail's record leaves these trains out at Bond Street, so
 *  this shows how they ran as far as Ealing Broadway." (Claude's draft.) */
export function standInLine(left: string, s: { name: string; side: 'from' | 'to' }): string {
  return s.side === 'to'
    ? `National Rail’s record leaves these trains out at ${left}, so this shows how they ran as far as ${s.name}.`
    : `National Rail’s record leaves these trains out at ${left}, so this shows how they ran from ${s.name}.`
}

type Named = { id: string; std: string; operator: string }

/** What tells a train in a list apart (John, November 26th 2026: two "4.42pm"s in the train lists of
 *  Connections, Message home and Exits, one taking 23 minutes and one 40). Its kind ("Fast",
 *  "Slower", "Elizabeth Line", as the boards say) when the journey has more than one; and where
 *  another train in `among` leaves at the same time with the same kind (or none), its company too,
 *  if theirs differ (Liverpool Street to Stratford: "Greater Anglia" and "Elizabeth Line" at 7.48pm). */
export function kindOf(a: Analysis, among: Named[] = []): (t: Named) => string {
  const groups = speedGroups({ ...a, ahead: [...a.past, ...a.ahead] }).filter((g) => g.kind !== 'all')
  const label = { fast: 'Fast', slower: 'Slower', elizabeth: 'Elizabeth Line', all: '' } as const
  const kind = (t: { id: string }) => (groups.length < 2 ? '' : label[groups.find((g) => g.trains.some((x) => x.id === t.id))?.kind ?? 'all'])
  const co = (t: Named) => companyName(t.operator) ?? t.operator
  return (t) => {
    const k = kind(t)
    const twins = among.filter((x) => x.id !== t.id && x.std === t.std && kind(x) === k)
    const c = twins.length && twins.every((x) => co(x) !== co(t)) && co(t) !== k ? co(t) : ''
    return [k, c].filter(Boolean).join(' · ')
  }
}

/** "the 4.42pm", or where another train in `among` leaves at the same time, "the 4.42pm slower train"
 *  ("the 7.48pm Greater Anglia train"). */
export function trainName(t: Named, among: Named[], label: (t: Named) => string): string {
  const k = label(t).split(' · ').pop()!
  const twin = among.some((x) => x.id !== t.id && x.std === t.std)
  return twin && k ? `the ${t12(t.std)} ${/^(Fast|Slower)$/.test(k) ? k.toLowerCase() : k} train` : `the ${t12(t.std)}`
}

/** The company, where another train in `among` leaves at the same time and is run by a different company
 *  (John, November 26th 2026, for the share picture's heading: "The 4.47pm Elizabeth Line train from
 *  Reading"; no "fast" or "slower" there); otherwise ''. */
export function otherCompany(t: Named, among: Named[]): string {
  const co = (x: Named) => companyName(x.operator) ?? x.operator
  return among.some((x) => x.id !== t.id && x.std === t.std && co(x) !== co(t)) ? co(t) : ''
}
