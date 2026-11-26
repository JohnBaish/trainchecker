// "Message home" (John, November 26th 2026): choose your train, see its line from the arrivals board at B,
// and share it as a picture with a sentence. The wording is John's, with Claude's drafts for the cases he
// didn't cover (marked Draft), all for John to confirm.
//
// The line comes from B's arrival board (`a.arr`, its platform B's), matched to the train on A's
// departure board by the first eight characters of its id (the same on every station's board). A
// train not on B's arrival board yet (it reaches only about two hours ahead) falls back to the
// departure board's time at B, with no platform.
import { diff, isTime, type Analysis, type Train } from './analyse.ts'
import { kindOf, num, otherCompany, t12, type PicRow } from './sentences.ts'

export type Home = {
  /** The train's line, as a row of the arrivals board. */
  row: PicRow
  /** "The 10.02am from Reading": the picture's heading. */
  heading: string
  /** "Expected into London Paddington at 10.26am, on platform 11.": the picture's words. */
  line: string
  /** The sentence sent with the picture. */
  sent: string
  /** Whether B's own arrival board gave the line (and so the platform column applies). */
  fromArr: boolean
  /** On a computer (John, November 26th 2026): no picture, only this message to copy, the phone's message turned
   *  round ("The 6.11pm from Reading is expected into …, on platform 9."), ending with what the link is for. */
  desk: string
}

/** Minutes before a train leaves when it becomes "my train". */
export const SOON = 4

const minutes = (k: number) => `${num(k)} ${k === 1 ? 'minute' : 'minutes'}`

export function homeFor(a: Analysis, t: Train, now: string): Home {
  const twin = a.arr?.find((x) => x.id.slice(0, 8) === t.id.slice(0, 8))
  const src = twin ?? t
  const platform = twin?.platform ?? null
  const to = a.to, from = a.from
  // "My train" once it has left, or is expected to leave in the next four minutes (John, November 26th
  // 2026); before that, "I'm planning to get".
  const left = !t.unknown && t.etd !== 'Delayed' && diff(now, isTime(t.etd) ? t.etd : t.std) <= SOON
  const arrived = isTime(src.ata) || src.ata === 'On time'
  const sta = src.sta ?? t.sta!
  const exp = arrived ? (isTime(src.ata) ? src.ata : sta) : isTime(src.eta) ? src.eta : src.eta === 'On time' || src.eta == null ? sta : null
  const late = exp ? diff(sta, exp) : 0
  // As the train lists and boards say it, from every train on the board (not only those still to leave).
  const kind = kindOf(a)(t)
  const on = platform ? `, on platform ${platform}` : ''
  // "The 4.47pm Elizabeth Line train from Reading" where another company's train leaves at the same time.
  const co = otherCompany(t, [...a.past, ...a.ahead])
  const heading = co ? `The ${t12(t.std)} ${co} train from ${from}` : `The ${t12(t.std)} from ${from}`
  const row: PicRow = {
    time: exp ? t12(exp) : '?',
    // "The 5.05pm" first in Message home's box, the time it's expected in after it (John, November 26th 2026).
    mid: [`The ${t12(t.std)}`, kind].filter(Boolean).join(' · '),
    late: !exp ? `delayed, was due ${t12(sta)}, no new time yet` : arrived ? 'arrived' : late > 0 ? `${minutes(late)} late` : '',
    ...(late > 0 && exp && !arrived ? { lateBy: late, arrow: true } : {}),
    ...(twin ? (platform ? { platform } : { noPlat: true }) : {}),
  }
  let line: string, sent: string, desk: string
  // The computer's message: fixed times only, so it stays true however late it's read (John, November 26th 2026).
  const follow = ' Follow its progress on Trainchecker:'
  if (!exp) {
    desk = `${heading} is delayed, with no new time given yet. It was due into ${to} at ${t12(sta)}.${follow}`
    // Draft: delayed with no new time.
    line = `Delayed, with no new time given yet. It was due into ${to} at ${t12(sta)}${on}.`
    sent = left ? `Here’s my train from ${from}, which is delayed, with no new time given yet. It was due into ${to} at ${t12(sta)}.`
      : `I’m planning to get the ${t12(t.std)} from ${from}, which is delayed, with no new time given yet. It was due into ${to} at ${t12(sta)}${on}.`
  } else if (arrived) {
    // Already in (John, November 26th 2026): "Arrived into …" in the picture; the message keeps "got into", for variety.
    line = `Arrived into ${to} at ${t12(exp)}${on}.`
    sent = `Here’s my train from ${from}, which got into ${to} at ${t12(exp)}.`
    desk = `${heading} got into ${to} at ${t12(exp)}${on}. See how the trains are doing on Trainchecker:`
  } else {
    // The picture's words go by the arrival alone.
    line = late > 0 ? `Running ${minutes(late)} late, now expected into ${to} at ${t12(exp)}${on}.` : `Expected into ${to} at ${t12(exp)}${on}.`
    const o = { from, to, std: t.std, exp, late, dep: depart(t), left, gone: gone(t, now), on }
    sent = sentFor(o)
    desk = deskFor(heading, o) + follow
  }
  return { row, heading, line, sent, fromArr: !!twin, desk }
}

/** How late the train left, or is expected to leave, A, in minutes ("On time" is 0); null when not known. */
function depart(t: Train): { late: number; at: string } | null {
  if (t.etd === 'On time') return { late: 0, at: t.std }
  if (isTime(t.etd)) return { late: diff(t.std, t.etd), at: t.etd }
  return null
}
/** Whether it has actually left A (not only within the four minutes). */
const gone = (t: Train, now: string) => { const d = depart(t); return !!d && diff(now, d.at) < 0 }

/** Under two minutes either way counts as on time, and a change of one minute as no change (John, November
 *  26th 2026, case 11). */
const ON_TIME = 2

type Said = { from: string; to: string; std: string; exp: string; late: number; dep: { late: number; at: string } | null; left: boolean; gone: boolean; on: string }

/** The computer's message (John, November 26th 2026): the phone's cases turned round, "The 6.11pm from Reading …",
 *  with the platform wherever it's known. All agreed by John. */
export function deskFor(name: string, o: Said): string {
  const { to, exp, late, dep, on } = o
  const into = `into ${to} at ${t12(exp)}`
  const lateArr = late >= ON_TIME, early = late <= -ON_TIME
  const depLate = dep && dep.late >= ON_TIME ? dep : null
  const leftLate = depLate ? `${minutes(depLate.late)} late, at ${t12(depLate.at)}` : ''
  if (!o.left) {
    if (depLate) return `${name} is expected to leave ${leftLate}, getting ${into}${on}.` // 9
    if (lateArr) return `${name} is running ${minutes(late)} late, now expected ${into}${on}.`
    return `${name} is expected ${into}${on}.`
  }
  if (!o.gone) return `${name} is due to leave ${depLate ? leftLate : 'on time'}, and it’s expected ${into}${on}.` // 8
  if (!dep) return lateArr ? `${name} is running ${minutes(late)} late, now expected ${into}${on}.` : `${name} is expected ${into}${on}.`
  if (!depLate) {
    if (lateArr) return `${name} left on time but it’s now running ${minutes(late)} late, expected ${into}${on}.` // 2
    if (early) return `${name} is expected into ${to} a little early, at ${t12(exp)}${on}.` // 3
    return `${name} is expected ${into}${on}.` // 1
  }
  if (Math.abs(late - depLate.late) <= 1) return `${name} left ${leftLate}, so it’s expected ${into}${on}.` // 4
  if (!lateArr) return `${name} left ${leftLate}, but it’s made up the time and is expected into ${to} ${early ? 'a little early' : 'on time'}, at ${t12(exp)}${on}.` // 6
  if (late < depLate.late) return `${name} left ${leftLate}, but it’s made up some time so it’s now expected ${into}${on}, ${minutes(late)} later than originally planned.` // 5
  return `${name} left ${leftLate}, and it’s now running ${minutes(late)} late, expected ${into}${on}.` // 7
}

/** The message sent with the picture, for a train still on its way (John, November 26th 2026, cases 1 to 10). */
export function sentFor(o: Said): string {
  const { from, to, exp, late, dep, on } = o
  const into = `into ${to} at ${t12(exp)}`
  const lateArr = late >= ON_TIME, early = late <= -ON_TIME
  const depLate = dep && dep.late >= ON_TIME ? dep : null
  const leftLate = depLate ? `${minutes(depLate.late)} late, at ${t12(depLate.at)}` : ''
  if (!o.left) {
    // 8 and 9, and (agreed earlier) a train leaving on time that's expected in late.
    if (depLate) return `I’m planning to get the ${t12(o.std)} from ${from}. It’s expected to leave ${leftLate}, getting ${into}${on}.`
    if (lateArr) return `I’m planning to get the ${t12(o.std)} from ${from}, running ${minutes(late)} late, now expected ${into}${on}.`
    return `I’m planning to get the ${t12(o.std)} from ${from}, expected ${into}${on}.`
  }
  const mine = `Here’s my train from ${from}`
  // 10: "my train" in the four minutes before it leaves.
  if (!o.gone) return `${mine}. It’s due to leave ${depLate ? leftLate : 'on time'}, and it’s expected ${into}.`
  // Not known how late it left: by the arrival alone, as before.
  if (!dep) return lateArr ? `${mine}, running ${minutes(late)} late, now expected ${into}.` : `${mine}, expected ${into}.`
  if (!depLate) {
    if (lateArr) return `${mine}. It left on time but it’s now running ${minutes(late)} late, expected ${into}.` // 2
    if (early) return `${mine}, expected into ${to} a little early, at ${t12(exp)}.` // 7
    return `${mine}, expected ${into}.` // 1
  }
  if (Math.abs(late - depLate.late) <= 1) return `${mine}. It left ${leftLate}, so it’s expected ${into}.` // 3
  if (!lateArr) return `${mine}. It left ${leftLate}, but it’s made up the time and is expected into ${to} ${early ? 'a little early' : 'on time'}, at ${t12(exp)}.` // 5
  if (late < depLate.late) return `${mine}. It left ${leftLate}, but it’s made up some time so it’s now expected ${into}, ${minutes(late)} later than originally planned.` // 4
  return `${mine}. It left ${leftLate}, and it’s now running ${minutes(late)} late, expected ${into}.` // 6
}
