// The arrivals' Share picture, read back from the clipboard (November 25th 2026). Live arrivals, the
// departure side made up from them (ILLUSTRATION ONLY). Usage: NODE_USE_ENV_PROXY=1 node pic.mjs FROM TO NAME_FROM NAME_TO out.png
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trimArr, ARR_WINDOWS } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [from, to, fromName, toName, out] = process.argv.slice(2)
const B = 'https://api1.raildata.org.uk/1010-live-arrival-board-arr/LDBWS/api/20220120/GetArrBoardWithDetails'
const boards = await Promise.all(ARR_WINDOWS.map(([o, w]) => fetch(`${B}/${to}?numRows=150&filterCrs=${from}&filterType=from&timeOffset=${o}&timeWindow=${w}`, { headers: { 'x-apikey': 'proxy-injected', Accept: 'application/json' } }).then((r) => r.json())))
const arrivals = trimArr(from, boards)
const snap = { taken: new Date().toISOString(), from, to, fromName, toName, services: arrivals.map((t) => ({ ...t, platform: null })), route: [], stops: [], arrivals }
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
const p = await ctx.newPage()
const errors = []; p.on('pageerror', (e) => errors.push(e.message))
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
await p.goto(`http://localhost:4620/#${from}-${to}`)
await p.waitForSelector('.grid')
const arr = p.locator('section.card', { has: p.locator('h3', { hasText: /^Arrivals$/ }) })
await arr.locator('summary').first().click()
await arr.getByRole('button', { name: /these arrivals/ }).click()
await p.waitForTimeout(1500)
const data = await p.evaluate(async () => { const it = (await navigator.clipboard.read())[0]; const bl = await it.getType('image/png'); return Array.from(new Uint8Array(await bl.arrayBuffer())) })
writeFileSync(out, Buffer.from(data))
const fonts = await p.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`))
console.log(JSON.stringify({ errors, bytes: data.length, fonts }))
await b.close()
