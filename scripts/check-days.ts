// npm run check (part 3): "The days ahead" (stage 4): the end of the weekend in winter and summer,
// station names in National Rail's words, and the matching on the saved incidents feed of 10.23pm
// on November 17th 2026 (design/incidents-trial-2026-11-17.md).
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { readIncidents, matches, current, endOfSunday, stationsIn, cleanAdvice, liveItems, forJourney, closedNow, type Incident } from '../src/lib/incidents.ts'
import { whenLabel, mayIntro, noPlanned, plannedIntro, daysHeading, closedVerdict, closedShare } from '../src/lib/sentences.ts'

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
const w = (planned: boolean, start: string | null, end: string | null) => whenLabel({ planned, start, end }, tue)
eq('when: disruption', w(false, '2026-11-17T18:00:00Z', null), 'Now')
eq('when: begun, ends today', w(true, '2026-11-16T00:00:00Z', '2026-11-17T23:59:00Z'), 'Until the end of today')
eq('when: begun, ends Thursday', w(true, '2026-11-16T00:00:00Z', '2026-11-19T23:59:00Z'), 'Now until Thursday November 19th')
eq('when: one day', w(true, '2026-11-22T00:00:00Z', '2026-11-22T23:59:00Z'), 'Sunday November 22nd')
eq('when: several days', w(true, '2026-11-21T00:00:00Z', '2026-11-24T23:59:00Z'), 'Saturday November 21st to Tuesday November 24th')
eq('when: into another year', w(true, '2026-06-11T23:00:00Z', '2027-04-30T22:59:00Z'), 'Now until Friday April 30th 2027')
eq('when: a summer midnight start (BST)', whenLabel({ planned: true, start: '2026-07-18T23:00:00Z', end: '2026-07-19T22:59:00Z' }, new Date('2026-07-15T12:00:00Z')), 'Sunday July 19th')
const sun = new Date('2026-11-22T23:59:59Z')
eq('days sentences', [daysHeading(false), daysHeading(true), plannedIntro(sun), noPlanned(sun)], ['The days ahead', 'Disruption now, and the days ahead',
  'Planned engineering work and changes from National Rail, to the end of Sunday November 22nd:',
  'National Rail lists no planned engineering work for this journey between now and the end of Sunday November 22nd.'])
eq('may affect, one', mayIntro(1, 'London Victoria', 'Brighton', ['Brighton']), 'This might affect some trains from London Victoria to Brighton too, as it involves Brighton:')
eq('may affect, several', mayIntro(4, 'Reading', 'London Paddington', ['Reading', 'London Paddington']), 'These might affect some trains from Reading to London Paddington too, as they involve Reading or London Paddington:')

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

console.log(`check-days: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
