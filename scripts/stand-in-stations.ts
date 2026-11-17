// A stand-in list of stations for the chooser, until the Knowledgebase Stations feed is
// subscribed (John, November 17th 2026): every station named in the real live boards saved on
// November 17th (design/mockups/snapshots/), with National Rail's own names and codes. Writes
// src/data/stations.json as [code, name] pairs, sorted by name. To be replaced by the full list.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const dir = new URL('../design/mockups/snapshots/', import.meta.url)
const found = new Map<string, string>()
type Point = { crs?: string; locationName?: string }
const walk = (o: unknown): void => {
  if (Array.isArray(o)) { o.forEach(walk); return }
  if (!o || typeof o !== 'object') return
  const p = o as Point
  if (p.crs && p.locationName && /^[A-Z]{3}$/.test(p.crs)) found.set(p.crs, p.locationName)
  Object.values(o).forEach(walk)
}
for (const f of readdirSync(dir).filter((x) => /^\d{8}-\d{4}-[A-Z]{3}-[A-Z]{3}\.json$/.test(x))) {
  const s = JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
  for (const b of s.boards) {
    walk(b.board)
    if (b.board.locationName) found.set(s.from, b.board.locationName)
    if (b.board.filterLocationName) found.set(s.to, b.board.filterLocationName)
  }
}
const list = [...found].sort((a, b) => a[1].localeCompare(b[1]))
writeFileSync(new URL('../src/data/stations.json', import.meta.url), JSON.stringify(list) + '\n')
console.log(`${list.length} stations`)
