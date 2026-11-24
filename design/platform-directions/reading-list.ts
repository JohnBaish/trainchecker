// Everything Trainchecker says about Reading station, numbered for John (November 24th 2026).
// Usage: node design/platform-directions/reading-list.ts > design/platform-directions/reading.md
import { readFileSync } from 'node:fs'
import { stationLine, trainLine, heading } from '../../src/lib/exits.ts'
import { toPlatform, entranceName, type Fix, type Links } from '../../src/lib/toPlatform.ts'
import { howToGet } from '../../src/lib/platformLinks.ts'
const R = (f: string) => JSON.parse(readFileSync(new URL(`../../src/data/${f}`, import.meta.url), 'utf8'))
const e = R('exits.json').RDG, L = R('platform-links.json').RDG as Links & { x: string }, F = R('to-platform.json').RDG as Fix
const ps = Array.from({ length: 15 }, (_, i) => String(i + 1))
const out: string[] = []
let n = 0
const item = (s: string) => out.push(`${++n}. ${s}`)
const VIA: Record<string, string> = { l: 'on the level', b: 'over the bridge', s: 'through the subway', c: 'round the concourse', u: 'up or down', x: 'level crossing' }

out.push('# Reading station: everything Trainchecker says (November 24th 2026)', '',
  'Every sentence below is exactly what the page would show, with John\'s corrections of today in.', 'Reply by number.', '')
out.push('## A. The entrances and exits', '')
e.x.forEach((x: [string, string[], number, string | null], i: number) => {
  const by = x[1].length ? `by platforms ${x[1].join(', ')} (nearest first)` : `by no platform; the bridge comes down by platform ${x[3]} on the way to it`
  const only = (e.eo ?? []).includes(i) ? ' Exit only: never offered as a way in.' : ''
  item(`**${x[0]}**: ${by}. As an entrance: "${entranceName(e, i, F)}".${only}`)
})
out.push('', '## B. How each platform reaches each exit (the table itself)', '')
for (const p of ps) {
  const ws = (e.p[p] ?? []).map((w: [number, string, string | null]) => `${e.x[w[0]][0]} ${VIA[w[1]]}${w[2] ? ` (comes down by ${w[2]})` : ''}`)
  item(`**Platform ${p}:** ${ws.join('; ')}.`)
}
out.push('', '## C. The Exits section (for your train coming in at Reading)', '')
item(`Heading "${heading('Reading', e)}", then: "${stationLine('Reading', e)}"`)
for (const p of ps) item(`**Platform ${p}:** "${trainLine(e, p, false)}"`)
out.push('', '## D. Platform directions (tap a platform on the Platforms board, leaving Reading)', '')
for (const p of ps) item(`**Platform ${p}:** "${(toPlatform(e, p, L, F) ?? ['(nothing)']).join(' ')}"`)
out.push('', '## E. Between platforms (Connections, changing trains at Reading)', '',
  'Connections says "… from platform 9, which is over the footbridge" and the like. Grouped:', '')
const groups = new Map<string, string[]>()
for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
  const s = howToGet(L, ps[i], ps[j]) || '(nothing said)'
  groups.set(s, [...(groups.get(s) ?? []), `${ps[i]}–${ps[j]}`])
}
for (const [s, pairs] of groups) item(`**"${s}"**: ${pairs.join(', ')}.`)
out.push('', '## F. John\'s answers (November 24th 2026)', '',
  'All in: the station\'s sentence (54) and platforms 1 to 3 (55) in his words; Apex Plaza for 4 to 6 (56,',
  'Claude\'s draft); not the main entrance for 4 to 6 (57); platform 3 round a small corner from 7, so 38 as',
  '39 (58); "by platform 15" kept, and "go down to platform 7" (59); "over the bridge" in Connections (60);',
  '"on the same level" for 1 to 7 (61).')
console.log(out.join('\n'))
