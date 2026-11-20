// Stage 5: the platforms fold and Arrivals, open, on a saved board (vite preview on 4620).
// Usage: node design/previews/stage5-folds.mjs <snapshot> <out.png> [390|1200] [light|dark]
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [file, out, size = '1200', theme = 'light'] = process.argv.slice(2)
const s = JSON.parse(readFileSync(new URL(`../mockups/snapshots/${file}`, import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const b = await chromium.launch()
const touch = size === '390'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
// The page's clock set to when the board was saved, so "the next hour" means then.
await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.goto(`http://localhost:4620/#${s.from}-${s.to}`)
await p.waitForSelector('.verdict', { timeout: 8000 }).catch(async () => { console.log('ERR', errors, (await p.evaluate(() => document.body.innerText)).slice(0, 300)) })
for (const sel of ['.grid details.trains-fold', 'details.arrivals-fold']) { const d = p.locator(sel).last(); if (await d.count()) await d.locator('summary').click() }
await p.waitForTimeout(300)
const info = await p.evaluate(() => ({ wide: document.documentElement.scrollWidth > innerWidth, sums: [...document.querySelectorAll('summary')].map((x) => [x.textContent.trim(), Math.round(x.getBoundingClientRect().height)]) }))
const hd = await p.evaluate(() => [...document.querySelectorAll('.bhead')].map((h) => [...h.children].map((c) => [c.textContent, Math.round(c.getBoundingClientRect().width), Math.round(c.getBoundingClientRect().height)]))); console.log(JSON.stringify(hd)); let k = 0; for (const el of await p.locator('.board').all()) await el.screenshot({ path: out.replace('.png', '-' + (k++) + '.png') })
console.log(file, size, theme, 'errors', errors.length, 'sideways', info.wide, JSON.stringify(info.sums))
await b.close()
