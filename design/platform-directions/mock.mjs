// Mock-ups A and B of "How do I get to my platform?" on a saved board (vite preview on 4620).
// Usage: node design/platform-directions/mock.mjs <snapshot> <A|B> <platform> <out.png> [390|1200] [light|dark]
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [file, mock, plat, out, size = '1200', theme = 'light'] = process.argv.slice(2)
const s = JSON.parse(readFileSync(new URL(`../mockups/snapshots/${file}`, import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const b = await chromium.launch()
const touch = size === '390'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.goto(`http://localhost:4620/#${s.from}-${s.to}`)
await p.waitForSelector('.verdict', { timeout: 8000 })
const fold = p.locator('details.trains-fold').last()
await fold.locator('summary').click()
await p.waitForTimeout(400)
const sel = mock === 'A' ? fold.locator('.tapbadge', { hasText: new RegExp(`^${plat}$`) }) : fold.locator('.pchip', { hasText: new RegExp(`^Platform ${plat}$`) })
await (plat === 'first' ? fold.locator(mock === 'A' ? '.tapbadge' : '.pchip') : sel).first().click()
await p.waitForTimeout(300)
const info = await p.evaluate(() => ({ wide: document.documentElement.scrollWidth > innerWidth, dirs: [...document.querySelectorAll('.pdirs p')].map((x) => x.textContent), taps: [...document.querySelectorAll('.tapbadge, .pchip')].map((x) => Math.round(x.getBoundingClientRect().height)) }))
const card = fold.locator('xpath=ancestor::section[1]')
await card.screenshot({ path: out })
console.log(file, mock, size, theme, 'errors', errors.length, 'sideways', info.wide, 'tap heights', [...new Set(info.taps)].join(','), '\n  ', info.dirs.join(' | '))
await b.close()
