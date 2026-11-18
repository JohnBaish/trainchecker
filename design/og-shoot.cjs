// Remakes public/og-trainchecker.png from design/og-trainchecker.html (1200 by 630), and stops if
// either brand font didn't load (house style §7).
const { chromium } = require('playwright')
const path = require('node:path')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
  await p.goto('file://' + path.join(__dirname, 'og-trainchecker.html'))
  await p.evaluate(() => document.fonts.ready)
  const ok = await p.evaluate(() => document.fonts.check('72px Caprasimo') && document.fonts.check('30px Figtree') && [...document.fonts].every((f) => f.status === 'loaded'))
  if (!ok) { console.error('A brand font did not load'); process.exit(1) }
  await p.screenshot({ path: path.join(__dirname, '../public/og-trainchecker.png') })
  console.log('public/og-trainchecker.png made')
  await b.close()
})()
