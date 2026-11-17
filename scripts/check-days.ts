// npm run check (part 3): "The days ahead" (stage 4): the end of the weekend in winter and summer,
// station names in National Rail's words, and the matching on the saved incidents feed of 10.23pm
// on November 17th 2026 (design/incidents-trial-2026-11-17.md).
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { readIncidents, matches, current, endOfSunday, stationsIn, type Incident } from '../src/lib/incidents.ts'

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

console.log(`check-days: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
