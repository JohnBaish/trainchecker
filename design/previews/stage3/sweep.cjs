// Stage 3: checks and photographs the real page against `vite preview` on port 4620 (with the
// functions served by vite.config.ts, so the figures are National Rail's, live). Every view at
// 1200px, 390px with touch and 844×390 with touch, light and dark: no script errors, no
// sideways scrolling, both fonts loaded, everything tappable at least 44px on touch screens.
// Usage: node design/previews/stage3/sweep.cjs [shots]
const { chromium } = require('playwright')
const BASE = 'http://localhost:4620/'
const VIEWS = [['first', ''], ['RDG-PAD', '#RDG-PAD'], ['MAN-MIA', '#MAN-MIA'], ['BTH-BRI', '#BTH-BRI'], ['RDG-CBG', '#RDG-CBG'], ['unknown', '#XYZ-PAD']]
const SIZES = [['1200', { width: 1200, height: 900 }, false], ['390', { width: 390, height: 844 }, true], ['844x390', { width: 844, height: 390 }, true]]
const shots = process.argv[2] === 'shots'

;(async () => {
  const browser = await chromium.launch()
  let problems = 0
  for (const [sname, viewport, touch] of SIZES) for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch && viewport.width < 500, deviceScaleFactor: shots ? 2 : 1, colorScheme: theme })
    for (const [vname, hash] of VIEWS) {
      const page = await ctx.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      // Vercel's visit statistics script exists only on Vercel, and an unknown station is
      // meant to get a 404 from the live function; any other failed address counts.
      const expected = (u) => u.includes('/_vercel/insights/') || (vname === 'unknown' && u.includes('/api/live'))
      page.on('response', (r) => { if (r.status() >= 400 && !expected(r.url())) errors.push(`${r.status()} ${r.url()}`) })
      page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()) })
      await page.goto(BASE + hash)
      await page.waitForFunction(() => !document.querySelector('.dateline .spinner'), null, { timeout: 30000 })
      await page.evaluate(() => document.fonts.ready)
      const r = await page.evaluate((touch) => {
        const fonts = ['Caprasimo', 'Figtree'].filter((f) => !document.fonts.check(`16px ${f}`))
        const wide = document.documentElement.scrollWidth > window.innerWidth
        const small = touch ? [...document.querySelectorAll('button, a.btn, a.chip, select, input, summary')]
          .filter((e) => e.offsetParent !== null).map((e) => [e.textContent.trim().slice(0, 30) || e.getAttribute('aria-label'), Math.round(e.getBoundingClientRect().height)])
          .filter(([, h]) => h < 44) : []
        const text = document.body.innerText
        return { fonts, wide, small, bad: /undefined|NaN|\bnull\b/.test(text), theme: document.documentElement.dataset.theme || 'light' }
      }, touch)
      const issues = []
      if (errors.length) issues.push(`errors ${errors.join(' | ')}`)
      if (r.fonts.length) issues.push(`fonts missing ${r.fonts}`)
      if (r.wide) issues.push('sideways scroll')
      if (r.small.length) issues.push(`small ${JSON.stringify(r.small)}`)
      if (r.bad) issues.push('undefined/NaN/null in text')
      if (r.theme !== theme) issues.push(`theme ${r.theme}`)
      console.log(`${vname} ${sname} ${theme}: ${issues.length ? issues.join('; ') : 'ok'}`)
      problems += issues.length
      if (shots) await page.screenshot({ path: `${__dirname}/${vname}-${sname}-${theme}.png`, fullPage: true })
      await page.close()
    }
    await ctx.close()
  }
  await browser.close()
  console.log(problems ? `${problems} problems` : 'all clean')
  process.exit(problems ? 1 : 0)
})()
