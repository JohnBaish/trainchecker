// "Follow my progress" mock-ups (John, November 26th 2026) on the saved board, Reading to Paddington at 6.24pm on
// November 17th 2026, the page's clock set to then. The arrival board (and so the platforms at Paddington) is made
// up from the departures, and some trains are changed to show cases the board didn't have (marked "made up"):
// ILLUSTRATION ONLY. Each case: the train's page at 1200px light and 390px dark with touch (option B, John); then Message home's share on a phone, the words and link it sends caught. vite preview on 4620.
// Usage: node design/previews/follow/shoot.mjs <out-dir>
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-1824-RDG-PAD.json', import.meta.url), 'utf8'))
const plat = ['9', '11', '12', '10', '14', '8', '11A', '9', '12', '10', '13', '11', '9', '10', '12', '11']
const DAY = '20261117'

/** The board, with `change` applied to the train with this id (made up), and the arrival board made up from it. */
function body(id, change) {
  const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
  const services = snap.services.map((x) => (change && x.id.startsWith(id) ? { ...x, ...change } : x))
  return JSON.stringify({ ...snap, services, arrivals: services.map((x, i) => ({ ...x, platform: plat[i % plat.length] })) })
}
// [name, timetabled, id, what's made up (or null: as on the board), day of the link]
const CASES = [
  ['1-on-time-between-stops', '1811', '10781475', null],
  ['1-on-time-non-stop', '1805', '10802565', null],
  ['2-left-on-time-now-late', '1801', '10802401', null],
  ['3-left-late-still-as-late', '1818', '10802537', null],
  ['4-a-little-early', '1805', '10802565', { eta: '18:26' }],
  ['5-made-up-some-time', '1815', '10780583', { eta: '19:14' }],
  ['6-made-up-the-time', '1746', '10780561', null],
  ['7-later-still', '1815', '10780583', { eta: '19:21' }],
  ['9-not-left-yet', '1826', '10802460', null],
  ['10-delayed-no-time', '1832', '10802521', { etd: 'Delayed', eta: 'Delayed' }],
  ['11-arrived', '1750', '10802578', null],
  ['12-cancelled', '1833', '10781476', { cancelled: true, reason: 'This train has been cancelled because of a fault on a train' }],
  ['13-a-later-day', '1811', '10781475', null, '20261116'],
  ['14-not-on-the-boards', '1840', '12345678', null],
]
const VIEWS = [
  { tag: '1200-light', viewport: { width: 1200, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2 },
  { tag: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
]
const clockAt = `{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`
const b = await chromium.launch()
let problems = 0
for (const v of VIEWS) {
  const { tag, ...opts } = v
  const ctx = await b.newContext(opts)
  for (const [name, std, id, change, day] of CASES) {
    for (const mock of ['B']) {
      const p = await ctx.newPage()
      const errors = []
      p.on('pageerror', (e) => errors.push(e.message))
      await p.addInitScript(clockAt)
      await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body: body(id, change) }))
      await p.goto(`http://localhost:4620/#RDG-PAD/follow/${std}-${id}-${day ?? DAY}`)
      await p.locator('.follow, .follow-more').first().waitFor()
      const text = await p.locator('.follow p').first().innerText().catch(() => '(no box)')
      const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      if (side > 0 || errors.length) problems++
      if (tag === '1200-light' && mock === 'B') console.log(`${name}${change ? ' (made up)' : ''}: ${text}`)
      const shot = mock === 'B' ? `${out}/${name}-${tag}.png` : `${out}/${name}-A-${tag}.png`
      await p.screenshot({ path: shot, fullPage: false })
      if (side > 0 || errors.length) console.log(`  ${tag} ${mock}: sideways ${side}, errors ${errors.join(' | ')}`)
      await p.close()
    }
  }
  await ctx.close()
}

// Message home's share on a phone: the words and link sent (navigator.share caught).
const ctx = await b.newContext(VIEWS[1])
const p = await ctx.newPage()
await p.addInitScript(clockAt)
await p.addInitScript(`navigator.canShare = () => true; navigator.share = async (d) => { window.__sent = { title: d.title, text: d.text, url: d.url } }`)
await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body: body('x', null) }))
await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
await p.goto('http://localhost:4620/#RDG-PAD')
await p.locator('.home summary').click()
const sent = []
for (const time of ['6.11pm', '6.26pm', '5.50pm']) {
  await p.locator('.home .cmine', { has: p.locator('b', { hasText: new RegExp(`^${time.replace('.', '\\.')}$`) }) }).first().click()
  await p.locator('.home .box-share button').click()
  await p.waitForFunction(() => window.__sent)
  const w = await p.evaluate(() => { const w = window.__sent; window.__sent = null; return w })
  sent.push(`${time}: ${w.text}\n   ${w.url}`)
}
console.log('\nMessage home sends:\n' + sent.join('\n'))
writeFileSync(`${out}/message-home-sends.txt`, sent.join('\n') + '\n')
// Open the first link it sent, as the person receiving it would.
const first = sent[0].split('\n')[1].trim().replace(/^https?:\/\/[^/]+/, 'http://localhost:4620')
const q = await ctx.newPage()
await q.addInitScript(clockAt)
await q.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: body('x', null) }))
await q.goto(first)
console.log(`\nOpened: ${await q.locator('.follow p').first().innerText()}`)
await q.screenshot({ path: `${out}/opened-from-message-home-390-dark.png` })
await b.close()
console.log(`\nViews with sideways scroll or errors: ${problems}`)
