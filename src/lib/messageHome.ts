// "Message home" (John, November 26th 2026): choose your train, see its line from the arrivals board at B,
// and share it as a picture with a sentence. The wording is John's, with Claude's drafts for the cases he
// didn't cover (marked Draft), all for John to confirm.
//
// The line comes from B's arrival board (`a.arr`, its platform B's), matched to the train on A's
// departure board by the first eight characters of its id (the same on every station's board). A
// train not on B's arrival board yet (it reaches only about two hours ahead) falls back to the
// departure board's time at B, with no platform.
import { diff, isTime, type Analysis, type Train } from './analyse.ts'
import { boardKind, num, t12, type PicRow } from './sentences.ts'

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
  const kind = boardKind(a)(t)
  const on = platform ? `, on platform ${platform}` : ''
  const heading = `The ${t12(t.std)} from ${from}`
  const row: PicRow = {
    time: exp ? t12(exp) : '?',
    mid: [`the ${t12(t.std)}`, kind].filter(Boolean).join(' · '),
    late: !exp ? `delayed, was due ${t12(sta)}, no new time yet` : arrived ? 'arrived' : late > 0 ? `${minutes(late)} late` : '',
    ...(late > 0 && exp && !arrived ? { lateBy: late, arrow: true } : {}),
    ...(twin ? (platform ? { platform } : { noPlat: true }) : {}),
  }
  let line: string, sent: string
  if (!exp) {
    // Draft: delayed with no new time.
    line = `Delayed, with no new time given yet. It was due into ${to} at ${t12(sta)}${on}.`
    sent = left ? `Here’s my train from ${from}, which is delayed, with no new time given yet. It was due into ${to} at ${t12(sta)}.`
      : `I’m planning to get the ${t12(t.std)} from ${from}, which is delayed, with no new time given yet. It was due into ${to} at ${t12(sta)}${on}.`
  } else if (arrived) {
    // Already in (John, November 26th 2026): "Arrived into …" in the picture; the message keeps "got into", for variety.
    line = `Arrived into ${to} at ${t12(exp)}${on}.`
    sent = `Here’s my train from ${from}, which got into ${to} at ${t12(exp)}.`
  } else if (late > 0) {
    // John's "running six minutes late, now expected into…".
    line = `Running ${minutes(late)} late, now expected into ${to} at ${t12(exp)}${on}.`
    sent = left ? `Here’s my train from ${from}, running ${minutes(late)} late, now expected into ${to} at ${t12(exp)}.`
      : `I’m planning to get the ${t12(t.std)} from ${from}, running ${minutes(late)} late, now expected into ${to} at ${t12(exp)}${on}.`
  } else {
    line = `Expected into ${to} at ${t12(exp)}${on}.`
    sent = left ? `Here’s my train from ${from}, expected into ${to} at ${t12(exp)}.`
      : `I’m planning to get the ${t12(t.std)} from ${from}, expected into ${to} at ${t12(exp)}${on}.`
  }
  return { row, heading, line, sent, fromArr: !!twin }
}
