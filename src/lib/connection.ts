// "Check my connection" (John, November 21st 2026): the sums and every sentence. You're on a train
// from A to B and changing at B for C. The wording of the four answers and the smaller pieces was
// drafted by Claude on real boards and edited by John the same day; anything marked "draft" below
// is Claude's and not yet agreed. scripts/check-connection.ts holds the agreed sentences.
import { diff, isTime, type Service } from './analyse.ts'
import { num, t12 } from './sentences.ts'
import type { Onward } from '../../api/connect.ts'

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

/** The trains you could ask about: from ten minutes before yours gets in, in the order they're
 *  expected to leave, six at most. */
export function choices(mine: Mine, trains: Onward[]): Onward[] {
  if (!mine.exp) return []
  const arr = mine.exp
  return trains.map((t) => ({ t, g: diff(arr, leaves(t) ?? t.std) })).filter((x) => x.g >= -10).sort((a, b) => a.g - b.g).slice(0, 6).map((x) => x.t)
}
/** The one it answers about first: your own train if it carries on to C, or the first you'd have
 *  at least a minute for (a cancelled one counts, so the page can say so). */
export function firstChoice(mine: Mine, trains: Onward[]): Onward | null {
  const list = choices(mine, trains)
  return list.find((t) => t.id === mine.id) ?? list.find((t) => diff(mine.exp!, leaves(t) ?? t.std) >= 1) ?? null
}

const minutes = (n: number) => `${num(n)} minute${n === 1 ? '' : 's'}`
const aWait = (n: number) => (n >= 60 ? 'a wait of more than an hour' : `${n === 8 || n === 11 || n === 18 ? 'an' : 'a'} ${num(n)}-minute wait`)

/** "pm" said with the first time and again only when it changes. */
function clockOnce() {
  let last = ''
  return (hhmm: string) => {
    const s = t12(hhmm), m = s.match(/^(.*?)(am|pm)$/)
    if (!m) { last = s === 'midday' ? 'pm' : 'am'; return s }
    const out = s.includes('.') && last === m[2] ? m[1] : s
    last = m[2]
    return out
  }
}

export type Answer = { kind: Band | 'through' | 'none' | 'unknown'; text: string }
export type Asked = {
  now: string // "HH:MM", when the boards were fetched
  from: string; at: string; to: string // the names of A, B and C
  mine: Mine
  arrPlatform: string | null
  trains: Onward[]
  chosen: string | null // an onward train's id; null for the first choice
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
  const list = o.trains.map((t) => ({ t, exp: leaves(t), g: diff(arr, leaves(t) ?? t.std) })).sort((a, b) => a.g - b.g)
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
  const named = (t: Onward) => say(t.std)

  let text = ''
  let c = list.find((x) => x.t.id === first.id)!
  let instead = ''
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
    text += `If you’re planning to get the ${lead} to ${to}${instead}, ${kind === 'fine' ? 'you should be fine' : kind === 'tight' ? 'it’s going to be tight' : 'that looks unlikely'}. `
    text += told ? `It’s running ${minutes(late)} late, which gives you ${minutes(gap)} to change trains. `
      : kind === 'unlikely' ? `You’d only have ${minutes(gap)} to change trains. ` : `You’ll have ${minutes(gap)} to change trains. `
    const leave = told ? `the ${to} train is now expected to leave at ${say(c.exp)}`
      : late >= 1 ? `the ${to} train is expected to leave ${minutes(late)} later than planned at ${say(c.exp)}`
      : `the ${to} train is expected to leave on time at ${say(c.exp)}`
    const p = c.t.platform, mineP = o.arrPlatform
    // Where we don't know the platform you're coming into, we just don't say (John).
    const alone = !mineP && p ? ` from platform ${p}${showing ? `, showing as the ${showing} train` : ''}` : ''
    text += `${arrive}, and ${leave}${alone}.`
    if (relies) text += ' It may make up time, so don’t count on it.'
    if (mineP && p) {
      text += mineP === p ? ` You’re coming into platform ${mineP}, and the ${to} train leaves from the same platform${showing ? `, showing as the ${showing} train` : ''}.`
        : ` You’re coming into platform ${mineP} and you’ll want platform ${p}${showing ? `, where your train will be showing on the departure board as the ${showing} train` : ''}.`
    } else if (!p) {
      text += `${mineP ? ` You’re coming into platform ${mineP}.` : ''} The platform for the ${to} train hasn’t been announced yet.${showing ? ` It’ll be showing on the departure board as the ${showing} train.` : ''}`
    }
  }

  // The next one: after "fine" too, without "if you miss it" (John: a packet of crisps).
  const n = after(c.t.id, 1)
  if (n) {
    const from = n.t.platform ? ` from platform ${n.t.platform}` : ''
    const opener = kind === 'fine' ? 'The one after that is' : kind === 'tight' ? 'If you miss it, the next one is' : 'The next one is'
    const b = band(n.g)
    text += ` ${opener} the ${named(n.t)}${from}`
    text += b === 'unlikely' ? `. You’d only have ${minutes(n.g)} to change, so that looks unlikely too.`
      : b === 'tight' ? `. You’d have ${minutes(n.g)} to change, so that’s going to be tight too.`
      : `, which would give you ${aWait(n.g)}.`
  } else if (kind !== 'fine') {
    text += ` Trainchecker can’t see a later train to ${to} in the next four hours.` // draft
  }
  return { kind, text: text + far }
}
