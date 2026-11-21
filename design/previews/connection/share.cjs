// The Connections share picture, read back from the clipboard (preview on port 4620):
// node design/previews/connection/share.cjs
const { chromium } = require('playwright')
const fs = require('fs')
;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 860 }, permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('http://localhost:4620/#MDG-RDG')
  await page.locator('.connect summary').click()
  await page.locator('.connect input').fill('London Paddington')
  await page.getByRole('button', { name: 'Next' }).click()
  await page.locator('.connect .cmine').first().click()
  await page.locator('.connect .canswer').waitFor({ timeout: 20000 })
  // An Elizabeth Line train, if the row has one that isn't cancelled.
  const eliz = page.locator('.connect .chip', { hasText: 'Elizabeth Line' }).filter({ hasNotText: 'cancelled' })
  if (await eliz.count()) await eliz.first().click()
  console.log(await page.locator('.connect .canswer').innerText())
  await document_fonts(page)
  await page.getByRole('button', { name: 'Copy this answer' }).click()
  await page.locator('.connect .share-status', { hasText: 'Copied' }).waitFor({ timeout: 10000 })
  const b64 = await page.evaluate(async () => {
    const items = await navigator.clipboard.read()
    const blob = await items[0].getType('image/png')
    const buf = new Uint8Array(await blob.arrayBuffer())
    let s = ''; for (const x of buf) s += String.fromCharCode(x)
    return btoa(s)
  })
  fs.writeFileSync('share-picture.png', Buffer.from(b64, 'base64'))
  console.log('picture saved; fonts', await page.evaluate(() => [document.fonts.check('34px Figtree'), document.fonts.check('44px Caprasimo')]), 'errors', errors.length)
  await page.locator('.connect').screenshot({ path: 'connections-paddington-1200.png' })
  await browser.close()
})()
async function document_fonts(page) { await page.evaluate(() => document.fonts.ready) }
