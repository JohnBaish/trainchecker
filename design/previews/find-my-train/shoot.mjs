// "Find my train from my location": each answer, on real boards saved on November 17th and 21st
// 2026, with the page's clock set to when each was saved and a pretend location given to the
// browser (vite preview on 4620). For Exits, the arrival board (which these saved boards predate)
// and the platform at B are made up from the departures (ILLUSTRATION ONLY): without them Exits
// leaves out trains that end at B. This shows the button, not the platform lookup.
// Usage: node design/previews/find-my-train/shoot.mjs <out-dir>
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { places, trimConnect } from '../../../api/connect.ts'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const out = process.argv[2] || '.'
const snaps = new URL('../../mockups/snapshots/', import.meta.url)
const pos = JSON.parse(readFileSync(new URL('../../../src/data/station-pos.json', import.meta.url), 'utf8'))
const board = (f) => { const s = JSON.parse(readFileSync(new URL(f, snaps), 'utf8')); return { snap: trim(s.from, s.to, s.taken, s.boards.map((b) => b.board)), taken: s.taken } }
const at = (crs) => ({ latitude: pos[crs][0], longitude: pos[crs][1], accuracy: 30 })
const mid = (p, q, f = 0.5) => ({ latitude: pos[p][0] + f * (pos[q][0] - pos[p][0]), longitude: pos[p][1] + f * (pos[q][1] - pos[p][1]), accuracy: 30 })

// geo: a position, 'denied' (permission refused) or 'lost' (the device can't find itself).
const ONLY = process.argv[3]
const EXITS = [
  { name: 'idle', file: '20261117-1947-EUS-MAN.json', geo: at('MAC'), tap: false },
  { name: 'one', file: '20261117-1947-EUS-MAN.json', geo: at('MAC') },
  { name: 'two', file: '20261117-2059-RDG-PAD.json', geo: mid('MAI', 'SLO', 0.6) },
  { name: 'atA', file: '20261117-2059-RDG-PAD.json', geo: at('RDG') },
  { name: 'far', file: '20261117-2059-RDG-PAD.json', geo: at('BHM') },
  { name: 'none', file: '20261117-1947-PAD-PLY.json', geo: at('EXD') },
  { name: 'denied', file: '20261117-2059-RDG-PAD.json', geo: 'denied' },
  { name: 'lost', file: '20261117-2059-RDG-PAD.json', geo: 'lost' },
]
const VIEWS = [
  { tag: '390-light', viewport: { width: 390, height: 844 }, colorScheme: 'light', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  { tag: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  { tag: '1200-light', viewport: { width: 1200, height: 900 }, colorScheme: 'light', deviceScaleFactor: 2 },
]

async function page(b, view, taken, geo) {
  const { tag, ...opts } = view
  const ctx = await b.newContext({ ...opts, ...(typeof geo === 'object' ? { geolocation: geo, permissions: ['geolocation'] } : {}) })
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
  if (geo === 'denied') await p.addInitScript(() => { navigator.geolocation.getCurrentPosition = (_ok, bad) => setTimeout(() => bad({ code: 1, PERMISSION_DENIED: 1 }), 200) })
  if (geo === 'lost') await p.addInitScript(() => { navigator.geolocation.getCurrentPosition = (_ok, bad) => setTimeout(() => bad({ code: 2, PERMISSION_DENIED: 1 }), 200) })
  await p.route('**/api/days**', (q) => q.fulfill({ status: 503, body: '' }))
  return { ctx, p, errors }
}
const report = async (p, errors, label, sel) => {
  const said = await p.locator(`${sel} .findme`).innerText().catch(() => '(no button)')
  const marked = await p.locator(`${sel} .cmine.near, ${sel} .cmine.on`).allInnerTexts()
  const side = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  const h = await p.locator(`${sel} .findme .btn`).evaluate((e) => e.getBoundingClientRect().height).catch(() => 0)
  console.log(`${label}: sideways ${side}, button ${Math.round(h)}px, errors ${errors.length}${errors.length ? ' ' + errors.join(' | ') : ''}\n  ${said.replace(/\n/g, ' / ')}\n  marked: ${marked.map((m) => m.replace(/\n/g, ' ')).join(' ; ') || 'none'}`)
}

const b = await chromium.launch()
for (const r of ONLY === 'connections' ? [] : EXITS) for (const v of VIEWS) {
  if (v.tag !== '390-light' && !['idle', 'one', 'two'].includes(r.name)) continue
  const { snap, taken } = board(r.file)
  const { ctx, p, errors } = await page(b, v, taken, r.geo)
  const withArr = { ...snap, arrivals: snap.services.map((x) => ({ ...x, platform: '9' })) }
  await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(withArr) }))
  await p.route('**/api/connect?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ arrPlatform: '9' }) }))
  await p.goto(`http://localhost:4620/#${snap.from}-${snap.to}`)
  await p.locator('.exits summary').click()
  if (r.tap !== false) {
    await p.locator('.exits .findme .btn').click()
    await p.locator('.exits .findme-said').waitFor({ timeout: 8000 })
    await p.waitForTimeout(600)
  }
  await report(p, errors, `exits ${r.name} ${v.tag}`, '.exits')
  await p.locator('.exits').screenshot({ path: `${out}/exits-${r.name}-${v.tag}.png` })
  await ctx.close()
}

// Connections: Twyford to Reading, changing for London Paddington, half way between Twyford and
// Reading. The boards were saved at 2.55pm on November 21st, before any of these trains had left
// Twyford (so the button rightly stays hidden then); the page's clock is set to 3.11pm, when the
// 3.07pm is on its way (ILLUSTRATION ONLY).
const dir = new URL('20261121-1455-connection/', snaps)
const read = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
const TAKEN = '2026-11-21T14:55:00Z'
const rdg = { locationName: 'Reading', trainServices: [0, 15, 30, 45, 60, 75, 90, 105].flatMap((o) => read(`RDG-w${o}.json`).trainServices || []) }
const toC = (bd, crs, name) => ({ locationName: bd.locationName, filterLocationName: name,
  trainServices: (bd.trainServices || []).filter((s) => (s.subsequentCallingPoints || []).some((g) => (g.callingPoint || []).some((c) => c.crs === crs))) })
const came = (bd, j) => { const ids = new Set((j.trainServices || []).map((s) => s.serviceID.slice(0, 8))); return { trainServices: (bd.trainServices || []).filter((s) => ids.has(s.serviceID.slice(0, 8))) } }
const journey = read('TWY-RDG.json')
const LATER = '2026-11-21T15:11:00Z'
const snap = trim('TWY', 'RDG', LATER, [journey])
for (const v of VIEWS) {
  for (const geo of [mid('TWY', 'RDG', 0.5)]) {
    const { ctx, p, errors } = await page(b, v, LATER, geo)
    await p.route('**/api/live?**', (q) => q.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
    await p.route('**/api/connect?**', (q) => {
      const u = new URL(q.request().url())
      const body = u.searchParams.get('to')
        ? trimConnect('RDG', 'PAD', TAKEN, [toC(rdg, 'PAD', 'London Paddington')], [came(rdg, journey)], u.searchParams.get('train'))
        : { taken: TAKEN, at: 'RDG', places: places([rdg]) }
      q.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
    await p.goto('http://localhost:4620/#TWY-RDG')
    await p.locator('.connect summary').click()
    const box = p.locator('.connect input')
    await box.fill('London Padd')
    await p.waitForTimeout(800)
    await box.fill('London Padd')
    await p.locator('.connect .suggest li', { hasText: 'London Paddington' }).first().click()
    await p.getByRole('button', { name: 'Next' }).click()
    await p.locator('.connect .findme .btn').click()
    await p.locator('.connect .findme-said').waitFor({ timeout: 8000 })
    await p.waitForTimeout(400)
    await report(p, errors, `connections ${v.tag}`, '.connect')
    await p.locator('.connect').screenshot({ path: `${out}/connections-two-${v.tag}.png` })
    // Then you choose the 3.07pm, as the two-train sentence asks.
    await p.locator('.connect .cmine', { hasText: '3.07pm' }).first().click()
    await p.locator('.connect .canswer').waitFor({ timeout: 8000 })
    await p.waitForTimeout(300)
    console.log('  after choosing the 3.07pm:', await p.locator('.connect .canswer').innerText())
    await p.locator('.connect').screenshot({ path: `${out}/connections-chosen-${v.tag}.png` })
    await ctx.close()
  }
}
await b.close()
