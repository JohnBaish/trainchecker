// PROTOTYPE (November 24th 2026, for John): the four hours split in two, in the order people need
// them. "The next hour" (every train in it, each with its platform when there is one), stretched to
// the next three trains when the hour has fewer ("The next three trains"); then the rest, "The
// following three hours", or "Later" when the first panel was stretched. No train is in both.
import { diff, isTime, type Analysis, type Train } from './analyse.ts'
import { Cap, becauseOf, dateShort, earlierLine, nextFour, num, speedGroups, t12, type ListPicture, type NextFour, type PicRow } from './sentences.ts'

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

export type Split = { first: Analysis; later: Analysis; stretched: boolean; inHour: number; running: number }

export function split(a: Analysis): Split {
  const runningAll = a.ahead.filter((t) => !t.cancelled).sort((x, y) => leaves(a, x) - leaves(a, y))
  const inHour = runningAll.filter((t) => leaves(a, t) <= 60).length
  // The hour, or up to the third train still running if the hour has fewer.
  const stretched = inHour < AT_LEAST && runningAll.length > inHour
  const cut = stretched ? leaves(a, runningAll[Math.min(AT_LEAST, runningAll.length) - 1]) : 60
  const first = a.ahead.filter((t) => leaves(a, t) <= cut)
  return { first: only(a, first), later: only(a, a.ahead.filter((t) => !first.includes(t))), stretched, inHour, running: Math.min(AT_LEAST, runningAll.length) }
}

const trainsWord = (k: number) => (k === 1 ? 'train' : 'trains')

/** The first panel: its heading, its sentence, and the board in the fold. */
export function firstPanel(a: Analysis, s = split(a)) {
  const f = s.first
  const k = s.running
  const heading = s.stretched ? (k === 1 ? 'The next train' : `The next ${num(k)} trains`) : 'The next hour'
  const n = f.ahead.length
  const open = s.stretched
    ? (s.inHour === 0 ? `There are no trains in the next hour, so here ${k === 1 ? "'s the next one" : `are the next ${num(k)}`}.`
      : `${s.inHour === 1 ? "There's only one train" : `There are only ${num(s.inHour)} trains`} in the next hour, so here are the next ${num(k)}.`)
    : `There are ${num(n)} trains in the next hour.`
  const nf = nextFour(f, { first: open })
  return { heading, lines: nf ? nf.lines : [open], picture: trainsPicture(f), cancelled: cancelledLine(f) }
}

/** "The 7.15pm is cancelled, because of a fault on this train." For the fold, after the board. */
function cancelledLine(f: Analysis): string | null {
  const c = f.cancelled
  if (!c.length) return null
  return c.length === 1 ? `The ${t12(c[0].std)} is cancelled${becauseOf(c)}.` : `The ${c.map((t) => t12(t.std)).join(', ').replace(/, ([^,]*)$/, ' and $1')} are cancelled${becauseOf(c)}.`
}

/** Every running train in the first panel, each with its platform or "not yet". */
export function trainsPicture(f: Analysis): ListPicture | null {
  const ts = f.ahead.filter((t) => !t.cancelled).sort((x, y) => leaves(f, x) - leaves(f, y))
  if (!ts.length) return null
  const groups = speedGroups(f).filter((g) => g.kind !== 'all')
  const label = { fast: 'Fast', slower: 'Slower', elizabeth: 'Elizabeth Line', all: '' } as const
  const kindOf = (t: Train) => (groups.length > 1 ? label[groups.find((g) => g.trains.includes(t))?.kind ?? 'all'] : '')
  const rows = [...ts.filter((t) => !t.unknown), ...ts.filter((t) => t.unknown)].map((t): PicRow & { noPlat?: boolean } => {
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
  const l = s.later, n = l.ahead.length
  const heading = s.stretched ? 'Later' : 'The following three hours'
  if (!n) return { heading, next: null, lines: [s.stretched ? `There are no more direct trains from ${a.from} to ${a.to} in the next four hours.` : `There are no more direct trains from ${a.from} to ${a.to} in the following three hours.`], platLine: null, later: l, picture: null, cancelled: null }
  const first = s.stretched
    ? (n === 1 ? 'There\'s one more train in the next four hours.' : `There are ${num(n)} more ${trainsWord(n)} in the next four hours.`)
    : (n === 1 ? "There's one train." : `There are ${num(n)} trains.`)
  // Short, as the heading says the period (John, November 24th 2026).
  const next = nextFour(l, s.stretched ? { first } : { first, hours: 3, short: true })
  return { heading, next, lines: next ? next.lines : [first], platLine: laterPlatforms(l), later: l, picture: trainsPicture(l), cancelled: cancelledLine(l) }
}

/** "Platforms have already been announced for 16 of these, mostly platform 9." (Claude's draft.) */
function laterPlatforms(l: Analysis): string | null {
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
    : top[0][1] * 2 >= k ? `mostly platform ${top[0][0]}`
    : `from platforms ${and(top.slice(0, 3).map((x) => x[0]).sort((x, y) => parseInt(x) - parseInt(y) || x.localeCompare(y)))}`
  return `${Cap(k === 1 ? 'A platform has' : 'Platforms have')} already been announced for ${which}: ${where}.`
}

export { earlierLine }
