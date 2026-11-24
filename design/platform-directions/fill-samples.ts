// Samples for John (November 24th 2026): platform directions with the left-out entrances filled in from the
// platform links. Usage: node design/platform-directions/fill-samples.ts > design/platform-directions/fill-samples.md
import { readFileSync } from 'node:fs'
import { toPlatform } from '../../src/lib/toPlatform.ts'
const R = (f: string) => JSON.parse(readFileSync(new URL(`../../src/data/${f}`, import.meta.url), 'utf8'))
const T = R('exits.json'), L = R('platform-links.json'), F = R('to-platform.json'), N = new Map<string, string>(R('stations.json'))
const kinds: [string, string, RegExp][] = [
  ['A', 'Over the footbridge', /footbridge to platform/], ['B', 'Through the subway', /subway to platform/],
  ['C', 'Across the level crossing', /level crossing to platform/], ['D', 'On the same level, along the platforms', /walk along/],
  ['E', 'The same island platform', /just across the platform/], ['F', 'Only by going out and round by the road', /no way through/],
  ['G', 'A big station with a concourse', /round through the concourse/]]
const pick: Record<string, string[]> = { A: ['LEB', 'ACR'], B: ['ANL', 'EPH'], C: ['ASH', 'HRL'], D: ['HHD'], E: ['BON'], F: ['ACK', 'IGD'], G: ['KGX'] }
const out = ['# Platform directions: entrances on the other side (samples, November 24th 2026)', '',
  'Draft wording, for John. "Now" is what the site says; "would be" adds the entrances it leaves out, using the',
  'platform links (the same table as Connections). Not live. Illustration only: from the map data, not checked',
  'at the stations. Stations with John\'s own corrections (Reading, Paddington, Twyford, Bath Spa) are left as they are.', '']
let n = 0
for (const [k, title, re] of kinds) {
  const all: string[] = []
  for (const c of Object.keys(T).filter((c) => N.has(c))) for (const p of Object.keys(T[c].p)) {
    const a = (toPlatform(T[c], p, L[c], F[c]) ?? []).join(' '), b = (toPlatform(T[c], p, L[c], F[c], true) ?? []).join(' ')
    if (a !== b && re.test(b.slice(a.length))) all.push(`${c}|${p}|${a}|${b}`)
  }
  out.push(`## ${k}. ${title} (${all.length} answers)`, '')
  const chosen = pick[k].map((c) => all.find((x) => x.startsWith(c + '|'))).filter(Boolean) as string[]
  for (const x of (chosen.length ? chosen : all.slice(0, 2))) {
    const [c, p, a, b] = x.split('|')
    out.push(`${++n}. **${N.get(c)}, platform ${p}**`, `   - Now: "${a}"`, `   - Would be: "${b}"`, '')
  }
}
console.log(out.join('\n'))
