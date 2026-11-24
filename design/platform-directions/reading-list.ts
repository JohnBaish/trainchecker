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
  'Draft for John to check. Your corrections of today are already in; every sentence below is', 'exactly what the page would show. Reply by number.', '')
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
out.push('', '## F. Questions for John', '')
for (const q of [
  'Item 20: the north exit is off the bridge, not by platform 15. Draft: "At Reading, the exits are by platforms 4 and 7, and at the north end of the bridge." (Agreed on November 22nd: "…by platforms 1, 4 and 15.")',
  'Items 21 to 23 and 27: on November 22nd you agreed "The way out to the town centre and Station Hill is right there" for platform 1. Keep that, or the new "The main Station Hill exit on the town centre side is right there"?',
  'Items 24 to 26: Apex Plaza isn\'t mentioned for 4 to 6. Add "…, or the Apex Plaza exit is round the concourse"? (Draft.)',
  'Items 39 to 41: mention the main Station Hill entrance for 4 to 6 too? Draft: "Platform 4 is right by the Station Road (Edward VII) entrance, and the main Station Hill entrance is a short walk along the platforms."',
  'Items 38 and 42: the map puts platform 3 on the same island as 7, so from the north entrance it says "cross to platform 3" directly, while 1 and 2 say "go down by platform 7, then walk". Is 3 really beside 7?',
  'Items 36 to 49: from the north entrance, "go up to the bridge by platform 15". The north entrance hall has stairs and escalators up to the bridge; is "by platform 15" helpful there, or would "go up to the bridge" alone be better?',
  'Section E: Connections says "footbridge" at Reading, where Exits and the directions say "bridge" (your word). Use "bridge" in Connections too, at every station where you\'ve set a word?',
  'Item 52: "on the same level" for any two of platforms 1 to 7: right?',
]) item(q)
console.log(out.join('\n'))
