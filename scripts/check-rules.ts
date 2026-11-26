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
  hourLabel, HOURS, quoteShareText, earlierLine, kindLine, platformTrains, arrivals, listShareWords, platformsPicture, arrivalsPicture, boardSummary, type Line,
  dueSay,
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
  // The mock-up code counted a late train still to leave as gone (fixed November 26th 2026, John: Birmingham to
  // Cardiff); on the boards with one, the page is checked by the sentences below instead.
  const waitingNow = a.ahead.some((t) => t.rel < 0)
  if (!a.lastGone && !waitingNow) eq(`${f}: verdict`, lineText(verdict(a).lines), a.worse ? mv.slice(0, 1) : mv)
  // Since November 18th 2026 (John): "a fault on the train" in the summary; the list keeps "this".
  const mn = S.nextFour(m)
  // "…expected to be on time" since November 18th 2026 (John, stage 5).
  if (mn) mn.lines = mn.lines.map((l: string) => l.replace(/\bthis train\b/g, 'the train').replace('All are expected on time.', "They're all expected to be on time.").replace('Both are expected on time.', 'Both of them are expected to be on time.').replace("It's expected on time.", "It's expected to be on time.").replace('The rest are expected on time.', 'The rest are expected to be on time.').replace('The other is expected on time.', 'The other one is expected to be on time.'))
  // Since November 18th 2026 (John): trains an hour when there are more than eight, and each
  // listed train's reason and company after its status (`why`), so those are left out here.
  const nf = nextFour(a)
  const cmp = nf && { ...nf, lines: a.ahead.length > 8 ? nf.lines.slice(1) : nf.lines, rows: nf.rows.map(({ why: _w, ...r }) => r) }
  if (mn && a.ahead.length > 8) mn.lines = mn.lines.slice(1)
  if (!waitingNow) eq(`${f}: next four hours`, cmp, mn)
  // Platforms differ from the mock-ups only where one or two are known (November 17th 2026).
  // "Currently" rather than "At the moment" (John, November 18th 2026).
  const mp = (S.platforms(m) as string | null)?.replace(/^At the moment, most trains are going from platform (\S+)\.$/, 'Trains are currently going from platform $1.').replace(/^At the moment, (\w)/, (_: string, c: string) => c.toUpperCase()).replace(/ (are|is) going/, ' $1 currently going')
  // By kind of train since November 18th 2026 (John): compared only where the trains are one kind.
  if (a.platKnown > 2 && !platformsByKind(a)) eq(`${f}: platforms`, platforms(a), mp)
  // Since November 18th 2026 (John): shares in digits from 10 ("19 in 20"); with cancellations, "Of
  // the trains … which weren't cancelled" and "didn't run at all"; one or two late trains in their
  // own tense. The mock-ups are compared where none of these apply.
  const digits = (l: string) => l.replace('nineteen in twenty', '19 in 20').replace('nine in ten', 'nine in 10').replace('one in ten', 'one in 10').replace('one in twenty', 'one in 20')
  // Since November 18th 2026 (John, stage 5) the first sentence starts with the share ("All five
  // trains leaving A…") and ends "of their planned time", so only the sentences after it are compared.
  // Since November 18th 2026 (John) more than two late trains are given as a range, and "expected" is said once, so only the
  // boards where neither applies are compared.
  if (!a.last.cancelled.length && a.last.lates.length <= 2 && a.last.tense === 'past') eq(`${f}: last two hours`, lastTwoLines(a).slice(1), (S.lastTwoLines(m) as string[]).map(digits).map(tenAfterWords).slice(1))
  // The Share words were reworded on November 24th 2026 (John), so they're no longer compared with the mock-ups; checked below.
  const bad = pageText(a).filter((t) => /undefined|null|NaN|\[object/.test(t))
  eq(`${f}: no undefined, null or NaN`, bad, [])
}

// 2: John's agreed sentences (design/mockups-2026-11-17.md and SPEC §8).
const A = (id: string) => analyse(snapOf(raw(files.find((f) => f.endsWith(`-${id}.json`))!)))
const rdgPad = A('RDG-PAD'), manMia = A('MAN-MIA'), kgxYrk = A('KGX-YRK'), bthBri = A('BTH-BRI'), rdgCbg = A('RDG-CBG'), padRdg = A('PAD-RDG')
eq('good news', lineText(verdict(padRdg).lines), ['<b>Good news:</b> trains from London Paddington to Reading are running well this evening.'])
eq('leaving on time (P4; the last two hours in their own box, John, stage 4)', lineText(verdict(rdgPad).lines), ['<b>Good news:</b> trains from Reading to London Paddington are leaving on time this evening.'])
eq('mixed bag: the last two hours in their own box (John, stage 4)', [bthBri.worse, verdict(bthBri).lines.length], [true, 1])
eq('mixed bag', lineText(verdict(bthBri).lines)[0], "<b>It's a mixed bag:</b> most trains from Bath Spa to Bristol Temple Meads are running this evening, but two of the 19 in the next four hours are cancelled.")
eq('be prepared', lineText(verdict(manMia).lines), ['<b>Be prepared:</b> trains from Manchester Piccadilly to Manchester Airport are disrupted this evening. Of the next 31, 10 are cancelled and three are running late, mostly because of a fault with the signalling system.'])
eq('no direct train (O7)', lineText(verdict(rdgCbg).lines), [
  "We can't find a direct train from Reading to Cambridge in the next four hours.",
  'Trainchecker only covers direct journeys – please try another.',
])
eq('long journey (O1, John)', lastTwoLines(kgxYrk), [
  'Seven of the eight trains leaving London Kings Cross in the last couple of hours are expected to reach York within three minutes of their planned time.',
  'The other is set to be six minutes late.',
])
eq('share (P2, reworded November 24th)', shareWords(rdgPad).text, "Good news, when the trains from Reading to London Paddington were checked at 6.24pm on November 17th they were leaving on time, though only half of the trains in the couple of hours before got there within three minutes of their planned time. From Trainchecker.")
eq('share: mixed bag (John, November 24th)', shareWords(bthBri).text, "It's a mixed bag for trains from Bath Spa to Bristol Temple Meads, according to a check at 6.24pm on November 17th. Most were running, but two of the 19 in the next four hours were cancelled. From Trainchecker.")
eq('share: running well (John, November 24th)', shareWords(padRdg).text, "Good news, when the trains from London Paddington to Reading were checked at 6.24pm on November 17th they were running well. From Trainchecker.")
eq('share: be prepared (John, November 24th)', shareWords(manMia).text, "Be prepared for the train journey from Manchester Piccadilly to Manchester Airport. At 6.24pm on November 17th a check showed that, of the next 31 trains, 10 were cancelled and three were running late, mostly because of a fault with the signalling system. From Trainchecker.")
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
// The trains whose timetabled time is still to come (a late train whose time has passed is left alone, so these
// checks keep testing what they were written for).
const ids = (a: Analysis) => a.ahead.filter((t) => t.rel >= 0).map((t) => t.id)
// As if the late trains still waiting at A had already gone, for checks about the order of platforms.
const asLeft = (sv: Snap['services'], a: Analysis) => { for (const t of a.ahead.filter((x) => x.rel < 0)) sv.find((x) => x.id === t.id)!.etd = 'On time' }
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
eq('the train, in the summary (John)', nextFour(bthBri)!.lines[1], 'Two are cancelled, because of a passenger being taken ill on a train and a fault on the train. The rest are expected to be on time.')
eq('trains an hour (John: "an hour" after every group)', nextFour(rdgPad)!.lines[0], 'There are eight fast trains an hour from Reading to London Paddington in the next four hours, two slower ones an hour (taking about 40 minutes) and about two an hour on the Elizabeth Line.')
eq('platforms by kind of train (John)', platforms(rdgPad), 'Most fast trains are currently going from platforms 10 and 11, with slower ones mostly using platform 15A and Elizabeth Line trains using platforms 13 and 14.')
eq('trains an hour, no real split', [nextFour(bthBri)!.lines[0], nextFour(manMia)!.lines[0]], ['There are about five trains an hour from Bath Spa to Bristol Temple Meads in the next four hours.', 'There are about eight trains an hour from Manchester Piccadilly to Manchester Airport in the next four hours.'])
eq('eight or fewer: the count', nextFour(kgxYrk)!.lines[0], 'There are five trains from London Kings Cross to York in the next four hours.')
const padRdg9 = analyse(snapOf(raw('20261117-2059-PAD-RDG.json')))
eq('a small group: "in that time"', nextFour(padRdg9)!.lines[0], 'There are about three fast trains an hour from London Paddington to Reading in the next four hours, about three slower ones an hour (taking about 40 minutes) and three on the Elizabeth Line in that time.')
eq('why, after the status (John)', [nextFour(bthBri)!.rows[1].why, nextFour(rdgPad)!.rows[2].why], [' because of a fault on this train (Great Western Railway).', ' (Great Western Railway).'])
eq('cancellations in the last two hours (John)', lastTwoLines(analyse(snapOf(raw('20261117-2059-LST-SRA.json')))), [
  'About 19 in 20 trains that ran on this route in the last couple of hours reached Stratford (London) within three minutes of their planned time.',
  'The other two were four and 16 minutes late.', "Four more didn't run at all."])
eq('cancellations, none on time', lastTwoLines(manMia)[0], 'None of the seven trains that ran on this route in the last couple of hours reached Manchester Airport within three minutes of their planned time.')
// One late train, not yet arrived, in a mixed group: its own tense (John). Kings Cross to York's
// late one, changed to not yet arrived and another train marked arrived.
const kyMixed = changed('KGX-YRK', (sv, a) => {
  // Two on-time ones marked as arrived (fewer than three, so still by the trains that left); the
  // late one still on its way.
  for (const t of a.past.filter((y) => y.eta === 'On time').slice(0, 2)) sv.find((y) => y.id === t.id)!.ata = t.sta
})
eq('one late train, its own tense', [kyMixed.last.tense, lastTwoLines(kyMixed)[1]], ['mixed', 'The other is expected to be six minutes late.'])
// The last two hours with the share first (John, November 18th 2026, stage 5): every case, on
// Kings Cross to York's real analysis with its "last" figures changed.
const ky = (o: Partial<Analysis['last']>) => lastTwoLines({ ...kgxYrk, last: { ...kgxYrk.last, byArrivals: false, cancelled: [], ...o } })
const lead = 'London Kings Cross in the last couple of hours'
eq('share first: some arrived', lastTwoLines(kyMixed)[0], `Seven of the eight trains leaving ${lead} have reached (or look like they will reach) York within three minutes of their planned time.`)
eq('share first: all, with the number', ky({ known: 4, within3: 4, lates: [], lateArrived: [], tense: 'past' }), [`All four trains leaving ${lead} reached York within three minutes of their planned time.`])
eq('share first: both', ky({ known: 2, within3: 2, lates: [], lateArrived: [], tense: 'future' }), [`Both trains leaving ${lead} are expected to reach York within three minutes of their planned time.`])
eq('share first: none, "that left"', ky({ known: 3, within3: 0, lates: [5, 6, 8], lateArrived: [true, true, true], usual: 6, worst: 8, tense: 'past' })[0], `None of the three trains that left ${lead} reached York within three minutes of their planned time.`)
eq('share first: one of nine, singular', [ky({ known: 9, within3: 1, tense: 'future' })[0], ky({ known: 9, within3: 1, tense: 'mixed' })[0]],
  [`One of the nine trains leaving ${lead} is expected to reach York within three minutes of their planned time.`, `One of the nine trains leaving ${lead} has reached (or looks like it will reach) York within three minutes of their planned time.`])
eq('share first: rounded', ky({ known: 20, within3: 15, tense: 'past' })[0], `Three quarters of the trains leaving ${lead} reached York within three minutes of their planned time.`)
eq('the only train, on time', [ky({ known: 1, within3: 1, lates: [], lateArrived: [], tense: 'past' }), ky({ known: 1, within3: 1, lates: [], lateArrived: [], tense: 'future' })],
  [[`The only train leaving ${lead} got to York within three minutes of its planned time.`], [`The only train leaving ${lead} is expected to get to York within three minutes of its planned time.`]])
eq('the only train, late (no "They was")', [ky({ known: 1, within3: 0, lates: [6], lateArrived: [true], usual: 6, worst: 6, tense: 'past' }), ky({ known: 1, within3: 0, lates: [6], lateArrived: [false], usual: 6, worst: 6, tense: 'future' })],
  [[`The only train leaving ${lead} was six minutes late getting to York.`], [`The only train leaving ${lead} is expected to be six minutes late getting to York.`]])
const two = manMia.last.cancelled.slice(0, 2)
eq('the only train, with cancellations: "that ran from" (John)', ky({ known: 1, within3: 1, lates: [], lateArrived: [], tense: 'past', cancelled: two }),
  [`The only train that ran from ${lead} got to York within three minutes of its planned time.`, "Two more didn't run at all."])
eq('cancellations: "Two more" either way (John)', [ky({ known: 4, within3: 4, lates: [], lateArrived: [], tense: 'past', cancelled: two }).at(-1), ky({ byArrivals: true, known: 4, within3: 4, lates: [], lateArrived: [], tense: 'past', cancelled: two })],
  ["Two more didn't run at all.", ['All four trains that ran on this route in the last couple of hours reached York within three minutes of their planned time.', "Two more didn't run at all."]])
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
eq('two on time (John, November 18th 2026)', nextFour(changed('PAD-RDG', (sv, a) => { const keep = new Set(ids(a).slice(0, 2)); for (let i = sv.length - 1; i >= 0; i--) if (a.ahead.some((t) => t.id === sv[i].id) && !keep.has(sv[i].id)) sv.splice(i, 1) }))!.lines[1], 'Both of them are expected to be on time.')
eq('both (John)', [share(2, 2).trains, share(2, 2).bare, share(3, 3).trains], ['both trains', 'both', 'all three trains'])

// The trains with platforms and arrivals (John, November 18th 2026), on the real boards.
const mdg = A('RDG-MDG'), rp9 = analyse(snapOf(raw('20261117-2059-RDG-PAD.json')))
eq('platforms fold: two trains, a sentence, "am" said once (John)', [platformTrains(mdg)!.fold, platformTrains(mdg)!.text, platformTrains(mdg)!.blocks], ['Show the trains with platforms', 'There are trains leaving at 9.13am (platform 12A) and 10.12 (platform 2).', null])
eq('platforms fold: one train', [platformTrains(kgxYrk)!.fold, platformTrains(kgxYrk)!.text], ['Show the train with a platform', "There's a train leaving from platform 3 at 8.03pm."])
eq('platforms fold: none, no fold', platformTrains(A('PAD-PLY')), null)
eq('platforms fold: ten, late ones in time order, by kind, "Of the next ten trains" (John)', platformTrains(rdgPad)!.text,
  "Of the next ten trains, fast ones are leaving at 6.32pm (platform 11A), 6.39 (was due to go at 6.36, platform 10A), 6.43 (platform 11), 6.46 (was due to go at 6.26, platform 14A), 6.49 (platform 10A) and 6.54 (platform 11), a slower one from platform 15A at 6.33, and Elizabeth Line trains from platforms 13 and 14 at 6.34 (was due to go at 6.28), 6.45 and 6.59.")
// More than ten (John, November 19th 2026): "The next ten trains are leaving at:", no sentence about the rest.
const bthP = platformTrains(analyse(snapOf(raw('20261117-1824-BTH-BRI.json'))))!
eq('platforms fold: more than ten, "The next ten trains" (John)', [bthP.text, bthP.blocks![0].lead, bthP.after], ['The next ten trains are leaving from platform 1 at 6.25pm (was due to go at 6.23), 6.38, 6.48, 7.23, 7.38, 7.49, 7.54, 7.59, 8.15 and 8.23.', 'The next ten trains are leaving from platform 1 at:', null])
eq('platforms fold: grouped, "The next ten trains" first, in bold (John)', platformTrains(rdgPad)!.blocks!.slice(0, 2).map((b) => [b.lead, !!b.head]), [['The next ten trains', true], ['Fast trains:', false]])
eq('platforms fold: fast trains on 10 and 11 (10A as 10, John)', platformTrains(rp9)!.text.split(', slower')[0], 'Of the next ten trains, fast ones are leaving from platforms 10 and 11 at 9.01pm, 9.10 (was due to go at 9.04), 9.12, 9.23, 9.26 and 9.43')
eq('platforms fold: one of a kind ("a slower one")', platformTrains(analyse(snapOf(raw('20261117-2059-PAD-RDG.json'))))!.text, 'Fast trains are leaving at 9.02pm (platform 4) and 9.04 (platform 8), a slower one from platform 10 at 9.08, and Elizabeth Line trains from platform B at 9.17, 9.47 and 10.17.')
eq('platforms fold: one platform for all, said once (John)', platformTrains(A('TVP-PAD'))!.text, 'There are trains leaving from platform 2 at 9.30am, 10.30 and 11.29.')
eq('platforms fold: two platforms for three or more, said once (John)', platformTrains(manMia)!.text, 'There are trains leaving from platforms 9 and 13 at 6.30pm (was due to go at 6.18), 6.36, 6.37 (was due to go at 6.28), 6.51, 7.04 and 7.18.')
eq('platforms fold: two trains, two platforms, each its own', platformTrains(mdg)!.text, 'There are trains leaving at 9.13am (platform 12A) and 10.12 (platform 2).')
eq('platforms fold: cancelled left out', platformTrains(manMia)!.text.includes('6.28pm'), false)
eq('arrivals: the brackets in sequence (John)', arrivals(rp9).text.split('), ').slice(0, 3).join('), ') + ')',
  'The first ten trains in the next hour are expected at 9.01pm (the one due to leave Reading at 8.37), 9.08 (the 8.44 from Reading), 9.13 (the 8.47, running three minutes late)')
const soon = (k: number) => changed('RDG-MDG', (sv) => { sv.filter((x) => x.sta && !x.ata).slice(0, k).forEach((t, i) => { t.std = `08:${30 + i * 10}`; t.sta = `08:${45 + i * 10}`; t.eta = 'On time'; t.cancelled = false }) })
eq('arrivals: one, "The only train" (John)', arrivals(soon(1)).text, 'The only train arriving in the next hour is expected at 8.45am (the one due to leave Reading at 8.30).')
eq('arrivals: two (John)', arrivals(soon(2)).text, "There are two trains arriving in the next hour. They're expected at 8.45am (the one due to leave Reading at 8.30) and 8.55 (the 8.40 from Reading).")
eq('arrivals: three to ten (John)', arrivals(analyse(snapOf(raw('20261117-2059-PAD-RDG.json')))).text.startsWith('The trains arriving in the next hour are expected at 9.11pm'), true)
eq('arrivals: long journey, what it can see (draft)', arrivals(A('TVP-PAD')).text, "Trainchecker can see one train arriving in the next hour, expected at 9.21am (the one due to leave Tiverton Parkway at 6.53). Trains that left Tiverton Parkway more than two hours ago aren't included, as Trainchecker can't see them.")
eq('arrivals: the heading', arrivals(rp9).heading, 'At London Paddington from Reading')
eq('arrivals: none in the next hour', arrivals(mdg).text, 'No direct trains from Reading are expected at Midgham in the next hour. The next one is expected at 9.28am.')
const mdgGone = changed('RDG-MDG', (sv) => { const t = sv.find((x) => x.sta)!; t.std = '08:40'; t.sta = '08:55'; t.ata = null; t.eta = null; t.cancelled = true })
eq('arrivals: none, one cancelled (John)', arrivals(mdgGone).text, 'No direct trains from Reading are expected at Midgham in the next hour. The one due in at 8.55am was cancelled. The next one is expected at 9.28am.')
eq('arrivals: a long journey says it can\'t see them all, never "none"', [arrivals(A('PAD-PLY')).text, arrivals(kgxYrk).text.endsWith("aren't included, as Trainchecker can't see them.")],
  ["Trainchecker can only see trains that left London Paddington in the last two hours, so it can't say which trains are expected at Plymouth in the next hour.", true])

// The late trains as a range (John, November 18th 2026), and "expected" said once, then "set to be".
eq('late trains: a range', [lastTwoLines(bthBri)[1], lastTwoLines(rdgPad)[1], lastTwoLines(manMia)[1]],
  ['The others were between four and 12 minutes late.', 'The others were between four and 23 minutes late, most of them less than 10.', 'They were between five and ten minutes late.'])
eq('late trains: some still on their way ("were, or are set to be,")', ky({ known: 8, within3: 2, lates: [5, 12, 23, 25, 30, 78], lateArrived: [true, true, true, false, false, false], usual: 23, worst: 78, tense: 'mixed' })[1],
  'The others were, or are set to be, between five and 78 minutes late, most of them less than 30.')
eq('late trains: none arrived yet, "expected" once then "set to be"', ky({ known: 5, within3: 3, lates: [6, 9], lateArrived: [false, false], usual: 6, worst: 9, tense: 'future' }),
  [`Three of the five trains leaving ${lead} are expected to reach York within three minutes of their planned time.`, 'The other two are set to be six and nine minutes late.'])
eq('late trains: all the same', ky({ known: 6, within3: 3, lates: [7, 7, 7], lateArrived: [true, true, true], usual: 7, worst: 7, tense: 'past' })[1], 'The others were seven minutes late.')
// "am" and "pm" said once (John): dropped while the same, back when it changes; on the hour kept.
const tvp = platformTrains(A('TVP-PAD'))!
eq('the lists: "am" once, the hour kept, laid out as rows', [tvp.text, tvp.blocks], ['There are trains leaving from platform 2 at 9.30am, 10.30 and 11.29.', [{ lead: 'There are trains leaving from platform 2 at:', rows: [{ time: '9.30am' }, { time: '10.30' }, { time: '11.29' }] }]])
eq('the lists: on the hour keeps "pm", across midday too', arrivals(analyse(snapOf(raw('20261117-1824-BTH-BRI.json')))).text.endsWith('6.53 (the 6.38) and 7pm (the 6.48).'), true)
eq('the lists: notes on their own rows', platformTrains(rp9)!.blocks![1], { lead: 'Fast trains, from platforms 10 and 11:', rows: [{ time: '9.01pm' }, { time: '9.10', note: 'was due to go at 9.04' }, { time: '9.12' }, { time: '9.23' }, { time: '9.26' }, { time: '9.43' }] })
eq('the lists: Share words (drafts)', [listShareWords(mdg, 'platforms', platformTrains(mdg)!.prose).text, listShareWords(mdg, 'arrivals', arrivals(mdg).text).text],
  ['Here are the trains from Reading to Midgham with platforms, as of 8.22am on November 18th. There are trains leaving at 9.13am (platform 12A) and 10.12 (platform 2). From Trainchecker.', 'Here are the trains expected at Midgham from Reading, as of 8.22am on November 18th. No direct trains from Reading are expected at Midgham in the next hour. The next one is expected at 9.28am. From Trainchecker.'])
eq('share: "next four hours" (John)', shareWords(bthBri).text.includes('in the next four hours'), true)

// "Delayed" with no time: out of the lists, a sentence of its own, with the reason when given (John, November 18th 2026).
const late2 = (k: number, del: number[]) => changed('RDG-MDG', (sv) => { sv.filter((x) => x.sta && !x.ata).slice(0, k).forEach((t, i) => { t.std = `08:${30 + i * 7}`; t.sta = `08:${42 + i * 7}`; t.eta = del.includes(i) ? 'Delayed' : 'On time'; t.etd = del.includes(i) ? 'Delayed' : 'On time'; t.cancelled = false; t.reason = i === 0 && del.includes(0) ? 'This train has been delayed by a fault with the signalling system' : null }) })
eq('delayed arrivals: all of them', arrivals(late2(2, [0, 1])).text, 'The trains due in the next hour are delayed, with no new times given yet: the 8.30am from Reading, due at 8.42, and the 8.37, due at 8.49, because of a fault with the signalling system.')
eq('delayed arrivals: one of three, and no "There are two trains…"', arrivals(late2(3, [1])).text, 'Two trains are expected in the next hour, at 8.42am (the one due to leave Reading at 8.30) and 8.56 (the 8.44 from Reading). The 8.37am from Reading, due at 8.49, is delayed, with no new time given yet.')
eq('delayed arrivals: one alone, with its reason', arrivals(late2(1, [0])).text, 'The 8.30am from Reading, due at 8.42, is delayed, with no new time given yet, because of a fault with the signalling system.')
const tvpD = changed('TVP-PAD', (sv) => { sv.find((x) => x.platform && x.std === '09:30')!.etd = 'Delayed' })
eq('delayed platforms: out of the list', platformTrains(tvpD)!.text, 'There are trains leaving from platform 2 at 10.30am and 11.29. The 9.30am, from platform 2, is delayed, with no new time given yet.')

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
  'On the weekdays from last Tuesday until yesterday, about a third of the 26 trains leaving Reading between 5pm and 5.30pm got to London Paddington within three minutes of their planned time. Another 13 were less than 10 minutes late, and the other five were 10 to 30 minutes late.')
// Shares only with more than 20 not on time since the fresh look (6.3), as in the mock-ups' code.
eq('the last week: the mock-up code agrees', lastWeekOthers(40, 8, 33, 40), S.lastWeekOthers(40, 8, 33, 40))
const sat = weekFor(new Date('2026-11-21T10:00:00Z'))
eq('the last week: on a Saturday', [sat.kind, sat.first, sat.last, sat.days.map((d) => dayName(d))], ['SATURDAY', '2026-11-14', '2026-11-20', ['Saturday November 14th']])
const clocks = weekFor(new Date('2026-10-27T08:00:00Z')) // the clocks went back on Sunday October 25th
eq('the last week: across a clock change', [clocks.first, clocks.last, clocks.days.map((d) => dayName(d))], ['2026-10-20', '2026-10-26', ['Tuesday October 20th', 'Wednesday October 21st', 'Thursday October 22nd', 'Friday October 23rd', 'Monday October 26th']])
const one = { from: 'Reading', to: 'London Paddington', kind: sat.kind, days: sat.days, start: '17:00', end: '18:00' }
eq('the last week: no trains', lastWeekText({ n: 0, w3: 0, w10: 0, w30: 0, w120: 0, dates: [], elizabeth: 0 }, one),
  "Last Saturday, no trains left Reading for London Paddington between 5pm and 6pm, as far as National Rail's record shows.")
// Manchester's real answer (four trains, three cancelled), shown as if for one Saturday.
const mm = count(JSON.parse(readFileSync(new URL('20261117-hsp-MAN-MIA-1840-1910.json', dir), 'utf8')))
// Cancelled trains didn't leave (John, November 18th 2026): counted apart.
eq('the last week: one ran, three cancelled', lastWeekText(mm, { ...one, from: 'Manchester Piccadilly', to: 'Manchester Airport', start: '18:40', end: '19:10' }),
  'Last Saturday, the only train that ran from Manchester Piccadilly between 6.40 and 7.10pm was less than 10 minutes late getting to Manchester Airport. Three more were cancelled.')
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
  'On the weekdays from last Tuesday until yesterday, none of the four trains that left Tiverton Parkway between 7am and 8am got to London Paddington within three minutes of their planned time. One was less than 10 minutes late, and the other three were 10 to 30 minutes late. One more was cancelled.')
eq('the last week: all cancelled', lastWeekText({ n: 2, w3: 0, w10: 0, w30: 0, w120: 0, dates: [], elizabeth: 0 }, { ...one, from: 'Reading', to: 'London Paddington', start: '07:00', end: '07:30' }),
  'Last Saturday, both trains due to leave Reading between 7am and 7.30am were cancelled.')
eq('the last week, one company named (John, Twyford)', lastWeekText({ n: 10, w3: 6, w10: 8, w30: 8, w120: 8, dates: [], elizabeth: 0 }, { ...one, from: 'Twyford', to: 'London Paddington', kind: wk.kind, days: wk.days, start: '08:00', end: '09:00', noun: ['Great Western Railway train', 'Great Western Railway trains'] }),
  'On the weekdays from last Tuesday until yesterday, six of the eight Great Western Railway trains leaving Twyford between 8am and 9am got to London Paddington within three minutes of their planned time. The other two were less than 10 minutes late. Two more were cancelled.')
eq('the last week, the Elizabeth Line part (draft)', standInMixedLine('London Paddington', { name: 'Ealing Broadway', side: 'to' }), 'National Rail’s record leaves Elizabeth Line trains out at London Paddington, so for those this shows how they ran as far as Ealing Broadway.')
eq('the last week: the hours', [HOURS.length, hourLabel(HOURS[0]), hourLabel(17), hourLabel(HOURS[HOURS.length - 1])], [19, '5am to 6am', '5pm to 6pm', '11pm to midnight'])
// The days as we'd say them, the only train, "38 of the 40", the line under the hours (John, November 18th 2026).
const mon = weekFor(new Date('2026-11-16T10:00:00Z')), sun = weekFor(new Date('2026-11-22T10:00:00Z')), wed = weekFor(new Date('2026-11-18T10:00:00Z'))
const w5 = (n: number, w3: number, o: Partial<typeof one> = {}) => lastWeekText({ n, w3, w10: n, w30: n, w120: n, dates: [], elizabeth: 0 }, { ...one, start: '11:00', end: '12:00', ...o })
eq('the last week: the days', [w5(5, 5, { kind: mon.kind, days: mon.days }), w5(5, 5, { kind: wed.kind, days: wed.days }), w5(5, 5, { kind: sun.kind, days: sun.days })].map((t) => t.split(',')[0]),
  ['From last Monday to Friday', 'On the weekdays from last Wednesday until yesterday', 'Last Sunday'])
eq('the last week: all, both', [w5(5, 5), w5(2, 2)], ['Last Saturday, all five trains leaving Reading between 11am and midday got to London Paddington within three minutes of their planned time.', 'Last Saturday, both trains leaving Reading between 11am and midday got to London Paddington within three minutes of their planned time.'])
eq('the last week: the only train, on time and late', [w5(1, 1), lastWeekText({ n: 1, w3: 0, w10: 0, w30: 1, w120: 1, dates: [], elizabeth: 0 }, { ...one, start: '11:00', end: '12:00' })],
  ['Last Saturday, the only train leaving Reading between 11am and midday got to London Paddington within three minutes of its planned time.', 'Last Saturday, the only train leaving Reading between 11am and midday was 10 to 30 minutes late getting to London Paddington.'])
eq('the last week: "38 of the 40", but "about a third of the 26"', [w5(40, 38), w5(26, 9)].map((t) => t.split(', ')[1].split('. ')[0] + '.'), ['38 of the 40 trains leaving Reading between 11am and midday got to London Paddington within three minutes of their planned time.', 'about a third of the 26 trains leaving Reading between 11am and midday got to London Paddington within three minutes of their planned time.'])
eq('the line under the hours', [kindLine('WEEKDAY'), kindLine('SATURDAY'), kindLine('SUNDAY')], ["Today is a weekday, so that's what this checks. (Saturdays and Sundays have their own timetables.)", "Today is a Saturday, so that's what this checks. (Weekdays and Sundays have their own timetables.)", "Today is a Sunday, so that's what this checks. (Weekdays and Saturdays have their own timetables.)"])
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
    "Be prepared for the train journey from Bath Spa to Bristol Temple Meads. At 6.24pm on November 17th a check showed that, of the next six trains, all six were running late. Someone arriving at the station then was expected to reach Bristol Temple Meads about 50 minutes later than the timetable said. From Trainchecker."])
  const arrive = analyse(board([5, 65, 125, 185].map((r, i) => tr(i, r, { eta: at(T, r + 75) }))))
  eq('be prepared from late arrivals: said, and not "All are expected on time" (2.2)', [lineText(verdict(arrive).lines)[0], nextFour(arrive)!.lines[1], nextFour(arrive)!.rows[0].what], [
    '<b>Be prepared:</b> trains from Bath Spa to Bristol Temple Meads are badly disrupted this evening. Someone arriving at the station now is expected to reach Bristol Temple Meads about 55 minutes later than the timetable says.',
    'All four are expected to leave on time but reach Bristol Temple Meads more than five minutes late.', 'Expected at Bristol Temple Meads 7.44pm, 55 minutes late'])
  eq('share: be prepared from late arrivals only (John, November 24th)', shareWords(arrive).text, "Be prepared for the train journey from Bath Spa to Bristol Temple Meads. At 6.24pm on November 17th a check showed that someone arriving at the station then was expected to reach Bristol Temple Meads about 55 minutes later than the timetable said. From Trainchecker.")
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


// The lists as pictures (John, November 19th 2026): platforms with the times trains are leaving,
// arrivals with the timetabled time; the platform once when all share one; the share words.
{
  const pp = platformsPicture(rdgPad)!
  eq('picture: platforms, ten rows, the leaving time, kind and lateness', [pp.rows.length, pp.rows[0], pp.rows.find((r) => r.late)], [10, { time: '6.32pm', mid: 'Fast', late: '', platform: '11A' }, { time: '6.34pm', mid: 'Elizabeth Line', late: 'was due to go at 6.28', platform: '13', lateBy: 6 }])
  eq('picture: platforms, the words with more than ten (John)', pp.words.text, 'The next ten trains from Reading to London Paddington with platforms, at 6.24pm on November 17th, from Trainchecker.')
  const bp = platformsPicture(analyse(snapOf(raw('20261117-1824-BTH-BRI.json'))))!
  eq('picture: one platform for all, said once, no kinds', [bp.one, bp.rows.every((r) => r.mid === '')], ['1', true])
  eq('picture: platforms, fewer than ten', platformsPicture(A('TVP-PAD'))!.words.text.startsWith('The trains from Tiverton Parkway to London Paddington with platforms, at '), true)
  eq('picture: no platforms, no picture', platformsPicture(A('PAD-PLY')), null)
  const ap = arrivalsPicture(rp9)!
  eq('picture: arrivals, the expected time, "the 8.47pm", "← three minutes late" (John, November 20th, option D)', [ap.heads, ap.rows[2]], [['EXPECTED IN', 'FROM READING'], { time: '9.13pm', mid: 'the 8.47pm · Fast', late: 'three minutes late', lateBy: 3, arrow: true }])
  eq('picture: arrivals in the order expected (John, November 20th)', ap.rows.map((r) => r.time).join(' '), '9.01pm 9.08pm 9.13pm 9.21pm 9.24pm 9.24pm 9.33pm 9.35pm 9.44pm 9.52pm')
  eq('picture: platforms heading (John, November 20th)', pp.heads, ['EXPECTED TO LEAVE', 'PLATFORM'])
  eq('picture: arrivals, the words with more than ten', ap.words.text, 'The first ten trains expected at London Paddington from Reading after 8.59pm on November 17th, from Trainchecker.')
  eq('picture: arrivals, a long journey has its note', arrivalsPicture(A('TVP-PAD'))!.note, "Trains that left Tiverton Parkway more than two hours ago aren't included, as Trainchecker can't see them.")
  eq('picture: arrivals, none, words instead', arrivalsPicture(mdg), null)
  const dl = changed('RDG-MDG', (sv) => { const t = sv.filter((x) => x.sta && !x.ata)[0]; t.std = '08:30'; t.sta = '08:45'; t.eta = 'Delayed'; t.cancelled = false })
  eq('picture: a delayed train with no time, "?" and "was due" (John)', arrivalsPicture(dl)!.rows, [{ time: '?', mid: 'the 8.30am', late: 'delayed, was due 8.45am, no new time yet' }])
  const dl2 = changed('PAD-RDG', (sv, a) => { const t = sv.find((x) => a.ahead.some((y) => y.id === x.id && y.sta && !y.ata))!; t.eta = 'Delayed' })
  const r2 = arrivalsPicture(analyse(snapOf(raw('20261117-2059-PAD-RDG.json'))))!, d2 = arrivalsPicture(dl2)!
  eq('picture: the delayed one goes to the bottom, the rest in order', [d2.rows[d2.rows.length - 1].time, d2.rows.slice(0, -1).every((r) => r.time !== '?'), d2.rows.length <= r2.rows.length + 1], ['?', true, true])
  const pd = changed('RDG-PAD', (sv, a) => { const t = sv.find((x) => a.ahead.some((y) => y.id === x.id && y.platform && !y.cancelled))!; t.etd = 'Delayed' })
  const pp2 = platformsPicture(pd)!
  eq('picture: platforms, a delayed train "?" at the bottom with its platform', [pp2.rows[pp2.rows.length - 1].time, pp2.rows[pp2.rows.length - 1].late, !!pp2.rows[pp2.rows.length - 1].platform, /the \d/.test(pp2.rows[pp2.rows.length - 1].mid)], ['?', 'delayed, no new time yet', true, true])
}
// The boards' sentence (John, November 19th 2026, option B; Claude's draft wording).
eq('board: all on time', boardSummary(platformsPicture(analyse(snapOf(raw('20261117-1824-BTH-BRI.json'))))!.rows, 'leave'), 'Nine are expected to leave on time, and one is running two minutes late.')
eq('board: some late, a range', boardSummary(platformsPicture(rdgPad)!.rows, 'leave'), 'Seven are expected to leave on time, and three are running between three and 20 minutes late.')
eq('board: arrivals, one late', boardSummary([{ time: '9.01pm', mid: '', late: '' }, { time: '9.10pm', mid: '', late: 'running three minutes late', lateBy: 3 }], 'arrive'), 'One is expected on time, and one is running three minutes late.')
eq('board: a delayed one with no time is left out of the count', boardSummary([{ time: '9.01pm', mid: '', late: '' }, { time: '?', mid: '', late: 'delayed, no new time yet' }], 'arrive'), "It's expected on time.")
// "was due": "am"/"pm" left off when it matches, kept across midday and on the hour (John, November 20th 2026).
eq('was due: pm once, kept across midday, on the hour', [dueSay('12:53', '12:47'), dueSay('12:04', '11:58'), dueSay('13:10', '12:59'), dueSay('21:04', '21:00')], ['12.47', '11.58am', '12.59', '9pm'])
{
  const one = changed('RDG-PAD', (sv, a) => { const t = sv.filter((x) => a.ahead.some((y) => y.id === x.id && y.sta && !y.ata && !y.cancelled)).sort((x, y) => (x.sta! < y.sta! ? -1 : 1))[0]; t.eta = ((h, m) => `${String(h + Math.floor((m + 1) / 60)).padStart(2, '0')}:${String((m + 1) % 60).padStart(2, '0')}`)(+t.sta!.slice(0, 2), +t.sta!.slice(3)) })
  const r = arrivalsPicture(one)!.rows.find((x) => x.lateBy === 1)
  eq('picture: arrivals, one minute late', r?.late, 'one minute late')
  eq('arrivals: the first train late, "running … late" (John, November 20th)', arrivals(rdgPad).text.startsWith('The first ten trains in the next hour are expected at 6.25pm (the one due to leave Reading at 5.41, running two minutes late), 6.26 (the 6.01 from Reading, running two minutes late), 6.28 (the 5.32, running two minutes late)'), true)
}

// Earlier trains with no platform yet (John, November 22nd 2026, option A): at Paddington the
// Elizabeth Line's platform B is shown an hour ahead, the main line's much later.
{
  const onlyB = changed('PAD-RDG', (sv, a) => { asLeft(sv, a); for (const t of sv) if (t.platform && t.platform !== 'B') t.platform = null })
  eq('platforms: only the Elizabeth Line announced, "So far" (John)', platforms(onlyB), 'So far, platforms have only been announced for the Elizabeth Line trains, which are going from platform B.')
  eq('platforms: the earlier trains listed above the board', /^\w+ earlier trains, (at|from) \d/.test(earlierLine(onlyB) ?? ''), true)
  eq('platforms: the line in the picture and the share words', [platformsPicture(onlyB)!.before === earlierLine(onlyB), platformTrains(onlyB)!.prose.startsWith(earlierLine(onlyB)!)], [true, true])
  const bth = changed('BTH-BRI', (sv, a) => { asLeft(sv, a); for (const id of ids(a).slice(0, 2)) sv.find((t) => t.id === id)!.platform = null })
  const two = bth.ahead.filter((t) => !t.cancelled).slice(0, 2).map((t) => t12(t.std))
  eq('platforms: one kind, later trains only', platforms(bth)!.startsWith('So far, platforms have only been announced for later trains: from '), true)
  eq('platforms: two earlier trains, "am"/"pm" once', earlierLine(bth), `Two earlier trains, at ${two[0]} and ${two[1].replace(/(am|pm)$/, '')}, don't have platforms yet.`)
  eq('platforms: none earlier, no line (the saved boards)', files.filter((f) => /^\d+-\d+-[A-Z]+-[A-Z]+\.json$/.test(f)).map((f) => earlierLine(analyse(snapOf(raw(f))))).every((x) => x === null), true)
}
// A late train that hasn't left yet is still to leave (John, Birmingham New Street to Cardiff Central at
// 6.22pm on November 26th 2026: the 6.12pm, expected at 6.30, was counted as gone). On the saved Reading
// to Paddington board, the 6.26pm is expected at 6.46: with the clock moved to 6.30pm it must still be
// ahead, the first train, 20 minutes late; at 6.50pm (gone at 6.46) it isn't.
{
  const s = raw('20261117-1824-RDG-PAD.json')
  const moved = (m: number) => analyse({ ...snapOf(s), taken: new Date(new Date(s.taken).getTime() + m * 60e3).toISOString() })
  const late = moved(6)
  const t = late.ahead.find((x) => x.std === '18:26')
  eq('late train not yet left: still ahead (John, Birmingham to Cardiff)', [!!t, late.past.some((x) => x.std === '18:26')], [true, false])
  eq('late train not yet left: first of the trains ahead, 20 minutes late', [late.ahead[0].std, t?.late], ['18:26', 20])
  eq('late train not yet left: counted in the late trains', late.late5.some((x) => x.std === '18:26'), true)
  const gone = moved(26)
  eq('late train once its expected time has passed: gone', [gone.past.some((x) => x.std === '18:26'), gone.ahead.some((x) => x.std === '18:26')], [true, false])
  const delayed = analyse({ ...snapOf(s), services: snapOf(s).services.map((x) => (x.std === '18:15' ? { ...x, etd: 'Delayed' } : x)) })
  eq('"Delayed" with no time, its time passed: still ahead', delayed.ahead.some((x) => x.std === '18:15' && x.unknown), true)
}
console.log(`check-rules: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
