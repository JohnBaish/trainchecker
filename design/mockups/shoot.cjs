// Stage 2 mock-ups: checks every view in Chromium (errors, sideways scrolling, fonts, small
// tap targets) and takes pictures. Usage: node shoot.cjs <out folder> [scale] [only-ids,...]
const { chromium } = require('playwright')
const path = require('path')
const out = process.argv[2], scale = Number(process.argv[3] || 1), only = process.argv[4] ? process.argv[4].split(',') : null
const url = 'file://' + path.join(__dirname, 'mockups.html')
const SIZES = [['1200', { width: 1200, height: 900 }, false], ['390', { width: 390, height: 844 }, true], ['844x390', { width: 844, height: 390 }, true]]
const VIEWS = [['first', 'choose'], ['PAD-RDG', 'choose'], ['RDG-PAD', 'choose'], ['RDG-PAD', 'loading'], ['RDG-PAD', 'result'], ['BTH-BRI', 'choose'], ['MAN-MIA', 'choose'], ['RDG-CBG', 'choose'], ['KGX-YRK', 'choose']]
;(async () => {
  const browser = await chromium.launch()
  let problems = 0, n = 0
  for (const [sname, vp, touch] of SIZES) for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: scale, hasTouch: touch, isMobile: touch && vp.width < 500, colorScheme: theme })
    const page = await ctx.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
    for (const [j, h] of VIEWS) {
      const id = `${j}${h !== 'choose' ? '-' + h : ''}`
      if (only && !only.includes(id)) continue
      await page.goto(`${url}#${j};${h};device`)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(150)
      const r = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth, cw = document.documentElement.clientWidth
        const fonts = ['Caprasimo', 'Figtree'].every((f) => document.fonts.check(`16px ${f}`))
        const small = [...document.querySelectorAll('#page button, #page a, #page select, #page input, #page summary, .theme-switch')]
          .filter((e) => e.offsetParent).map((e) => [e, e.getBoundingClientRect()])
          .filter(([e, b]) => b.height < 44 && !(e.tagName === 'A' && e.closest('p, li')))
          .map(([e, b]) => `${e.tagName}:${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30)}(${Math.round(b.height)})`)
        return { sideways: sw > cw, fonts, small, theme: document.documentElement.dataset.theme }
      })
      const name = `${id}-${sname}-${theme}`
      const bad = errs.length || r.sideways || !r.fonts || r.theme !== theme || (touch && r.small.length)
      if (bad) { problems++; console.log(name, JSON.stringify({ errs, ...r })) }
      errs.length = 0
      await page.screenshot({ path: `${out}/${name}.png`, fullPage: true })
      n++
    }
    await ctx.close()
  }
  await browser.close()
  console.log(`${n} views, ${problems} with problems`)
})()
