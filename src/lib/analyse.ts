// The agreed rules (SPEC §7 and §8; design/stage-1-recommendation-2026-11-17.md §2), applied to
// what the live function sends (api/live.ts): the verdict, "badly disrupted", the next four
// hours, the last two hours and the platforms. Ported from design/mockups/analyse.mjs, which
// made the agreed mock-ups; scripts/check-rules.ts tries it on the real snapshots.

/** One train, as api/live.ts sends it. */
export type Service = {
  id: string; std: string; etd: string | null; platform: string | null; operator: string; destination: string
  cancelled: boolean; reason: string | null; sta: string | null; eta: string | null; ata: string | null
}
export type Snap = { taken: string; from: string; to: string; fromName: string; toName: string; services: Service[] }

export type Train = Service & {
  rel: number // minutes from now to its timetabled departure (negative: already gone)
  late: number | null // expected minutes late leaving (next four hours)
  unknown: boolean // "Delayed" with no time given
}

export type Kind = 'good' | 'mixed' | 'prepared' | 'none'
export type Tense = 'past' | 'future' | 'mixed'

export type Analysis = {
  now: string; from: string; to: string; fromCrs: string; toCrs: string; taken: string
  ahead: Train[]; past: Train[]; cancelled: Train[]; late5: Train[]; unknown: Train[]
  affected: number; allowance: number; verdict: Kind; badly: boolean
  why: { twoOfThree: boolean; gap: number | null; noTrains: boolean }
  last: { byArrivals: boolean; tense: Tense; known: number; within3: number; lates: number[]; usual: number | null; worst: number | null; cancelled: Train[] }
  worse: boolean
  platList: [string, number][]
  platKnown: number
  /** With no train in the next four hours: the latest that left in the last two, if any, so the
   *  page can say the last one has gone (John, November 17th 2026). */
  lastGone: Train | null
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
  const past = all.filter((s) => s.rel < 0 && s.rel >= -120)
  const ahead = all.filter((s) => s.rel >= 0 && s.rel <= 240)

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
  const expArr = (s: Train) => {
    const e = s.eta || s.ata
    if (e === null || e === 'On time') return fromNow(s.sta!)
    return isTime(e) ? fromNow(e) : null
  }
  const firstSched = ahead.find((s) => s.sta)
  const bests = running.map(expArr).filter((x): x is number => x !== null)
  let gap = bests.length && firstSched ? Math.min(...bests) - fromNow(firstSched.sta!) : null
  if (gap !== null && gap < 0) gap = 0
  const noTrains = ahead.length > 0 && running.length === 0
  const badly = twoOfThree || (gap !== null && gap >= 45) || noTrains

  // The verdict: good news allows one train, or one in ten when there are 20 or more.
  const allowance = Math.max(1, Math.floor(ahead.length / 10))
  let verdict: Kind = 'good'
  if (affected > allowance) verdict = 'mixed'
  if (badly || cancelled.length >= 3) verdict = 'prepared'
  if (ahead.length === 0) verdict = 'none'

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
  const lates = known.map(([, l]) => l).filter((l) => l > 3).sort((x, y) => x - y)
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
    now, from: snap.fromName, to: snap.toName, fromCrs: snap.from, toCrs: snap.to, taken: snap.taken,
    ahead, past, cancelled, late5, unknown, affected, allowance, verdict, badly,
    why: { twoOfThree, gap, noTrains },
    last: { byArrivals, tense, known: known.length, within3, lates, usual, worst, cancelled: pastCancelled },
    worse, platList, platKnown: platList.reduce((a, [, n]) => a + n, 0),
    lastGone: ahead.length ? null : past.filter((s) => !s.cancelled).at(-1) ?? null,
  }
}
