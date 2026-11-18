// npm run check (part 3): "The days ahead" (stage 4): the end of the weekend in winter and summer,
// station names in National Rail's words, and the matching on the saved incidents feed of 10.23pm
// on November 17th 2026 (design/incidents-trial-2026-11-17.md).
import { readFileSync } from 'node:fs'
import { trim, type RawBoard } from '../api/live.ts'
import { gunzipSync } from 'node:zlib'
import { readIncidents, matches, current, endOfSunday, stationsIn, cleanAdvice, liveItems, forJourney, closedNow, gist, mayAffect, earlyOrLate, entries, wordNumbers, plainSummary, type Incident } from '../src/lib/incidents.ts'
import { whenLabel, mayIntro, noPlanned, plannedIntro, daysHeading, closedVerdict, closedShare, singlesLine, singlesKicker } from '../src/lib/sentences.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}

// The end of the coming Sunday, UK time: GMT in November, British Summer Time in July, on a Sunday
// itself, and late on a Saturday night in summer (when UTC is still Saturday).
eq('end of Sunday, Tuesday in November', endOfSunday(new Date('2026-11-17T22:23:00Z')).toISOString(), '2026-11-22T23:59:59.000Z')
eq('end of Sunday, Wednesday in July (BST)', endOfSunday(new Date('2026-07-15T12:00:00Z')).toISOString(), '2026-07-19T22:59:59.000Z')
eq('end of Sunday, on a Sunday', endOfSunday(new Date('2026-11-22T10:00:00Z')).toISOString(), '2026-11-22T23:59:59.000Z')
eq('end of Sunday, 00.30 on a Sunday in BST (still Saturday in UTC)', endOfSunday(new Date('2026-07-18T23:30:00Z')).toISOString(), '2026-07-19T22:59:59.000Z')
eq('end of Sunday, the week the clocks go back', endOfSunday(new Date('2026-10-21T12:00:00Z')).toISOString(), '2026-10-25T23:59:59.000Z')
eq('end of Sunday, the week the clocks go forward', endOfSunday(new Date('2026-03-25T12:00:00Z')).toISOString(), '2026-03-29T22:59:59.000Z')

// Station names: the longer name wins; brackets the feed leaves off or writes differently.
const codes = (t: string) => stationsIn(t).map((x) => x.code)
eq('Reading West is not Reading', codes('Buses replace trains between Reading West and Newbury'), ['RDW', 'NBY'])
eq('Gillingham (Kent) in the feed', codes('between Dartford and Strood / Gillingham (Kent)'), ['DFD', 'SOO', 'GLM'])
eq('Swindon without (Wilts)', codes('between Swindon and Bristol Temple Meads'), ['SWI', 'BRI'])
eq('Newport alone is neither Newport', codes('trains to Newport'), [])
eq('Kings Lynn without its apostrophe', codes('between Ely and Kings Lynn'), ['ELY', 'KLN'])
eq('a date is not a station', codes('on Saturday 21 and Sunday 22 November'), [])

// The saved feed: what counts for some journeys, and why.
const all = readIncidents(gunzipSync(readFileSync(new URL('../design/mockups/snapshots/20261117-2223-incidents.xml.gz', import.meta.url))).toString('utf8'))
const now = new Date('2026-11-17T22:23:00Z'), until = endOfSunday(now)
const live = all.filter((i) => current(i, now, until))
eq('the feed', [all.length, live.length], [937, 104])
const counted = (a: string, b: string) => live.map((i): [Incident, string | null] => [i, matches(i, a, b)]).filter(([, w]) => w).map(([i, w]) => `${w}: ${i.summary}`)
eq('Reading to London Paddington', counted('RDG', 'PAD'), ['to-from: Amended trains to / from / via London Paddington on Sunday 22 November'])
eq('London Paddington to Reading (one train, its own direction)', counted('PAD', 'RDG'), [
  'train: Amended 00:49 London Paddington to Reading service on Saturday 21 November',
  'train: Amended 00:34 London Paddington to Reading service on Sunday 22 November',
  'to-from: Amended trains to / from / via London Paddington on Sunday 22 November',
])
eq('Bath Spa to Bristol (both named)', counted('BTH', 'BRI'), ['both: Buses replace late night trains between Swindon and Bristol Temple Meads via Chippenham / Bath Spa from Monday 16 to Thursday 19 November'])
eq('Manchester Airport (unplanned)', counted('MAN', 'MIA'), ['both: Disruption between Manchester Airport and Manchester Piccadilly expected until 05:00 Wednesday 18 November'])
eq('Reading to Cambridge: nothing', counted('RDG', 'CBG'), [])
eq('cleared incidents left out', live.some((i) => /^CLEARED/i.test(i.summary) || i.cleared), false)
eq('cancelled engineering work left out', live.some((i) => /^CANCELLED/i.test(i.summary)), false)
eq('every live item has a summary and a link', live.filter((i) => !i.summary || !/^https:\/\//.test(i.link)).map((i) => i.id), [])

// The page's sentences (agreed at the mock-ups; "may affect", John's option 2).
const tue = new Date('2026-11-17T22:23:00Z')
const label = (x: { main: string; date?: string }) => x.main + (x.date ? ' ' + x.date : '')
const w = (planned: boolean, start: string | null, end: string | null) => label(whenLabel({ planned, start, end }, tue))
eq('when: disruption', w(false, '2026-11-17T18:00:00Z', null), 'Now')
eq('when: begun, ends today', w(true, '2026-11-16T00:00:00Z', '2026-11-17T23:59:00Z'), 'Until the end of today')
eq('when: begun, ends Thursday (John)', w(true, '2026-11-16T00:00:00Z', '2026-11-19T23:59:00Z'), 'Now until Thursday (November 19th)')
eq('when: one day (John)', w(true, '2026-11-22T00:00:00Z', '2026-11-22T23:59:00Z'), 'On Sunday (November 22nd)')
eq('when: tomorrow', w(true, '2026-11-18T00:00:00Z', '2026-11-18T23:59:00Z'), 'Tomorrow (November 18th)')
eq('when: several days within the week', w(true, '2026-11-20T00:00:00Z', '2026-11-22T23:59:00Z'), 'From Friday to Sunday (November 20th to 22nd)')
eq('when: ending beyond the week: full dates', w(true, '2026-11-21T00:00:00Z', '2026-11-24T23:59:00Z'), 'Saturday November 21st to Tuesday November 24th')
eq('when: into another year', w(true, '2026-06-11T23:00:00Z', '2027-04-30T22:59:00Z'), 'Now until Friday April 30th 2027')
eq('when: a summer midnight start (BST)', label(whenLabel({ planned: true, start: '2026-07-18T23:00:00Z', end: '2026-07-19T22:59:00Z' }, new Date('2026-07-15T12:00:00Z'))), 'On Sunday (July 19th)')
const sun = new Date('2026-11-22T23:59:59Z')
eq('days sentences (John: this weekend; today on a Sunday)', [daysHeading(false), daysHeading(true), plannedIntro(sun, tue), noPlanned(sun, tue), plannedIntro(sun, new Date('2026-11-22T10:00:00Z')), noPlanned(sun, new Date('2026-11-22T10:00:00Z'))], ['The days ahead', 'Disruption now, and the days ahead',
  'Planned engineering work and changes on this route from National Rail, to the end of this weekend:',
  "National Rail isn't listing any planned engineering work for this journey between now and the end of this weekend.",
  'Planned engineering work and changes on this route from National Rail, to the end of today:',
  "National Rail isn't listing any planned engineering work for this journey between now and the end of today."])
eq('may affect (John, November 18th 2026)', [mayIntro(1, ['Southampton Central'], false), mayIntro(3, ['London Paddington'], true), mayIntro(1, ['London Paddington'], true), mayIntro(2, ['Reading', 'London Paddington'], false)], [
  'A change involving Southampton Central which might affect this route:',
  'Other changes involving London Paddington which might also affect this route:',
  'Another change involving London Paddington which might also affect this route:',
  'Changes involving Reading or London Paddington which might affect this route:'])

// What the function sends, and the page's split, on the saved feed.
const days = liveItems(gunzipSync(readFileSync(new URL('../design/mockups/snapshots/20261117-2223-incidents.xml.gz', import.meta.url))).toString('utf8'), now)
eq('function: live items', [days.items.length, days.until], [104, '2026-11-22T23:59:59.000Z'])
const vb = forJourney(days, { fromCrs: 'VIC', toCrs: 'BTN', from: 'London Victoria', to: 'Brighton' })
eq('Victoria to Brighton: counted and may', [vb.now.length, vb.planned.map((i) => i.summary), vb.may.map((i) => i.summary), vb.involved],
  [0, ['No Gatwick Express / Southern trains to / from London Victoria on Sunday 22 November'], ['Buses replace late night / early morning trains between Haywards Heath and Brighton / Worthing / Eastbourne from Monday 16 to Friday 20 November'], ['Brighton']])
const mm = forJourney(days, { fromCrs: 'MAN', toCrs: 'MIA', from: 'Manchester Piccadilly', to: 'Manchester Airport' })
eq('Manchester Airport: disruption now', mm.now.length, 1)
eq('board names recognised (Swindon, not "Swindon (Wilts)")', forJourney(days, { fromCrs: 'SWI', toCrs: 'BRI', from: 'Swindon', to: 'Bristol Temple Meads' }).planned.length, 1)

// National Rail's advice, made safe: only simple tags, https links opening a new tab.
const dirty = '<h4 onclick="x()">Advice</h4><p style="a">Go <a href="javascript:alert(1)">here</a> or <a href="http://www.nationalrail.co.uk/x" title="t">there</a></p><script>alert(1)</script><img src=x onerror=alert(1)><table><tr><td>t</td></tr></table>'
eq('advice cleaned', cleanAdvice(dirty), '<p><b>Advice</b></p><p>Go here or <a href="https://www.nationalrail.co.uk/x" target="_blank" rel="noopener noreferrer">there</a></p>alert(1)t')
const tags = new Set(days.items.flatMap((i) => i.advice.match(/<[^>]+>/g) ?? []).map((t) => t.replace(/href="[^"]*"/, 'href')))
eq('only simple tags in every item', [...tags].sort(), ['</a>', '</b>', '</li>', '</p>', '</ul>', '<a href target="_blank" rel="noopener noreferrer">', '<b>', '<li>', '<p>', '<ul>'])
eq('no undefined in any item', days.items.filter((i) => /undefined|NaN|\[object/.test(JSON.stringify(i))).length, 0)

// The line closed today (John, November 18th 2026): buses all day count; only at some hours don't.
const closedFor = (a: string, b: string, A: string, B: string, at: string) => { const j = forJourney(days, { fromCrs: a, toCrs: b, from: A, to: B }); return closedNow([...j.now, ...j.planned], new Date(at)) }
eq('closed: Derby to Matlock, buses all week', closedFor('DBY', 'MAT', 'Derby', 'Matlock', '2026-11-18T12:00:00Z'), 'buses')
eq('closed: Corby, buses only before 06:30', closedFor('KET', 'COR', 'Kettering', 'Corby', '2026-11-21T05:00:00Z'), null)
eq('closed: Swindon to Bristol, late night only', closedFor('SWI', 'BRI', 'Swindon', 'Bristol Temple Meads', '2026-11-18T23:30:00Z'), null)
eq('closed: Victoria on Sunday', closedFor('VIC', 'BTN', 'London Victoria', 'Brighton', '2026-11-22T12:00:00Z'), 'none')
eq('closed: Victoria on Wednesday', closedFor('VIC', 'BTN', 'London Victoria', 'Brighton', '2026-11-18T12:00:00Z'), null)
eq('closed: the verdict (John)', closedVerdict('buses', 'Derby', 'Matlock'), [{ bold: 'Be prepared:', text: ' National Rail says buses are replacing trains between Derby and Matlock today. Their advice is under “The days ahead” below.' }])
eq('closed: Share', closedShare('buses', { from: 'Derby', to: 'Matlock', now: '12:05', taken: '2026-11-18T12:05:00Z' }), "Here's what Trainchecker found at 12.05pm on November 18th: National Rail said buses were replacing trains between Derby and Matlock that day.")

// The summaries above the fold (John, November 18th 2026: National Rail's own sentences), the
// single services grouped, and the route check, on the saved feed and the 6.24pm boards.
const it = (re: RegExp) => days.items.find((i) => re.test(i.summary))!
eq('gist: Reading to Paddington, Sunday (no "throughout")', gist(it(/via London Paddington on Sunday/), 'RDG', 'PAD'), [
  'Engineering work is taking place between London Paddington and Southall, closing two out of four lines throughout the day.',
  'The 6.20am Reading to London Paddington service will start at 6.39am.'])
eq('gist: the other way', gist(it(/via London Paddington on Sunday/), 'PAD', 'RDG')[1], 'The 6.38am London Paddington to Reading service will not run.')
eq('gist: a "will:" list joined', gist(it(/23:45 Didcot/), 'RDG', 'PAD')[1], 'The 11.45pm Didcot Parkway to London Paddington service will not call at Taplow or Burnham and terminate at Ealing Broadway.')
eq('gist: a single train', gist(it(/05:31 Bedwyn/), 'RDG', 'PAD')[1], 'The 5.31am Bedwyn to London Paddington will terminate at Reading.')
eq('gist: disruption, between either way round, no ways round it', gist(it(/Disruption between Manchester Airport/), 'MAN', 'MIA')[1], 'Trains between Manchester Airport and Manchester Piccadilly may be delayed by up to 30 minutes or revised or cancelled.')
eq('gist: Derby to Matlock', gist(it(/Derby and Matlock/), 'DBY', 'MAT')[1], 'No trains will run between Derby and Matlock for the duration.')
eq('gist: never more than two sentences, never undefined', days.items.every((i) => { const g = gist(i, 'RDG', 'PAD'); return g.length <= 2 && !g.some((x) => /undefined|NaN/.test(x)) }), true)
const route = (f: string) => { const r = JSON.parse(readFileSync(new URL(`../design/mockups/snapshots/${f}`, import.meta.url), 'utf8')); return trim(r.from, r.to, r.taken, r.boards.map((b: { board: RawBoard }) => b.board)).route }
const rdgPad = route('20261117-1824-RDG-PAD.json'), padRdg = route('20261117-1824-PAD-RDG.json')
eq('route: Reading to Basingstoke and Newbury drop out for Reading to Paddington', [mayAffect(it(/Reading to Basingstoke/), 'RDG', 'PAD', rdgPad), mayAffect(it(/between Reading and Newbury/), 'RDG', 'PAD', rdgPad)], [false, false])
// Since the route is only the stations between A and B (John, November 18th 2026), work beyond B
// drops out unless its advice names the journey's trains: Reading to Newbury now drops out for
// Paddington to Reading (its advice retimes Penzance trains without naming Reading).
eq('route: work beyond B drops out (Reading to Newbury, for Paddington to Reading)', mayAffect(it(/between Reading and Newbury/), 'PAD', 'RDG', padRdg), false)
eq('route: Southampton to Bournemouth drops out for Basingstoke to Southampton Central (John)', mayAffect(it(/Southampton Central and Bournemouth/), 'BSK', 'SOU', ['WIN', 'SOA', 'MCV']), false)
const bthBriRoute = route('20261117-1824-BTH-BRI.json')
eq('may: a night bus from Bath Spa to Bristol shows (Westbury to Bristol buses)', mayAffect(it(/Westbury \/ Frome/), 'BTH', 'BRI', bthBriRoute), true)
eq('may: "via Bath Spa (not calling)" does not (Weston-super-Mare)', mayAffect(it(/Weston-super-Mare \/ Taunton on/), 'BTH', 'BRI', bthBriRoute), false)
eq('may: "other services are available" is reassurance (Blackpool, for the Airport)', mayAffect(it(/Manchester Airport and Blackpool/), 'MAN', 'MIA', route('20261117-1824-MAN-MIA.json')), false)
eq('route: Haywards Heath (between) stays for Victoria to Brighton', mayAffect(it(/Haywards Heath and Brighton/), 'VIC', 'BTN', ['CLJ', 'ECR', 'GTW', 'TBD', 'HHE', 'BUG', 'HSK', 'PRP']), true)
eq('route: single services stay when their advice names the other end', [mayAffect(it(/05:31 Bedwyn/), 'RDG', 'PAD', rdgPad), mayAffect(it(/23:45 Didcot/), 'RDG', 'PAD', rdgPad)], [true, true])
eq('early or late', [earlyOrLate(it(/05:31 Bedwyn/)), earlyOrLate(it(/23:45 Didcot/)), earlyOrLate(it(/08:37 Reading/))], [true, true, false])
const at606 = new Date('2026-11-18T06:06:00Z')
eq('singles (John\'s words)', [singlesKicker(2), singlesLine([it(/05:31 Bedwyn/), it(/23:45 Didcot/)], at606)], ['Two single services', "If you're travelling before 6am between now and Friday or after 11pm on Saturday you may be affected – see more details."])
eq('singles after midnight say the night before', singlesLine([it(/00:49 London Paddington/), it(/00:34 London Paddington/)], at606), "If you're travelling after midnight on Friday night or after midnight on Saturday night you may be affected – see more details.")

eq('numbers in words (John), digits kept for times and platforms', wordNumbers('closing 2 out of 4 lines; 2 trains per hour from platform 3 at 06:39; route 42; 4.6km; 12 trains'),
  'closing two out of four lines; two trains per hour from platform 3 at 06:39; route 42; 4.6km; 12 trains')
eq('two grouped single services make one entry ("This might affect…")', [entries([it(/05:31 Bedwyn/), it(/23:45 Didcot/)]), entries([it(/05:31 Bedwyn/)]), entries([it(/05:31 Bedwyn/), it(/between Reading and Newbury/)])], [1, 1, 2])

// National Rail's summaries in the house style (John, November 18th 2026).
eq('summaries reworded', [
  'Amended trains to / from / via London Paddington on Sunday 22 November',
  'Amended 05:31 Bedwyn to London Paddington service from Tuesday 17 to Friday 20 November',
  'Buses replace late night / early morning trains between Haywards Heath and Brighton / Worthing / Eastbourne from Monday 16 to Friday 20 November',
  'Amended train service between London Waterloo and Exeter St Davids from Monday 10 August until further notice',
  'No London-bound trains at Limehouse from 20:45 on Saturday 17 October to 04:40 on Monday 23 November',
  'Disruption between Manchester Airport and Manchester Piccadilly expected until 05:00 Wednesday 18 November',
  'Buses replace trains between Corby and Kettering before 06:30 on Saturday 21 November',
].map(plainSummary), [
  'Amended trains to, from and through London Paddington',
  'Amended 5.31am Bedwyn to London Paddington service',
  'Buses replace late night or early morning trains between Haywards Heath and Brighton, Worthing or Eastbourne',
  'Amended train service between London Waterloo and Exeter St Davids until further notice',
  'No London-bound trains at Limehouse from 8.45pm on Saturday October 17th to 4.40am on Monday November 23rd',
  'Disruption between Manchester Airport and Manchester Piccadilly expected until 5am Wednesday November 18th',
  'Buses replace trains between Corby and Kettering before 6.30am on Saturday November 21st',
])
eq('summaries: nothing lost or broken on any real item', days.items.filter((i) => { const p = plainSummary(i.summary); return !p || /undefined|\/ |  /.test(p) || p.length < 15 }).map((i) => i.summary), [])

console.log(`check-days: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
