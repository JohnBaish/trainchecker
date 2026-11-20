import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '/home/user/trainchecker/api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const S = process.argv[2]
const b = await chromium.launch()
const s = JSON.parse(readFileSync('/home/user/trainchecker/design/mockups/snapshots/20261117-1824-RDG-PAD.json', 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((x) => x.board))
const out = {}
for (const opt of ['now', 'A', 'B', 'C']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'dark', deviceScaleFactor: 2 })
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
  await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
  await p.goto(`http://localhost:4620/#${s.from}-${s.to}`)
  await p.waitForSelector('.verdict', { timeout: 8000 })
  await p.locator('details.arrivals-fold summary').click()
  const info = await p.evaluate((opt) => {
    const W = ['zero','one','two','three','four','five','six','seven','eight','nine']
    const fit = []
    for (const row of document.querySelectorAll('.arrivals-fold .brow')) {
      const late = row.querySelector('.blate'); if (!late) continue
      const k = W.indexOf(late.textContent.match(/running (\w+) minutes? late/)[1])
      const t = row.querySelector('.bt').textContent.match(/(\d+)\.(\d\d)/)
      let m = (+t[1]) * 60 + (+t[2]) - k; const due = `${Math.floor(m / 60)}.${String(m % 60).padStart(2, '0')}`
      const mins = `${W[k] ?? k} ${k === 1 ? 'minute' : 'minutes'}`
      if (opt === 'A') late.textContent = `was due in at ${due}`
      if (opt === 'B') late.textContent = `${mins} later than planned`
      if (opt === 'C') {
        late.remove()
        const bt = row.querySelector('.bt'); const n = document.createElement('span')
        n.textContent = `${mins} late`; n.style.cssText = 'display:block;font-size:13px;line-height:1.25;font-weight:600;color:var(--color-accent-700);margin-top:2px'
        bt.appendChild(n); bt.style.whiteSpace = 'normal'
      }
    }
    for (const row of document.querySelectorAll('.arrivals-fold .brow')) {
      const e = row.querySelector('.blate') ?? row.querySelector('.bt span')
      if (e) fit.push(`${e.textContent}: ${Math.round(e.getBoundingClientRect().height)}px tall, ${e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > row.getBoundingClientRect().right ? 'overflows' : 'ok'}`)
    }
    return { fit, wide: document.documentElement.scrollWidth > innerWidth }
  }, opt)
  console.log(opt, 'errors', errs.length, 'sideways', info.wide, info.fit.join(' | '))
  await p.locator('.arrivals-fold .board').screenshot({ path: `${S}/m-${opt}.png` })
  out[opt] = readFileSync(`${S}/m-${opt}.png`).toString('base64')
  await ctx.close()
}
const cap = { now: 'Now on the branch: “running two minutes late”', A: 'A · “was due in at 6.23”', B: 'B · “two minutes later than planned”', C: 'C · the lateness under the big time' }
const font = (f) => `url(file:///home/user/trainchecker/node_modules/@fontsource/figtree/files/figtree-latin-${f}-normal.woff2)`
writeFileSync(`${S}/mock.html`, `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:F;font-weight:600;src:${font(600)}}@font-face{font-family:F;font-weight:400;src:${font(400)}}body{margin:0;background:#1c1a18;font-family:F;color:#ece3d4;padding:28px}h1{font-size:22px;font-weight:600;margin:0 0 4px}p{margin:0 0 22px;color:#b9ae9e;font-size:15px}.g{display:grid;grid-template-columns:repeat(4,400px);gap:26px}h2{font-size:16px;font-weight:600;margin:0 0 10px;color:#ea9862}img{width:400px;display:block;background:#36322d;border-radius:14px;padding:14px;box-sizing:border-box}</style>
<h1>Arrivals: three ways to show the big time already includes the lateness</h1><p>Reading to London Paddington, the saved board from 6.24pm on November 17th, at phone width (390px), dark. Illustration only: the wording is mocked up on the real board.</p>
<div class="g">${['now','A','B','C'].map((k) => `<div><h2>${cap[k]}</h2><img src="data:image/png;base64,${out[k]}"></div>`).join('')}</div>`)
const ctx = await b.newContext({ viewport: { width: 1740, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage(); await p.goto(`file://${S}/mock.html`); await p.evaluate(() => document.fonts.ready)
console.log('fonts', await p.evaluate(() => [...document.fonts].map((f) => f.weight + ':' + f.status).join(' ')))
await p.screenshot({ path: `${S}/arrivals-options.png`, fullPage: true })
await b.close()
