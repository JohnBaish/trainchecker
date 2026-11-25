// MOCK-UP pictures (November 25th 2026): Share under the platform location guide and under Exits'
// answer. Guide: the saved Reading to Paddington board of November 17th 6.24pm, the page's clock set
// then. Exits: live arrivals, Twyford to Reading, the departure side made up from them (ILLUSTRATION
// ONLY). Copies each picture and reads it back from the clipboard.
// Usage: NODE_USE_ENV_PROXY=1 node design/previews/box-share/shoot.mjs guide|exits <size 390|1200> <light|dark>
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim, trimArr, ARR_WINDOWS } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [which, size = '1200', theme = 'light'] = process.argv.slice(2)
const dir = new URL('./', import.meta.url).pathname
let snap, hash, taken
if (which === 'guide') {
  const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-1824-RDG-PAD.json', import.meta.url), 'utf8'))
  snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board)); hash = '#RDG-PAD'; taken = s.taken
} else {
  const B = 'https://api1.raildata.org.uk/1010-live-arrival-board-arr/LDBWS/api/20220120/GetArrBoardWithDetails'
  const boards = await Promise.all([[-120, 60], ...ARR_WINDOWS, [119, 120]].map(([o, w]) => fetch(`${B}/RDG?numRows=150&filterCrs=TWY&filterType=from&timeOffset=${o}&timeWindow=${w}`, { headers: { 'x-apikey': 'proxy-injected', Accept: 'application/json' } }).then((r) => r.json())))
  const arrivals = trimArr('TWY', boards.slice(1, 4))
  taken = new Date().toISOString()
  snap = { taken, from: 'TWY', to: 'RDG', fromName: 'Twyford', toName: 'Reading', services: trimArr('TWY', boards).map((t) => ({ ...t, platform: null })), route: [], stops: [], arrivals }
  hash = '#TWY-RDG'
}
const b = await chromium.launch()
const touch = size !== '1200'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2, permissions: ['clipboard-read', 'clipboard-write'] })
const p = await ctx.newPage()
const errors = []; p.on('pageerror', (e) => errors.push(e.message))
if (which === 'guide') await p.addInitScript(`{ const T = ${Date.parse(taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
await p.goto(`http://localhost:4620/${hash}`)
await p.waitForSelector('.grid')
let sec, btn
if (which === 'guide') {
  sec = p.locator('section', { has: p.locator('.tapbadge') }).first()
  await sec.locator('details summary').last().click().catch(() => {})
  for (const d of await sec.locator('details').all()) if (!(await d.evaluate((x) => x.open))) await d.locator('summary').click()
  const badge = sec.locator('.tapbadge').first()
  if (touch) await badge.tap(); else await badge.click()
  await p.waitForSelector('.pdirs-block')
  btn = p.locator('.pdirs-block .box-share button')
} else {
  sec = p.locator('section.exits')
  const closed0 = !(await sec.locator('details.exits-fold').evaluate((d) => d.open))
  console.log('fold starts closed:', closed0, '| line above:', (await sec.locator(':scope > p').first().textContent()).slice(0, 90))
  await sec.locator('details.exits-fold summary').click()
  const t = sec.locator('button.cmine').first()
  if (touch) await t.tap(); else await t.click()
  await p.waitForSelector('.exit-answer', { timeout: 20000 })
  btn = sec.locator('.box-share button')
}
const label = await btn.textContent(), h = (await btn.boundingBox()).height
const box = which === 'guide' ? p.locator('.pdirs-block') : sec.locator('.tap-reply')
await box.screenshot({ path: `${dir}${which}-${size}-${theme}.png` })
let pic = null
if (!touch) {
  await btn.click(); await p.waitForTimeout(1500); console.log('status:', await p.locator('.box-share .share-status').textContent(), await p.evaluate(async () => (await navigator.clipboard.read()).map((i) => i.types)))
  const data = await p.evaluate(async () => { const it = (await navigator.clipboard.read())[0]; const bl = await it.getType('image/png'); return Array.from(new Uint8Array(await bl.arrayBuffer())) })
  writeFileSync(`${dir}${which}-picture.png`, Buffer.from(data)); pic = data.length
}
console.log(JSON.stringify({ which, size, theme, errors, label: label.trim(), buttonHeight: Math.round(h), picture: pic, sideways: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth) }))
await b.close()
