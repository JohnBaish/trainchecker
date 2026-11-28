// MOCK-UP (November 28th 2026): the platform at B on Exits' train buttons, ?mock=A and ?mock=B, on the saved
// Bath Spa to Bristol Temple Meads board (6.24pm, November 17th 2026), the page's clock set to then. The arrival
// board is made up (ILLUSTRATION ONLY): the first three trains platform 3, the rest not announced yet.
// vite preview on 4620. Usage: node design/previews/exits-platform/shoot.mjs <out-dir>
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-1824-BTH-BRI.json', import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const sorted = [...snap.services].sort((x, y) => x.std.localeCompare(y.std))
const now = new Date(s.taken).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })
const firstThree = new Set(sorted.filter((x) => x.std >= '18:00').slice(0, 3).map((x) => x.id))
const body = JSON.stringify({ ...snap, arrivals: snap.services.map((x) => ({ ...x, platform: firstThree.has(x.id) ? '3' : null })) })
const VIEWS = [
  { tag: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  { tag: '390-light', viewport: { width: 390, height: 844 }, colorScheme: 'light', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  { tag: '1200-light', viewport: { width: 1200, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2 },
]
const b = await chromium.launch()
for (const mock of ['A', 'B']) for (const v of VIEWS) {
  const { tag, ...opts } = v
  const ctx = await b.newContext(opts)
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
  await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body }))
  await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
  await p.goto(`http://localhost:4620/?mock=${mock}#${s.from}-${s.to}`)
  const ex = p.locator('section.exits:not(.home)')
  await ex.waitFor()
  await ex.locator('summary').click()
  await p.waitForTimeout(300)
  await ex.screenshot({ path: `${out}/mock-${mock}-${tag}.png` })
  const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  const n = await ex.locator('.cmine').count()
  console.log(`${mock} ${tag}: clock ${now}, ${n} trains, sideways ${side}, errors ${errors.length} ${errors.join(' | ')}`)
  await ctx.close()
}
await b.close()
