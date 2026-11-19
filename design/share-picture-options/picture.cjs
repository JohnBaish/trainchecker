// Photographs options.html for each option and list (mock-ups, November 19th 2026). Needs a
// static server on the repo root: npx http-server or python3 -m http.server 4630 from the repo.
const { chromium } = require('playwright')
const path = require('node:path')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1080, height: 400 }, deviceScaleFactor: 1 })
  for (const [opt, list, v] of [['A', [0, 1, 2]], ['B', [0, 1, 2]], ['C', [0, 2]], ['B', [2], '1'], ['B', [2], '2'], ['B', [1], 's1'], ['B', [1], 's2']]) for (const i of list) {
    await p.goto(`http://localhost:4630/design/share-picture-options/options.html?opt=${opt}&i=${i}${v ? `&v=${v}` : ''}`)
    await p.waitForSelector('body[data-ready]')
    await p.evaluate(() => document.fonts.ready)
    const ok = await p.evaluate(() => [...document.fonts].filter((f) => f.status !== 'unloaded').every((f) => f.status === 'loaded') && document.fonts.check('52px Caprasimo') && document.fonts.check('700 34px Figtree'))
    if (!ok) { console.error('A brand font did not load'); process.exit(1) }
    const f = path.join(__dirname, `option-${opt}${v ? `${v}` : ''}-${['platforms-RDG-PAD', 'platforms-BTH-BRI', 'arrivals-RDG-PAD'][i]}.png`)
    await p.locator('#pic').screenshot({ path: f })
    console.log(path.basename(f))
  }
  await b.close()
})()
