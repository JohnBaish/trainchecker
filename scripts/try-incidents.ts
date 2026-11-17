// Stage 4: the matching tried on a saved incidents feed, for John (design/incidents-trial-*.md).
// Usage: node scripts/try-incidents.ts <feed .xml.gz> <time ISO> > report.md
// For each journey: what counts, and why; and the "near misses": live incidents that name one of
// the two stations, or whose "routes affected" name both, but that the rule leaves out.
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { readIncidents, matches, mayAffect, current, endOfSunday, stationsIn } from '../src/lib/incidents.ts'
import STATIONS from '../src/data/stations.json' with { type: 'json' }

const [file, at] = process.argv.slice(2)
const name = new Map(STATIONS as [string, string][])
const all = readIncidents(gunzipSync(readFileSync(file)).toString('utf8'))
const now = new Date(at), until = endOfSunday(now)
const live = all.filter((i) => current(i, now, until))
const J = `RDG-PAD PAD-RDG BTH-BRI MAN-MIA RDG-CBG KGX-YRK EUS-MAN PAD-PLY EUS-MKC LST-SRA RDG-PAN BDW-PAD PAD-BDW HOT-RDG CDF-BRI
SWI-BRI BRI-FRO LST-NRW DBY-MAT HHE-BTN VIC-BTN FST-UPM LBG-SRS EUS-WVH KGX-EDB KET-COR DFD-SOO PRE-CNE MCO-LIV CRE-CTR BHM-COV
LEW-LBG RDG-BSK RDG-NBY PAD-BNM GLQ-CNR LST-CLT NRW-LWT COL-INT MAN-SHF BHM-EUS LST-CBG VIC-GTW WAT-WIM MAN-RSH MYB-AVP CLJ-SPB
FST-SOC ARU-HRH CAR-MRY WFJ-SAA SWA-CDF NOT-SHF EXD-BRI WAT-EXD KGX-HUL`.split(/\s+/)
const out: string[] = []
const p = (s = '') => out.push(s)
p(`Feed of ${at}: ${all.length} incidents; ${live.length} live between then and the end of Sunday (${until.toISOString()}).`)
p()
const unnamed = live.filter((i) => !stationsIn(i.summary).length)
p(`## Live incidents whose summary names no station (${unnamed.length}): these can never match`)
p()
unnamed.forEach((i, k) => p(`${k + 1}. ${i.planned ? '' : '(unplanned) '}${i.summary}`))
p()
p('## Journey by journey')
let any = 0
J.forEach((j, k) => {
  const [a, b] = j.split('-')
  const got = live.map((i) => [i, matches(i, a, b)] as const).filter(([, w]) => w)
  const may = live.filter((i) => mayAffect(i, a, b))
  const near = live.filter((i) => !matches(i, a, b) && !mayAffect(i, a, b)).filter((i) => {
    const s = stationsIn(i.summary).map((x) => x.code), r = stationsIn(i.routes).map((x) => x.code)
    return s.includes(a) || s.includes(b) || (r.includes(a) && r.includes(b))
  })
  if (got.length) any++
  p()
  p(`${k + 1}. **${name.get(a)} to ${name.get(b)}**: ${got.length} counted, ${may.length} may affect, ${near.length} left out`)
  for (const [i, w] of got) p(`   - Counted (${w}): ${i.planned ? '' : '(unplanned) '}${i.summary}`)
  for (const i of may) p(`   - May affect: ${i.planned ? '' : '(unplanned) '}${i.summary}`)
  for (const i of near) p(`   - Left out: ${i.planned ? '' : '(unplanned) '}${i.summary}`)
})
p()
p(`${any} of ${J.length} journeys have something counted.`)
console.log(out.join('\n'))
