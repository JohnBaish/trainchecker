// "Check my connection" (John, November 21st 2026): the sums and every sentence. You're on a train
// from A to B and changing at B for C. The wording of the four answers and the smaller pieces was
// drafted by Claude on real boards and edited by John the same day; anything marked "draft" below
// is Claude's and not yet agreed. scripts/check-connection.ts holds the agreed sentences.
import { onceSay } from './timesSaid.ts'
import { diff, isTime, type Service } from './analyse.ts'
import { dueSay, num, t12 } from './sentences.ts'
import type { Onward } from '../../api/connect.ts'
import { howToGet, type StationLinks } from './platformLinks.ts'

export type Band = 'fine' | 'tight' | 'unlikely' | 'missed'
/** John, November 21st 2026: five, four or three minutes is tight; two or one looks unlikely;
 *  none or less, you won't make it. */
export const band = (gap: number): Band => (gap >= 6 ? 'fine' : gap >= 3 ? 'tight' : gap >= 1 ? 'unlikely' : 'missed')
const RANK: Record<Band, number> = { missed: 0, unlikely: 1, tight: 2, fine: 3 }

/** The train you're on, from the journey's own board (api/live.ts). */
export type Mine = { id: string; std: string; sta: string | null; exp: string | null; arrived: boolean; lateBy: number }
export function mineOf(s: Service): Mine {
  const arrived = isTime(s.ata) || s.ata === 'On time'
  const exp = isTime(s.ata) ? s.ata : s.ata === 'On time' ? s.sta : isTime(s.eta) ? s.eta : s.eta === 'On time' ? s.sta : null
  return { id: s.id.slice(0, 8), std: s.std, sta: s.sta, exp, arrived, lateBy: exp && s.sta ? diff(s.sta, exp) : 0 }
}

/** When an onward train is expected to leave; null when it's "Delayed" with no time. */
export const leaves = (t: Onward): string | null => (isTime(t.etd) ? t.etd : t.etd === 'Delayed' ? null : t.std)

/** When an onward train reaches C: the expected time, or the timetabled one when there's no
 *  expected time (John, November 21st 2026). */
export const reaches = (t: Onward): string | null => (isTime(t.eta) ? t.eta : t.sta)

export type Speed = 'fast' | 'slower' | 'elizabeth'
const SPEED: Record<Speed, string> = { fast: 'fast', slower: 'slower', elizabeth: 'Elizabeth Line' }
/** Fast, slower and Elizabeth Line trains from B to C, by the page's own rule (speedGroups() in
 *  sentences.ts): fast is no more than a quarter longer than the quickest, or within 10 minutes of
 *  it; the Elizabeth Line apart when it's slower; no split unless the slower ones usually take 10
 *  minutes longer. Empty when every train is much the same. John, November 21st 2026: Reading to
 *  Paddington's trains aren't all alike. */
export function speeds(trains: Onward[]): Map<string, Speed> {
  const t = trains.filter((x) => x.sta).map((x) => ({ id: x.id, mins: diff(x.std, x.sta!), eliz: /elizabeth/i.test(x.operator) }))
  const out = new Map<string, Speed>()
  if (!t.length) return out
  const q = Math.min(...t.map((x) => x.mins)), lim = Math.max(q * 1.25, q + 10)
  const eliz = t.filter((x) => x.eliz && x.mins > lim), rest = t.filter((x) => !eliz.includes(x))
  const mid = (g: typeof t) => g.map((x) => x.mins).sort((m, n) => m - n)[Math.floor(g.length / 2)]
  let fast = rest.filter((x) => x.mins <= lim), slow = rest.filter((x) => x.mins > lim)
  if (slow.length && fast.length && mid(slow) - mid(fast) < 10) { fast = rest; slow = [] }
  if (!slow.length && !eliz.length) return out
  for (const x of fast) out.set(x.id, 'fast')
  for (const x of slow) out.set(x.id, 'slower')
  for (const x of eliz) out.set(x.id, 'elizabeth')
  return out
}
/** A train in the row of others to ask about: "3.29pm Elizabeth Line, arrives 4.25" ("pm" once) where the
 *  trains differ in speed, otherwise just "3.39pm". */
export function chipLabel(t: Onward, sp: Map<string, Speed>): string {
  const k = sp.get(t.id), there = reaches(t)
  return `${t12(t.std)}${k ? ` ${SPEED[k]}` : ''}${sp.size && there ? `, arrives ${dueSay(t.std, there)}` : ''}`
}

/** In the order they're expected to leave; two at the same minute, the one that gets there first. */
function ordered(arr: string, trains: Onward[]) {
  return trains.map((t) => ({ t, exp: leaves(t), g: diff(arr, leaves(t) ?? t.std), a: reaches(t) ? diff(arr, reaches(t)!) : null }))
    .sort((x, y) => x.g - y.g || (x.a ?? 9999) - (y.a ?? 9999))
}

/** The trains you could ask about: from ten minutes before yours gets in, in the order they're
 *  expected to leave, six at most. Slower trains stay in, as people may be booked on them (John). */
export function choices(mine: Mine, trains: Onward[]): Onward[] {
  if (!mine.exp) return []
  return ordered(mine.exp, trains).filter((x) => x.g >= -10).slice(0, 6).map((x) => x.t)
}
/** The one it answers about first: your own train if it carries on to C, or the first you'd have
 *  at least a minute for (a cancelled one counts, so the page can say so). */
export function firstChoice(mine: Mine, trains: Onward[]): Onward | null {
  const list = choices(mine, trains)
  return list.find((t) => t.id === mine.id) ?? list.find((t) => diff(mine.exp!, leaves(t) ?? t.std) >= 1) ?? null
}

const minutes = (n: number) => `${num(n)} minute${n === 1 ? '' : 's'}`
/** An hour or more, to the nearest quarter of an hour, with "almost" or "more than" when it isn't
 *  exact (John, November 21st 2026): 94 minutes is "more than an hour and a half". */
export function longWait(n: number): string {
  const q = Math.round(n / 15) * 15, h = Math.floor(q / 60), part = q % 60
  const amount = h === 1 ? (part === 0 ? 'an hour' : `an hour and ${part === 15 ? 'a quarter' : part === 30 ? 'a half' : 'three quarters'}`)
    : part === 0 ? `${num(h)} hours` : `${num(h)} and ${part === 15 ? 'a quarter' : part === 30 ? 'a half' : 'three quarter'} hours`
  return `${n < q ? 'almost ' : n > q ? 'more than ' : ''}${amount}`
}
export const aWait = (n: number) => (n >= 60 ? `a wait of ${longWait(n)}` : `${n === 8 || n === 11 || n === 18 ? 'an' : 'a'} ${num(n)}-minute wait`)

/** "pm" said with the first time and again only when it changes. */
function clockOnce() {
  const once = onceSay()
  return (hhmm: string) => once(t12(hhmm))
}

export type Answer = { kind: Band | 'through' | 'none' | 'unknown'; text: string }
export type Asked = {
  now: string // "HH:MM", when the boards were fetched
  from: string; at: string; to: string // the names of A, B and C
  mine: Mine
  arrPlatform: string | null
  trains: Onward[]
  chosen: string | null // an onward train's id; null for the first choice
  links?: StationLinks | null // how B's platforms connect, from OpenStreetMap
}

export function answer(o: Asked): Answer {
  const { mine, to } = o
  const say = clockOnce()
  // Line 12: when your train is still more than half an hour from B.
  const far = mine.exp && diff(o.now, mine.exp) > 30 ? ' These times can change, so it’s worth checking again later.' : ''
  if (!mine.exp) {
    // Draft.
    return { kind: 'unknown', text: `Your train from ${o.from} is delayed, with no time given yet, so Trainchecker can’t work out your connection. It’s worth checking again later.` }
  }
  const arr = mine.exp
  const list = ordered(arr, o.trains)
  const sp = speeds(o.trains)
  const first = o.chosen ? o.trains.find((t) => t.id === o.chosen) ?? null : firstChoice(mine, o.trains)
  if (!first) {
    // Draft: "four", as that's how far ahead the boards are asked.
    return { kind: 'none', text: `Trainchecker can’t see a train from ${o.at} to ${to} in the next four hours${list.length ? ' that leaves after yours gets in' : ''}.` }
  }
  // Line 9: no change needed.
  if (first.id === mine.id && !first.cancelled) {
    const there = isTime(first.eta) ? first.eta : first.eta === 'On time' ? first.sta : null
    return { kind: 'through', text: `You don’t need to change: the train you’re on carries on to ${to}${there ? `, and is expected there at ${say(there)}` : ''}.${far}` }
  }
  const after = (id: string, min = -999) => {
    const i = list.findIndex((x) => x.t.id === id)
    return list.slice(i + 1).find((x) => !x.t.cancelled && x.exp && x.t.id !== mine.id && x.g >= min) ?? null
  }
  type Row = (typeof list)[number]
  /** Trains you could catch that leave no earlier than this one and get to C sooner. */
  const quicker = (x: Row) => list.filter((y) => y !== x && !y.t.cancelled && y.exp && y.t.id !== mine.id && y.g >= 1 && y.g >= x.g && x.a !== null && y.a !== null && y.a < x.a)
  /** The next one to suggest: not one that a later train overtakes. */
  const next = (id: string, min: number) => {
    const i = list.findIndex((x) => x.t.id === id)
    return list.slice(i + 1).find((x) => !x.t.cancelled && x.exp && x.t.id !== mine.id && x.g >= min && !quicker(x).length) ?? null
  }
  // "the 3.29pm Elizabeth Line train", "the 3.27 fast train"; plain "the 3.39pm" where trains are alike.
  const named = (t: Onward) => `${say(t.std)}${sp.has(t.id) ? ` ${SPEED[sp.get(t.id)!]} train` : ''}`

  let text = ''
  let c = list.find((x) => x.t.id === first.id)!
  let instead = ''
  let over: Row | null = null
  // Line 10: the one you wanted is cancelled, so the answer is about the next.
  if (c.t.cancelled) {
    text = `The ${named(c.t)} to ${to} has been cancelled. `
    const n = after(c.t.id, 1)
    if (!n) return { kind: 'none', text: `${text}Trainchecker can’t see a later train to ${to} in the next four hours.` }
    c = n
    instead = ' instead'
  }
  if (!c.exp) {
    // Draft.
    const n = after(c.t.id, 1)
    return { kind: 'unknown', text: `${text}The ${named(c.t)} to ${to} is delayed, with no time given yet, so Trainchecker can’t tell how long you’d have.${n ? ` The next one is the ${named(n.t)}${n.t.platform ? ` from platform ${n.t.platform}` : ''}.` : ''}${far}` }
  }

  const gap = c.g, kind = band(gap)
  const late = diff(c.t.std, c.exp)
  // The change only works because the onward train is late (John: say it may make up time).
  const relies = late > 0 && RANK[band(diff(arr, c.t.std))] < RANK[kind]
  const lead = named(c.t)
  const arrive = mine.arrived ? `Your train from ${o.from} got in at ${say(arr)}` // draft
    : mine.lateBy >= 1 ? `Your train from ${o.from} is running ${minutes(mine.lateBy)} late and is now expected in at ${say(arr)}`
    : mine.lateBy <= -1 ? `Your train from ${o.from} is expected to arrive a little early, at ${say(arr)}` // draft
    : `Your train from ${o.from} is expected to arrive on time at ${say(arr)}`
  const showing = c.t.destination && c.t.destination !== to ? c.t.destination : null

  if (kind === 'missed') {
    const when = gap === 0 ? `just as it’s ${late > 0 ? 'expected' : 'due'} to leave` : `${minutes(-gap)} after the ${to} train is ${late > 0 ? 'expected' : 'due'} to leave` // the second: draft
    text += `You won’t make the ${lead} to ${to}${instead}. ${arrive}, ${when}.`
  } else {
    const told = relies && kind === 'tight'
    // A long wait, more than 40 minutes (John, November 22nd 2026): a firm opening rather than "you
    // should be fine", "between trains", and "currently expected"; the time in words from 70 minutes.
    const long = kind === 'fine' && gap > 40
    const isNext = !instead && (!o.chosen || o.chosen === firstChoice(mine, o.trains)?.id)
    if (long) {
      text += isNext ? `The next connecting train to ${to} is the ${lead}, which is going to give you quite a wait at ${o.at}. `
        : `If you’re planning to get the ${lead} to ${to}${instead}, that’s quite a wait at ${o.at}. `
      text += `You’ll have ${gap >= 70 ? longWait(gap) : minutes(gap)} between trains. `
    } else {
      text += `If you’re planning to get the ${lead} to ${to}${instead}, ${kind === 'fine' ? 'you should be fine' : kind === 'tight' ? 'it’s going to be tight' : 'that looks unlikely'}. `
      text += told ? `It’s running ${minutes(late)} late, which gives you ${minutes(gap)} to change trains. `
        : kind === 'unlikely' ? `You’d only have ${minutes(gap)} to change trains. ` : `You’ll have ${minutes(gap)} to change trains. `
    }
    const leave = told ? `the ${to} train is now expected to leave at ${say(c.exp)}`
      : long ? (late >= 1 ? `the ${to} train is currently expected to leave ${minutes(late)} late, at ${say(c.exp)}` : `the ${to} train is currently expected to leave on time`)
      : late >= 1 ? `the ${to} train is expected to leave ${minutes(late)} later than planned at ${say(c.exp)}`
      : `the ${to} train is expected to leave on time at ${say(c.exp)}`
    const p = c.t.platform, mineP = o.arrPlatform
    // Where we don't know the platform you're coming into, we just don't say (John).
    // "…expected to leave on time at 3.29, getting there at 4.25." (John, November 21st 2026: more
    // natural than a sentence of its own.) The expected time, or the timetabled one.
    const there = reaches(c.t)
    text += `${arrive}, and ${leave}${!mineP && p ? ` from platform ${p}` : ''}${there ? `, getting there at ${say(there)}` : ''}.`
    if (!mineP && p && showing) text += ` It’ll be showing on the departure board as the ${showing} train.`
    if (relies) text += ' It may make up time, so don’t count on it.'
    // A later train that gets there sooner (John agreed, November 21st 2026).
    over = quicker(c).sort((x, y) => x.a! - y.a! || x.g - y.g)[0] ?? null
    // Both platforms in one sentence where there are two trains to tell apart (John).
    const both = !!(over && over.t.platform && mineP && p && mineP !== p)
    if (over) text += ` The ${named(over.t)}${!both && over.t.platform ? ` from platform ${over.t.platform}` : ''} leaves ${over.g === c.g ? 'at the same time' : 'later'} but gets there sooner, at ${say(reaches(over.t)!)}.`
    if (mineP && p) {
      // How to get there: "over the footbridge" and so on (John, November 21st 2026).
      const how = howToGet(o.links, mineP, p)
      const how2 = both ? howToGet(o.links, mineP, over!.t.platform!) : ''
      const one = `platform ${p} for the ${named(c.t)}`, two = both ? `platform ${over!.t.platform} for the ${named(over!.t)}` : ''
      const wants = !both ? '' : how && how === how2 ? `${one}, or ${two}, both ${how}`
        : `${one}${how ? `, ${how},` : ','} or ${two}${how2 ? `, ${how2}` : ''}`
      text += mineP === p ? ` You’re coming into platform ${mineP}, and the ${to} train leaves from the same platform${showing ? `, showing as the ${showing} train` : ''}.`
        : both ? ` You’re coming into platform ${mineP} and you’ll want ${wants}.${showing ? ` The ${named(c.t)} will be showing on the departure board as the ${showing} train.` : ''}`
        // "for the 3.27" where the route has more than one kind of train (John).
        : ` You’re coming into platform ${mineP} and you’ll want platform ${p}${sp.size ? ` for the ${say(c.t.std)}` : ''}${how ? `, ${how}` : ''}${showing ? `, where your train will be showing on the departure board as the ${showing} train` : ''}.`
    } else if (!p) {
      text += `${mineP ? ` You’re coming into platform ${mineP}.` : ''} The platform for the ${to} train hasn’t been announced yet.${showing ? ` It’ll be showing on the departure board as the ${showing} train.` : ''}`
    }
  }

  // The next one: after "fine" too, without "if you miss it" (John: a packet of crisps).
  const n = next(c.t.id, 1)
  if (n && n === over) {
    // Already named as the quicker train.
  } else if (n) {
    const from = n.t.platform ? ` from platform ${n.t.platform}` : ''
    const opener = kind === 'fine' ? 'The one after that is' : kind === 'tight' ? 'If you miss it, the next one is' : 'The next one is'
    const b = band(n.g)
    // "The one after that is two minutes later, the 6.47 from platform 9B" (John, November 21st
    // 2026), when it leaves within ten minutes of the first (the limit is Claude's).
    const d = n.g - c.g
    const later = kind === 'fine' && d >= 1 && d < 10 ? `${minutes(d)} later, ` : ''
    text += ` ${opener} ${later}the ${named(n.t)}${from}`
    text += b === 'unlikely' ? `. You’d only have ${minutes(n.g)} to change, so that looks unlikely too.`
      : b === 'tight' ? `. You’d have ${minutes(n.g)} to change, so that’s going to be tight too.`
      : `, which would give you ${aWait(n.g)}.`
    // When the next one is tight or unlikely as well, the first with six minutes or more (John,
    // November 21st 2026, for "unlikely too"; for "tight too" as well is Claude's draft).
    const easy = b === 'fine' ? null : next(n.t.id, 6)
    if (easy) text += ` The next connection which looks comfortable is the ${named(easy.t)}${easy.t.platform ? ` from platform ${easy.t.platform}` : ''}, which would give you ${aWait(easy.g)}.`
  } else if (kind !== 'fine') {
    text += ` Trainchecker can’t see a later train to ${to} in the next four hours.` // draft
  }
  return { kind, text: text + far }
}

/** The trains offered in Connections and Exits (John, November 26th 2026, on the train out of Reading:
 *  the first eight were older trains still on their way, so the one just gone couldn't be chosen):
 *  every train that has left A and is still on its way (or got in within the last three minutes,
 *  filtered before this), then the next NEXT_TO_LEAVE to leave, in time order. "Left" as in
 *  whichTrain(): the expected departure (or timetabled) has passed; "Delayed" with no time hasn't. */
export const NEXT_TO_LEAVE = 4
export function shownTrains<T>(now: string, items: T[], train: (x: T) => { std: string; etd: string | null; unknown?: boolean }): T[] {
  const left = (x: T) => { const t = train(x); return !t.unknown && t.etd !== 'Delayed' && diff(now, isTime(t.etd) ? t.etd : t.std) < 0 }
  const next = new Set(items.filter((x) => !left(x)).slice(0, NEXT_TO_LEAVE))
  // Kept in the list's own (timetabled) order.
  return items.filter((x) => left(x) || next.has(x))
}

/** The question above the list of trains you might be on (John, November 22nd 2026): "planning to
 *  take" when none has left A yet, "on" when they all have, both otherwise. A train has left once
 *  its expected departure (or timetabled, when it has no time) has passed; one delayed with no
 *  time given yet hasn't. */
export function whichTrain(now: string, trains: { std: string; etd: string | null; unknown?: boolean }[]): string {
  const left = (t: { std: string; etd: string | null; unknown?: boolean }) => !t.unknown && diff(now, isTime(t.etd) ? t.etd : t.std) < 0
  const n = trains.filter(left).length
  return n === 0 ? 'Which train are you planning to take?' : n === trains.length ? 'Which train are you on?' : 'Which train are you on, or planning to take?'
}
