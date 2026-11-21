// "Over the footbridge" in context: Connections answered on the real boards saved at 2.55pm on
// November 21st 2026 (vite preview on 4620), the page's clock set to then.
// Usage: node design/previews/connection/footbridge.mjs <out-dir>
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { places, trimConnect } from '../../../api/connect.ts'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const dir = new URL('../../mockups/snapshots/20261121-1455-connection/', import.meta.url)
const read = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
const TAKEN = '2026-11-21T14:55:00Z'
const nta = read('NTA.json')
const rdg = { locationName: 'Reading', trainServices: [0, 15, 30, 45, 60, 75, 90, 105].flatMap((o) => read(`RDG-w${o}.json`).trainServices || []) }
const to = (b, crs, name) => ({ locationName: b.locationName, filterLocationName: name,
  trainServices: (b.trainServices || []).filter((s) => (s.subsequentCallingPoints || []).some((g) => (g.callingPoint || []).some((c) => c.crs === crs))) })
const came = (b, j) => { const ids = new Set((j.trainServices || []).map((s) => s.serviceID.slice(0, 8))); return { trainServices: (b.trainServices || []).filter((s) => ids.has(s.serviceID.slice(0, 8))) } }

const RUNS = [
  { name: 'IVY-NTA-TQY', a: 'IVY', b: 'NTA', file: 'IVY-NTA.json', board: nta, c: 'TQY', cName: 'Torquay', type: 'Torq', std: '15:04' },
  { name: 'TWY-RDG-SWI', a: 'TWY', b: 'RDG', file: 'TWY-RDG.json', board: rdg, c: 'SWI', cName: 'Swindon', type: 'Swin', std: '15:07' },
  { name: 'TWY-RDG-PAD', a: 'TWY', b: 'RDG', file: 'TWY-RDG.json', board: rdg, c: 'PAD', cName: 'London Paddington', type: 'London Padd', std: '15:07', chip: 'Elizabeth Line' },
]
const VIEWS = [
  { tag: '1200-light', viewport: { width: 1200, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2 },
  { tag: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
]
const b = await chromium.launch()
for (const r of RUNS) for (const v of VIEWS) {
  const { tag, ...opts } = v
  const journey = read(r.file)
  const snap = trim(r.a, r.b, TAKEN, [journey])
  const mine = snap.services.find((s) => s.std === r.std)
  const ctx = await b.newContext(opts)
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(TAKEN)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
  await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
  await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
  await p.route('**/api/connect?**', (q) => {
    const u = new URL(q.request().url())
    const body = u.searchParams.get('to')
      ? trimConnect(r.b, r.c, TAKEN, [to(r.board, r.c, r.cName)], [came(r.board, journey)], u.searchParams.get('train'))
      : { taken: TAKEN, at: r.b, places: places([r.board]) }
    q.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await p.goto(`http://localhost:4620/#${r.a}-${r.b}`)
  await p.locator('.connect summary').click()
  const box = p.locator('.connect input')
  await box.fill(r.type)
  await p.waitForTimeout(800)
  await box.fill(r.type)
  await p.locator('.connect .suggest li', { hasText: r.cName }).first().click()
  await p.getByRole('button', { name: 'Next' }).click()
  const t12 = (s) => { const [h, m] = s.split(':').map(Number); return `${h % 12 || 12}.${String(m).padStart(2, '0')}` }
  await p.locator('.connect .cmine', { hasText: t12(mine.std) }).first().click()
  await p.locator('.connect .canswer').waitFor({ timeout: 8000 })
  if (r.chip) await p.locator('.connect .chip', { hasText: r.chip }).first().click()
  await p.waitForTimeout(300)
  const text = await p.locator('.connect .canswer').innerText()
  const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  await p.locator('.connect').screenshot({ path: `${out}/footbridge-${r.name}-${tag}.png` })
  console.log(`${r.name} ${tag}: sideways ${side}, errors ${errors.length}${errors.length ? ' ' + errors.join(' | ') : ''}\n  ${text}`)
  await ctx.close()
}
// The credit in "About these figures".
const p = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage()
await p.goto('http://localhost:4620/')
console.log('credit:', await p.locator('.about p', { hasText: 'OpenStreetMap' }).innerText(), await p.locator('.about a', { hasText: 'OpenStreetMap' }).getAttribute('href'))
await b.close()
