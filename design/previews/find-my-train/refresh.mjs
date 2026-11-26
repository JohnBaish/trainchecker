// Keeping your place on a refresh (John, November 26th 2026): scroll to a section, open its fold, refresh while
// National Rail takes a moment to answer, and measure where the page lands. Saved board: Reading to Paddington,
// 6.24pm, November 17th 2026 (arrival board made up from the departures, ILLUSTRATION ONLY). vite preview on 4620.
// Usage: node design/previews/find-my-train/refresh.mjs <out-dir>
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-1824-RDG-PAD.json', import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const body = JSON.stringify({ ...snap, arrivals: snap.services.map((x) => ({ ...x, platform: '9' })) })
const b = await chromium.launch()
const where = (p, sel) => p.evaluate((sel) => Math.round(document.querySelector(sel).getBoundingClientRect().top), sel)
for (const v of [{ tag: '390-light', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  { tag: '1200-dark', viewport: { width: 1200, height: 900 }, colorScheme: 'dark', deviceScaleFactor: 2 }]) {
  for (const [name, sel, fold, nudge] of [['Exits', '.exits', '.exits summary', 40], ['Connections', '.connect', '.connect summary', 0], ['The last week', 'section.card:has(h3:text("The last week"))', null, 120]]) {
    const { tag, ...opts } = v
    const ctx = await b.newContext(opts)
    const p = await ctx.newPage()
    const errors = []
    p.on('pageerror', (e) => errors.push(e.message))
    await p.route('**/api/live?**', async (q) => { await new Promise((r) => setTimeout(r, 600)); q.fulfill({ status: 200, contentType: 'application/json', body }) })
    await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
    await p.goto('http://localhost:4620/#RDG-PAD')
    const el = p.locator(sel).first()
    await el.waitFor()
    if (fold) await p.locator(fold).click()
    await el.evaluate((e, n) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY + n), nudge)
    await p.waitForTimeout(400)
    const before = await el.evaluate((e) => Math.round(e.getBoundingClientRect().top))
    await p.reload()
    await el.waitFor()
    await p.waitForTimeout(2500)
    const after = await el.evaluate((e) => Math.round(e.getBoundingClientRect().top))
    const open = fold ? await p.locator(fold.replace(' summary', ' details')).evaluate((d) => d.open) : '-'
    const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    console.log(`${tag} ${name}: section top ${before}px before, ${after}px after the refresh; fold open again: ${open}; sideways ${side}; errors ${errors.length}`)
    if (name === 'Exits') await p.screenshot({ path: `${out}/refresh-exits-${tag}.png` })
    // A fresh visit (not a refresh) starts at the top.
    await p.goto('about:blank'); await p.goto('http://localhost:4620/#RDG-PAD'); await el.waitFor(); await p.waitForTimeout(1500)
    console.log(`   then a fresh visit: scrolled to ${await p.evaluate(() => Math.round(scrollY))}`)
    await ctx.close()
  }
}
await b.close()
