// Home Screen icon (apple-touch-icon) options for Trainchecker, made from public/favicon.svg.
// Run: node design/home-icon/icons.mjs  (writes option-*.png at 180x180, and home-screen.png)
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const here = path.dirname(fileURLToPath(import.meta.url))
const train = `<rect x="14" y="11" width="20" height="21" rx="5" fill="none" stroke="#201e1d" stroke-width="4.5"/><path d="M15 38 L19 33 M33 38 L29 33" stroke="#c67139" stroke-width="4.5" stroke-linecap="round"/>`
const opts = {
  // A: cream square, the train drawing large, no disc
  A: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#f5ead8"/><g transform="translate(24 24.5) scale(1.1) translate(-24 -24.5)">${train}</g></svg>`,
  // B: the favicon as it is (disc and ring) on the cream page colour
  B: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#f5ead8"/><circle cx="24" cy="24" r="21" fill="#f5ead8" stroke="#c67139" stroke-width="2.5"/>${train}</svg>`,
  // C: the favicon on the darker card colour, so the disc stands out
  C: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#ebddc5"/><circle cx="24" cy="24" r="20" fill="#f5ead8" stroke="#c67139" stroke-width="2.5"/>${train}</svg>`,
}
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 })
for (const [k, svg] of Object.entries(opts)) {
  await p.setContent(`<style>body{margin:0}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="180" height="180">`)
  await p.screenshot({ path: path.join(here, `option-${k}.png`) })
}
const fs = await import('node:fs')
const uri = Object.fromEntries(['A','B','C'].map(k => [k, 'data:image/png;base64,' + fs.readFileSync(path.join(here, `option-${k}.png`)).toString('base64')]))
// A mock Home Screen: each option at iPhone size (60pt, iOS rounds the corners), light and dark wallpaper
const tile = (k, bg) => `<div style="text-align:center;width:120px"><img src="${uri[k]}" style="width:120px;height:120px;border-radius:27px;display:block"><div style="color:#fff;font:500 22px -apple-system,Helvetica,Arial;margin-top:8px;text-shadow:0 1px 2px #0008">Trainchecker</div><div style="color:#fff;font:700 24px Arial;margin-top:4px">${k}</div></div>`
const row = bg => `<div style="display:flex;gap:56px;padding:40px 48px;background:${bg}">${['A','B','C'].map(k=>tile(k)).join('')}</div>`
const q = await b.newPage({ viewport: { width: 600, height: 520 }, deviceScaleFactor: 2 })
await q.setContent(`<style>body{margin:0}</style>${row('linear-gradient(#3b5b7a,#6a4a6e)')}${row('#111')}`)
await q.screenshot({ path: path.join(here, 'home-screen.png'), fullPage: true })
await b.close()
