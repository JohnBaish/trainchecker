// MOCK-UP pictures (November 27th 2026): three ways of showing the coaches in "The next hour", on a saved
// board (Reading to London Paddington, 6.24pm on November 17th 2026; real coach counts from that board).
// Needs `vite preview --port 4620`. Usage: node design/previews/coaches/shoot.mjs <0|1|2|3> <390|1200> <light|dark>
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [opt, size, theme] = process.argv.slice(2)
const file = process.env.SNAP || '20261117-1824-RDG-PAD.json'
const s = JSON.parse(readFileSync(new URL(`../../mockups/snapshots/${file}`, import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const b = await chromium.launch()
const touch = size !== '1200'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
await p.goto(`http://localhost:4620/${opt === '0' ? '' : `?coaches=${opt}`}#${s.from}-${s.to}`)
await p.waitForSelector('.grid', { timeout: 8000 })
const card = p.locator('.grid > *').first()
await card.locator('details summary').first().click()
await p.waitForTimeout(400)
const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)
const out = new URL(`./coaches-${process.env.TAG ?? ''}${opt}-${size}-${theme}.png`, import.meta.url).pathname
await card.screenshot({ path: out })
console.log(opt, size, theme, 'errors', errors.length, 'sideways', wide, 'rows', await card.locator('.brow').count())
await b.close()
