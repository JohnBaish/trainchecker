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

export function verdict(a) {
  const when = partOfDay(a.now)
  const journey = `trains from ${a.from} to ${a.to}`
  if (a.verdict === 'none') {
    return {
      kind: 'none', word: 'No direct train',
      lines: [
        `We can't find a direct train from ${a.from} to ${a.to} in the next four hours.`,
        `Trainchecker only covers journeys without a change of train for now, so National Rail's journey planner will be more help.`,
      ],
    }
  }
  const lines = []
  let kind = a.verdict
  if (kind === 'good') {
    lines.push(`<b>Good news:</b> ${journey} are running well ${when}.`)
  } else if (kind === 'mixed') {
    const bits = []
    if (a.cancelled.length) bits.push(`${num(a.cancelled.length)} ${a.cancelled.length === 1 ? 'is' : 'are'} cancelled`)
    const late = a.late5.length + a.unknown.length
    if (late) bits.push(`${num(late)} ${late === 1 ? 'is' : 'are'} running late`)
    lines.push(`<b>It's a mixed bag:</b> most ${journey} are running ${when}, but ${bits.join(' and ').replace(/^(\w+)/, `$1 of the ${num(a.ahead.length)} in the next four hours`)}.`)
  } else {
    const r = mainReason([...a.cancelled, ...a.late5])
    const what = a.badly ? 'are badly disrupted' : 'are disrupted'
    let s = `<b>Be prepared:</b> ${journey} ${what} ${when}. Of the next ${num(a.ahead.length)}, ${num(a.cancelled.length)} ${a.cancelled.length === 1 ? 'is' : 'are'} cancelled`
    if (a.late5.length) s += ` and ${num(a.late5.length)} ${a.late5.length === 1 ? 'is' : 'are'} running late`
    s += r ? `, mostly because of ${r}.` : '.'
    lines.push(s)
  }
  if (a.worse) {
    const L = a.last
    const opener = kind === 'good' ? "However, it's worth knowing" : "It's also worth knowing"
    if (L.cancelled.length >= 2) {
      lines.push(`${opener} that ${num(L.cancelled.length)} trains were cancelled in the last two hours.`)
    } else {
      lines.push(`${opener} that the last two hours were less reliable: ${num(L.within3)} of ${num(L.known)} trains ${L.byArrivals ? `reached ${a.to}` : `left ${a.from}`} within 3 minutes of the timetable.`)
    }
  }
  return { kind, word: { good: 'Good news', mixed: "It's a mixed bag", prepared: 'Be prepared' }[kind], lines }
}

export function nextFour(a) {
  if (a.verdict === 'none') return null
  const n = a.ahead.length
  const end = addMins(a.now, 240)
  const onTime = a.ahead.filter((s) => s.late !== null && s.late <= 3).length
  const little = a.ahead.filter((s) => s.late !== null && s.late > 3 && s.late <= 5).length
  const parts = []
  let first = `There are ${num(n)} trains from ${a.from} to ${a.to} between ${t12(a.now)} and ${t12(end)}.`
  if (onTime === n) parts.push(`${first} All are expected on time.`)
  else {
    parts.push(first)
    const v = (n) => (n === 1 ? 'is' : 'are')
    const bits = [`${num(onTime)} ${v(onTime)} expected on time`]
    if (little) bits.push(`${num(little)} ${v(little)} expected a few minutes late`)
    if (a.late5.length) bits.push(`${num(a.late5.length)} ${v(a.late5.length)} expected more than 5 minutes late`)
    if (a.unknown.length) bits.push(`${num(a.unknown.length)} ${v(a.unknown.length)} delayed with no time given yet`)
    if (a.cancelled.length) bits.push(`${num(a.cancelled.length)} ${v(a.cancelled.length)} cancelled`)
    const last = bits.pop()
    parts.push(Cap(`${bits.join(', ')}${bits.length ? ' and ' : ''}${last}.`))
  }
  const rows = [...a.cancelled, ...a.late5, ...a.unknown].sort((x, y) => x.rel - y.rel).map((s) => ({
    time: t12(s.std), dest: s.destination, operator: s.operator,
    status: s.cancelled ? 'cancelled' : s.unknown ? 'unknown' : 'late',
    what: s.cancelled ? 'Cancelled' : s.unknown ? 'Delayed, no time given yet' : `Expected ${t12(s.etd)}, ${s.late} minutes late`,
    reason: reasonText(s.reason) ? Cap(reasonText(s.reason)) + '.' : null,
  }))
  return { lines: parts, rows, heading: rows.length ? (rows.length === 1 ? 'The train that isn\'t on time' : `The ${num(rows.length)} trains that aren't on time`) : null }
}

export function platforms(a) {
  if (a.verdict === 'none') return null
  const running = a.ahead.length - a.cancelled.length
  if (!a.platKnown) return `No platforms have been announced yet for the next trains. They're usually shown shortly before a train leaves.`
  const [[p1, n1], ...rest] = a.platList
  let s
  if (n1 * 2 >= a.platKnown) {
    s = `At the moment, most of the next trains are going from platform ${p1}`
    if (rest.length === 1) s += `, and ${rest[0][1] === 1 ? 'one' : num(rest[0][1])} from platform ${rest[0][0]}`
    else if (rest.length > 1) s += `; others from platforms ${rest.slice(0, 3).map((x) => x[0]).join(', ').replace(/, ([^,]*)$/, ' and $1')}`
    s += '.'
  } else {
    const top = a.platList.slice(0, 4).map((x) => x[0])
    const list = a.platList.length > 4 ? `${top.join(', ')} and others` : top.join(', ').replace(/, ([^,]*)$/, ' and $1')
    s = `At the moment, the next trains are going from platforms ${list}.`
  }
  if (a.platKnown < running) s += ` Platforms for later trains aren't announced yet.`
  return s
}

export function lastTwo(a) {
  if (a.verdict === 'none') return null
  const L = a.last
  if (!L.total && !L.cancelled.length) return `No trains made this journey in the last two hours.`
  const where = L.byArrivals ? `reached ${a.to}` : `left ${a.from}`
  let s
  if (L.byArrivals) {
    s = L.within3 === 0
      ? `In the last two hours, none of the ${num(L.known)} trains that reached ${a.to} arrived within 3 minutes of the timetable.`
      : `In the last two hours, ${num(L.within3)} of ${num(L.known)} trains reached ${a.to} within 3 minutes of the timetable.`
  } else {
    s = `Of the ${num(L.known)} trains that left ${a.from} in the last two hours, ${num(L.within3)} left within 3 minutes of the timetable (most haven't reached ${a.to} yet).`
  }
  if (L.worst && L.worst.late > 3) s += ` The latest was the ${t12(L.worst.std)} from ${a.from}, ${L.worst.late} minutes late.`
  if (L.cancelled.length) s += ` ${Cap(plural(L.cancelled.length, 'train was', 'trains were'))} cancelled.`
  void where
  return s
}
