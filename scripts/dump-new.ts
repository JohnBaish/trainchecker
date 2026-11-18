// Prints the platforms fold and the arrivals sentence for every saved board (for checking by eye).
import { readFileSync, readdirSync } from 'node:fs'
import { trim } from '../api/live.ts'
import { analyse } from '../src/lib/analyse.ts'
import { arrivals, platformTrains } from '../src/lib/sentences.ts'
const dir = new URL('../design/mockups/snapshots/', import.meta.url)
for (const f of readdirSync(dir).filter((x) => /^\d{8}-\d{4}-[A-Z]{3}-[A-Z]{3}\.json$/.test(x)).sort()) {
  const s = JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
  const a = analyse(trim(s.from, s.to, s.taken, s.boards.map((b: { board: unknown }) => b.board)))
  const p = platformTrains(a), x = arrivals(a)
  console.log(`${f} (${a.now})\n  ${p ? `[${p.fold}] ${p.text}` : '(no platforms fold)'}\n  [${x.heading}] ${x.text}\n`)
}
