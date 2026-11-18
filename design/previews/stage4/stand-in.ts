// Stage 4: Reading to Bond Street's last week, measured to Ealing Broadway (John's idea, November 18th
// 2026). The live board is the 6.24pm Reading board's Elizabeth Line trains; the history is real
// (needs the history key and the preview on 4620 with RDM_HSP_KEY).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium, devices } = createRequire(import.meta.url)('playwright')
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-1824-RDG-PAD.json', import.meta.url), 'utf8'))
const boards = s.boards.map((x: any) => ({ ...x.board, trainServices: (x.board.trainServices || []).filter((t: any) => /Elizabeth/.test(t.operator)) }))
const snap = { ...trim('RDG', 'BDS', s.taken, boards), toName: 'Bond Street' }
const b = await chromium.launch()
const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage()
const errors: string[] = []; p.on('pageerror', (e: Error) => errors.push(e.message))
const asked: string[] = []
p.on('request', (r: any) => { if (r.url().includes('/api/week')) asked.push(new URL(r.url()).search) })
await p.route('**/api/live?**', (r: any) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.goto('http://localhost:4620/#RDG-BDS')
await p.waitForSelector('.verdict')
const box = p.locator('section', { has: p.locator('h3', { hasText: 'The last week' }) })
await box.locator('select').selectOption('8')
await box.getByRole('button', { name: 'Show the last week' }).tap()
await box.locator('.hist-result .big, .hist-failed').waitFor({ timeout: 120000 })
console.log(await box.innerText())
console.log('asked:', asked.join(' | '))
await box.screenshot({ path: new URL('./stand-in-RDG-BDS-390.png', import.meta.url).pathname })
console.log('errors', errors.length, 'sideways', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth))
await b.close()
