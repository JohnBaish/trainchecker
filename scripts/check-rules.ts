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
  standIn, standInLine, standInMixedLine, tenAfterWords, verdict, nextFour, platforms, platformsByKind, lastTwoLines, shareWords, share, lastWeekOthers, lastWeekText, weekFor, t12, dayName,
  hourLabel, HOURS, quoteShareText, type Line,
} from '../src/lib/sentences.ts'
import { quoteOfTheDay, QUOTES } from '../src/data/quotes.ts'
import { STATIONS, resolve, suggest, complete } from '../src/lib/stations.ts'

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
  // "…– please try another." since November 18th 2026 (John).
  const mv: string[] = (S.verdict(m).lines as string[]).map((l) => l.replace('if you know part of the route, try that.', 'please try another.'))
  if (!a.lastGone) eq(`${f}: verdict`, lineText(verdict(a).lines), a.worse ? mv.slice(0, 1) : mv)
  // Since November 18th 2026 (John): "a fault on the train" in the summary; the list keeps "this".
  const mn = S.nextFour(m)
  if (mn) mn.lines = mn.lines.map((l: string) => l.replace(/\bthis train\b/g, 'the train'))
  // Since November 18th 2026 (John): trains an hour when there are more than eight, and each
  // listed train's reason and company after its status (`why`), so those are left out here.
  const nf = nextFour(a)
  const cmp = nf && { ...nf, lines: a.ahead.length > 8 ? nf.lines.slice(1) : nf.lines, rows: nf.rows.map(({ why: _w, ...r }) => r) }
  if (mn && a.ahead.length > 8) mn.lines = mn.lines.slice(1)
  eq(`${f}: next four hours`, cmp, mn)
  // Platforms differ from the mock-ups only where one or two are known (November 17th 2026).
  // "Currently" rather than "At the moment" (John, November 18th 2026).
  const mp = (S.platforms(m) as string | null)?.replace(/^At the moment, most trains are going from platform (\S+)\.$/, 'Trains are currently going from platform $1.').replace(/^At the moment, (\w)/, (_: string, c: string) => c.toUpperCase()).replace(/ (are|is) going/, ' $1 currently going')
  // By kind of train since November 18th 2026 (John): compared only where the trains are one kind.
  if (a.platKnown > 2 && !platformsByKind(a)) eq(`${f}: platforms`, platforms(a), mp)
  // Since November 18th 2026 (John): shares in digits from 10 ("19 in 20"); with cancellations, "Of
  // the trains … which weren't cancelled" and "didn't run at all"; one or two late trains in their
  // own tense. The mock-ups are compared where none of these apply.
  const digits = (l: string) => l.replace('nineteen in twenty', '19 in 20').replace('nine in ten', 'nine in 10').replace('one in ten', 'one in 10').replace('one in twenty', 'one in 20')
  if (!a.last.cancelled.length && !(a.last.tense === 'mixed' && a.last.lates.length <= 2)) eq(`${f}: last two hours`, lastTwoLines(a), (S.lastTwoLines(m) as string[]).map(digits).map(tenAfterWords).map((l) => (a.last.known === 2 ? l.replace(', all are ', ', both are ') : l)))
  const when = { time: t12(m.now), date: dayName(new Date(m.taken)).replace(/^\w+ /, '') }
  // Since the fresh look (November 18th 2026), "Be prepared"'s Share sentence gives the late trains
  // too, as the verdict does, so it's compared with the mock-up only for the other verdicts.
  if (!a.lastGone && a.verdict !== 'prepared') eq(`${f}: share`, shareWords(a).text, S.shareWords(m, when).text)
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
  'Trainchecker only covers direct journeys – please try another.',
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
  ['half', 'about a third', 'about nine in 10', 'five of the nine trains', 'all 19 trains', 'none of the 12 trains', 'one in 10', 'nine in 10', '19 in 20', 'a third'])

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

eq('platforms: the same for every kind, so the plain sentence (John, Tiverton Parkway)', platforms(changed('RDG-PAD', (sv) => { for (const t of sv) if (t.platform) t.platform = '2' })), 'Trains are currently going from platform 2.')
eq('platforms: all from one platform, no "Most"', platforms(bthBri), 'Trains are currently going from platform 1.')
eq('the train, in the summary (John)', nextFour(bthBri)!.lines[1], 'Two are cancelled, because of a passenger being taken ill on a train and a fault on the train. The rest are expected on time.')
eq('trains an hour (John: "an hour" after every group)', nextFour(rdgPad)!.lines[0], 'There are eight fast trains an hour from Reading to London Paddington in the next four hours, two slower ones an hour (taking about 40 minutes) and about two an hour on the Elizabeth Line.')
eq('platforms by kind of train (John)', platforms(rdgPad), 'Most fast trains are currently going from platforms 10 and 11, with slower ones mostly using platform 15A and Elizabeth Line trains using platforms 13 and 14.')
eq('trains an hour, no real split', [nextFour(bthBri)!.lines[0], nextFour(manMia)!.lines[0]], ['There are about five trains an hour from Bath Spa to Bristol Temple Meads in the next four hours.', 'There are about eight trains an hour from Manchester Piccadilly to Manchester Airport in the next four hours.'])
eq('eight or fewer: the count', nextFour(kgxYrk)!.lines[0], 'There are five trains from London Kings Cross to York in the next four hours.')
const padRdg9 = analyse(snapOf(raw('20261117-2059-PAD-RDG.json')))
eq('a small group: "in that time"', nextFour(padRdg9)!.lines[0], 'There are about three fast trains an hour from London Paddington to Reading in the next four hours, about three slower ones an hour (taking about 40 minutes) and three on the Elizabeth Line in that time.')
eq('why, after the status (John)', [nextFour(bthBri)!.rows[1].why, nextFour(rdgPad)!.rows[2].why], [' because of a fault on this train (Great Western Railway).', ' (Great Western Railway).'])
eq('cancellations in the last two hours (John)', lastTwoLines(analyse(snapOf(raw('20261117-2059-LST-SRA.json')))), [
  "Of the trains on this route in the last couple of hours which weren't cancelled, about 19 in 20 got to Stratford (London) within three minutes of their timetabled arrival.",
  'The other two were four and 16 minutes late.', "Four trains didn't run at all."])
eq('cancellations, none on time', lastTwoLines(manMia)[0], "Of the trains on this route in the last couple of hours which weren't cancelled, none of the seven got to Manchester Airport within three minutes of their timetabled arrival.")
// One late train, not yet arrived, in a mixed group: its own tense (John). Kings Cross to York's
// late one, changed to not yet arrived and another train marked arrived.
const kyMixed = changed('KGX-YRK', (sv, a) => {
  // Two on-time ones marked as arrived (fewer than three, so still by the trains that left); the
  // late one still on its way.
  for (const t of a.past.filter((y) => y.eta === 'On time').slice(0, 2)) sv.find((y) => y.id === t.id)!.ata = t.sta
})
eq('one late train, its own tense', [kyMixed.last.tense, lastTwoLines(kyMixed)[1]], ['mixed', 'The other is expected to be six minutes late.'])
eq('ten after a spelt number (John)', ['about nine in 10 trains', 'one in 10', 'The other two were four and 10 minutes late.', 'one was less than 10 minutes late', 'at 10.30pm', 'four from platform 10', '19 in 20', 'about 10 trains an hour'].map(tenAfterWords),
  ['about nine in ten trains', 'one in ten', 'The other two were four and ten minutes late.', 'one was less than 10 minutes late', 'at 10.30pm', 'four from platform 10', '19 in 20', 'about 10 trains an hour'])
eq('suggestions stay open at "Ivy", a code on the way to Ivybridge (John)', [complete('Ivy', suggest('Ivy')), suggest('Ivy').map(([, n]) => n)], [false, ['Ivybridge']])
eq('suggestions close once the full name is in the box, even with longer names below (fresh look 4.1)', [complete('Ivybridge', suggest('Ivybridge')), complete('reading', suggest('reading')), complete('Reading W', suggest('Reading W'))], [true, true, false])
eq("an apostrophe doesn't matter (fresh look 4.2)", [resolve("King's Cross"), suggest("king's cross").map(([c]) => c), resolve("london king's cross")], [null, ['KGX'], 'KGX'])
// The last week's stand-in station (John's Ealing Broadway idea, November 18th 2026): the history
// had no Reading to Bond Street trains, but 10 to Ealing Broadway and 10 to Tottenham Court Road.
const west: [string, string][] = [['TWY', 'Twyford'], ['SLO', 'Slough'], ['EAL', 'Ealing Broadway'], ['PAD', 'London Paddington']]
eq('stand-in: Reading to Bond Street measures to Ealing Broadway', standIn({ fromCrs: 'RDG', toCrs: 'BDS', stops: west }), { crs: 'EAL', name: 'Ealing Broadway', side: 'to' })
eq('stand-in: Bond Street to Reading from Ealing Broadway', standIn({ fromCrs: 'BDS', toCrs: 'RDG', stops: [['PAD', 'London Paddington'], ['EAL', 'Ealing Broadway'], ['SLO', 'Slough']] }), { crs: 'EAL', name: 'Ealing Broadway', side: 'from' })
eq('stand-in: from the east, the nearest stop', standIn({ fromCrs: 'ABW', toCrs: 'BDS', stops: [['WWC', 'Woolwich'], ['CWX', 'Canary Wharf'], ['ZLW', 'Whitechapel'], ['LST', 'Liverpool Street'], ['ZFD', 'Farringdon'], ['TCR', 'Tottenham Court Road']] }), { crs: 'TCR', name: 'Tottenham Court Road', side: 'to' })
eq('stand-in: both ends left out, none', standIn({ fromCrs: 'PAD', toCrs: 'BDS', stops: [] }), null)
eq('stand-in: the line (draft)', standInLine('Bond Street', { name: 'Ealing Broadway', side: 'to' }), 'National Rail’s record leaves these trains out at Bond Street, so this shows how they ran as far as Ealing Broadway.')
eq('this train, in the list', nextFour(bthBri)!.rows[1].reason, 'A fault on this train.')
eq('platforms, one known of many', platforms(A('KGX-YRK')), 'So far, a platform has only been announced for one train: platform 3.')
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
  'On the five weekdays from Tuesday November 10th to Monday November 16th, about a third of the 26 trains that left Reading between 5pm and 5.30pm reached London Paddington within three minutes of the timetable. Another 13 were less than 10 minutes late, and the other five were 10 to 30 minutes late.')
// Shares only with more than 20 not on time since the fresh look (6.3), as in the mock-ups' code.
eq('the last week: the mock-up code agrees', lastWeekOthers(40, 8, 33, 40), S.lastWeekOthers(40, 8, 33, 40))
const sat = weekFor(new Date('2026-11-21T10:00:00Z'))
eq('the last week: on a Saturday', [sat.kind, sat.first, sat.last, sat.days.map((d) => dayName(d))], ['SATURDAY', '2026-11-14', '2026-11-20', ['Saturday November 14th']])
const clocks = weekFor(new Date('2026-10-27T08:00:00Z')) // the clocks went back on Sunday October 25th
eq('the last week: across a clock change', [clocks.first, clocks.last, clocks.days.map((d) => dayName(d))], ['2026-10-20', '2026-10-26', ['Tuesday October 20th', 'Wednesday October 21st', 'Thursday October 22nd', 'Friday October 23rd', 'Monday October 26th']])
const one = { from: 'Reading', to: 'London Paddington', kind: sat.kind, days: sat.days, start: '17:00', end: '18:00' }
eq('the last week: no trains', lastWeekText({ n: 0, w3: 0, w10: 0, w30: 0, w120: 0, dates: [], elizabeth: 0 }, one),
  "On Saturday November 14th, no trains left Reading for London Paddington between 5pm and 6pm, as far as National Rail's record shows.")
// Manchester's real answer (four trains, three cancelled), shown as if for one Saturday.
const mm = count(JSON.parse(readFileSync(new URL('20261117-hsp-MAN-MIA-1840-1910.json', dir), 'utf8')))
// Cancelled trains didn't leave (John, November 18th 2026): counted apart.
eq('the last week: one ran, three cancelled', lastWeekText(mm, { ...one, from: 'Manchester Piccadilly', to: 'Manchester Airport', start: '18:40', end: '19:10' }),
  "On Saturday November 14th, the only train that left Manchester Piccadilly between 6.40pm and 7.10pm didn't reach Manchester Airport within three minutes of the timetable. It was less than 10 minutes late. Three more were cancelled.")
// The trains not on time, as counts following on from the on-time ones (John, November 18th 2026).
const others = (n: number, w3: number, w10: number, w30: number, w120 = w30) => lastWeekOthers(n, w3, w10, w30, w120)
eq('not on time: Totnes (John)', others(5, 2, 4, 5), 'Another two were less than 10 minutes late, and the other one was 10 to 30 minutes late.')
eq('not on time: two bands, more than one', others(7, 2, 4, 7), 'Another two were less than 10 minutes late, and the other three were 10 to 30 minutes late.')
eq('not on time: the first just one ("One more")', others(6, 3, 4, 6), 'One more was less than 10 minutes late, and the other two were 10 to 30 minutes late.')
eq('not on time: three bands', others(8, 4, 6, 7, 8), 'Another two were less than 10 minutes late, one was 10 to 30 minutes late and one was more than half an hour late.')
eq('not on time: one band', [others(9, 6, 9, 9), others(9, 8, 9, 9)], ['The other three were less than 10 minutes late.', 'The other was less than 10 minutes late.'])
eq('not on time: none on time, one band', others(3, 0, 3, 3), 'They were all less than 10 minutes late.')
eq('not on time: up to 20, counts (fresh look 6.3)', others(26, 8, 21, 26), 'Another 13 were less than 10 minutes late, and the other five were 10 to 30 minutes late.')
eq('not on time: more than 20, shares and "the rest"', others(40, 8, 32, 40), 'Of the others, three quarters were less than 10 minutes late, and the rest 10 to 30 minutes late.')
eq('the last week: Tiverton Parkway (John)', lastWeekText({ n: 5, w3: 0, w10: 1, w30: 4, w120: 4, dates: [], elizabeth: 0 }, { ...one, from: 'Tiverton Parkway', to: 'London Paddington', kind: wk.kind, days: wk.days, start: '07:00', end: '08:00' }),
  'On the five weekdays from Tuesday November 10th to Monday November 16th, none of the four trains that left Tiverton Parkway between 7am and 8am reached London Paddington within three minutes of the timetable. One was less than 10 minutes late, and the other three were 10 to 30 minutes late. One more was cancelled.')
eq('the last week: all cancelled', lastWeekText({ n: 2, w3: 0, w10: 0, w30: 0, w120: 0, dates: [], elizabeth: 0 }, { ...one, from: 'Reading', to: 'London Paddington', start: '07:00', end: '07:30' }),
  'On Saturday November 14th, both trains due to leave Reading between 7am and 7.30am were cancelled.')
eq('the last week, one company named (John, Twyford)', lastWeekText({ n: 10, w3: 6, w10: 8, w30: 8, w120: 8, dates: [], elizabeth: 0 }, { ...one, from: 'Twyford', to: 'London Paddington', kind: wk.kind, days: wk.days, start: '08:00', end: '09:00', noun: ['Great Western Railway train', 'Great Western Railway trains'] }),
  'On the five weekdays from Tuesday November 10th to Monday November 16th, six of the eight Great Western Railway trains that left Twyford between 8am and 9am reached London Paddington within three minutes of the timetable. The other two were less than 10 minutes late. Two more were cancelled.')
eq('the last week, the Elizabeth Line part (draft)', standInMixedLine('London Paddington', { name: 'Ealing Broadway', side: 'to' }), 'National Rail’s record leaves Elizabeth Line trains out at London Paddington, so for those this shows how they ran as far as Ealing Broadway.')
eq('the last week: the hours', [HOURS.length, hourLabel(HOURS[0]), hourLabel(17), hourLabel(HOURS[HOURS.length - 1])], [19, '5am to 6am', '5pm to 6pm', '11pm to midnight'])
const sentences = [lastWeekText(hsp, { ...one, kind: wk.kind, days: wk.days }), lastWeekText(mm, one)]
eq('the last week: no undefined, null or NaN', sentences.filter((t) => /undefined|null|NaN/.test(t)), [])

// Times and the quote of the day.
eq('times', ['18:26', '19:00', '12:00', '00:00', '00:49', '09:05'].map(t12), ['6.26pm', '7pm', 'midday', 'midnight', '12.49am', '9.05am'])
eq('quote of the day', [quoteOfTheDay(new Date('2026-11-17T12:00:00Z')).author, quoteOfTheDay(new Date('2026-11-18T12:00:00Z')).author], ['E. W. Hornung', 'Benjamin Franklin'])
eq('quote share words', quoteShareText('E. W. Hornung', nov17), 'The quote of the day on Trainchecker for November 17th, from E. W. Hornung.')
eq('366 quotes', QUOTES.length, 366)

// The fresh look (November 18th 2026): made-up boards for cases the saved ones don't have.
{
  const T = '2026-11-17T18:24:00Z'
  const at = (iso: string, m: number) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(new Date(iso).getTime() + m * 60e3))
  const tr = (i: number, rel: number, o: Partial<Snap['services'][number]> = {}, t = T) => ({ id: 's' + i, std: at(t, rel), etd: 'On time', platform: '3', operator: 'Great Western Railway', destination: 'Bristol Temple Meads', cancelled: false, reason: null, sta: at(t, rel + 20), eta: 'On time', ata: null, ...o })
  const board = (services: Snap['services'], taken = T): Snap => ({ taken, from: 'BTH', to: 'BRI', fromName: 'Bath Spa', toName: 'Bristol Temple Meads', services, route: [], stops: [] })
  const lates = analyse(board([5, 35, 65, 95, 125, 155].map((r, i) => tr(i, r, { etd: at(T, r + 50), eta: at(T, r + 70) }))))
  eq('be prepared, late trains only: no "zero are cancelled" (2.1)', [lineText(verdict(lates).lines)[0], shareWords(lates).text], [
    '<b>Be prepared:</b> trains from Bath Spa to Bristol Temple Meads are badly disrupted this evening. Of the next six, all six are running late. Someone arriving at the station now is expected to reach Bristol Temple Meads about 50 minutes later than the timetable says.',
    "Here's how the trains from Bath Spa to Bristol Temple Meads were looking at 6.24pm on November 17th: be prepared. Of the next six, all six were running late. Someone arriving at the station then was expected to reach Bristol Temple Meads about 50 minutes later than the timetable said. From Trainchecker."])
  const arrive = analyse(board([5, 65, 125, 185].map((r, i) => tr(i, r, { eta: at(T, r + 75) }))))
  eq('be prepared from late arrivals: said, and not "All are expected on time" (2.2)', [lineText(verdict(arrive).lines)[0], nextFour(arrive)!.lines[1], nextFour(arrive)!.rows[0].what], [
    '<b>Be prepared:</b> trains from Bath Spa to Bristol Temple Meads are badly disrupted this evening. Someone arriving at the station now is expected to reach Bristol Temple Meads about 55 minutes later than the timetable says.',
    'All four are expected to leave on time but reach Bristol Temple Meads more than five minutes late.', 'Expected at Bristol Temple Meads 7.44pm, 55 minutes late'])
  const delayed = analyse(board([5, 35, 65, 95, 125, 155].map((r, i) => tr(i, r, i < 2 ? { etd: 'Delayed', eta: 'Delayed' } : {}))))
  eq('two "Delayed" trains alone: a mixed bag, not badly disrupted (2.2)', [delayed.badly, delayed.verdict], [false, 'mixed'])
  const gone = analyse(board([5, 35, 65, 95].map((r, i) => tr(i, r, { cancelled: true, etd: 'Cancelled', platform: null, reason: 'This train has been cancelled because of a fault on this train' }))))
  eq('every train cancelled (2.3)', [lineText(verdict(gone).lines)[0], nextFour(gone)!.lines[1], platforms(gone)], [
    '<b>Be prepared:</b> trains from Bath Spa to Bristol Temple Meads are badly disrupted this evening. Of the next four, all four are cancelled, mostly because of a fault on the train.',
    'All four are cancelled, because of a fault on the train.', 'None of these trains is running, so there are no platforms to show.'])
  const T2 = '2026-11-18T01:10:00Z'
  const night = analyse(board([10, 50].map((r, i) => tr(i, r, {}, T2)), T2))
  const lastNight = analyse(board([tr(1, -50, { ata: at(T2, -30), etd: at(T2, -50) }, T2)], T2))
  eq('after midnight: "tonight" and "the first trains of the day" (2.4)', [lineText(verdict(night).lines)[0], lineText(verdict(lastNight).lines)[1]], [
    '<b>Good news:</b> trains from Bath Spa to Bristol Temple Meads are running well tonight.', 'Trainchecker looks four hours ahead, so check again later for the first trains of the day.'])
  const busy = (k: number, n: number) => analyse(board(Array.from({ length: n }, (_, i) => tr(i, 2 + i * 2.4, i % 10 === 5 && i < k * 10 ? { cancelled: true, etd: 'Cancelled' } : {})))).verdict
  eq('three cancelled: "Be prepared" only when more than one in 20 (2.5)', [busy(3, 40), busy(3, 60), busy(3, 95), busy(5, 95)], ['prepared', 'good', 'good', 'prepared'])
}

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
