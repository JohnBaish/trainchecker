// The whole page on every saved board (design/mockups/snapshots/), every fold opened, at a computer, a phone and a phone
// held sideways: page errors and sideways scroll. The arrival board is made up from the departures (ILLUSTRATION ONLY),
// so Exits shows. vite preview on 4620. Usage: node design/previews/find-my-train/sweep.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const dir = new URL('../../mockups/snapshots/', import.meta.url)
const files = readdirSync(dir).filter((f) => /^\d{8}-\d{4}-[A-Z]{3}-[A-Z]{3}\.json$/.test(f))
const VIEWS = [
  { tag: '1200 light', viewport: { width: 1200, height: 900 }, colorScheme: 'light' },
  { tag: '390 dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true },
  { tag: '844x390', viewport: { width: 844, height: 390 }, colorScheme: 'light', hasTouch: true, isMobile: true },
]
const b = await chromium.launch()
let bad = 0, runs = 0
for (const f of files) {
  const s = JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
  const snap = trim(s.from, s.to, s.taken, s.boards.map((x) => x.board))
  const body = JSON.stringify({ ...snap, arrivals: snap.services })
  for (const v of VIEWS) {
    const { tag, ...opts } = v
    const ctx = await b.newContext(opts)
    const p = await ctx.newPage()
    const errors = []
    p.on('pageerror', (e) => errors.push(e.message))
    await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
    await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body }))
    await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
    await p.route('**/api/connect?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ taken: s.taken, at: snap.to, places: [], arrPlatform: '9' }) }))
    await p.goto(`http://localhost:4620/#${snap.from}-${snap.to}`)
    await p.locator('.verdict, .load-failed').first().waitFor({ timeout: 10000 })
    await p.waitForTimeout(800)
    await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true }))
    await p.waitForTimeout(800)
    const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    const trains = await p.locator('.cmine').count()
    runs++
    if (errors.length || side > 0) { bad++; console.log(`${f} ${tag}: sideways ${side}, errors ${errors.join(' | ')}`) }
    else console.log(`${f.slice(9, 21)} ${tag}: fine (${trains} train buttons)`)
    await ctx.close()
  }
}
console.log(`${runs} views, ${bad} with a problem`)
await b.close()
