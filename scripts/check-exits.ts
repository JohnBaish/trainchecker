// npm run check (part 5): "Station exits" (John, November 22nd 2026) on the real table
// (src/data/exits.json): the sentences John agreed, and the stations he knows.
import t from '../src/data/exits.json' with { type: 'json' }
import { heading, stationLine, trainLine, type ExitsTable } from '../src/lib/exits.ts'
import { whichTrain } from '../src/lib/connection.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const T = t as unknown as ExitsTable

// Reading, as John agreed it; the four sentences below changed with his corrections of November 24th
// 2026 (design/platform-directions/reading.md, items 20, 21, 24 and 28), awaiting his review.
eq('heading: "Exits" (John)', [heading('Reading', T.RDG), heading('Newton Abbot', T.NTA)], ['Exits', 'Exit'])
eq('Reading: the station', stationLine('Reading', T.RDG), 'At Reading, the exits are by platforms 4, 7 and 15.')
eq('Reading: platform 4 (level)', trainLine(T.RDG, '4', false), 'Your train is due into platform 4. The exit on Station Road (Edward VII) is right there, or you can go over the bridge for the north exit by the car park on the Caversham side.')
eq('Reading: platform 8 (either way off the bridge, and where each comes down)', trainLine(T.RDG, '8', false),
  'Your train is due into platform 8. Go up to the bridge, where you can turn either way: to the main Station Hill exit on the town centre side, coming down from the bridge by platform 7, or to the north exit by the car park on the Caversham side, coming down by platform 15.')
// John's corrections (design/platform-links-trial/exits-overrides.json): names, "is right there", "the bridge".
eq('Reading: a renamed exit is right there (John)', trainLine(T.RDG, '1', false), 'Your train is due into platform 1. The main Station Hill exit on the town centre side is right there, or you can go over the bridge for the north exit by the car park on the Caversham side.')
eq('Reading: "the bridge", not "the footbridge" (John)', T.RDG.w, 'bridge')
// Exits named by what's near them (John, November 22nd 2026; name_exits.py): the name takes the
// place of a street's, a town centre only where the station is named after the town (within 600 m).
eq('Oxford: the city centre exit', trainLine(T.OXF, '1', false), 'Your train is due into platform 1. The city centre exit is right there, or you can go over the footbridge for Roger Dudman Way.')
eq('Warminster: both exits named', trainLine(T.WMN, '2', false), 'Your train is due into platform 2. The car park exit is right there, or you can go over the footbridge for the town centre exit.')
eq('Ivybridge: Hazel Lane is the town centre exit (John)', T.IVY.x[0][0], 'the town centre exit')
eq('Tooting, Claygate and Northumberland Park keep their street names (John)', [T.TOO.x, T.CLG.x, T.NUM.x].flat().some((x) => /centre exit/.test(x[0] ?? '')), false)
eq('Twickenham: the town centre exit', T.TWI.x.map((x) => x[0]), ['the town centre exit', 'Bradshaw Close'])
eq('Twyford: the long-term car park from platform 3 (John)', trainLine(T.TWY, '3', false).startsWith('Your train is due into platform 3. The exit to the long-term car park is right there'), true)
eq('Twyford: the station (John)', stationLine('Twyford', T.TWY), 'At Twyford, the exits are by platforms 1, 3 and 4.')
eq('Paddington: the Elizabeth Line platforms (John)', trainLine(T.PAD, 'A', false), 'Your train is due into platform A. The way out is up from the Elizabeth Line platforms to the Eastbourne Terrace exit.')
// Up or down where the station map shows which; never "up or down" (John, November 22nd 2026).
eq('Tunbridge Wells: up to Mount Pleasant Road', trainLine(T.TBW, '2', false), 'Your train is due into platform 2. The way out is up from the platform to Mount Pleasant Road.')
eq('St Pancras: down from 1, up from A', [trainLine(T.STP, '1', false), trainLine(T.STP, 'A', false)], ['Your train is due into platform 1. The way out is down from the platform to Pancras Road.', 'Your train is due into platform A. The way out is up from the platform to Midland Road (north).'])
eq('Ealing Broadway: which way not known, so only where it leads', trainLine(T.EAL, '2', false), 'Your train is due into platform 2. The way out from the platform leads to The Broadway.')
{ let n = 0; for (const e of Object.values(T)) for (const p of Object.keys(e.p)) if (/up or down/.test(trainLine(e, p, false))) n++; eq('never "up or down"', n, 0) }
// The others John checked.
eq('Newton Abbot: by the station building', stationLine('Newton Abbot', T.NTA), 'At Newton Abbot, the exit is by the station building on platform 3.')
eq('Newton Abbot: platform 1, over the bridge', trainLine(T.NTA, '1', false), 'Your train is due into platform 1, so you’ll want the footbridge to the exit, coming down from the bridge by platform 3.')
eq('Twyford: platform 1 on Hurst Road', trainLine(T.TWY, '1', false).startsWith('Your train is due into platform 1. The exit on Hurst Road is right there'), true)
eq('Bristol: platform 3', trainLine(T.BRI, '3', false), 'Your train is due into platform 3. The exit on Station Approach is right there, or you can go through the subway for the University of Bristol exit.')
eq('Bristol: the subway from platform 9', trainLine(T.BRI, '9', false).startsWith('Your train is due into platform 9. Go down to the subway, where you can turn either way: to Station Approach, coming up from the subway by platform 3'), true)
eq('Clapham Junction: Grant Road by platform 1', trainLine(T.CLJ, '1', false), 'Your train is due into platform 1. The exit on Grant Road is right there, or you can go through the subway for St John\'s Hill.')
eq('Southend Airport: by platform 1 only (John)', [stationLine('Southend Airport', T.SIA), Object.keys(T.SIA.p).length], ['At Southend Airport, the exit is by platform 1.', 0])
eq('Southend Airport: platform 1 is right there', trainLine(T.SIA, '1', false).endsWith('is right there.'), true)
eq('Chislehurst: no north car park exit (John)', T.CIT.x.some((x) => /north/i.test(x[0] ?? '')), false)
// A terminus, and the platform not known.
eq('Victoria: the concourse', stationLine('London Victoria', T.VIC), 'At London Victoria, every platform leads to the concourse, where the exits are.')
eq('a terminus: no platform needed', trainLine(T.VIC, null, true), 'Every platform leads to the concourse, where the exits are.')
eq('platform not yet announced', trainLine(T.RDG, null, false), 'The platform for your train hasn’t been announced yet. Check again nearer the time.')
eq('opening hours (Leeds, Holbeck)', trainLine(T.LDS, '9', false).endsWith('The Holbeck Urban Village exit is open from 6am to 10pm.'), true)
// No route known from a platform: the station's own sentence, never "doesn't know" (John).
eq('Midgham: an exit by each platform, either side of the level crossing (John)', stationLine('Midgham', T.MDG), 'At Midgham, there’s an exit by each platform, either side of the level crossing.')
eq('Midgham: platform 1 (John)', trainLine(T.MDG, '1', false), 'Your train is due into platform 1. There’s an exit right there, by the level crossing.')
eq('Midgham: platform 2', trainLine(T.MDG, '2', false), 'Your train is due into platform 2. The exit on Station Road is right there, by the level crossing.')
eq('Dean: an exit by each platform, no level crossing said', stationLine('Dean', T.DEN), 'At Dean, there’s an exit by each platform.')
eq('Dean: the bracket dropped from your own platform', trainLine(T.DEN, '1', false), 'Your train is due into platform 1. The exit on Rectory Hill is right there.')
eq('a platform with no route: the station’s sentence (Bridlington)', trainLine(T.BDT, '1', false).startsWith('Your train is due into platform 1. ') && !/doesn’t know/.test(trainLine(T.BDT, '1', false)), true)
eq('Southend Airport: platform 2 with no route', trainLine(T.SIA, '2', false), 'Your train is due into platform 2. The exit is by platform 1.')
let knows = 0
for (const e of Object.values(T)) for (const p of ['1', '2', '3', '4']) if (/doesn’t know/.test(trainLine(e, p, false))) knows++
eq('never "doesn’t know"', knows, 0)
// "An exit by each platform" only where every platform's way out is right there (Airdrie wasn't).
let mismatch = 0
for (const e of Object.values(T)) if (stationLine('X', e).includes('by each platform')) for (const p of Object.keys(e.p)) if (!/right there/.test(trainLine(e, p, false))) mismatch++
eq('"an exit by each platform" agrees with every platform', mismatch, 0)
// Every exit by one platform (Ivybridge, the map data).
eq('Ivybridge: both exits by platform 1', stationLine('Ivybridge', T.IVY), 'At Ivybridge, both exits are by platform 1.')
// The question fits the trains in the list (John, November 22nd 2026), at 3.17pm.
const tr = (std: string, etd: string | null, unknown = false) => ({ std, etd, unknown })
eq('none left yet: planning to take', whichTrain('15:17', [tr('15:52', 'On time'), tr('16:50', 'On time')]), 'Which train are you planning to take?')
eq('some left: on, or planning to take', whichTrain('15:17', [tr('14:50', 'On time'), tr('15:52', 'On time')]), 'Which train are you on, or planning to take?')
eq('all left: on', whichTrain('15:17', [tr('14:50', 'On time'), tr('15:05', '15:09')]), 'Which train are you on?')
eq('a late train whose new time is to come hasn’t left', whichTrain('15:17', [tr('15:05', '15:25')]), 'Which train are you planning to take?')
eq('delayed with no time given yet hasn’t left', whichTrain('15:17', [tr('15:05', 'Delayed', true)]), 'Which train are you planning to take?')
eq('across midnight', whichTrain('23:58', [tr('00:05', 'On time')]), 'Which train are you planning to take?')
// Southampton Central and Ivybridge, in John's words (November 22nd 2026).
eq('Southampton: platform 1, and the other exit over the footbridge', trainLine(T.SOU, '1', false),
  'Your train is due into platform 1. The Blechynden Terrace exit near the Mayflower and the BBC is right there, or you can go over the footbridge for the town centre exit.')
eq('Southampton: platform 4, the reverse', trainLine(T.SOU, '4', false),
  'Your train is due into platform 4. The town centre exit is right there, or you can go over the footbridge for the Blechynden Terrace exit near the Mayflower and the BBC.')
eq('Southampton: platform 2, either way', trainLine(T.SOU, '2', false),
  'Your train is due into platform 2. Go up to the footbridge, where you can turn either way: to the Blechynden Terrace exit near the Mayflower and the BBC, or to the town centre exit.')
eq('Ivybridge: platform 1 (John\'s informant)', trainLine(T.IVY, '1', false),
  'Your train is due into platform 1. There are two exits there, one via the platform gate to the car park and buses, and one via the footbridge exit, which is quicker on foot to the town.')
eq('Ivybridge: platform 2', trainLine(T.IVY, '2', false).startsWith('Your train is due into platform 2. Go up to the footbridge'), true)
// Names that read oddly after "for" or before "is right there" (John: trap as many as we can).
eq('a place takes "the … exit"', trainLine(T.BRI, '3', false).endsWith('or you can go through the subway for the University of Bristol exit.'), true)
eq('"the car park" after "The exit to"', /The exit on the /.test(Object.values(T).flatMap((e) => Object.keys(e.p).map((p) => trainLine(e, p, false))).join(' ')), false)
eq('map data street names untouched ("The Ridgeway")', Object.values(T).flatMap((e) => Object.keys(e.p).map((p) => trainLine(e, p, false))).some((s) => /the The /.test(s)), false)
eq('the other exit everywhere, even with only a street name (John)', trainLine(T.WOF, '1', false),
  'Your train is due into platform 1. The exit on Foregate Street is right there, or you can go through the subway for Pierpoint Street.')
// Left out where the exits aren't known, or still in doubt (John, the cautious approach).
eq('left out', ['KIH', 'LTT', 'MIS', 'GNB', 'HLR', 'ENC', 'SWN', 'BDG', 'GNH', 'HMC', 'BUO', 'MTN', 'BMN', 'GRP', 'NEH', 'EBT', 'CSB'].filter((c) => c in T), [])
// Never across a barrow crossing; every route points at a real exit.
let bad = 0
for (const e of Object.values(T)) for (const ws of Object.values(e.p)) for (const [i, v] of ws) if (!e.x[i] || !'lbsxcu'.includes(v)) bad++
eq('every route points at a real exit, with a known way', bad, 0)
eq('every station has at least one exit', Object.values(T).every((e) => e.x.length > 0), true)

console.log(`check-exits: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
