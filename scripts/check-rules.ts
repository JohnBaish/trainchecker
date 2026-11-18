// npm run check (part 1): the verdict rules and every sentence, on the real live boards saved on
// November 17th 2026 (design/mockups/snapshots/), following house style §10 ("Automatic checks").
//
// 1. The app's rules give exactly what the agreed mock-ups gave: the mock-up code
//    (design/mockups/analyse.mjs and sentences.mjs) is run on the same snapshots and compared.
// 2. John's agreed sentences, word for word, where the notes quote them.
// 3. The two faults found in stage 1: a gap wrapped the wrong way round the clock, and trains
//    after midnight sorted first. Each real snapshot is moved to just before midnight (every
//    time shifted by the same amount), and must give the same answers.
// 4. Rounding, the tense of long journeys, "badly disrupted", the last week, dates.
// 5. No "undefined", "null" or "NaN" in any sentence.
import { readFileSync, readdirSync } from 'node:fs'
import { trim, type RawBoard } from '../api/live.ts'
import { count } from '../api/week.ts'
import { analyse, diff, type Snap, type Analysis } from '../src/lib/analyse.ts'
import {
  verdict, nextFour, platforms, lastTwoLines, shareWords, share, lastWeekOthers, lastWeekText, weekFor, t12, dayName,
  hourLabel, HOURS, quoteShareText, type Line,
} from '../src/lib/sentences.ts'
import { quoteOfTheDay, QUOTES } from '../src/data/quotes.ts'
import { STATIONS, resolve, suggest } from '../src/lib/stations.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const dir = new URL('../design/mockups/snapshots/', import.meta.url)
type Raw = { taken: string; from: string; to: string; boards: { off: number; win: number; board: RawBoard }[] }
const raw = (f: string): Raw => JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
const snapOf = (s: Raw): Snap => trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const files = readdirSync(dir).filter((x) => /^\d{8}-\d{4}-[A-Z]{3}-[A-Z]{3}\.json$/.test(x)).sort()
const lineText = (ls: Line[]) => ls.map((l) => (l.bold ? `<b>${l.bold}</b>` : '') + l.text)

// The mock-ups' own code, loaded by name so TypeScript leaves it alone.
const mockDir = '../design/mockups/'
const M = await import(mockDir + 'analyse.mjs')
const S = await import(mockDir + 'sentences.mjs')

// Everything a journey's page says, as text.
function pageText(a: Analysis): string[] {
  const n = nextFour(a)
  return [
    ...lineText(verdict(a).lines), ...(n ? [...n.lines, n.fold ?? '', ...n.rows.flatMap((r) => [r.time, r.dest, r.operator, r.what, r.reason ?? ''])] : []),
    platforms(a) ?? '', ...lastTwoLines(a), shareWords(a).text, shareWords(a).title,
  ]
}

// 1 and 5: the same as the mock-ups, and nothing missing.
for (const f of files) {
  const s = raw(f)
  const a = analyse(snapOf(s))
  const m = M.analyse(s)
  eq(`${f}: verdict kind`, a.verdict, m.verdict)
  // The last train gone (November 17th 2026) is new since the mock-ups.
  // Since November 17th 2026 (stage 4) the verdict never gives the last two hours (they stay in
  // their own box), so where the mock-ups added them, only the first line matches.
  const mv: string[] = S.verdict(m).lines
  if (!a.lastGone) eq(`${f}: verdict`, lineText(verdict(a).lines), a.worse ? mv.slice(0, 1) : mv)
  // Since November 18th 2026 (John): "a fault on the train" in the summary; the list keeps "this".
  const mn = S.nextFour(m)
  if (mn) mn.lines = mn.lines.map((l: string) => l.replace(/\bthis train\b/g, 'the train'))
  eq(`${f}: next four hours`, nextFour(a), mn)
  // Platforms differ from the mock-ups only where one or two are known (November 17th 2026).
  // "Currently" rather than "At the moment" (John, November 18th 2026).
  const mp = (S.platforms(m) as string | null)?.replace(/^At the moment, (\w)/, (_: string, c: string) => c.toUpperCase()).replace(/ (are|is) going/, ' $1 currently going')
  if (a.platKnown > 2) eq(`${f}: platforms`, platforms(a), mp)
  eq(`${f}: last two hours`, lastTwoLines(a), S.lastTwoLines(m))
  const when = { time: t12(m.now), date: dayName(new Date(m.taken)).replace(/^\w+ /, '') }
  if (!a.lastGone) eq(`${f}: share`, shareWords(a).text, S.shareWords(m, when).text)
  const bad = pageText(a).filter((t) => /undefined|null|NaN|\[object/.test(t))
  eq(`${f}: no undefined, null or NaN`, bad, [])
}

// 2: John's agreed sentences (design/mockups-2026-11-17.md and SPEC §8).
const A = (id: string) => analyse(snapOf(raw(files.find((f) => f.endsWith(`-${id}.json`))!)))
const rdgPad = A('RDG-PAD'), manMia = A('MAN-MIA'), kgxYrk = A('KGX-YRK'), bthBri = A('BTH-BRI'), rdgCbg = A('RDG-CBG'), padRdg = A('PAD-RDG')
eq('good news', lineText(verdict(padRdg).lines), ['<b>Good news:</b> trains from London Paddington to Reading are running well this evening.'])
eq('leaving on time (P4; the last two hours in their own box, John, stage 4)', lineText(verdict(rdgPad).lines), ['<b>Good news:</b> trains from Reading to London Paddington are leaving on time this evening.'])
eq('mixed bag: the last two hours in their own box (John, stage 4)', [bthBri.worse, verdict(bthBri).lines.length], [true, 1])
eq('mixed bag', lineText(verdict(bthBri).lines)[0], "<b>It's a mixed bag:</b> most trains from Bath Spa to Bristol Temple Meads are running this evening, but two of the 18 in the next four hours are cancelled.")
eq('be prepared', lineText(verdict(manMia).lines), ['<b>Be prepared:</b> trains from Manchester Piccadilly to Manchester Airport are disrupted this evening. Of the next 30, 10 are cancelled and two are running late, mostly because of a fault with the signalling system.'])
eq('no direct train (O7)', lineText(verdict(rdgCbg).lines), [
  "We can't find a direct train from Reading to Cambridge in the next four hours.",
  'Trainchecker only covers direct journeys – if you know part of the route, try that.',
])
eq('long journey (O1, John)', lastTwoLines(kgxYrk), [
  'Of the trains that left London Kings Cross in the last couple of hours, seven of the eight are expected to reach York within three minutes of their timetabled arrival.',
  'The other is expected to be six minutes late.',
])
eq('share (P2)', shareWords(rdgPad).text, "Here's how the trains from Reading to London Paddington were looking at 6.24pm on November 17th: good news, they were leaving on time, though only half of the trains in the couple of hours before got there within three minutes of the timetable. From Trainchecker.")
eq('share link and title', [shareWords(rdgPad).hash, shareWords(rdgPad).title], ['#RDG-PAD', 'Trainchecker: Reading to London Paddington'])
eq('fold', nextFour(rdgPad)!.fold, "Show the three trains that aren't on time")

// 3: the stage 1 faults. Every time in a snapshot moved by the same amount, so that "now" is
// 11.40pm: the next four hours then run past midnight, and the answers must not change.
function shifted(s: Raw, by: number): Raw {
  const sh = (t: unknown) => {
    if (typeof t !== 'string' || !/^\d\d:\d\d$/.test(t)) return t
    const [h, m] = t.split(':').map(Number), x = (h * 60 + m + by + 1440 * 2) % 1440
    return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
  }
  const walk = (o: unknown): unknown => Array.isArray(o) ? o.map(walk) : o && typeof o === 'object'
    ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, ['std', 'etd', 'st', 'et', 'at'].includes(k) ? sh(v) : walk(v)])) : o
  return { ...s, taken: new Date(Date.parse(s.taken) + by * 60e3).toISOString(), boards: walk(s.boards) as Raw['boards'] }
}
for (const f of files) {
  const s = raw(f)
  const a = analyse(snapOf(s))
  const nowMins = Number(a.now.slice(0, 2)) * 60 + Number(a.now.slice(3))
  const by = 23 * 60 + 40 - nowMins
  const b = analyse(snapOf(shifted(s, by)))
  eq(`${f} at 11.40pm: now`, b.now, '23:40')
  const sum = (x: Analysis) => [x.verdict, x.badly, x.why, x.ahead.map((t) => t.id), x.past.map((t) => t.id), x.affected, { ...x.last, cancelled: x.last.cancelled.map((t) => t.id) }, x.platList, x.worse]
  eq(`${f} at 11.40pm: same answers`, sum(b), sum(a))
}
eq('a gap across midnight', diff('23:58', '00:03'), 5)
eq('back across midnight', diff('00:03', '23:58'), -5)

// 4: rounding (N1, N2), with "about" unless exact.
eq('rounding', [share(11, 22).bare, share(8, 26).bare, share(17, 19).bare, share(5, 9).trains, share(19, 19).trains, share(0, 12).trains, share(1, 10).bare, share(18, 20).bare, share(19, 20).bare, share(7, 21).bare],
  ['half', 'about a third', 'about nine in ten', 'five of the nine trains', 'all 19 trains', 'none of the 12 trains', 'one in ten', 'nine in ten', 'nineteen in twenty', 'a third'])

// "Badly disrupted" (SPEC §7, answer 9), on real boards changed one way at a time.
function changed(id: string, edit: (sv: Snap['services'], a: Analysis) => void): Analysis {
  const snap = snapOf(raw(files.find((f) => f.endsWith(`-${id}.json`))!))
  edit(snap.services, analyse(snap))
  return analyse(snap)
}
const ids = (a: Analysis) => a.ahead.map((t) => t.id)
const twoCancelled = changed('PAD-RDG', (sv, a) => { for (const id of ids(a).slice(0, 2)) sv.find((t) => t.id === id)!.cancelled = true })
eq('two of the next three cancelled: badly disrupted', [twoCancelled.why.twoOfThree, twoCancelled.badly, twoCancelled.verdict], [true, true, 'prepared'])
eq('two of the next three cancelled: the words', lineText(verdict(twoCancelled).lines)[0].includes('are badly disrupted'), true)
const oneCancelled = changed('PAD-RDG', (sv, a) => { sv.find((t) => t.id === ids(a)[0])!.cancelled = true })
eq('one cancelled among 43: still good news', [oneCancelled.badly, oneCancelled.verdict], [false, 'good'])
const allCancelled = changed('BTH-BRI', (sv) => { for (const t of sv) t.cancelled = true })
eq('nothing running: badly disrupted', [allCancelled.why.noTrains, allCancelled.badly], [true, true])
const oneVeryLate = changed('PAD-RDG', (sv, a) => { const t = sv.find((x) => x.id === ids(a)[0])!; t.etd = '23:59'; t.eta = '23:59' })
eq('one very late train among frequent ones: not badly disrupted (Hereford example)', oneVeryLate.badly, false)
eq('Manchester: disrupted, not badly', [manMia.verdict, manMia.badly], ['prepared', false])

eq('platforms: currently (John)', platforms(rdgPad), 'Trains are currently going from platforms including 10, 10A, 11 and 13.')
eq('the train, in the summary (John)', nextFour(bthBri)!.lines[1], 'Two are cancelled, because of a passenger being taken ill on a train and a fault on the train. The rest are expected on time.')
eq('this train, in the list', nextFour(bthBri)!.rows[1].reason, 'A fault on this train.')
eq('platforms, one known of many', platforms(A('KGX-YRK')), 'So far, a platform has been announced for one train: platform 3.')
eq('two on time (John)', nextFour(changed('PAD-RDG', (sv, a) => { const keep = new Set(ids(a).slice(0, 2)); for (let i = sv.length - 1; i >= 0; i--) if (a.ahead.some((t) => t.id === sv[i].id) && !keep.has(sv[i].id)) sv.splice(i, 1) }))!.lines[1], 'Both are expected on time.')
eq('both (John)', [share(2, 2).trains, share(2, 2).bare, share(3, 3).trains], ['both trains', 'both', 'all three trains'])

// The last train gone: Kings Cross to Edinburgh at 8.59pm (trains in the last two hours, none in
// the next four); Reading to Cambridge at 6.24pm has none either way, so keeps the agreed words.
const kgxEdb = analyse(snapOf(raw('20261117-2059-KGX-EDB.json')))
eq('last train gone', lineText(verdict(kgxEdb).lines)[0], `The last direct train from London Kings Cross to Edinburgh seems to have gone: the latest left at ${t12(kgxEdb.lastGone!.std)}, and there isn't another in the next four hours.`)
eq('no train either way', rdgCbg.lastGone, null)

// The last week (O4, Q1), on the real answer for Reading to London Paddington, 5pm to 5.30pm.
const nov17 = new Date('2026-11-17T18:24:00Z')
const wk = weekFor(nov17)
eq('the last week: weekdays', [wk.kind, wk.first, wk.last, wk.days.length], ['WEEKDAY', '2026-11-10', '2026-11-16', 5])
const hsp = count(JSON.parse(readFileSync(new URL('20261117-hsp-RDG-PAD-1700-1730.json', dir), 'utf8')))
eq('the last week: agreed sentence', lastWeekText(hsp, { from: 'Reading', to: 'London Paddington', kind: wk.kind, days: wk.days, start: '17:00', end: '17:30' }),
  'On the five weekdays from Tuesday November 10th to Monday November 16th, about a third of the 26 trains that left Reading between 5pm and 5.30pm reached London Paddington within three minutes of the timetable. Of the others, about three quarters were less than 10 minutes late, and the rest 10 to 30 minutes late.')
eq('the last week: the mock-up code agrees', lastWeekOthers(26, 8, 21, 26), S.lastWeekOthers(26, 8, 21, 26))
const sat = weekFor(new Date('2026-11-21T10:00:00Z'))
eq('the last week: on a Saturday', [sat.kind, sat.first, sat.last, sat.days.map((d) => dayName(d))], ['SATURDAY', '2026-11-14', '2026-11-20', ['Saturday November 14th']])
const clocks = weekFor(new Date('2026-10-27T08:00:00Z')) // the clocks went back on Sunday October 25th
eq('the last week: across a clock change', [clocks.first, clocks.last, clocks.days.map((d) => dayName(d))], ['2026-10-20', '2026-10-26', ['Tuesday October 20th', 'Wednesday October 21st', 'Thursday October 22nd', 'Friday October 23rd', 'Monday October 26th']])
const one = { from: 'Reading', to: 'London Paddington', kind: sat.kind, days: sat.days, start: '17:00', end: '18:00' }
eq('the last week: no trains', lastWeekText({ n: 0, w3: 0, w10: 0, w30: 0, w120: 0, dates: [], elizabeth: 0 }, one),
  "On Saturday November 14th, no trains left Reading for London Paddington between 5pm and 6pm, as far as National Rail's record shows.")
// Manchester's real answer (four trains, three cancelled), shown as if for one Saturday.
const mm = count(JSON.parse(readFileSync(new URL('20261117-hsp-MAN-MIA-1840-1910.json', dir), 'utf8')))
eq('the last week: none on time, three cancelled', lastWeekText(mm, { ...one, from: 'Manchester Piccadilly', to: 'Manchester Airport', start: '18:40', end: '19:10' }),
  'On Saturday November 14th, none of the four trains that left Manchester Piccadilly between 6.40pm and 7.10pm reached Manchester Airport within three minutes of the timetable. Of these, one of the four was less than 10 minutes late, and the rest cancelled.')
eq('the last week: the hours', [HOURS.length, hourLabel(HOURS[0]), hourLabel(17), hourLabel(HOURS[HOURS.length - 1])], [19, '5am to 6am', '5pm to 6pm', '11pm to midnight'])
const sentences = [lastWeekText(hsp, { ...one, kind: wk.kind, days: wk.days }), lastWeekText(mm, one)]
eq('the last week: no undefined, null or NaN', sentences.filter((t) => /undefined|null|NaN/.test(t)), [])

// Times and the quote of the day.
eq('times', ['18:26', '19:00', '12:00', '00:00', '00:49', '09:05'].map(t12), ['6.26pm', '7pm', 'midday', 'midnight', '12.49am', '9.05am'])
eq('quote of the day', [quoteOfTheDay(new Date('2026-11-17T12:00:00Z')).author, quoteOfTheDay(new Date('2026-11-18T12:00:00Z')).author], ['E. W. Hornung', 'Benjamin Franklin'])
eq('quote share words', quoteShareText('E. W. Hornung', nov17), 'The quote of the day on Trainchecker for November 17th, from E. W. Hornung.')
eq('366 quotes', QUOTES.length, 366)

// The station list (Knowledgebase Stations, November 17th 2026): complete, each code once, and
// every station in the real snapshots findable by its code.
eq('stations: how many', STATIONS.length >= 2600, true)
eq('stations: each code once', new Set(STATIONS.map(([c]) => c)).size, STATIONS.length)
eq('stations: no markup left in names', STATIONS.filter(([, n]) => /&\w+;|<|>/.test(n)), [])
const inSnaps = new Set(files.flatMap((f) => { const s = raw(f); return [s.from, s.to] }))
eq('stations: every journey in the snapshots', [...inSnaps].filter((c) => !STATIONS.some(([x]) => x === c)), [])
eq('stations: typed names and codes', [resolve('reading'), resolve('London Paddington'), resolve('kgx'), resolve('Goring & Streatley'), resolve('nowhere')], ['RDG', 'PAD', 'KGX', 'GOR', null])
eq('stations: suggestions', [suggest('paddington')[0][1], suggest('man')[0][1], suggest('tcr')[0][0]], ['London Paddington', 'Manchester Piccadilly', 'TCR'])

console.log(`check-rules: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
