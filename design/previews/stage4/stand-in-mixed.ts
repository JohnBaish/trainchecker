// Stage 4: Twyford to Paddington's last week, Great Western to Paddington and the Elizabeth Line to
// Ealing Broadway (John, November 18th 2026). A small made-up live board (one train of each, with
// the Elizabeth Line's real stops); the history is real (preview on 4620 with RDM_HSP_KEY).
import { createRequire } from 'node:module'
const { chromium, devices } = createRequire(import.meta.url)('playwright')
const t = (std: string, sta: string, operator: string) => ({ id: operator + std, std, etd: 'On time', platform: null, operator, destination: 'London Paddington', cancelled: false, reason: null, sta, eta: 'On time', ata: null })
const stops: [string, string][] = [['MAI', 'Maidenhead'], ['TAP', 'Taplow'], ['BNM', 'Burnham'], ['SLO', 'Slough'], ['LNY', 'Langley'], ['IVR', 'Iver'], ['WDT', 'West Drayton'], ['HAY', 'Hayes & Harlington'], ['STL', 'Southall'], ['EAL', 'Ealing Broadway']]
const hm = (mins: number) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(Date.now() + mins * 60e3))
const snap = { taken: new Date().toISOString(), from: 'TWY', to: 'PAD', fromName: 'Twyford', toName: 'London Paddington', route: stops.map(([c]) => c), stops,
  services: [t(hm(30), hm(60), 'Great Western Railway'), t(hm(35), hm(85), 'Elizabeth Line')] }
const b = await chromium.launch()
const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage()
const errors: string[] = []; p.on('pageerror', (e: Error) => errors.push(e.message))
const asked: string[] = []
p.on('request', (r: any) => { if (r.url().includes('/api/week')) asked.push(new URL(r.url()).search.replace(/&first.*/, '')) })
await p.route('**/api/live?**', (r: any) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.route('**/api/days', (r: any) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ taken: snap.taken, until: snap.taken, items: [] }) }))
await p.goto('http://localhost:4620/#TWY-PAD')
await p.waitForSelector('.verdict')
const box = p.locator('section', { has: p.locator('h3', { hasText: 'The last week' }) })
await box.locator('select').selectOption('8')
const t0 = Date.now()
await box.getByRole('button', { name: 'Show the last week' }).tap()
await box.locator('.hist-result .big, .hist-failed').first().waitFor({ timeout: 150000 })
console.log(`answered in ${Math.round((Date.now() - t0) / 1000)} seconds`)
console.log((await box.locator('.hist-result').innerText()))
console.log('asked:', asked.join(' | '))
await box.screenshot({ path: new URL('./stand-in-TWY-PAD-390.png', import.meta.url).pathname })
console.log('errors', errors.length, 'sideways', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth))
await b.close()
