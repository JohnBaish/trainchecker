// The list in Exits on the rush-hour board (Reading to Paddington, 6.24pm, November 17th 2026): every train on
// its way, then the next four (John, November 26th 2026). The arrival board and platform are made up from the
// departures (ILLUSTRATION ONLY). vite preview on 4620. Usage: node design/previews/find-my-train/list.mjs <out-dir>
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-1824-RDG-PAD.json', import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const body = JSON.stringify({ ...snap, arrivals: snap.services.map((x) => ({ ...x, platform: '9' })) })
const b = await chromium.launch()
for (const v of [{ tag: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  { tag: '1200-light', viewport: { width: 1200, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2 }]) {
  const { tag, ...opts } = v
  const ctx = await b.newContext(opts)
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
  await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body }))
  await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
  await p.goto('http://localhost:4620/#RDG-PAD')
  await p.locator('.exits summary').click()
  await p.waitForTimeout(500)
  const rows = await p.locator('.exits .cmine').allInnerTexts()
  const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  console.log(`${tag}: ${rows.length} trains, sideways ${side}, errors ${errors.length}\n  ${rows.map((r) => r.split('\n').join(' ')).join('\n  ')}`)
  await p.locator('.exits').screenshot({ path: `${out}/list-rush-hour-${tag}.png` })
  await ctx.close()
}
await b.close()
