// The four hours split in two (John, November 24th 2026; live since then), in the order people need
// them. "The next hour" (every train in it, each with its platform when there is one), stretched to
// the next three trains when the hour has fewer ("The next three trains"); then the rest, "The
// following three hours", or "Later" when the first panel was stretched. No train is in both.
import { diff, isTime, type Analysis, type Train } from './analyse.ts'
import { Cap, andList, becauseOf, clockSay, dateShort, rangeSay, earlierLine, nextFour, num, speedGroups, t12, trainsAnHour, type ListPicture, type NextFour, type PicRow } from './sentences.ts'

/** When a train is expected to leave, in minutes from now (a cancelled one: its timetabled time). */
const leaves = (a: Analysis, t: Train) => diff(a.now, !t.cancelled && t.late !== null && t.late > 0 && isTime(t.etd) ? t.etd : t.std)

/** The analysis for some of the trains only: the counts and platforms worked out again from them. */
export function only(a: Analysis, trains: Train[]): Analysis {
  const ahead = a.ahead.filter((t) => trains.includes(t))
  const has = (xs: Train[]) => xs.filter((t) => ahead.includes(t))
  const plats: Record<string, number> = {}
  for (const s of ahead) if (s.platform && !s.cancelled) plats[s.platform] = (plats[s.platform] || 0) + 1
  const platList = Object.entries(plats).sort((x, y) => y[1] - x[1])
  return { ...a, ahead, cancelled: has(a.cancelled), late5: has(a.late5), unknown: has(a.unknown), arrLate: has(a.arrLate), platList, platKnown: platList.reduce((x, [, n]) => x + n, 0) }
}

export const AT_LEAST = 3

export type Split = { first: Analysis; later: Analysis; stretched: boolean; inHour: number; running: number; cut: number }

export function split(a: Analysis): Split {
  const runningAll = a.ahead.filter((t) => !t.cancelled).sort((x, y) => leaves(a, x) - leaves(a, y))
  const inHour = runningAll.filter((t) => leaves(a, t) <= 60).length
  // The hour, or up to the third train still running if the hour has fewer.
  const stretched = inHour < AT_LEAST && runningAll.length > inHour
  const cut = stretched ? leaves(a, runningAll[Math.min(AT_LEAST, runningAll.length) - 1]) : 60
  const first = a.ahead.filter((t) => leaves(a, t) <= cut)
  return { first: only(a, first), later: only(a, a.ahead.filter((t) => !first.includes(t))), stretched, inHour, running: Math.min(AT_LEAST, runningAll.length), cut }
}

const trainsWord = (k: number) => (k === 1 ? 'train' : 'trains')

/** The first panel: its heading, its sentence, and the board in the fold. */
export function firstPanel(a: Analysis, s = split(a)) {
  const f = s.first
  const k = s.running
  // Counts are of the trains running; cancelled ones are "more" (John, November 24th 2026): "The next
  // three trains … One more is cancelled".
  const heading = s.stretched ? (k === 1 ? 'The next train' : `The next ${num(k)} trains`) : 'The next hour'
  const n = f.ahead.filter((t) => !t.cancelled).length
  const open = s.stretched
    ? (s.inHour === 0 ? `There are no trains in the next hour, so here ${k === 1 ? "'s the next one" : `are the next ${num(k)}`}.`
      : `${s.inHour === 1 ? "There's only one train" : `There are only ${num(s.inHour)} trains`} in the next hour, so here are the next ${num(k)}.`)
    : n === 1 ? "There's one train in the next hour." : `There are ${num(n)} trains in the next hour.`
  // Stretched: no opening sentence, the heading says it (John, November 24th 2026).
  const nf = nextFour(f, { first: s.stretched ? null : open, more: '' })
  return { heading, lines: nf ? nf.lines : s.stretched ? [] : [open], platLine: platformsLine(f, ''), picture: trainsPicture(f), cancelled: cancelledLine(f) }
}

/** "The 7.15pm is cancelled, because of a fault on this train." or "The 6.44am, 6.48, 7.14 and 7.18 are
 *  cancelled, …". For the fold, after the board. */
function cancelledLine(f: Analysis): string | null {
  const c = f.cancelled
  if (!c.length) return null
  if (c.length === 1) return `The ${t12(c[0].std)} is cancelled${becauseOf(c)}.`
  // "am" or "pm" said once, again only when it changes (John, November 26th 2026).
  const say = clockSay()
  return `The ${andList(c.map((t) => say(t.std)))} are cancelled${becauseOf(c)}.`
}

/** Every running train in the first panel, each with its platform or "not yet". */
export function trainsPicture(f: Analysis): ListPicture | null {
  const ts = f.ahead.filter((t) => !t.cancelled).sort((x, y) => leaves(f, x) - leaves(f, y))
  if (!ts.length) return null
  const groups = speedGroups(f).filter((g) => g.kind !== 'all')
  const label = { fast: 'Fast', slower: 'Slower', elizabeth: 'Elizabeth Line', all: '' } as const
  const kindOf = (t: Train) => (groups.length > 1 ? label[groups.find((g) => g.trains.includes(t))?.kind ?? 'all'] : '')
  const rows = [...ts.filter((t) => !t.unknown), ...ts.filter((t) => t.unknown)].map((t): PicRow => {
    const late = t.late !== null && t.late > 0 && isTime(t.etd)
    const p = t.platform ?? undefined
    if (t.unknown) return { time: '?', mid: [kindOf(t), `the ${t12(t.std)}`].filter(Boolean).join(' · '), late: 'delayed, no new time yet', platform: p, noPlat: !p }
    return { time: t12(late ? t.etd! : t.std), mid: kindOf(t), late: late ? `was due to go at ${t12(t.std).replace(/(am|pm)$/, '')}` : '', platform: p, lateBy: late ? t.late! : undefined, noPlat: !p }
  })
  const one = rows.length > 1 && rows.every((r) => r.platform && r.platform === rows[0].platform) ? rows[0].platform! : null
  const at = `${t12(f.now)} on ${dateShort(new Date(f.taken))}`
  return {
    kicker: 'TRAINCHECKER', title: `${f.from} to ${f.to}`, when: at, heads: ['EXPECTED TO LEAVE', 'PLATFORM'], one, rows, note: null,
    words: { text: '', title: '', hash: '' },
  }
}

/** The second panel: its heading and sentences (the trains an hour, the ones that aren't on time,
 *  with their fold), and a line about the platforms already announced for these later trains. */
export function laterPanel(a: Analysis, s = split(a)): { heading: string; next: NextFour | null; lines: string[]; platLine: string | null; later: Analysis; picture: ListPicture | null; cancelled: string | null } {
  const l = s.later, n = l.ahead.filter((t) => !t.cancelled).length
  const heading = s.stretched ? 'Later' : 'The following three hours'
  if (!l.ahead.length) return { heading, next: null, lines: [s.stretched ? `There are no more direct trains from ${a.from} to ${a.to} in the next four hours.` : `There are no more direct trains from ${a.from} to ${a.to} in the following three hours.`], platLine: null, later: l, picture: null, cancelled: null }
  const first = s.stretched
    ? (n === 1 ? 'There\'s one more train in the next four hours.' : `There are ${num(n)} more ${trainsWord(n)} in the next four hours.`)
    : (trainsAnHour(only(l, l.ahead.filter((t) => !t.cancelled)), 3, '', true) ?? (n === 0 ? 'There are no trains running.' : n === 1 ? "There's one train." : `There are ${num(n)} trains.`))
  // Short, as the heading says the period; the rate counts only the trains running (John, November 24th 2026).
  const next = nextFour(l, { first, more: s.stretched ? '' : ' in that time' })
  return { heading, next, lines: next ? next.lines : [first], platLine: platformsLine(l, ' already'), later: l, picture: trainsPicture(l), cancelled: cancelledLine(l) }
}

/** "Platforms have already been announced for 11 of these: from platforms 10, 11 and 13." (Claude's draft;
 *  "already" in the later panel only.) */
function platformsLine(l: Analysis, already: string): string | null {
  const running = l.ahead.filter((t) => !t.cancelled)
  const k = running.filter((t) => t.platform).length
  if (!k) return null
  const used = new Set(running.filter((t) => t.platform).map((t) => t.platform!))
  const base = (p: string) => { const m = p.match(/^(\d+)[A-Z]$/); return m && used.has(m[1]) ? m[1] : p }
  const counts = new Map<string, number>()
  for (const t of running) if (t.platform) counts.set(base(t.platform), (counts.get(base(t.platform)) ?? 0) + 1)
  const top = [...counts].sort((x, y) => y[1] - x[1])
  const and = (xs: string[]) => xs.join(', ').replace(/, ([^,]*)$/, ' and $1')
  const which = k === running.length ? (k === 1 ? 'this one' : k === 2 ? 'both of these' : 'all of these') : k === 1 ? 'one of these' : `${num(k)} of these`
  const where = top.length === 1 ? (k === 1 || k === running.length ? `platform ${top[0][0]}` : `all platform ${top[0][0]}`)
    : k >= 3 && top[0][1] * 2 > k ? `mostly platform ${top[0][0]}`
    : `from platforms ${and(top.slice(0, 3).map((x) => x[0]).sort((x, y) => parseInt(x) - parseInt(y) || x.localeCompare(y)))}`
  return `${Cap(k === 1 ? 'A platform has' : 'Platforms have')}${already} been announced for ${which}: ${where}.`
}

export { earlierLine }


// ---- Share pictures and their words (agreed by John, November 24th 2026) ----

/** "HH:MM" plus some minutes. */
const plus = (hhmm: string, m: number) => { const [h, mi] = hhmm.split(':').map(Number); const t = (h * 60 + mi + m + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}` }
const words = (text: string, a: Analysis) => ({ text, title: `Trainchecker: ${a.from} to ${a.to}`, hash: `#${a.fromCrs}-${a.toCrs}` })

/** The first panel's picture and words: "The trains from Reading to London Paddington leaving between
 *  6.24pm and 7.24pm on November 17th, with the platforms announced so far, from Trainchecker." */
export function firstShare(a: Analysis, s = split(a)): ListPicture | null {
  const pic = trainsPicture(s.first)
  if (!pic) return null
  const date = dateShort(new Date(a.taken)), now = t12(a.now)
  const head = firstPanel(a, s).heading
  const text = s.stretched
    ? `${head} from ${a.from} to ${a.to} after ${now} on ${date}, with the platforms announced so far, from Trainchecker.`
    : `The trains from ${a.from} to ${a.to} leaving between ${rangeSay(now, t12(plus(a.now, 60)), ' and ')} on ${date}, with the platforms announced so far, from Trainchecker.`
  return { ...pic, kicker: `TRAINCHECKER · ${head.toUpperCase()}`, when: s.stretched ? `after ${now} on ${date}` : `${rangeSay(now, t12(plus(a.now, 60)))} on ${date}`, words: words(text, a) }
}

/** The later panel's period, as said in its picture: "7.24pm to 10.24pm on November 17th", or, stretched,
 *  "after the 9.03pm, up to 11.47pm on November 17th". */
function laterWhen(a: Analysis, s: Split) {
  const date = dateShort(new Date(a.taken)), end = t12(plus(a.now, 240))
  return s.stretched ? `up to ${end} on ${date}` : `${rangeSay(t12(plus(a.now, 60)), end)} on ${date}`
}

/** The later panel's picture (John, November 24th 2026): hour by hour, each row the hour, the trains
 *  running and, in orange, any of these late and any more cancelled; when the first panel was stretched,
 *  the few later trains themselves, each with its platform or "not yet". */
export function laterShare(a: Analysis, s = split(a)): ListPicture | null {
  const l = s.later
  if (!l.ahead.length) return null
  const lp = laterPanel(a, s)
  const when = laterWhen(a, s)
  if (s.stretched) {
    const pic = trainsPicture(l)
    if (!pic) return null
    return { ...pic, kicker: `TRAINCHECKER · ${lp.heading.toUpperCase()}`, when, words: words(`The later trains from ${a.from} to ${a.to}, ${when}, with the platforms announced so far, from Trainchecker.`, a) }
  }
  const base = { kicker: `TRAINCHECKER · ${lp.heading.toUpperCase()}`, title: `${a.from} to ${a.to}`, when, one: null as string | null, note: null as string | null }
  // Hour by hour (John: no platforms said, a time range rather than "FROM").
  const start = 60
  const rows: PicRow[] = []
  const range = (f: number, t: number) => {
    return rangeSay(t12(plus(a.now, f)), t12(plus(a.now, t)))
  }
  for (let from = start; from < 240; from += 60) {
    const to = Math.min(from + 60, 240)
    const ts = l.ahead.filter((t) => { const m = leaves(a, t); return m > from && m <= to })
    const c = ts.filter((t) => t.cancelled).length, late = ts.filter((t) => l.late5.includes(t) || l.arrLate.includes(t) || t.unknown).length
    // The trains running on the right; under them, any of these late, then those cancelled as "more"
    // ("one of these is late, three more are cancelled", John, November 24th 2026).
    const run = ts.length - c
    const lateBit = !late ? '' : run === 1 ? "it's running late" : late === 1 ? 'one of these is late' : `${num(late)} of these are late`
    const cBit = !c ? '' : run === 0 ? `${num(c)} ${c === 1 ? 'is' : 'are'} cancelled` : `${num(c)} more ${c === 1 ? 'is' : 'are'} cancelled`
    const bad = [lateBit, cBit].filter(Boolean).join(', ')
    rows.push({ time: range(from, to), mid: run ? `${num(run)} ${trainsWord(run)}` : ts.length ? 'no trains running' : 'no trains', late: bad })
  }
  const text = `The trains from ${a.from} to ${a.to}, hour by hour, from ${when}, from Trainchecker.`
  return { ...base, heads: ['', ''], rows, before: lp.lines.join(' '), layout: 'hours', words: words(text, a) }
}
