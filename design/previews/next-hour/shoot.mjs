// PROTOTYPE pictures (November 24th 2026): the two new panels, folds open, on a saved board.
// Usage: node design/previews/next-hour/shoot.mjs <snapshot> <out.png> <A|B> [390|1200] [light|dark]
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [file, out, mock, size = '1200', theme = 'light'] = process.argv.slice(2)
const s = JSON.parse(readFileSync(new URL(`../../mockups/snapshots/${file}`, import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const b = await chromium.launch()
const touch = size === '390'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
await p.goto(`http://localhost:4620/?mock=${mock}#${s.from}-${s.to}`)
await p.waitForSelector('.grid', { timeout: 8000 })
const open = process.env.OPEN !== '0'
if (open) for (const d of await p.locator('.grid details').all()) await d.locator('summary').click()
await p.waitForTimeout(300)
const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)
const box = await p.locator('.grid').boundingBox()
const v = await p.locator('.verdict').boundingBox()
await p.screenshot({ path: out, fullPage: true, clip: { x: 0, y: Math.max(0, v.y - 12), width: touch ? 390 : 1200, height: box.y + box.height - v.y + 24 } })
console.log(file, mock, size, theme, 'errors', errors.length, 'sideways', wide)
await b.close()
