// Mock-ups B and C (John, November 26th 2026): copying Message home's message and link on a computer, where Copy puts
// only the picture on the clipboard. The saved Reading to Paddington board at 6.24pm on November 17th 2026, the arrival
// board made up from it (illustration only); the 6.11pm chosen. Each clipboard read back. vite preview on 4620.
// Usage: node design/previews/follow/copy.mjs <out-dir>
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-1824-RDG-PAD.json', import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const plat = ['9', '11', '12', '10', '14', '8', '11A', '9', '12', '10', '13', '11', '9', '10', '12', '11']
const body = JSON.stringify({ ...snap, arrivals: snap.services.map((x, i) => ({ ...x, platform: plat[i % plat.length] })) })
const clockAt = `{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`
const b = await chromium.launch()
for (const scheme of ['light', 'dark']) {
  for (const mode of ['B', 'C']) {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2, permissions: ['clipboard-read', 'clipboard-write'] })
    const p = await ctx.newPage()
    const errors = []
    p.on('pageerror', (e) => errors.push(e.message))
    await p.addInitScript(clockAt)
    await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body }))
    await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
    await p.goto(`http://localhost:4620/?copy=${mode}#RDG-PAD`)
    await p.locator('.home summary').click()
    await p.locator('.home .cmine', { has: p.locator('b', { hasText: /^6\.11pm$/ }) }).first().click()
    const box = p.locator('.home .tap-reply')
    await box.scrollIntoViewIfNeeded()
    await box.screenshot({ path: `${out}/copy-${mode}-1-before-${scheme}.png` })
    await p.locator('.home .box-share button', { hasText: 'Copy the picture' }).click()
    await p.locator('.home .share-status', { hasText: 'Copied' }).first().waitFor()
    const pic = await p.evaluate(async () => (await navigator.clipboard.read())[0].types.join(','))
    await box.screenshot({ path: `${out}/copy-${mode}-2-picture-copied-${scheme}.png` })
    await p.locator('.home button', { hasText: 'Copy the message and link' }).click()
    await p.waitForTimeout(200)
    const words = await p.evaluate(() => navigator.clipboard.readText())
    await box.screenshot({ path: `${out}/copy-${mode}-3-words-copied-${scheme}.png` })
    const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    console.log(`${mode} ${scheme}: picture on the clipboard as ${pic}; then the words:\n  ${words.replace(/\n/g, '\n  ')}\n  sideways ${side}, errors ${errors.length}`)
    await ctx.close()
  }
}
await b.close()
