// MOCK-UP (November 25th 2026): what shows while the trains load, options A and B. The answer is held
// back so the loading screen stays. Usage: node design/previews/loading/shoot.mjs A|B 390|1200 light|dark
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const [opt, size, theme] = process.argv.slice(2)
const b = await chromium.launch()
const touch = size !== '1200'
const ctx = await b.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1200, height: 900 }, hasTouch: touch, isMobile: touch, colorScheme: theme, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errors = []; p.on('pageerror', (e) => errors.push(e.message))
await p.route('**/api/live?**', () => {}) // never answered
await p.route('**/api/days**', () => {})
await p.goto(`http://localhost:4620/?load=${opt}#RDG-PAD`)
await p.waitForSelector('[role=status]')
await p.waitForTimeout(400)
const quote = await p.locator('.quote, .qotd, [class*=quote]').count()
await p.screenshot({ path: new URL(`./load-${opt}-${size}-${theme}.png`, import.meta.url).pathname })
console.log(JSON.stringify({ opt, size, theme, errors, quoteShown: quote > 0, sideways: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth) }))
await b.close()
