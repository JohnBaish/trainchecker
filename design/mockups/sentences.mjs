// Stage 2 mock-ups: the page's sentences, built from analyse.mjs's figures. Every sentence
// here is Claude's draft, for John to agree word by word (house style §10, §13, §15).
// The app's version will live in src/lib/ with checks (npm run check).

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
// One to nine as words, 10 and above as digits (house style §13).
export const num = (n) => (n >= 0 && n < 10 ? WORDS[n] : String(n))
export const Num = (n) => { const w = num(n); return w[0].toUpperCase() + w.slice(1) }
const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`

// "18:26" → "6.26pm"; "19:00" → "7pm"; "12:00" → "midday"; "00:00" → "midnight" (§15).
export function t12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  if (m === 0 && h === 12) return 'midday'
  if (m === 0 && h === 0) return 'midnight'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}${m ? '.' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`
}
const addMins = (hhmm, n) => {
  const [h, m] = hhmm.split(':').map(Number)
  const x = (h * 60 + m + n + 1440) % 1440
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}

const ORD = (d) => d + (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th')
// "Tuesday November 17th" in UK time (§15: month first, with an ordinal).
export function dayName(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .formatToParts(date).map((x) => [x.type, x.value]))
  return `${p.weekday} ${p.month} ${ORD(Number(p.day))}`
}

// The part of the day the next four hours mostly fall in.
export function partOfDay(hhmm) {
  const h = Number(hhmm.slice(0, 2))
  if (h < 12) return 'this morning'
  if (h < 17) return 'this afternoon'
  return 'this evening'
}

// National Rail's reason, without its opening words: "This service has been delayed by a
// fault on a train" → "a fault on a train". (Draft: the alternative is NR's whole sentence.)
export function reasonText(r) {
  if (!r) return null
  return r.replace(/^This (service|train) (has been|is being|was) (delayed|cancelled) (by|because of|due to) /i, '')
}
const Cap = (s) => s[0].toUpperCase() + s.slice(1)

// The most common reason among some trains, if one covers at least half of them.
// Reasons that differ only by a place ("…signalling system" and "…signalling system at
// Gatley") count as one, in the shorter wording.
function mainReason(trains) {
  const rs = trains.map((s) => reasonText(s.reason)).filter(Boolean)
  let best = null
  for (const r of new Set(rs)) {
    const n = rs.filter((x) => x === r || x.startsWith(r + ' ')).length
    if (!best || n > best[1] || (n === best[1] && r.length < best[0].length)) best = [r, n]
  }
  return best && best[1] * 2 >= trains.length ? best[0] : null
}

// Rounded shares (N1, N2, John): with 10 or more trains, the nearest of these, with
// "about" unless exact; with fewer, the real count. "All" and "none" said plainly.
const SHARES = [[1, 20, 'one in twenty', 'in'], [1, 10, 'one in ten', 'in'], [1, 4, 'a quarter', 'of'], [1, 3, 'a third', 'of'],
  [1, 2, 'half', 'of'], [2, 3, 'two thirds', 'of'], [3, 4, 'three quarters', 'of'], [9, 10, 'nine in ten', 'in'], [19, 20, 'nineteen in twenty', 'in']]
// Returns the phrase for "<share> trains" ("about half of the trains", "five of the nine
// trains", "all 19 trains") and the bare share ("about half", "five of the nine", "all").
export function share(k, n) {
  if (k === n) return { trains: `all ${num(n)} trains`, bare: 'all' }
  if (k === 0) return { trains: `none of the ${num(n)} trains`, bare: 'none' }
  if (n < 10) return { trains: `${num(k)} of the ${num(n)} trains`, bare: `${num(k)} of the ${num(n)}` }
  let best = SHARES[0]
  for (const x of SHARES) if (Math.abs(k / n - x[0] / x[1]) < Math.abs(k / n - best[0] / best[1])) best = x
  const about = k * best[1] === n * best[0] ? '' : 'about '
  return { trains: best[3] === 'in' ? `${about}${best[2]} trains` : `${about}${best[2]} of the trains`, bare: `${about}${best[2]}` }
}

// How the last two hours went, as sentences (John's wording, N3 to N7).
export function lastTwoLines(a) {
  const L = a.last
  if (!L.known && !L.cancelled.length) return [`No trains made this journey in the last two hours.`]
  const out = []
  if (L.known) {
    const sh = share(L.within3, L.known)
    if (L.byArrivals) out.push(`${Cap(sh.trains)} on this route in the last couple of hours got to ${a.to} within three minutes of their timetabled arrival.`)
    else {
      // Long journeys (O1): trains that left in the last two hours, by actual or expected arrival.
      const reach = { past: 'reached', future: 'are expected to reach', mixed: 'have reached or are expected to reach' }[L.tense]
      out.push(`Of the trains that left ${a.from} in the last couple of hours, ${sh.bare} ${reach} ${a.to} within three minutes of their timetabled arrival.`)
    }
    const n = L.lates.length, them = L.within3 === 0 ? 'They' : n === 1 ? 'The other' : n === 2 ? 'The other two' : 'The others'
    const was = { past: n === 1 ? 'was' : 'were', future: n === 1 ? 'is expected to be' : 'are expected to be', mixed: n === 1 ? 'was or is expected to be' : 'were or are expected to be' }[L.tense]
    if (n === 1) out.push(`${them} ${was} ${num(L.worst)} minutes late.`)
    else if (n === 2) out.push(`${them} ${was} ${num(L.lates[0])} and ${num(L.lates[1])} minutes late.`)
    else if (n > 2) out.push(L.usual === L.worst ? `${them} ${was} about ${num(L.usual)} minutes late.` : `${them} ${was} mostly about ${num(L.usual)} minutes late, and the latest ${L.tense === 'future' ? 'is expected to be' : 'was'} ${num(L.worst)} minutes late.`)
  }
  const c = L.cancelled.length
  if (c) out.push(`${Cap(num(c))}${L.known ? ' more' : ''} ${c === 1 ? (L.known ? 'was' : 'train was') : (L.known ? 'were' : 'trains were')} cancelled.`)
  return out
}

export function verdict(a) {
  const when = partOfDay(a.now)
  const journey = `trains from ${a.from} to ${a.to}`
  if (a.verdict === 'none') {
    return {
      kind: 'none', lines: [
        `We can't find a direct train from ${a.from} to ${a.to} in the next four hours.`,
        `Trainchecker only covers direct journeys – if you know part of the route, try that.`,
      ],
    }
  }
  const lines = []
  const kind = a.verdict
  if (kind === 'good') {
    lines.push(a.worse ? `<b>Good news:</b> ${journey} are leaving on time ${when}.` : `<b>Good news:</b> ${journey} are running well ${when}.`)
  } else if (kind === 'mixed') {
    const bits = []
    if (a.cancelled.length) bits.push(`${num(a.cancelled.length)} ${a.cancelled.length === 1 ? 'is' : 'are'} cancelled`)
    const late = a.late5.length + a.unknown.length
    if (late) bits.push(`${num(late)} ${late === 1 ? 'is' : 'are'} running late`)
    lines.push(`<b>It's a mixed bag:</b> most ${journey} are running ${when}, but ${bits.join(' and ').replace(/^(\w+)/, `$1 of the ${num(a.ahead.length)} in the next four hours`)}.`)
  } else {
    const r = mainReason([...a.cancelled, ...a.late5])
    let s = `<b>Be prepared:</b> ${journey} ${a.badly ? 'are badly disrupted' : 'are disrupted'} ${when}. Of the next ${num(a.ahead.length)}, ${num(a.cancelled.length)} ${a.cancelled.length === 1 ? 'is' : 'are'} cancelled`
    if (a.late5.length) s += ` and ${num(a.late5.length)} ${a.late5.length === 1 ? 'is' : 'are'} running late`
    s += r ? `, mostly because of ${r}.` : '.'
    lines.push(s)
  }
  // The last two hours, on a new line, only when they were bad (N5).
  if (a.worse) lines.push(lastTwoLines(a).join(' '))
  return { kind, lines }
}

// "because of A and B", or "mostly because of A", or nothing.
function because(trains) {
  const rs = [...new Set(trains.map((s) => reasonText(s.reason)).filter(Boolean))]
  if (!rs.length) return ''
  if (rs.length <= 2) return `, because of ${rs.join(' and ')}`
  const m = mainReason(trains)
  return m ? `, mostly because of ${m}` : ''
}

export function nextFour(a) {
  if (a.verdict === 'none') return null
  const n = a.ahead.length
  const v = (k) => (k === 1 ? 'is' : 'are')
  const lines = [n === 1 ? `There's one train from ${a.from} to ${a.to} in the next four hours.` : `There are ${num(n)} trains from ${a.from} to ${a.to} in the next four hours.`]
  const onTime = a.ahead.filter((s) => s.late !== null && s.late <= 3).length
  const little = a.ahead.filter((s) => s.late !== null && s.late > 3 && s.late <= 5)
  if (onTime === n) lines.push(n === 1 ? 'It\'s expected on time.' : 'All are expected on time.')
  else {
    const g = []
    if (a.cancelled.length) g.push([a.cancelled.length, `${v(a.cancelled.length)} cancelled${because(a.cancelled)}`])
    if (a.late5.length) g.push([a.late5.length, `${v(a.late5.length)} expected to be more than five minutes late${because(a.late5)}`])
    if (little.length) g.push([little.length, `${v(little.length)} expected to be a few minutes late`])
    if (a.unknown.length) g.push([a.unknown.length, `${v(a.unknown.length)} delayed with no time given yet`])
    const parts = g.map(([k, t]) => `${num(k)} ${t}`)
    let s = parts.length > 1 ? `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}` : parts[0]
    s = g[0][0] >= 10 ? `Of these, ${s}.` : `${Cap(s)}.`
    lines.push(s)
    if (onTime) lines.push(onTime === 1 ? 'The other is expected on time.' : 'The rest are expected on time.')
  }
  const rows = [...a.cancelled, ...a.late5, ...a.unknown].sort((x, y) => x.rel - y.rel).map((s) => ({
    time: t12(s.std), dest: s.destination, operator: s.operator,
    status: s.cancelled ? 'cancelled' : s.unknown ? 'unknown' : 'late',
    what: s.cancelled ? 'Cancelled' : s.unknown ? 'Delayed, no time given yet' : `Expected ${t12(s.etd)}, ${s.late} minutes late`,
    reason: reasonText(s.reason) ? Cap(reasonText(s.reason)) + '.' : null,
  }))
  const fold = !rows.length ? null : rows.length === 1 ? "Show the train that isn't on time" : `Show the ${num(rows.length)} trains that aren't on time`
  return { lines: [lines.slice(0, 1).join(' '), lines.slice(1).join(' ')].filter(Boolean), rows, fold }
}

export function platforms(a) {
  if (a.verdict === 'none') return null
  if (!a.platKnown) return 'No platforms have been announced yet.'
  const [[p1, n1], ...rest] = a.platList
  const and = (xs) => xs.join(', ').replace(/, ([^,]*)$/, ' and $1')
  if (n1 * 2 >= a.platKnown) {
    let s = `At the moment, most trains are going from platform ${p1}`
    if (rest.length === 1) s += `, and ${rest[0][1] === 1 ? 'one' : 'some'} from platform ${rest[0][0]}`
    else if (rest.length > 1) s += `; others from platforms ${and(rest.slice(0, 3).map((x) => x[0]))}`
    return s + '.'
  }
  return `At the moment, trains are going from platforms including ${and(a.platList.slice(0, 4).map((x) => x[0]))}.`
}

// The Share button's words (P2, John: A's friendly opening, a short summary, then the link
// sent separately). Past tense and a date, as a message is often read later (§17).
export function shareWords(a, when) {
  const at = `${when.time} on ${when.date}`
  const lead = `Here's how the trains from ${a.from} to ${a.to} were looking at ${at}: `
  let body
  if (a.verdict === 'none') {
    body = `Here's what Trainchecker found at ${at}: no direct train from ${a.from} to ${a.to} in the following four hours.`
    return { text: body, title: `Trainchecker: ${a.from} to ${a.to}`, link: `trainchecker.baish.net/#${a.fromCrs}-${a.toCrs}` }
  }
  const was = (k) => (k === 1 ? 'was' : 'were')
  if (a.verdict === 'good' && !a.worse) body = 'good news, they were running well.'
  else if (a.verdict === 'good') {
    const L = a.last
    const why = L.known && L.within3 / L.known < 0.75
      ? `only ${share(L.within3, L.known).bare} of the trains in the couple of hours before got there within three minutes of the timetable`
      : `${num(L.cancelled.length)} trains were cancelled in the couple of hours before`
    body = `good news, they were leaving on time, though ${why}.`
  } else if (a.verdict === 'mixed') {
    const bits = []
    if (a.cancelled.length) bits.push(`${num(a.cancelled.length)} ${was(a.cancelled.length)} cancelled`)
    const late = a.late5.length + a.unknown.length
    if (late) bits.push(`${num(late)} ${was(late)} running late`)
    body = `a mixed bag. Most were running, but ${bits.join(' and ').replace(/^(\w+)/, `$1 of the ${num(a.ahead.length)} in the following four hours`)}.`
  } else {
    const r = mainReason([...a.cancelled, ...a.late5])
    body = `be prepared. Of the next ${num(a.ahead.length)}, ${num(a.cancelled.length)} ${was(a.cancelled.length)} cancelled${r ? `, mostly because of ${r}` : ''}.`
  }
  return { text: lead + body + ' From Trainchecker.', title: `Trainchecker: ${a.from} to ${a.to}`, link: `trainchecker.baish.net/#${a.fromCrs}-${a.toCrs}` }
}
