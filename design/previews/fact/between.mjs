// "Between X and Y, your train…" (John, November 23rd 2026): chosen facts on saved boards, close up.
// Usage (vite preview on 4620): node design/previews/fact/between.mjs [out-folder]
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
import d from '../../../src/data/passes-near.json' with { type: 'json' }
import { journeyFacts } from '../../../src/lib/passesNear.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || new URL('.', import.meta.url).pathname
const cases = [
  ['20261118-0822-TVP-PAD.json', 'AML-PAD', '390', 'dark'],
  ['20261118-0822-TVP-PAD.json', 'IVR-WDT', '1200', 'light'],
  ['20261118-0822-TVP-PAD.json', 'HAY-STL', '390', 'light'],
  ['20261117-1824-BTH-BRI.json', null, '1200', 'dark'],
]
const b = await chromium.launch()
for (const [file, want, size, theme] of cases) {
  const s = JSON.parse(readFileSync(new URL(`../../mockups/snapshots/${file}`, import.meta.url), 'utf8'))
  const snap = trim(s.from, s.to, s.taken, s.boards.map((x) => x.board))
  const facts = journeyFacts(d, snap.from, snap.stops.map(([c]) => c), snap.to)
  const i = want ? facts.findIndex((f) => f.id === want) : 0
  const r = (i + 0.5) / facts.length
  const touch = size === '390'
  const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } }; Math.random = () => ${r} }`)
  await p.route('**/api/live?**', (x) => x.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
  await p.route('**/api/days**', (x) => x.fulfill({ status: 503, body: '' }))
  await p.goto(`http://localhost:4620/#${s.from}-${s.to}`)
  await p.waitForSelector('.fact', { timeout: 8000 })
  await p.evaluate(() => document.fonts.ready)
  const f = await p.locator('.fact').boundingBox()
  const info = await p.evaluate(() => ({ wide: document.documentElement.scrollWidth > innerWidth, text: document.querySelector('.fact .qt').textContent }))
  const name = `between-${s.from}-${s.to}-${want ?? 'first'}-${size}-${theme}.png`
  await p.screenshot({ fullPage: true, path: `${out}/${name}`, clip: { x: 0, y: f.y - 24, width: touch ? 390 : 1200, height: f.height + 48 } })
  console.log(name, 'errors', errors.length, 'sideways', info.wide, '|', info.text.slice(0, 90))
  await ctx.close()
}
await b.close()
