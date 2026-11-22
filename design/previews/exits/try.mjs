// Station exits on a saved board (vite preview on 4620), the platform lookup answered with a
// given platform. Usage: node design/previews/exits/try.mjs <snapshot> <platform> <out.png> [390|1200] [light|dark]
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [file, plat, out, size = '1200', theme = 'light'] = process.argv.slice(2)
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
await p.route('**/api/connect?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ taken: s.taken, at: s.to, arrPlatform: plat === 'none' ? null : plat }) }))
await p.goto(`http://localhost:4620/#${s.from}-${s.to}`)
await p.waitForSelector('.verdict', { timeout: 8000 })
const sec = p.locator('section.exits')
await sec.waitFor({ timeout: 8000 })
const chip = sec.locator('.cmine').first()
if (await chip.count()) { await chip.click(); await p.waitForSelector('.exit-answer', { timeout: 5000 }) }
await p.waitForTimeout(200)
const info = await p.evaluate(() => ({ wide: document.documentElement.scrollWidth > innerWidth, chips: [...document.querySelectorAll('section.exits .cmine')].map((x) => Math.round(x.getBoundingClientRect().height)) }))
await sec.screenshot({ path: out })
console.log(file, plat, size, theme, 'errors', errors.length, 'sideways', info.wide, 'chip heights', info.chips.join(','))
console.log((await sec.innerText()).replace(/\n+/g, ' | '))
await b.close()
