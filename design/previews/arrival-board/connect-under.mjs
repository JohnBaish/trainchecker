// Connections: the answer under the train you tapped (John, November 25th 2026). ILLUSTRATION ONLY:
// the trains are live arrival boards; the departure side and the onward trains (from Oxford's arrival
// board, trains from Reading) are made up from them, as this session holds only the arrival key.
// Usage: NODE_USE_ENV_PROXY=1 node connect-under.mjs N out.png [390|1200] [light|dark]
import { createRequire } from 'node:module'
import { trimArr, ARR_WINDOWS } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [n, out, size = '390', theme = 'light'] = process.argv.slice(2)
const B = 'https://api1.raildata.org.uk/1010-live-arrival-board-arr/LDBWS/api/20220120/GetArrBoardWithDetails'
const get = (at, from, wins) => Promise.all(wins.map(([o, w]) => fetch(`${B}/${at}?numRows=150&filterCrs=${from}&filterType=from&timeOffset=${o}&timeWindow=${w}`, { headers: { 'x-apikey': 'proxy-injected', Accept: 'application/json' } }).then((r) => r.json())))
const twy = await get('RDG', 'TWY', [[-120, 60], ...ARR_WINDOWS, [119, 120]])
const oxf = await get('OXF', 'RDG', [[-10, 120], [110, 120]])
const taken = new Date().toISOString()
const arrivals = trimArr('TWY', twy.slice(1, 4))
const snap = { taken, from: 'TWY', to: 'RDG', fromName: 'Twyford', toName: 'Reading', services: trimArr('TWY', twy).map((t) => ({ ...t, platform: null })), route: [], stops: [], arrivals }
const onward = trimArr('RDG', oxf).map((t) => ({ id: t.id.slice(0, 8), std: t.std, etd: t.etd, platform: null, destination: t.destination, operator: t.operator, cancelled: t.cancelled, sta: t.sta, eta: t.eta }))
const plat = Object.fromEntries(arrivals.map((t) => [t.id.slice(0, 8), t.platform]))
const b = await chromium.launch()
const touch = size !== '1200'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errors = []; p.on('pageerror', (e) => errors.push(e.message))
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
await p.route('**/api/connect?**', async (r) => {
  const q = new URL(r.request().url()).searchParams
  if (!q.get('to') && !q.get('only')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ taken, at: 'RDG', places: ['OXF'] }) })
  await new Promise((res) => setTimeout(res, 400))
  r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ taken, at: 'RDG', to: 'OXF', atName: 'Reading', toName: 'Oxford', arrPlatform: plat[q.get('train')] ?? null, trains: onward }) })
})
await p.goto('http://localhost:4620/#TWY-RDG')
await p.waitForSelector('section.connect')
const sec = p.locator('section.connect')
await sec.locator('summary').click()
await sec.locator('input').fill('Oxford')
await sec.getByRole('button', { name: 'Next' }).click()
await p.waitForSelector('section.connect button.cmine')
const btns = sec.locator('button.cmine')
const tapped = btns.nth(+n - 1)
if (touch) await tapped.tap(); else await tapped.click()
const waiting = await sec.locator('.tap-reply [role=status]').count()
await p.waitForSelector('section.connect .canswer', { timeout: 20000 })
const ans = await sec.locator('.tap-reply').boundingBox(), tb = await tapped.boundingBox()
const all = await Promise.all((await btns.all()).map((x) => x.boundingBox()))
await sec.screenshot({ path: out })
console.log(JSON.stringify({ size, theme, errors, cols: new Set(all.map((x) => Math.round(x.x))).size, trains: all.length, waitingShownInPlace: waiting > 0,
  gapUnderTappedRow: Math.round(ans.y - Math.max(...all.filter((x) => Math.abs(x.y - tb.y) < 2).map((x) => x.y + x.height))),
  trainsBelowAnswer: all.filter((x) => x.y > ans.y).length, answer: (await sec.locator('.canswer').textContent()).slice(0, 120),
  shareButton: await sec.locator('.tap-reply .share-row button').count(), sideways: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth) }))
await b.close()
