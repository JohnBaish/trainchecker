// Prints the last two hours' sentences and the Share message for every saved board, to compare
// before and after a wording change (node scripts/dump-last-two.ts > before.txt).
import { readFileSync, readdirSync } from 'node:fs'
import { trim } from '../api/live.ts'
import { analyse } from '../src/lib/analyse.ts'
import { lastTwoLines, shareWords } from '../src/lib/sentences.ts'
const dir = new URL('../design/mockups/snapshots/', import.meta.url)
for (const f of readdirSync(dir).filter((x) => /^\d{8}-\d{4}-[A-Z]{3}-[A-Z]{3}\.json$/.test(x)).sort()) {
  const s = JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
  const a = analyse(trim(s.from, s.to, s.taken, s.boards.map((b: { board: unknown }) => b.board)))
  console.log(`${f}\n  ${lastTwoLines(a).join('\n  ')}\n  SHARE: ${shareWords(a).text}\n`)
}
