// Stage 3: the quote of the day's Share picture (src/lib/share.ts quoteImage), for John to see
// before it's agreed: today's quote, the longest, and a verse. Needs `npm run dev -- --port 4621`.
const { chromium } = require('playwright')
const fs = require('fs')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage()
  await p.goto('http://localhost:4621/')
  await p.waitForSelector('.qc2')
  await p.evaluate(() => document.fonts.ready)
  const out = await p.evaluate(async () => {
    const { quoteImage } = await import('/src/lib/share.ts')
    const { QUOTES, quoteOfTheDay } = await import('/src/data/quotes.ts')
    const day = new Date('2026-11-17T12:00:00Z')
    const longest = QUOTES.reduce((a, q) => (q.text.length > a.text.length ? q : a))
    const verse = QUOTES.find((q) => q.text.includes('The time has come'))
    return [['today', quoteOfTheDay(day)], ['longest', longest], ['verse', verse]].map(([n, q]) => [n, quoteImage(q, day).toDataURL('image/png')])
  })
  for (const [n, url] of out) fs.writeFileSync(`${__dirname}/quote-picture-${n}.png`, Buffer.from(url.split(',')[1], 'base64'))
  await b.close()
  console.log('written')
})()
