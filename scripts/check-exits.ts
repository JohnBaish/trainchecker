// npm run check (part 5): "Station exits" (John, November 22nd 2026) on the real table
// (src/data/exits.json): the sentences John agreed, and the stations he knows.
import { toPlatform } from '../src/lib/toPlatform.ts'
import t from '../src/data/exits.json' with { type: 'json' }
import { heading, platformWayOut, sharedPlatform, stationLine, trainLine, type ExitsTable } from '../src/lib/exits.ts'
import { whichTrain } from '../src/lib/connection.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) passed++
  else { failed++; console.error(`FAIL ${what}\n  got:  ${g}\n  want: ${w}`) }
}
const T = t as unknown as ExitsTable

// Reading, as John agreed it; the four sentences below changed with his corrections of November 24th
// 2026 (design/platform-directions/reading.md, items 20, 21, 24 and 28), all agreed by him the same day.
eq('heading: "Exits" (John)', [heading('Reading', T.RDG), heading('Newton Abbot', T.NTA)], ['Exits', 'Exit'])
eq('Reading: the station', stationLine('Reading', T.RDG), 'At Reading, the exits are on the town side by platforms 4 and 7, and on the north side down from the bridge by platform 15.')
eq('Reading: platform 4 (level)', trainLine(T.RDG, '4', false), 'Your train is due into platform 4. The exit on Station Road (Edward VII) is right there, the Apex Plaza exit is round the concourse, or you can go over the bridge for the north exit by the car park on the Caversham side.')
eq('Reading: platform 8 (either way off the bridge, and where each comes down)', trainLine(T.RDG, '8', false),
  'Your train is due into platform 8. Go up to the bridge, where you can turn either way: to the main Station Hill exit on the town centre side, coming down from the bridge by platform 7, or to the north exit by the car park on the Caversham side, coming down by platform 15.')
// John's corrections (design/platform-links-trial/exits-overrides.json): names, "is right there", "the bridge".
eq('Reading: a renamed exit is right there (John)', trainLine(T.RDG, '1', false), 'Your train is due into platform 1. The main Station Hill exit on the town centre side is nearby on the same level, by platform 7, or you can go over the bridge for the north exit by the car park on the Caversham side.')
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
// Paddington in John's words (November 28th 2026).
eq('Paddington: the station', stationLine('London Paddington', T.PAD), 'At London Paddington, the main exits are off the concourse: Praed Street, by platforms 9 and 10, and Eastbourne Terrace, by platform 1. Footbridges from the platforms lead to the back exit by the canal and the Hammersmith and City Line, and the Elizabeth Line has its own entrance on Eastbourne Terrace.')
eq('Paddington: the Elizabeth Line platforms (John)', trainLine(T.PAD, 'A', false), 'Your train is due into platform A. The way out is up from the Elizabeth Line platforms to Eastbourne Terrace. The main station’s Eastbourne Terrace entrance is right there: go in and cross the concourse for the Praed Street exit or the tube entrances, or walk along platform 1 to the footbridge for the back exit by the canal and the Hammersmith and City Line.')
eq('Paddington 1: the big clock, no gates', trainLine(T.PAD, '1', false).startsWith('Your train is due into platform 1, the one with the big clock. The Eastbourne Terrace exit is right there') && trainLine(T.PAD, '1', false).includes('There are no ticket gates at either exit from this platform.'), true)
eq('Paddington 8: Burger King', trainLine(T.PAD, '8', false).startsWith('Your train is due into platform 8, by Burger King.'), true)
eq('Paddington: every numbered platform ends with the Elizabeth Line', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14'].every((p) => trainLine(T.PAD, p, false).endsWith('For the Elizabeth Line, use the Eastbourne Terrace exit: its entrance is right there.')), true)
eq('Paddington 9B: platform 9’s words, its own label', trainLine(T.PAD, '9B', false).startsWith('Your train is due into platform 9B. The Praed Street exit is right there'), true)
eq('Paddington: the shared line drops the opening', platformWayOut(T.PAD, '1').startsWith('The Eastbourne Terrace exit is right there'), true)
eq('Paddington 14: the guide', toPlatform(T.PAD, '14', undefined, (await import('../src/data/to-platform.json', { with: { type: 'json' } })).default.PAD as never)!.join(' '), 'From the back entrance by the canal and the Hammersmith and City Line, take the small footbridge round the corner to platform 14. From the concourse it’s a longer walk: go along platform 8 to the small footbridge and cross it to platform 14.')
eq('Paddington 9B: the guide in platform 9’s words', toPlatform(T.PAD, '9B', undefined, (await import('../src/data/to-platform.json', { with: { type: 'json' } })).default.PAD as never)!.join(' ').startsWith('Platform 9B is right by the Praed Street entrance.'), true)
const padFix = (await import('../src/data/to-platform.json', { with: { type: 'json' } })).default.PAD as never
eq('no “Sheldon Square” left at Paddington', JSON.stringify(['1','2','3','4','5','6','7','8','9','10','11','12','14','A','B'].map((p) => [trainLine(T.PAD, p, false), toPlatform(T.PAD, p, undefined, padFix)])).includes('Sheldon'), false)
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
eq('"the car park" after "The exit to"', /The exit on the (?!city side)/.test(Object.values(T).flatMap((e) => Object.keys(e.p).map((p) => trainLine(e, p, false))).join(' ')), false)
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

// Some exits by a platform and some not (John, November 24th 2026, from Guildford): the station's sentence
// names the ones by a platform, never a catch-all that ignores them.
eq('Guildford (John)', stationLine('Guildford', T.GLD), 'At Guildford, the main town centre exit is by platforms 1 and 2, and the Guildford Park Road exit at the back is over the footbridge.')
eq('Newbury: exits by 1 and 2', stationLine('Newbury', T.NBY), 'At Newbury, there are exits by platforms 1 and 2.')
eq('Tonbridge: an exit by 3', stationLine('Tonbridge', T.TON), 'At Tonbridge, there’s an exit by platform 3.')
eq('Theale: two exits by 3', stationLine('Theale', T.THE), 'At Theale, there are two exits by platform 3.')
eq('Kings Cross: the rest off the concourse', stationLine('London Kings Cross', T.KGX), 'At London Kings Cross, there’s an exit by platform 9, and others off the concourse.')
eq('Edinburgh: not "up above" when some are on the level', stationLine('Edinburgh', T.EDB), 'At Edinburgh, there are exits by platforms 8w, 13 and 17.')
const untrue = Object.entries(T).filter(([, e]) => e.x.some((x) => x[1].length)
  && /aren’t on the platforms|isn’t on the platforms|every platform reaches|up above the platforms|down below the platforms/.test(stationLine('X', e))).map(([c]) => c)
eq('no station with an exit by a platform says a catch-all', untrue, [])

// Two exits with the same name (John, November 24th 2026): one drawn twice is merged in the build; two on
// different sides are told apart by platform, and no answer names the same one twice.
eq('Abergavenny: one Station Road, not "either way … or to Station Road"', T.AGV.x.filter((x) => x[0] === 'Station Road').length, 1)
eq('Broadbottom: the other Moss Lane by its platform', trainLine(T.BDB, '1', false), 'Your train is due into platform 1. The exit on Moss Lane is right there, or you can go over the footbridge for Moss Lane by platform 2.')
eq('Broadbottom directions', toPlatform(T.BDB, '1')!.join(' '), 'Platform 1 is right by the Moss Lane entrance. From the Moss Lane entrance by platform 2, go up to the footbridge and cross to platform 1.')
eq('Carlisle: one entrance, two ways, one sentence', toPlatform(T.CAR, '1')!.join(' '), 'From the Station Approach entrance, go down to the subway and come up on platform 1, or go up to the footbridge by platform 4 and cross to platform 1.')
eq('Ealing Broadway: no platform when only one Broadway is named', trainLine(T.EAL, '2', false), 'Your train is due into platform 2. The way out from the platform leads to The Broadway.')
const repeats: string[] = []
for (const [c, e] of Object.entries(T)) for (const p of Object.keys(e.p)) {
  const froms = [...(toPlatform(e, p) ?? []).join(' ').matchAll(/From ([^,]+?), /g)].map((m) => m[1])
  if (new Set(froms).size < froms.length) repeats.push(`${c} ${p}`)
  const t = trainLine(e, p, false)
  if (e.x.some((x, i) => x[0] && e.x.some((y, j) => j !== i && y[0] === x[0]) && (t.match(new RegExp(` ${x[0].replace(/[()]/g, '.')}[,.]`, 'g')) ?? []).length > 1)) repeats.push(`${c} ${p} exits`)
}
eq('no answer names the same exit or entrance twice', repeats, [])

// Lost routes restored from the map readings; unnamed exits by no platform named by the nearest platform on foot.
eq('New Street: Navigation Street by the footbridge', T.BHM.p['1A'].some((w) => T.BHM.x[w[0]][0] === 'Navigation Street' && w[1] === 'b'), true)
eq('Liverpool Street: Old Broad Street and Sun Street off the concourse', ['Old Broad Street', 'Sun Street'].every((n) => T.LST.p['1'].some((w) => T.LST.x[w[0]][0] === n)), true)
eq('Ashford International: "the entrance nearest platform 3", not "the other entrance"', toPlatform(T.AFK, '4')!.join(' '), 'From the entrance nearest platform 3, go up to the footbridge and cross to platform 4.')
eq('no "the other entrance" anywhere', Object.entries(T).filter(([, e]) => Object.keys(e.p).some((p) => (toPlatform(e, p) ?? []).join(' ').includes('the other entrance'))).map(([c]) => c), [])

// No guide or Exits answer names an entrance or exit after the platform it's about (John, Putney,
// November 25th 2026), except two exits of one street told apart by platform (Haddenham, Waterloo).
const esc = (p: string) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const selfNamed = Object.entries(T).flatMap(([c, e]) => Object.keys(e.p).filter((p) => {
  const g = (toPlatform(e, p) ?? []).join(' '), x = trainLine(e, p, false).replace(/^Your train is due into platform [^.]+\. /, '')
  return new RegExp(`\\bthe (entrance|exit) (by|nearest) platform ${esc(p)}\\b(?! and)`).test(g + ' ' + x)
}).map((p) => `${c} ${p}`))
eq('no entrance or exit named after its own platform', selfNamed, [])
// Two of one name, told apart by platform: left for John (November 25th 2026).
const twins = Object.entries(T).flatMap(([c, e]) => Object.keys(e.p).filter((p) => new RegExp(`[A-Z][a-z]+ (entrance )?by platform ${esc(p)}\\b`).test((toPlatform(e, p) ?? []).join(' ') + ' ' + trainLine(e, p, false))).map((p) => `${c} ${p}`))
eq('pairs of one name, told apart by the platform itself', twins, ['ECR 1', 'HDM 2', 'HHE 1', 'HHE 3', 'ZLW 5', 'ZWA 9'])
eq('Aberdare 2: across the line', toPlatform(T.ABA, '2')!.join(' '), 'Platform 2 has its own entrance. From the entrance across the line, go down to the subway and come up on platform 2.')
eq('Ashford International 3: across the line', trainLine(T.AFK, '3', false), 'Your train is due into platform 3, so you’ll want the footbridge to the exit across the line.')
// Putney (John, November 25th 2026): one entrance, on Putney High Street; his facts, Claude's drafts.
eq('Putney: one exit', T.PUT.x.map((x) => x[0]), ['Putney High Street'])
eq('Putney: the station', stationLine('Putney', T.PUT), 'At Putney, there’s one way in and out, on Putney High Street, at the top of the stairs from the platforms.')
eq('Putney 3: the location guide, no "island platform"', toPlatform(T.PUT, '3', undefined, (await import('../src/data/to-platform.json', { with: { type: 'json' } })).default.PUT as never)!.join(' '), 'From the entrance on Putney High Street, walk onto the footbridge and go down the stairs to platform 3.')
eq('Putney 2: the way out', trainLine(T.PUT, '2', false), 'Your train is due into platform 2. Go up the stairs to the footbridge, and along to the exit on Putney High Street.')

// Both exits at one platform: one way, then a choice there, never "either way" (John, November 27th 2026).
// Exeter St Davids: one exit, by the station building on platform 1 (John, November 27th 2026).
eq('Exeter St Davids: the station', stationLine('Exeter St Davids', T.EXD), 'At Exeter St Davids, there’s one way in and out, by the station building on platform 1.')
eq('Exeter St Davids 1, 2, 6B: the way out', ['1', '2', '6B'].map((p) => trainLine(T.EXD, p, false)), ['Your train is due into platform 1. The exit is right there.', 'Your train is due into platform 2. It’s a short walk along to the exit by platform 1, on the same level.', 'Your train is due into platform 6B, so you’ll want the footbridge to the exit, coming down from the bridge by platform 1.'])
// Bath Spa (John, November 28th 2026): the exit on the city side by platform 2; platform 1 only by the subway or the exits at the back.
eq('Bath Spa: the station', stationLine('Bath Spa', T.BTH), 'At Bath Spa, the main exit is on the city side by platform 2, and there are exits at the back by platform 1, near the car park.')
eq('Bath Spa: platform 1', trainLine(T.BTH, '1', false), 'Your train is due into platform 1. The exits at the back, near the car park, are right there, or you can go through the subway for the exit on the city side.')
eq('Bath Spa: platform 2', trainLine(T.BTH, '2', false), 'Your train is due into platform 2. The exit on the city side is right there, or you can go through the subway for the exits at the back, near the car park.')
eq('Bath Spa: the location guide, platform 1', toPlatform(T.BTH, '1', undefined, (await import('../src/data/to-platform.json', { with: { type: 'json' } })).default.BTH as never)!.join(' '), 'Platform 1 is right by the entrances at the back, near the car park. From the entrance on the city side, go down to the subway by platform 2 and come up on platform 1.')
eq('Bath Spa 2: two unnamed exits by platform 1', trainLine(T.BAT, '2', false), 'Your train is due into platform 2. Go up to the footbridge and come down by platform 1, where both exits are.')
eq('Exeter Central 3: the bridge comes down by the platform both exits are by', trainLine(T.EXC, '3', false), 'Your train is due into platform 3. Go up to the footbridge and come down by platform 2 for the city centre exit or the shopping centre exit.')
{
  const bad: string[] = []
  for (const [k, e] of Object.entries(T)) for (const p of Object.keys(e.p ?? {})) {
    const t = trainLine(e, p, false)
    const m = t.match(/either way: [^.]*by platform ([0-9A-Z]+), or [^.]*by platform ([0-9A-Z]+)\./)
    if (m && m[1] === m[2]) bad.push(`${k} ${p}`)
    if (/either way: to (.+), or to \1\./.test(t)) bad.push(`${k} ${p} (same twice)`)
  }
  eq('sweep: no "either way" to the same platform', bad, [])
}
// "Right there" only within 60 metres; "a short walk along" over 60, "a walk along" over 120 (John, November 27th 2026).
// Bare Lane 1 (18 m) and Bloxwich 1 (84 m) were the examples here; both are now in doubt (below), as the
// platform links say platform 2 is across the line from 1 (a level crossing, a footbridge).
eq('Beckenham Junction 1 (233 m): a walk', trainLine(T.BKJ, '1', false), 'Your train is due into platform 1. It’s a walk along to the car park exit by platform 2, on the same level, or you can go over the footbridge for the exit by platform 4.')
// In doubt (John, November 27th 2026: "simplify everything enough to make what we say true even if it's less
// detailed"): the Exits table says on the level, the platform links say across the line; only where the exit is.
eq('in doubt: Bare Lane 1', trainLine(T.BAR, '1', false), 'Your train is due into platform 1. There’s an exit on Bare Lane by platform 2.')
eq('in doubt: Bloxwich 1', trainLine(T.BLX, '1', false), 'Your train is due into platform 1. There’s an exit on Croxdene Avenue by platform 2.')
eq('in doubt: Bloxwich 1, the platform guide', toPlatform(T.BLX, '1')!.join(' '), 'The Croxdene Avenue entrance is by platform 2.')
eq('in doubt: Maidenhead 5, the other ways kept', trainLine(T.MAI, '5', false), 'Your train is due into platform 5. The exit on King Street is right there, or you can go through the subway for Courtlands. There’s also an exit on Braywick Road by platform 1.')
eq('in doubt: Maidenhead, the station', stationLine('Maidenhead', T.MAI), 'At Maidenhead, there are exits by platforms 1 and 5.')
eq('in doubt: Maryland 2, two exits by one platform', trainLine(T.MYL, '2', false), 'Your train is due into platform 2. There’s an exit on Manbey Park Road by platform 1. The university exit and Forest Lane are by platform 4.')
eq('in doubt: Maryland 2, the platform guide', toPlatform(T.MYL, '2')!.join(' '), 'The Manbey Park Road entrance is by platform 1. The university and Forest Lane entrances are by platform 4.')
eq('in doubt: Inverness 1, an unmeasured walk is not "right there"', trainLine(T.INV, '1', false), 'Your train is due into platform 1. The city centre exit is by platform 2, on the same level. The car park exit is by platform 6.')
{
  const bad: string[] = []
  for (const [k, e] of Object.entries(T)) for (const [p, ks0] of Object.entries(e.dq ?? {})) {
    // An exit of the same name the platform reaches itself (Bilbrook's two Duck Lanes): nothing to add.
    const ks = ks0.filter((i) => !e.x.some((y, j) => j !== i && y[0] === e.x[i][0] && (e.p[p] ?? []).some((w) => w[0] === j && !ks0.includes(j))))
    if (!ks.length) continue
    const t = trainLine(e, p, false)
    for (const i of ks) if (e.x[i][0] && new RegExp(`${e.x[i][0].replace(/[()]/g, '.')}[^.]* is right there`).test(t)) bad.push(`${k} ${p}`)
    if (!/by platform/.test(t)) bad.push(`${k} ${p} (no platform said)`)
  }
  eq('sweep: no exit in doubt is "right there"', bad, [])
}
// Hersham (John, November 27th 2026): two entrances on Molesey Road, either side of the railway bridge.
eq('Hersham: the station', stationLine('Hersham', T.HER), 'At Hersham, there’s an exit by each platform, both on Molesey Road, either side of the railway bridge.')
eq('Hersham 1 and 2: the way out', ['1', '2'].map((p) => trainLine(T.HER, p, false)), ['Your train is due into platform 1. The exit to Molesey Road is right there, down the steps.', 'Your train is due into platform 2. The exit to Molesey Road is right there, down the steps.'])
{
  const fix = (await import('../src/data/to-platform.json', { with: { type: 'json' } })).default.HER as never
  eq('Hersham 1 and 2: the platform guide', ['1', '2'].map((p) => toPlatform(T.HER, p, undefined, fix)!.join(' ')), ['Platform 1’s entrance is on Molesey Road, on the Walton Park side of the railway bridge. Go up the steps.', 'Platform 2’s entrance is on Molesey Road, on the other side of the railway bridge from Walton Park. Go up the steps.'])
}
eq('Hersham: not in doubt (John’s corrections)', T.HER.dq, undefined)
eq('Bilbrook 2: the same road the other side, not repeated', trainLine(T.BBK, '2', false), 'Your train is due into platform 2. The exit on Duck Lane is right there.')
{
  const bad: string[] = []
  for (const [k, e] of Object.entries(T)) for (const p of Object.keys(e.far ?? {})) {
    if (e.dq?.[p]) continue // in doubt: only where the exit is (John, November 27th 2026)
    if (/right there/.test(trainLine(e, p, false))) bad.push(`${k} ${p} exits`)
    if (!/(a|short) walk along to platform/.test((toPlatform(e, p) ?? []).join(' '))) bad.push(`${k} ${p} guide`)
  }
  eq('sweep: every exit over 60 metres away is a walk, not "right there"', bad, [])
}
// One platform for every train whose platform has been announced (John, November 28th 2026).
eq('shared: two or more on one platform', sharedPlatform(['2', null, '2', null])?.line, 'All the trains whose platforms have been announced are coming into platform 2.')
eq('shared: only one announced', sharedPlatform([null, '3', null])?.line, 'The only train whose platform has been announced is coming into platform 3.')
eq('shared: none announced', sharedPlatform([null, null]), null)
eq('shared: two platforms', sharedPlatform(['2', '3']), null)
eq('shared: 10 and 10A are different platforms', sharedPlatform(['10', '10A']), null)
eq('shared: the way out from Reading 4, without "Your train is due"', platformWayOut(T.RDG, '4'), trainLine(T.RDG, '4', false).replace('Your train is due into platform 4. ', ''))
eq('shared: every station and platform reads as a sentence', Object.entries(T).flatMap(([c, e]) => Object.keys(e.p).map((p) => [c, p, platformWayOut(e, p)])).filter(([, , w]) => !/^[A-Z“].*[.!]$/.test(w) || /Your train/.test(w)).slice(0, 5), [])
console.log(`check-exits: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
