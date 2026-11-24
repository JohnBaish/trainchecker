// The two panels' share pictures, read back from the clipboard, on a saved board (preview on port 4620).
// Usage: node design/previews/next-hour/share-pics.mjs <snapshot> <outPrefix> <A|B|C>
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { trim } from '../../../api/live.ts'
const { chromium } = createRequire(import.meta.url)('playwright')
const [file, out, kind] = process.argv.slice(2)
const s = JSON.parse(readFileSync(new URL(`../../mockups/snapshots/${file}`, import.meta.url), 'utf8'))
const snap = trim(s.from, s.to, s.taken, s.boards.map((b) => b.board))
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
await p.addInitScript(`{ const T = ${Date.parse(s.taken)}; const D = Date; const off = T - D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])) } static now() { return D.now() + off } } }`)
await p.route('**/api/live?**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) }))
await p.route('**/api/days**', (r) => r.fulfill({ status: 503, body: '' }))
await p.goto(`http://localhost:4620/?share=${kind}#${s.from}-${s.to}`)
await p.waitForSelector('.grid', { timeout: 8000 })
await p.evaluate(() => document.fonts.ready)
const panels = p.locator('.grid > section')
for (const [i, name] of [[0, 'first'], [1, 'later']]) {
  const panel = panels.nth(i)
  const folds = panel.locator('details')
  const n = await folds.count()
  if (!n) { console.log(name, 'no fold'); continue }
  const fold = folds.nth(n - 1)
  await fold.locator('summary').click()
  const btn = fold.getByRole('button', { name: 'Copy these trains' })
  if (!(await btn.count())) { console.log(name, 'no share'); continue }
  await btn.click()
  await fold.locator('.share-status', { hasText: 'Copied' }).waitFor({ timeout: 10000 })
  const b64 = await p.evaluate(async () => {
    const items = await navigator.clipboard.read()
    const blob = await items[0].getType('image/png')
    const buf = new Uint8Array(await blob.arrayBuffer()); let t = ''; for (const x of buf) t += String.fromCharCode(x); return btoa(t)
  })
  writeFileSync(`${out}-${name}${name === 'later' ? '-' + kind : ''}.png`, Buffer.from(b64, 'base64'))
}
console.log(file, kind, 'fonts', await p.evaluate(() => [document.fonts.check('34px Figtree'), document.fonts.check('44px Caprasimo')]), 'errors', errors.length)
await b.close()
