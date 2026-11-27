// The agreed rules (SPEC §7 and §8; design/stage-1-recommendation-2026-11-17.md §2), applied to
// what the live function sends (api/live.ts): the verdict, "badly disrupted", the next four
// hours, the last two hours and the platforms. Ported from design/mockups/analyse.mjs, which
// made the agreed mock-ups; scripts/check-rules.ts tries it on the real snapshots.

/** One train, as api/live.ts sends it. */
export type Service = {
  id: string; std: string; etd: string | null; platform: string | null; operator: string; destination: string
  cancelled: boolean; reason: string | null; sta: string | null; eta: string | null; ata: string | null
  /** Stops between A and B: [code, timetabled, actual or expected "HH:MM" or null] (api/live.ts). */
  calls?: [string, string, string | null, (0 | 1)?][]
  /** Coaches leaving A, when the board gives it (MOCK-UP, November 27th 2026). */
  coaches?: number | null
}
/** `arrivals`: from B's arrival board (api/live.ts, November 25th 2026); each `platform` is B's. */
export type Snap = { taken: string; from: string; to: string; fromName: string; toName: string; services: Service[]; route?: string[]; stops?: [string, string][]; arrivals?: Service[] | null }

export type Train = Service & {
  rel: number // minutes from now to its timetabled departure (negative: already gone)
  late: number | null // expected minutes late leaving (next four hours)
  unknown: boolean // "Delayed" with no time given
}

export type Kind = 'good' | 'mixed' | 'prepared' | 'none'
export type Tense = 'past' | 'future' | 'mixed'

export type Analysis = {
  now: string; from: string; to: string; fromCrs: string; toCrs: string; taken: string
  /** Stations the trains call at after A (api/live.ts). */
  route: string[]
  /** The stations in order between A and B, with names (api/live.ts). */
  stops: [string, string][]
  ahead: Train[]; past: Train[]; cancelled: Train[]; late5: Train[]; unknown: Train[]
  /** Expected to leave on time but reach B more than five minutes late. */
  arrLate: Train[]
  affected: number; allowance: number; verdict: Kind; badly: boolean
  /** The train that will leave next (by expected time), when it's cancelled, more than five minutes late or
   *  "Delayed" with no time; and whether that alone made the verdict "a mixed bag" (John, November 26th 2026). */
  nextBad: Train | null; byNext: boolean
  why: { twoOfThree: boolean; gap: number | null; noTrains: boolean }
  last: { byArrivals: boolean; tense: Tense; known: number; within3: number; lates: number[]; lateArrived: boolean[]; usual: number | null; worst: number | null; cancelled: Train[] }
  worse: boolean
  platList: [string, number][]
  platKnown: number
  /** With no train in the next four hours: the latest that left in the last two, if any, so the
   *  page can say the last one has gone (John, November 17th 2026). */
  lastGone: Train | null
  /** The trains due at B from A, from B's arrival board, with the platform at B (`platform` here
   *  is B's, not A's); null without it, and then Arrivals uses the departure boards as before. */
  arr: Train[] | null
}

export const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
/** Minutes from a to b, wrapped to -12h..+12h, so 23:58 to 00:03 is 5, not -1435 (a fault
 *  found in stage 1). */
export const diff = (a: string, b: string) => { let d = mins(b) - mins(a); if (d < -720) d += 1440; if (d > 720) d -= 1440; return d }
export const isTime = (t: unknown): t is string => typeof t === 'string' && /^\d\d:\d\d$/.test(t)

/** UK clock time of a moment, "HH:MM". */
export function clock(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
}

export function analyse(snap: Snap): Analysis {
  const now = clock(snap.taken)
  // Sorted by minutes from now, not by clock time, so trains after midnight come last (the
  // other stage 1 fault).
  const all: Train[] = snap.services.map((s) => ({ ...s, rel: diff(now, s.std), late: null, unknown: false })).sort((a, b) => a.rel - b.rel)
  // A train whose timetabled time has passed but which hasn't left is still to leave: running late and
  // expected to go from now on, or "Delayed" with no time given (John, Birmingham New Street to Cardiff
  // Central at 6.22pm on November 26th 2026: the 6.12pm, expected at 6.30, was counted as gone, so the
  // page said the next train was on time).
  const waiting = (s: Service) => !s.cancelled && (isTime(s.etd) ? diff(now, s.etd) >= 0 : s.etd === 'Delayed')
  const past = all.filter((s) => s.rel < 0 && s.rel >= -120 && !waiting(s))
  const ahead = all.filter((s) => (s.rel >= 0 && s.rel <= 240) || (s.rel < 0 && s.rel >= -120 && waiting(s)))

  // The next four hours: how late each is expected to leave.
  for (const s of ahead) {
    s.late = s.cancelled ? null : s.etd === 'On time' ? 0 : isTime(s.etd) ? diff(s.std, s.etd) : null
    s.unknown = !s.cancelled && s.late === null // "Delayed", with no time given: counts as late (M3)
  }
  const cancelled = ahead.filter((s) => s.cancelled)
  const late5 = ahead.filter((s) => s.late !== null && s.late > 5)
  const unknown = ahead.filter((s) => s.unknown)
  const affected = cancelled.length + late5.length + unknown.length

  // Badly disrupted (SPEC §7, answer 9): two of the next three cancelled; someone arriving now
  // would reach B 45 minutes or more after the timetable says; or no trains running.
  const next3 = ahead.slice(0, 3)
  const twoOfThree = next3.filter((s) => s.cancelled).length >= 2
  const running = ahead.filter((s) => !s.cancelled && s.sta)
  const fromNow = (t: string) => (mins(t) - mins(now) + 1440) % 1440
  // A train shown as "Delayed" with no time isn't taken as never arriving: its timetabled time
  // stands in, so two "Delayed" trains alone don't make the line "badly disrupted" (fresh look
  // 2.2, John, November 18th 2026).
  const expArr = (s: Train) => {
    const e = s.eta || s.ata
    return isTime(e) ? fromNow(e) : fromNow(s.sta!)
  }
  const firstSched = ahead.find((s) => s.sta)
  const bests = running.map(expArr).filter((x): x is number => x !== null)
  let gap = bests.length && firstSched ? Math.min(...bests) - fromNow(firstSched.sta!) : null
  if (gap !== null && gap < 0) gap = 0
  const noTrains = ahead.length > 0 && running.length === 0
  const badly = twoOfThree || (gap !== null && gap >= 45) || noTrains

  // Trains expected to leave on time (within five minutes) but reach B more than five minutes
  // late (fresh look 2.2), so "The next four hours" can say so.
  const arrLate = ahead.filter((s) => !s.cancelled && s.late !== null && s.late <= 5 && s.sta && isTime(s.eta) && diff(s.sta, s.eta) > 5)

  // The verdict: good news allows one train, or one in ten when there are 20 or more.
  const allowance = Math.max(1, Math.floor(ahead.length / 10))
  let verdict: Kind = 'good'
  if (affected > allowance) verdict = 'mixed'
  // Three or more cancelled counts only when that's also more than one train in 20, so a third
  // cancellation on a very busy line isn't "Be prepared" on its own (fresh look 2.5, John).
  if (badly || (cancelled.length >= 3 && cancelled.length * 20 > ahead.length)) verdict = 'prepared'
  if (ahead.length === 0) verdict = 'none'
  // Never "Good news" when the train that will leave next is cancelled, more than five minutes late or
  // "Delayed" with no time (John, November 26th 2026, after Birmingham New Street to Cardiff Central: on a
  // line with one or two trains an hour, the one train the rule allows is the one you're about to catch).
  const leavesAt = (s: Train) => (!s.cancelled && s.late !== null && s.late > 0 && isTime(s.etd) ? diff(now, s.etd) : s.rel)
  const firstOut = [...ahead].sort((x, y) => leavesAt(x) - leavesAt(y))[0]
  // Unless another train taking about as long (within five minutes, or a fifth of the journey) is on time and leaves
  // in the next five minutes: then it's still good news (John, November 26th 2026: Liverpool Street to Stratford,
  // trains every few minutes).
  const took = (s: Train) => (s.sta ? diff(s.std, s.sta) : null)
  const alike = (x: Train, y: Train) => { const a = took(x), b = took(y); return a !== null && b !== null && Math.abs(a - b) <= Math.max(5, b / 5) }
  const nextOff = firstOut && (firstOut.cancelled || firstOut.unknown || (firstOut.late ?? 0) > 5) ? firstOut : null
  const covered = !!nextOff && ahead.some((s) => s !== nextOff && !s.cancelled && !s.unknown && (s.late ?? 0) <= 5 && leavesAt(s) >= 0 && leavesAt(s) <= 5 && alike(s, nextOff))
  const nextBad = covered ? null : nextOff
  const byNext = verdict === 'good' && !!nextBad
  if (byNext) verdict = 'mixed'

  // The last two hours: arrivals at B; on long journeys (fewer than three arrived), the trains
  // that left A, each by its actual or expected arrival (O1, John).
  const arrived = past.filter((s) => s.ata && s.sta && !s.cancelled)
  const lateBy = (s: Train, t: string | null) => (t === 'On time' ? 0 : isTime(t) ? diff(s.sta!, t) : null)
  const byArrivals = arrived.length >= 3
  const counted: [Train, number | null][] = byArrivals
    ? arrived.map((s) => [s, lateBy(s, s.ata)])
    : past.filter((s) => !s.cancelled && s.sta).map((s) => [s, lateBy(s, s.ata || s.eta)])
  const known = counted.filter((x): x is [Train, number] => x[1] !== null)
  const arrivedN = known.filter(([t]) => t.ata).length
  const tense: Tense = byArrivals || arrivedN === known.length ? 'past' : arrivedN === 0 ? 'future' : 'mixed'
  const within3 = known.filter(([, l]) => l <= 3).length
  const lateOnes = known.filter(([, l]) => l > 3).sort((x, y) => x[1] - y[1])
  const lates = lateOnes.map(([, l]) => l)
  // Whether each late one has arrived, for the tense when there are only one or two (John,
  // November 18th 2026: not "was or is expected to be" when it's just one).
  const lateArrived = lateOnes.map(([t]) => !!t.ata)
  const usual = lates.length ? lates[Math.floor((lates.length - 1) / 2)] : null // the middle one (N4)
  const worst = lates.length ? lates[lates.length - 1] : null
  const pastCancelled = past.filter((s) => s.cancelled)
  // "Bad" (N5, N6): two or more cancelled, or fewer than three in four within three minutes.
  // Said in the verdict then, unless it already says "Be prepared".
  const bad = pastCancelled.length >= 2 || (known.length >= 4 && within3 / known.length < 0.75)
  const worse = bad && verdict !== 'prepared' && verdict !== 'none'

  // Platforms, from the trains that aren't cancelled.
  const plats: Record<string, number> = {}
  for (const s of ahead) if (s.platform && !s.cancelled) plats[s.platform] = (plats[s.platform] || 0) + 1
  const platList = Object.entries(plats).sort((a, b) => b[1] - a[1])

  return {
    now, from: snap.fromName, to: snap.toName, fromCrs: snap.from, toCrs: snap.to, taken: snap.taken, route: snap.route ?? [], stops: snap.stops ?? [],
    ahead, past, cancelled, late5, unknown, arrLate, affected, allowance, verdict, badly, nextBad, byNext,
    why: { twoOfThree, gap, noTrains },
    last: { byArrivals, tense, known: known.length, within3, lates, lateArrived, usual, worst, cancelled: pastCancelled },
    worse, platList, platKnown: platList.reduce((a, [, n]) => a + n, 0),
    lastGone: ahead.length ? null : past.filter((s) => !s.cancelled).at(-1) ?? null,
    arr: snap.arrivals ? snap.arrivals.map((s) => ({ ...s, rel: diff(now, s.std), late: null, unknown: false })).sort((a, b) => a.rel - b.rel) : null,
  }
}
