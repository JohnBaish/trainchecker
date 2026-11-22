// Fact of the journey at the bottom: the page's order on a saved board, and a picture of the end.
// Usage (vite preview on 4620): node design/previews/fact/order.mjs [out-folder]
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || new URL('.', import.meta.url).pathname
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-2059-RDG-PAD.json', import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const b = await chromium.launch()
for (const [size, theme] of [['1200', 'light'], ['390', 'dark']]) {
  const touch = size === '390'
  const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme })
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } }; Math.random = () => 0.15 }`)
  await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
  await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
  await p.goto(`http://localhost:4620/#${s.from}-${s.to}`)
  await p.waitForSelector('.fact', { timeout: 8000 })
  await p.waitForTimeout(800)
  const info = await p.evaluate(() => ({
    wide: document.documentElement.scrollWidth > innerWidth,
    order: [...document.querySelectorAll('h3, .fact, .qc2')].map((e) => e.classList.contains('fact') ? '[FACT]' : e.classList.contains('qc2') ? '[QUOTE]' : e.textContent.trim().slice(0, 30)),
  }))
  const f = await p.locator('.fact').boundingBox()
  await p.screenshot({ fullPage: true, path: `${out}/bottom-${size}-${theme}.png`, clip: { x: 0, y: Math.max(0, f.y - 300), width: touch ? 390 : 1200, height: f.height + 600 } })
  console.log(size, theme, 'errors', errors.length, 'sideways', info.wide, '\n ', info.order.join(' > '))
  await ctx.close()
}
await b.close()
