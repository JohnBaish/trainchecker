// Two trains at the same time (John, November 26th 2026: two "4.42pm"s from Reading in the train lists).
// The saved Reading to Paddington board of 8.59pm on November 17th 2026 has a fast and a slower 9.04pm; the
// page's clock is moved on to 9.06 or 9.08pm (the trains as the board saw them at 8.59), with a pretend
// location between Reading and Twyford where Find my train finds one or both. The arrival board and platforms
// are made up from the departures (ILLUSTRATION ONLY). Message home, Exits and Connections' lists photographed.
// vite preview on 4620. Usage: node design/previews/same-time/shoot.mjs <out-dir>
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const pos = JSON.parse(readFileSync(new URL('../../../src/data/station-pos.json', import.meta.url), 'utf8'))
const s = JSON.parse(readFileSync(new URL('../../mockups/snapshots/20261117-2059-RDG-PAD.json', import.meta.url), 'utf8'))
const near = (f) => ({ latitude: pos.RDG[0] + f * (pos.TWY[0] - pos.RDG[0]), longitude: pos.RDG[1] + f * (pos.TWY[1] - pos.RDG[1]), accuracy: 30 })
const CASES = [{ name: 'both', at: '21:08', geo: near(0.4) }, { name: 'one', at: '21:06', geo: near(0.2) }]
const VIEWS = [
  { tag: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  { tag: '1200-light', viewport: { width: 1200, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2 },
]
const b = await chromium.launch()
for (const c of CASES) for (const v of VIEWS) {
  const taken = `2026-11-17T${c.at}:00.000Z`
  const snap = { ...trim(s.from, s.to, s.taken, s.boards.map((x) => x.board)), taken }
  const body = JSON.stringify({ ...snap, arrivals: snap.services.map((x, i) => ({ ...x, platform: ['9', '11', '12'][i % 3] })) })
  const { tag, ...opts } = v
  const ctx = await b.newContext({ ...opts, geolocation: c.geo, permissions: ['geolocation'] })
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
  await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
  await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body }))
  await p.route('**/api/connect?**', (q) => q.fulfill({ status: 503, body: '' }))
  await p.goto('http://localhost:4620/#RDG-PAD')
  for (const [sel, label] of [['.home', 'message-home'], ['.exits:not(.home)', 'exits']]) {
    await p.locator(sel).waitFor()
    await p.locator(`${sel} summary`).first().click()
    await p.locator(`${sel} .findme .btn`).click()
    await p.locator(`${sel} .findme-said`).waitFor({ timeout: 8000 })
    await p.waitForTimeout(400)
    console.log(`${c.name} ${tag} ${label}: ${(await p.locator(`${sel} .findme-said`).innerText()).trim()}`)
    console.log('   marked: ' + (await p.locator(`${sel} .cmine.near, ${sel} .cmine.on`).allInnerTexts()).map((x) => x.replace(/\n/g, ' ')).join(' ; '))
    await p.locator(sel).screenshot({ path: `${out}/${label}-${c.name}-${tag}.png` })
  }
  // Connections' list (no change station needed to see the trains).
  await p.locator('.connect summary').first().click()
  const conn = await p.locator('.connect .cmine').allInnerTexts()
  console.log(`   connections: ${conn.filter((x) => /9\.04pm/.test(x)).map((x) => x.replace(/\n/g, ' ')).join(' ; ') || '(list not shown yet)'}`)
  const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  console.log(`   sideways ${side}, errors ${errors.length}${errors.length ? ' ' + errors.join(' | ') : ''}`)
  await ctx.close()
}
await b.close()
