// "Follow my progress" (John, November 26th 2026; design/follow-my-train/README.md): Message home's share
// ends "Follow my progress on Trainchecker:" with a link to a page about that one train. The link, after the
// "#" (never sent to the server): #RDG-PAD/follow/1805-10781475-20261126 (the journey, the timetabled time at
// A, the first eight characters of the train's id, which are the same on every station's board, and the day).
//
// Where the train is comes only from the stops it calls at, from the departure board at A (an actual time for
// each stop passed) or, once it has gone from that board, from B's arrival board. Between A and B with no stop
// in between, nothing is said about where it is (John). The sentences are John's drafts of November 26th 2026
// (on its way: left on time, left on time but now late, left late and still as late), with Claude's drafts
// for the other cases, all for John to confirm.
import { clock, diff, isTime, type Analysis, type Train } from './analyse.ts'
import { placeName } from './passesNear.ts'
import { num, otherCompany, reasonText, t12 } from './sentences.ts'

export type FollowLink = { from: string; to: string; std: string; id: string; date: string }

export function parseFollow(hash: string): FollowLink | null {
  const m = /^#?([A-Za-z]{3})-([A-Za-z]{3})\/follow\/(\d\d)(\d\d)-([A-Za-z0-9]{8})-(\d{8})$/.exec(decodeURIComponent(hash))
  return m ? { from: m[1].toUpperCase(), to: m[2].toUpperCase(), std: `${m[3]}:${m[4]}`, id: m[5], date: m[6] } : null
}
export const followHash = (l: FollowLink) => `#${l.from}-${l.to}/follow/${l.std.replace(':', '')}-${l.id}-${l.date}`

/** The day in the UK, "20261126". */
export function ukDay(d: Date): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.year}${p.month}${p.day}`
}
/** "November 26th", from "20261126". */
function daySaid(day: string): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const d = Number(day.slice(6)), ord = d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th'
  return `${months[Number(day.slice(4, 6)) - 1]} ${d}${ord}`
}

export type FollowState = 'waiting' | 'delayed' | 'onway' | 'arrived' | 'cancelled' | 'missing' | 'stale'
export type Follow = {
  state: FollowState
  /** "The 6.11pm from Reading": the page's heading. */
  heading: string
  /** The sentences. */
  text: string
  /** How it's doing, for the box's edge: on time, late, or cancelled (or no colour). */
  tone: 'good' | 'mixed' | 'prepared' | 'none'
  /** The train's line, for the box: when it's expected in, and how late, and the platform at B. */
  line: { exp: string | null; late: string; platform: string | null; noPlat: boolean; arrived: boolean } | null
}

/** Under two minutes either way counts as on time, and a change of one minute as no change (as Message home). */
const ON_TIME = 2
const minutes = (k: number) => `${num(k)} ${k === 1 ? 'minute' : 'minutes'}`

/** "12 minutes ago", "a minute ago", "just now", "an hour and 10 minutes ago". */
export function ago(n: number): string {
  if (n <= 0) return 'just now'
  if (n === 1) return 'a minute ago'
  if (n < 60) return `${minutes(n)} ago`
  const h = Math.floor(n / 60), m = n % 60
  const hours = h === 1 ? 'an hour' : `${num(h)} hours`
  return m ? `${hours} and ${minutes(m)} ago` : `${hours} ago`
}

/** The train the link names: the same id (its first eight characters) and the same booked time at A, so a train
 *  with the same id on another day can't be taken for it. */
const sameTrain = (l: FollowLink) => (t: { id: string; std: string }) => t.id.slice(0, 8) === l.id && t.std === l.std

export function followFor(a: Analysis, l: FollowLink, today: string): Follow {
  const all = [...a.past, ...a.ahead]
  const dep = all.find(sameTrain(l)) as Train | undefined
  const arr = a.arr?.find(sameTrain(l))
  const src = dep ?? arr
  const from = a.from, to = a.to
  const co = src ? otherCompany(src, all) : ''
  const name = `The ${t12(l.std)}${co ? ` ${co}` : ''} train`
  const heading = `The ${t12(l.std)}${co ? ` ${co} train` : ''} from ${from}`
  const base = { heading, line: null, tone: 'none' as const }
  // A link opened on a later day, once the train has gone from the boards. While it's still on them it's followed
  // whatever the date: sent at 11.52pm about the 11.50pm, opened at 12.10am (John, November 26th 2026).
  if (!src && l.date !== today) {
    return { ...base, state: 'stale', text: `This link was for the ${t12(l.std)} train from ${from} to ${to} on ${daySaid(l.date)}. It’s no longer being followed.` }
  }
  if (!src) {
    // Draft: not on either board. Before (or near) its time, it may simply not be listed yet; long after, it
    // will have finished its journey.
    const text = diff(l.std, a.now) > 120
      ? `${name} from ${from} to ${to} is no longer on National Rail’s boards, so it will have finished its journey.`
      : `Trainchecker can’t find ${name.replace(/^The/, 'the')} from ${from} to ${to} on National Rail’s boards at the moment. Please check again later.`
    return { ...base, state: 'missing', text }
  }
  if (src.cancelled) {
    // Draft: cancelled, with National Rail's reason when it gives one.
    const why = reasonText(src.reason)
    return { ...base, state: 'cancelled', tone: 'prepared', text: `${name} from ${from} to ${to} has been cancelled${why && why !== src.reason ? ` because of ${why}` : ''}.` }
  }

  const platform = arr?.platform ?? null
  const on = platform ? `, on platform\u00a0${platform}` : ''
  const sta = arr?.sta ?? src.sta!
  const ata = arr?.ata ?? src.ata
  const arrived = isTime(ata) || ata === 'On time'
  const eta = arr?.eta ?? src.eta
  const exp = arrived ? (isTime(ata) ? ata : sta) : isTime(eta) ? eta : eta === 'On time' || eta == null ? sta : null
  const late = exp ? diff(sta, exp) : 0
  const lateArr = late >= ON_TIME, early = late <= -ON_TIME
  // On B's arrival board but no platform given yet: "not yet" (as Message home), so it's clear it isn't known yet
  // rather than left out (John, November 26th 2026). Not on that board at all: nothing said about the platform.
  const noPlat = !!arr && !platform && !arrived
  const line = { exp, platform, noPlat, arrived, late: !exp ? 'delayed, no new time yet' : arrived ? (lateArr ? `got in ${minutes(late)} late` : 'got in') : lateArr ? `${minutes(late)} late` : early ? 'a little early' : 'on time' }
  const tone = !exp || lateArr ? 'mixed' as const : 'good' as const

  if (arrived) {
    // Draft: in. "got into … 15 minutes late, at 5.44pm" as "left 15 minutes late, at 5.20pm".
    return { heading, line, tone, state: 'arrived', text: `${name} from ${from} got into ${to}${lateArr ? ` ${minutes(late)} late,` : ''} at ${t12(exp!)}${on}.` }
  }

  // How it left A: on time, late (and when), or not known; "Delayed" with no time given yet.
  const etd = (dep ?? arr)!.etd
  const d = etd === 'On time' ? { late: 0, at: l.std } : isTime(etd) ? { late: diff(l.std, etd), at: etd } : null
  const calls = (dep?.calls ?? arr?.calls ?? []) as [string, string, string | null, (0 | 1)?][]
  const passed = calls.map((c) => c[3] === 1).lastIndexOf(true)
  const left = passed >= 0 || (!!d && diff(a.now, d.at) < 0)
  const into = `into ${to} at ${t12(exp ?? sta)}`

  if (!left) {
    // Draft: not left yet (John agreed planning messages carry the link too).
    if (etd === 'Delayed' || !exp) {
      return { heading, line, tone: 'mixed', state: 'delayed', text: `${name} from ${from} to ${to} is delayed, with no new time given yet. It was due to leave ${from} at ${t12(l.std)} and get into ${to} at ${t12(sta)}.` }
    }
    const leave = d && d.late >= ON_TIME ? `leave ${minutes(d.late)} late, at ${t12(d.at)},` : 'leave on time'
    // Arriving later (or less late) than it leaves: "get into London Paddington 13 minutes late, at 7.07pm".
    const getIn = lateArr && !(d && Math.abs(late - d.late) <= 1) ? `get into ${to} ${minutes(late)} late, at ${t12(exp)}` : `get ${into}`
    return { heading, line, tone, state: 'waiting', text: `${name} from ${from} to ${to} hasn’t left yet. It’s expected to ${leave} and ${getIn}${on}.` }
  }

  // Where it is: between the last stop passed and the next; nothing between A and B with no stop between.
  const prev = passed >= 0 ? placeName(calls[passed][0]) : from
  const next = passed + 1 < calls.length ? placeName(calls[passed + 1][0]) : to
  const where = calls.length ? `, now between ${prev} and ${next}` : ''
  const first = `${name} from ${from} to ${to} is on its way${where}.`
  if (!exp) return { heading, line, tone, state: 'onway', text: `${first} It’s delayed, with no new time given yet. It was due ${into}.` }

  const cur = `currently expected ${into}${on}`
  let rest: string
  if (!d) {
    // How it left isn't known: by the arrival alone.
    rest = lateArr ? `It’s now running ${minutes(late)} late, ${cur}.` : `It’s ${cur}.`
  } else if (d.late < ON_TIME) {
    const lft = (n: number) => (n <= 0 ? 'It left on time just now' : `It left on time, ${ago(n)},`)
    const gone = lft(diff(d.at, a.now))
    if (lateArr) rest = `${gone} but it’s now running ${minutes(late)} late, ${cur}.` // 2 (John)
    else if (early) rest = `${gone} and it’s running a little early, ${cur}.` // 4
    else rest = `${gone} and it’s ${cur}.` // 1 (John)
  } else {
    const leftLate = `It left ${minutes(d.late)} late, at ${t12(d.at)},`
    // In the first five minutes after it left, "it should make up …": it can't have made up much yet; and "as planned",
    // not "on time", after "the time" (John, November 26th 2026).
    const soon = diff(d.at, a.now) < 5
    if (Math.abs(late - d.late) <= 1) rest = `${leftLate} so it’s ${cur}.` // 3 (John)
    else if (!lateArr) rest = `${leftLate} but it${soon ? ' should make' : '’s made'} up the time, and it’s currently expected into ${to} ${early ? 'a little early' : 'as planned'}, at ${t12(exp)}${on}.` // 6
    else if (late < d.late && soon) rest = `${leftLate} but it should make up some time, and it’s currently expected into ${to} ${minutes(late)} late, at ${t12(exp)}${on}.` // 5, early on
    else if (late < d.late) rest = `${leftLate} but it’s made up some time, and it’s now running ${minutes(late)} late, ${cur}.` // 5
    else rest = `${leftLate} and it’s now running ${minutes(late)} late, ${cur}.` // 7
  }
  return { heading, line, tone, state: 'onway', text: `${first} ${rest}` }
}

/** The time of the check, for the page: "6.24pm". */
export const checkedAt = (a: Analysis) => t12(clock(a.taken))
