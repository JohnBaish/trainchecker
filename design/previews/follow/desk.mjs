// Message home on a computer (John, November 26th 2026): no box or picture, the message and its link, "Copy this message".
// The saved Reading to Paddington board at 6.24pm on November 17th 2026, the arrival board made up from it (illustration
// only). Three trains at 1200px light and dark, each copied and the clipboard read back; then a phone (390px, touch) to
// see the box and Share are still there. vite preview on 4620.
// Usage: node design/previews/follow/desk.mjs <out-dir>
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
const TRAINS = [['on-its-way', '6.11pm'], ['not-left-late', '6.26pm'], ['arrived', '5.50pm']]
const b = await chromium.launch()
async function open(opts) {
  const ctx = await b.newContext(opts)
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(clockAt)
  await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body }))
  await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
  await p.goto('http://localhost:4620/#RDG-PAD')
  await p.locator('.home summary').click()
  return { ctx, p, errors }
}
const pick = (p, time) => p.locator('.home .cmine', { has: p.locator('b', { hasText: new RegExp(`^${time.replace('.', '\\.')}$`) }) }).first().click()
for (const scheme of ['light', 'dark']) {
  const { ctx, p, errors } = await open({ viewport: { width: 1200, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2, permissions: ['clipboard-read', 'clipboard-write'] })
  for (const [name, time] of TRAINS) {
    await pick(p, time)
    const reply = p.locator('.home .tap-reply')
    await reply.scrollIntoViewIfNeeded()
    const boxes = await p.locator('.home .home-box').count()
    await p.locator('.home .desk-message button', { hasText: 'Copy' }).click()
    await p.locator('.home .desk-message .share-status', { hasText: 'Copied' }).waitFor()
    const words = await p.evaluate(() => navigator.clipboard.readText())
    await reply.screenshot({ path: `${out}/desk-${name}-1200-${scheme}.png` })
    if (scheme === 'light') console.log(`${time}: box shown ${boxes}; copied:\n  ${words}`)
  }
  const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  console.log(`1200 ${scheme}: sideways ${side}, errors ${errors.length}`)
  await ctx.close()
}
{
  const { ctx, p, errors } = await open({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
  await pick(p, '6.11pm')
  const reply = p.locator('.home .tap-reply')
  await reply.scrollIntoViewIfNeeded()
  await reply.screenshot({ path: `${out}/desk-phone-unchanged-390-dark.png` })
  const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  console.log(`390 dark phone: box shown ${await p.locator('.home .home-box').count()}, message shown ${await p.locator('.home .desk-message').count()}, button "${(await p.locator('.home .box-share button', { hasText: 'Share' }).innerText()).trim()}", sideways ${side}, errors ${errors.length}`)
  await ctx.close()
}
await b.close()
