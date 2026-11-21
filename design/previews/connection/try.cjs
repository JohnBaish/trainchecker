// "Check my connection" tried in Chromium against live trains (preview on port 4620):
// node design/previews/connection/try.cjs
const { chromium } = require('playwright')
const RUNS = [
  { name: 'TWY-RDG-OXF', hash: '#TWY-RDG', type: 'Oxf', pick: 'Oxford' },
  { name: 'MDG-RDG-PAD', hash: '#MDG-RDG', type: 'London Padd', pick: 'London Paddington' },
  { name: 'IVY-NTA-TQY', hash: '#IVY-NTA', type: 'Torq', pick: 'Torquay' },
]
const VIEWS = [
  { tag: '1200-light', viewport: { width: 1200, height: 860 }, colorScheme: 'light', deviceScaleFactor: 2 },
  { tag: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
]
;(async () => {
  const browser = await chromium.launch()
  for (const r of RUNS) for (const v of VIEWS) {
    const { tag, ...opts } = v
    const page = await (await browser.newContext(opts)).newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    await page.goto(`http://localhost:4620/${r.hash}`)
    const open = page.locator('.connect summary')
    await open.waitFor({ timeout: 20000 })
    await open.click()
    const box = page.locator('.connect input')
    await box.fill(r.type)
    await page.waitForTimeout(1500) // the stations served arrive
    await box.fill(r.type)
    const offered = await page.locator('.connect .suggest li').allInnerTexts()
    await page.locator('.connect .suggest li', { hasText: r.pick }).first().click()
    await page.getByRole('button', { name: 'Next' }).click()
    const mines = page.locator('.connect .cmine')
    const n = await mines.count()
    await mines.nth(Math.min(1, n - 1)).click()
    const t0 = Date.now()
    await page.locator('.connect .canswer').waitFor({ timeout: 20000 })
    const took = Date.now() - t0
    const text = await page.locator('.connect .canswer').innerText()
    const chips = await page.locator('.connect .chip').allInnerTexts()
    const side = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    const small = await page.evaluate(() => [...document.querySelectorAll('.connect button, .connect input')].filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.className + ' ' + Math.round(e.getBoundingClientRect().height)))
    await page.locator('.connect').screenshot({ path: `${r.name}-${tag}.png` })
    console.log(`\n${r.name} ${tag}: trains offered ${n}; suggestions ${JSON.stringify(offered)}; answer in ${took} ms; sideways ${side}; errors ${errors.length}${errors.length ? ' ' + errors.join(' | ') : ''}${tag.startsWith('390') ? '; under 44px: ' + JSON.stringify(small) : ''}\n  ${text}\n  chips: ${chips.join(' · ')}`)
    if (chips.length > 1 && tag.startsWith('1200')) {
      await page.locator('.connect .chip').first().click()
      console.log('  first chip: ' + (await page.locator('.connect .canswer').innerText()))
    }
    // A change of journey leaves one Connections card, folded, for the new journey (a duplicate key
    // once left the old panel at the top of the page: John, November 21st 2026).
    await page.evaluate(() => { location.hash = '#RDG-PAD' })
    await page.locator('.strip h2', { hasText: 'Reading to London Paddington' }).waitFor()
    await page.locator('.connect summary', { hasText: 'London Paddington' }).waitFor({ timeout: 20000 })
    console.log('  after a change of journey: cards ' + (await page.locator('.connect').count()) + ', open ' + (await page.locator('.connect details[open]').count()) + ', ' + JSON.stringify(await page.locator('.connect summary').allInnerTexts()))
    await page.context().close()
  }
  await browser.close()
})()
