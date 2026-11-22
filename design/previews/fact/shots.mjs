// Fact of the journey: the quote and the fact close up, on a saved board, for each colour.
// Usage (vite preview on 4620): node design/previews/fact/shots.mjs
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const file = process.argv[2] || '20261117-2059-RDG-PAD.json'
const s = JSON.parse(readFileSync(new URL(`../../mockups/snapshots/${file}`, import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const b = await chromium.launch()
for (const [size, theme] of [['1200', 'light'], ['390', 'light'], ['390', 'dark'], ['1200', 'dark']]) {
  for (const look of ['b']) {
    const touch = size === '390'
    const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
    const p = await ctx.newPage()
    const errors = []
    p.on('pageerror', (e) => errors.push(e.message))
    await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } }; Math.random = () => 0.15 }`)
    await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
    await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
    await p.goto(`http://localhost:4620/#${s.from}-${s.to}`)
    await p.waitForSelector('.fact', { timeout: 8000 })
    await p.evaluate(() => document.fonts.ready)
    const q = await p.locator('.qc2').first().boundingBox(), f = await p.locator('.fact').boundingBox()
    const info = await p.evaluate(() => ({ wide: document.documentElement.scrollWidth > innerWidth, share: Math.round(document.querySelector('.fact .qs2').getBoundingClientRect().height), text: document.querySelector('.fact .qt').textContent }))
    await p.screenshot({ fullPage: true, path: new URL(`${look}-${size}-${theme}.png`, import.meta.url).pathname, clip: { x: 0, y: q.y - 16, width: touch ? 390 : 1200, height: f.y + f.height - q.y + 32 } })
    console.log(look, size, theme, 'errors', errors.length, 'sideways', info.wide, 'share', info.share, '|', info.text.slice(0, 70))
    await ctx.close()
  }
}
await b.close()
