// Exits: the answer under the train you tapped (John, November 25th 2026). Live arrivals, the departure
// side made up from them (ILLUSTRATION ONLY). Usage: NODE_USE_ENV_PROXY=1 node exits-under.mjs FROM TO NAME_FROM NAME_TO N out.png [390|1200] [light|dark]
import { createRequire } from 'node:module'
import { trimArr, ARR_WINDOWS } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [from, to, fromName, toName, n, out, size = '390', theme = 'light'] = process.argv.slice(2)
const B = 'https://api1.raildata.org.uk/1010-live-arrival-board-arr/LDBWS/api/20220120/GetArrBoardWithDetails'
const boards = await Promise.all([[-120, 60], ...ARR_WINDOWS, [119, 120]].map(([o, w]) =>
  fetch(`${B}/${to}?numRows=150&filterCrs=${from}&filterType=from&timeOffset=${o}&timeWindow=${w}`, { headers: { 'x-apikey': 'proxy-injected', Accept: 'application/json' } }).then((r) => r.json())))
const arrivals = trimArr(from, boards.slice(1, 4))
const snap = { taken: new Date().toISOString(), from, to, fromName, toName, services: trimArr(from, boards).map((t) => ({ ...t, platform: null })), route: [], stops: [], arrivals }
const b = await chromium.launch()
const touch = size !== '1200'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errors = []; p.on('pageerror', (e) => errors.push(e.message))
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
await p.goto(`http://localhost:4620/#${from}-${to}`)
await p.waitForSelector('section.exits')
const foldOpen0 = await p.locator('section.exits details.exits-fold').evaluate((d) => d.open)
await p.locator('section.exits details.exits-fold summary').click()
await p.waitForSelector('section.exits button.cmine')
const btns = p.locator('section.exits button.cmine')
const tapped = btns.nth(+n - 1)
if (touch) await tapped.tap(); else await tapped.click()
const waitBox = await p.locator('.tap-reply').boundingBox()   // while asking
await p.waitForSelector('.exit-answer', { timeout: 20000 })
const ans = await p.locator('.tap-reply').boundingBox()
const tb = await tapped.boundingBox()
const all = await Promise.all((await btns.all()).map((x) => x.boundingBox()))
const below = all.filter((x) => x.y > ans.y)
const sameRowAfter = all.filter((x) => Math.abs(x.y - tb.y) < 2 && x.x > tb.x)
await p.locator('section.exits').screenshot({ path: out })
console.log(JSON.stringify({ size, theme, foldStartsClosed: !foldOpen0, errors, cols: new Set(all.map((x) => Math.round(x.x))).size, trains: all.length,
  gapUnderTapped: Math.round(ans.y - (tb.y + tb.height)), lastRowBottom: Math.round(Math.max(...all.filter((x) => x.y <= tb.y + 2).map((x) => x.y + x.height))), answerTop: Math.round(ans.y),
  trainsBelowAnswer: below.length, sameRowAfterTapped: sameRowAfter.length, waitingShownInPlace: !!waitBox,
  sideways: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth) }))
await b.close()
