// npm run check (part 5): "Station exits" (John, November 22nd 2026) on the real table
// (src/data/exits.json): the sentences John agreed, and the stations he knows.
import t from '../src/data/exits.json' with { type: 'json' }
import { heading, stationLine, trainLine, type ExitsTable } from '../src/lib/exits.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const T = t as unknown as ExitsTable

// Reading, as John agreed it.
eq('Reading: heading', heading('Reading', T.RDG), 'Station exits at Reading')
eq('Reading: the station', stationLine('Reading', T.RDG), 'At Reading, the exits are by platforms 1, 4 and 15.')
eq('Reading: platform 4 (level)', trainLine(T.RDG, '4', false), 'Your train is due into platform 4. The exit on Forbury Road is right there.')
eq('Reading: platform 8 (either way off the bridge, and where each comes down)', trainLine(T.RDG, '8', false),
  'Your train is due into platform 8. Go up to the bridge, where you can turn either way: to the town centre and Station Hill, coming down from the bridge by platform 7, or to the north exit by the car park on the Caversham side, coming down by platform 15.')
// John's corrections (design/platform-links-trial/exits-overrides.json): names, "is right there", "the bridge".
eq('Reading: a renamed exit is right there (John)', trainLine(T.RDG, '1', false), 'Your train is due into platform 1. The way out to the town centre and Station Hill is right there.')
eq('Reading: "the bridge", not "the footbridge" (John)', T.RDG.w, 'bridge')
// The others John checked.
eq('Newton Abbot: by the station building', stationLine('Newton Abbot', T.NTA), 'At Newton Abbot, the exit is by the station building on platform 3.')
eq('Newton Abbot: platform 1, over the bridge', trainLine(T.NTA, '1', false), 'Your train is due into platform 1, so you’ll want the footbridge to the exit, coming down from the bridge by platform 3.')
eq('Twyford: platform 1 on Hurst Road', trainLine(T.TWY, '1', false), 'Your train is due into platform 1. The exit on Hurst Road is right there.')
eq('Bristol: platform 3', trainLine(T.BRI, '3', false), 'Your train is due into platform 3. The exit on Station Approach is right there.')
eq('Bristol: the subway from platform 9', trainLine(T.BRI, '9', false).startsWith('Your train is due into platform 9. Go down to the subway, where you can turn either way: to Station Approach, coming up from the subway by platform 3'), true)
eq('Clapham Junction: Grant Road by platform 1', trainLine(T.CLJ, '1', false), 'Your train is due into platform 1. The exit on Grant Road is right there.')
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
// Left out where the exits aren't known, or still in doubt (John, the cautious approach).
eq('left out', ['KIH', 'LTT', 'MIS', 'GNB', 'HLR', 'ENC', 'SWN', 'BDG', 'GNH', 'HMC', 'BUO', 'MTN', 'BMN', 'GRP', 'NEH', 'EBT', 'CSB'].filter((c) => c in T), [])
// Never across a barrow crossing; every route points at a real exit.
let bad = 0
for (const e of Object.values(T)) for (const ws of Object.values(e.p)) for (const [i, v] of ws) if (!e.x[i] || !'lbsxcu'.includes(v)) bad++
eq('every route points at a real exit, with a known way', bad, 0)
eq('every station has at least one exit', Object.values(T).every((e) => e.x.length > 0), true)

console.log(`check-exits: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
