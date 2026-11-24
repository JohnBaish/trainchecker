// The trial (John, November 24th 2026): "How do I get to my platform?" for every platform at
// stations he knows, from the exits table. Usage: node design/platform-directions/trial.ts > out.md
import { readFileSync } from 'node:fs'
import { toPlatform } from '../../src/lib/toPlatform.ts'
import type { ExitsTable } from '../../src/lib/exits.ts'
const t = JSON.parse(readFileSync(new URL('../../src/data/exits.json', import.meta.url), 'utf8')) as ExitsTable
const st = JSON.parse(readFileSync(new URL('../../src/data/stations.json', import.meta.url), 'utf8')) as unknown
const names = new Map((st as [string, string][]))
const num = (s: string) => parseInt(s.replace(/\D/g, ''), 10)
const codes = process.argv.slice(2).length ? process.argv.slice(2) : ['RDG', 'PAD', 'TWY', 'OXF', 'NTA', 'MDG', 'IVY', 'SOU', 'RDH', 'BRI', 'BTH', 'CLJ']
for (const c of codes) {
  const e = t[c]
  console.log(`\n## ${names.get(c) ?? c}\n`)
  if (!e) { console.log('Not in the exits table.'); continue }
  const ps = [...new Set([...Object.keys(e.p), ...e.x.flatMap((x) => x[1])])].sort((a, b) => num(a) - num(b) || a.localeCompare(b))
  if (e.k === 'concourse') { console.log(toPlatform(e, ps[0])!.join(' ')); continue }
  for (const p of ps) console.log(`- **Platform ${p}:** ${(toPlatform(e, p) ?? ['(nothing known)']).join(' ')}`)
}
