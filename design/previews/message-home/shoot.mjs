// "Message home" (John, November 26th 2026) on the saved rush-hour board, Reading to Paddington at 6.24pm on
// November 17th 2026, the page's clock set to then. The arrival board (and so the platforms at Paddington) is made
// up from the departures (ILLUSTRATION ONLY). Each kind of train chosen in turn; the box photographed, and on a
// computer the share picture copied and read back from the clipboard. vite preview on 4620.
// Usage: node design/previews/message-home/shoot.mjs <out-dir>
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-1824-RDG-PAD.json', import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const plat = ['9', '11', '12', '10', '14', '8', '11A', '9', '12', '10', '13', '11', '9', '10', '12', '11']
const body = JSON.stringify({ ...snap, arrivals: snap.services.map((x, i) => ({ ...x, platform: plat[i % plat.length] })) })
const TRAINS = [['on-time', '6.05pm'], ['late', '6.18pm'], ['planned', '6.28pm'], ['arrived', '5.50pm']]
const VIEWS = [
  { tag: '1200-light', viewport: { width: 1200, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2, permissions: ['clipboard-read', 'clipboard-write'] },
  { tag: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
]
const b = await chromium.launch()
for (const v of VIEWS) {
  const { tag, ...opts } = v
  const ctx = await b.newContext(opts)
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
  // On a computer, catch the share sheet's words (navigator.share isn't there, so Copy is used; the words are logged).
  await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body }))
  await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
  await p.goto('http://localhost:4620/#RDG-PAD')
  await p.locator('.home').waitFor()
  await p.locator('.exits:not(.home)').waitFor()
  const order = await p.locator('main section.card h3').allInnerTexts()
  console.log(`${tag} order: ${order.join(' → ')}`)
  await p.locator('.home summary').click()
  await p.locator('.home').screenshot({ path: `${out}/fold-${tag}.png` })
  for (const [name, time] of TRAINS) {
    await p.locator('.home .cmine', { has: p.locator('b', { hasText: new RegExp(`^${time.replace('.', '\\.')}$`) }) }).first().click()
    await p.waitForTimeout(300)
    const row = await p.locator('.home .home-box').innerText()
    console.log(`  ${name} (${time}): ${row.replace(/\n+/g, ' | ')}`)
    await p.locator('.home .tap-reply').screenshot({ path: `${out}/box-${name}-${tag}.png` })
    if (tag === '1200-light') {
      // The words and title the share sends: read from the function the button calls, via the clipboard picture.
      await p.locator('.home .box-share button').click()
      await p.locator('.home .share-status', { hasText: 'Copied' }).waitFor({ timeout: 8000 })
      const png = await p.evaluate(async () => {
        const items = await navigator.clipboard.read()
        const blob = await items[0].getType('image/png')
        const buf = new Uint8Array(await blob.arrayBuffer())
        let bin = ''; for (const c of buf) bin += String.fromCharCode(c)
        return btoa(bin)
      }).catch((e) => 'ERR ' + e.message)
      if (png.startsWith('ERR')) console.log('   picture:', png)
      else { writeFileSync(`${out}/picture-${name}.png`, Buffer.from(png, 'base64')); console.log(`   picture copied (${Math.round(png.length * 0.75 / 1024)} KB), status: ${await p.locator('.home .share-status').innerText()}`) }
    }
  }
  const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  const h = await p.locator('.home .box-share button').evaluate((e) => e.getBoundingClientRect().height)
  console.log(`  sideways ${side}, share button ${Math.round(h)}px, errors ${errors.length}${errors.length ? ' ' + errors.join(' | ') : ''}`)
  await ctx.close()
}
await b.close()
