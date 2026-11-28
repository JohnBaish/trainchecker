// Exits' line when every announced platform is the same (John, November 28th 2026), on the saved Bath Spa to
// Bristol Temple Meads board (6.24pm, November 17th 2026), the page's clock set to then. The arrival board is
// made up (ILLUSTRATION ONLY): case "all", the three trains after 6pm on platform 3; "one", only the 6.23pm;
// "mixed", platforms 3 and 5 (no line). vite preview on 4620. Usage: node shared.mjs <out-dir>
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-1824-BTH-BRI.json', import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const after6 = [...snap.services].sort((x, y) => x.std.localeCompare(y.std)).filter((x) => x.std >= '18:00').map((x) => x.id)
const CASES = {
  all: (id) => (after6.slice(0, 3).includes(id) ? '3' : null),
  one: (id) => (id === after6[2] ? '3' : null),
  mixed: (id) => (id === after6[1] ? '5' : after6.slice(0, 3).includes(id) ? '3' : null),
}
const VIEWS = [
  { tag: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  { tag: '1200-light', viewport: { width: 1200, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2, permissions: ['clipboard-read', 'clipboard-write'] },
]
const b = await chromium.launch()
for (const [name, plat] of Object.entries(CASES)) for (const v of VIEWS) {
  const { tag, ...opts } = v
  const body = JSON.stringify({ ...snap, arrivals: snap.services.map((x) => ({ ...x, platform: plat(x.id) })) })
  const ctx = await b.newContext(opts)
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
  await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body }))
  await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
  await p.goto(`http://localhost:4620/#${s.from}-${s.to}`)
  const ex = p.locator('section.exits:not(.home)')
  await ex.waitFor()
  await ex.locator('summary').click()
  await p.waitForTimeout(300)
  await ex.screenshot({ path: `${out}/shared-${name}-${tag}.png` })
  const line = await ex.locator('.exit-shared').innerText().catch(() => '(none)')
  const q = await ex.locator('.cq').innerText()
  let pic = ''
  if (tag === '1200-light' && name === 'all') {
    await ex.locator('.exit-shared .box-share button').click()
    await ex.locator('.exit-shared .share-status', { hasText: 'Copied' }).waitFor({ timeout: 8000 })
    const png = await p.evaluate(async () => { const it = await navigator.clipboard.read(); const buf = new Uint8Array(await (await it[0].getType('image/png')).arrayBuffer()); let s = ''; for (const c of buf) s += String.fromCharCode(c); return btoa(s) })
    writeFileSync(`${out}/shared-picture.png`, Buffer.from(png, 'base64')); pic = ', picture copied'
  }
  const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  console.log(`${name} ${tag}: [${line.replace(/\n+/g, ' | ')}] Q: ${q}; sideways ${side}, errors ${errors.length}${pic}`)
  await ctx.close()
}
await b.close()
