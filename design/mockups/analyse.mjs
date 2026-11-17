// Stage 2 mock-ups: applies the agreed rules (design/stage-1-recommendation-2026-11-17.md §2,
// SPEC.md §7) to the snapshots saved by fetch-snapshot.mjs, and prints what each journey's
// page would say. build-mockups.mjs uses the same functions to put the figures into the page.
// Not part of the app: the app's own version will have checks (npm run check) for the two
// faults found in stage 1 (a negative gap wrapped round the clock; after-midnight trains
// sorted first). Usage: node analyse.mjs snapshots/<file>.json ...
import { readFileSync } from 'node:fs'

const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
// Minutes from a to b, wrapped to -12h..+12h, so 23:58 to 00:03 is 5, not -1435.
const diff = (a, b) => { let d = mins(b) - mins(a); if (d < -720) d += 1440; if (d > 720) d -= 1440; return d }
const isTime = (t) => typeof t === 'string' && /^\d\d:\d\d$/.test(t)

// UK clock time of the snapshot, "HH:MM".
export function clock(iso) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
}

export function services(snap) {
  const seen = new Map()
  for (const { board } of snap.boards) {
    for (const s of board.trainServices || []) {
      const cps = (s.subsequentCallingPoints || []).flatMap((g) => g.callingPoint || [])
      const p = cps.find((c) => c.crs === snap.to) || {}
      seen.set(s.serviceID, {
        id: s.serviceID, std: s.std, etd: s.etd, platform: s.platform || null,
        operator: s.operator, destination: (s.destination || []).map((x) => x.locationName).join(' and '),
        cancelled: Boolean(s.isCancelled || p.isCancelled),
        reason: s.cancelReason || p.cancelReason || s.delayReason || p.delayReason || null,
        sta: p.st || null, eta: p.et || null, ata: p.at || null,
      })
    }
  }
  return [...seen.values()]
}

export function analyse(snap) {
  const now = clock(snap.taken)
  const all = services(snap).map((s) => ({ ...s, rel: diff(now, s.std) })).sort((a, b) => a.rel - b.rel)
  const names = snap.boards.find((b) => b.board.locationName)?.board || {}
  const past = all.filter((s) => s.rel < 0 && s.rel >= -120)
  const ahead = all.filter((s) => s.rel >= 0 && s.rel <= 240)

  // Next four hours: how late each is expected to leave.
  for (const s of ahead) {
    s.late = s.cancelled ? null : s.etd === 'On time' ? 0 : isTime(s.etd) ? diff(s.std, s.etd) : null
    s.unknown = !s.cancelled && s.late === null // "Delayed", with no time given
  }
  const cancelled = ahead.filter((s) => s.cancelled)
  const late5 = ahead.filter((s) => s.late !== null && s.late > 5)
  const unknown = ahead.filter((s) => s.unknown)
  const affected = cancelled.length + late5.length + unknown.length

  // Badly disrupted (SPEC §7, answer 9).
  const next3 = ahead.slice(0, 3)
  const twoOfThree = next3.filter((s) => s.cancelled).length >= 2
  const running = ahead.filter((s) => !s.cancelled && s.sta)
  const fromNow = (t) => (mins(t) - mins(now) + 1440) % 1440
  const expArr = (s) => {
    const e = s.eta || s.ata
    if (e === null || e === 'On time') return fromNow(s.sta)
    return isTime(e) ? fromNow(e) : null
  }
  const firstSched = ahead.find((s) => s.sta)
  const bests = running.map(expArr).filter((x) => x !== null)
  let gap = bests.length && firstSched ? Math.min(...bests) - fromNow(firstSched.sta) : null
  if (gap !== null && gap < 0) gap = 0
  const noTrains = ahead.length > 0 && running.length === 0
  const badly = twoOfThree || (gap !== null && gap >= 45) || noTrains

  // Verdict (recommendation §2.1).
  const allowance = Math.max(1, Math.floor(ahead.length / 10))
  let verdict = 'good'
  if (affected > allowance) verdict = 'mixed'
  if (badly || cancelled.length >= 3) verdict = 'prepared'
  if (ahead.length === 0) verdict = 'none'

  // Last two hours (recommendation §2.3): arrivals, or departures if fewer than three arrived.
  const arrived = past.filter((s) => s.ata && s.sta && !s.cancelled)
  for (const s of arrived) s.arrLate = s.ata === 'On time' ? 0 : isTime(s.ata) ? diff(s.sta, s.ata) : null
  // Long journeys (O1, John): when fewer than three have arrived, the trains that left in
  // the last two hours, each by its actual arrival or, if still on its way, its expected one.
  const byArrivals = arrived.length >= 3
  let counted
  if (byArrivals) counted = arrived.map((s) => [s, s.arrLate])
  else {
    counted = past.filter((s) => !s.cancelled && s.sta).map((s) => {
      const t = s.ata || s.eta
      return [s, t === 'On time' ? 0 : isTime(t) ? diff(s.sta, t) : null]
    })
  }
  const known = counted.filter(([, l]) => l !== null)
  const within3 = known.filter(([, l]) => l <= 3).length
  const lates = known.map(([, l]) => l).filter((l) => l > 3).sort((x, y) => x - y)
  const usual = lates.length ? lates[Math.floor((lates.length - 1) / 2)] : null // the middle one
  const worst = lates.length ? lates[lates.length - 1] : null
  const pastCancelled = past.filter((s) => s.cancelled)
  // "Bad" (N5, N6, John): two or more cancelled, or fewer than three in four within three
  // minutes. Said in the top section then, except when it already says "Be prepared".
  const bad = (pastCancelled.length >= 2 || (known.length >= 4 && within3 / known.length < 0.75))
  const worse = bad && verdict !== 'prepared' && verdict !== 'none'

  // Platforms (recommendation §2.4).
  const plats = {}
  for (const s of ahead) if (s.platform && !s.cancelled) plats[s.platform] = (plats[s.platform] || 0) + 1
  const platList = Object.entries(plats).sort((a, b) => b[1] - a[1])

  return {
    now, from: names.locationName || snap.from, to: names.filterLocationName || snap.to,
    fromCrs: snap.from, toCrs: snap.to, taken: snap.taken,
    ahead, past, cancelled, late5, unknown, affected, allowance, verdict, badly,
    why: { twoOfThree, gap, noTrains },
    last: { byArrivals, known: known.length, within3, lates, usual, worst, cancelled: pastCancelled },
    worse, platList, platKnown: platList.reduce((a, [, n]) => a + n, 0),
    messages: (snap.messages || []).map((m) => m.Value || ''),
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const f of process.argv.slice(2)) {
    const a = analyse(JSON.parse(readFileSync(f, 'utf8')))
    console.log(`\n## ${a.from} to ${a.to}, ${a.now}: ${a.verdict}${a.worse ? ' + however' : ''}`)
    console.log(`next 4h: ${a.ahead.length} trains, ${a.cancelled.length} cancelled, ${a.late5.length} >5 late, ${a.unknown.length} delayed no time; affected ${a.affected} (allowance ${a.allowance}); badly ${a.badly} ${JSON.stringify(a.why)}`)
    for (const s of [...a.cancelled, ...a.late5, ...a.unknown].sort((x, y) => x.rel - y.rel)) console.log(`  ${s.std} ${s.operator} → ${s.destination}: ${s.cancelled ? 'cancelled' : s.etd} ${s.reason || ''}`)
    console.log(`last 2h (${a.last.byArrivals ? 'arrivals' : 'left'}): ${a.last.within3} of ${a.last.known} within 3; usual ${a.last.usual}, worst ${a.last.worst}; cancelled ${a.last.cancelled.length}`)
    console.log(`platforms: ${JSON.stringify(a.platList)} (${a.platKnown} of ${a.ahead.length - a.cancelled.length})`)
    for (const m of a.messages) console.log(`  msg: ${m.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}`)
  }
}
