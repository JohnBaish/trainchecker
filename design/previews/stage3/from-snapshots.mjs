// Stage 3: pictures of the page fed with National Rail's real saved answers (design/mockups/
// snapshots/), for when this session holds another product's key. Needs `vite preview` on 4620.
// Usage: node design/previews/stage3/from-snapshots.mjs <snapshot file> <name> [390|1200] [light|dark]
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [file, name, size = '1200', theme = 'light'] = process.argv.slice(2)
const s = JSON.parse(readFileSync(new URL(`../../mockups/snapshots/${file}`, import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const b = await chromium.launch()
const touch = size === '390'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.goto(`http://localhost:4620/#${s.from}-${s.to}`)
await p.waitForSelector('.verdict')
const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)
await p.screenshot({ path: new URL(`./${name}-${size}-${theme}.png`, import.meta.url).pathname, fullPage: true })
console.log(name, size, theme, 'errors', errors.length, 'sideways', wide)
await b.close()
