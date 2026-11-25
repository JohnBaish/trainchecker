// The arrival board on the page (November 25th 2026). The arrivals are live, from B's arrival board;
// the departure side is made up from the same trains (ILLUSTRATION ONLY: this session holds only the
// arrival board's key). The Exits platform lookup goes to the real preview server.
// Usage: NODE_USE_ENV_PROXY=1 node design/previews/arrival-board/shoot.mjs FROM TO NAME_FROM NAME_TO <out> [390|1200] [light|dark]
import { createRequire } from 'node:module'
import { trimArr, ARR_WINDOWS } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [from, to, fromName, toName, out, size = '1200', theme = 'light'] = process.argv.slice(2)
const B = 'https://api1.raildata.org.uk/1010-live-arrival-board-arr/LDBWS/api/20220120/GetArrBoardWithDetails'
const boards = await Promise.all([[-120, 60], ...ARR_WINDOWS, [119, 120]].map(([o, w]) =>
  fetch(`${B}/${to}?numRows=150&filterCrs=${from}&filterType=from&timeOffset=${o}&timeWindow=${w}`, { headers: { 'x-apikey': 'proxy-injected', Accept: 'application/json' } }).then((r) => r.json())))
const taken = new Date().toISOString()
const arrivals = trimArr(from, boards.slice(1, 4))
const services = trimArr(from, boards).map((t) => ({ ...t, platform: null }))
const snap = { taken, from, to, fromName, toName, services, route: [], stops: [], arrivals }
const b = await chromium.launch()
const touch = size !== '1200'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
await p.goto(`http://localhost:4620/#${from}-${to}`)
await p.waitForSelector('.grid', { timeout: 8000 })
const arr = p.locator('section.card', { has: p.locator('h3', { hasText: /^Arrivals$/ }) })
const fold = arr.locator('summary')
if (await fold.count()) await fold.first().click()
// Exits: choose the first train and wait for the platform answer.
const ex = p.locator('section.exits')
let exitAnswer = null
if (await ex.count()) {
  const first = ex.locator('button.cmine').first()
  if (await first.count()) {
    await first.click()
    await p.waitForSelector('.exit-answer', { timeout: 20000 }).catch(() => {})
    exitAnswer = await ex.locator('.exit-answer').textContent().catch(() => null)
  }
}
await p.waitForTimeout(300)
const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)
const heads = await arr.locator('.bhead').allTextContents()
await arr.screenshot({ path: out })
if (await ex.count()) await ex.screenshot({ path: out.replace('.png', '-exits.png') })
console.log(JSON.stringify({ from, to, size, theme, errors, sideways: wide, arrivals: arrivals.length, ending: arrivals.filter((t) => t.destination === toName).length, heads, exitAnswer }))
await b.close()
