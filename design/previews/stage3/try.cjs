// Stage 3: tries the page's controls against `vite preview` on port 4620 (live figures).
// Usage: node design/previews/stage3/try.cjs
const { chromium } = require('playwright')
const BASE = 'http://localhost:4620/'
const say = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) process.exitCode = 1 }

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } })
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const settled = () => page.waitForFunction(() => !document.querySelector('.dateline .spinner'), null, { timeout: 30000 })

  // Typing stations, choosing from the suggestions with the keyboard and the mouse.
  await page.goto(BASE)
  await page.getByLabel('From').fill('bath')
  say(await page.locator('.suggest li').first().innerText().then((t) => t.startsWith('Bath Spa')), 'suggestions for "bath" start with Bath Spa')
  await page.getByLabel('From').press('ArrowDown')
  await page.getByLabel('From').press('Enter')
  say((await page.getByLabel('From').inputValue()) === 'Bath Spa', 'arrow and Enter choose Bath Spa')
  await page.getByLabel('To').fill('bristol t')
  await page.locator('.suggest li', { hasText: 'Bristol Temple Meads' }).click()
  say((await page.getByLabel('To').inputValue()) === 'Bristol Temple Meads', 'a click chooses Bristol Temple Meads')
  await page.getByRole('button', { name: 'Swap the stations' }).click()
  say((await page.getByLabel('From').inputValue()) === 'Bristol Temple Meads', 'swap in the chooser')
  await page.getByRole('button', { name: 'Swap the stations' }).click()
  await page.getByRole('button', { name: 'Show trains' }).click()
  await settled()
  say(page.url().endsWith('#BTH-BRI'), 'Show trains opens #BTH-BRI')
  say(await page.locator('.verdict').isVisible(), 'a verdict is shown')

  // Nonsense in a box.
  await page.goto(BASE)
  await page.getByLabel('From').fill('Nowhere at all')
  await page.getByRole('button', { name: 'Show trains' }).click()
  say((await page.locator('.err').allInnerTexts()).join('|') === 'Choose a station from the list.|Type a station.', 'messages for a wrong and an empty box')

  // Recent journeys, Swap, Change, Check again, the fold.
  await page.goto(BASE)
  say((await page.locator('.recent .chip').allInnerTexts()).includes('Bath Spa to Bristol Temple Meads'), 'the journey is in Recent')
  await page.goto(BASE + '#RDG-PAD')
  await settled()
  await page.getByRole('link', { name: 'Swap' }).click()
  await page.waitForURL(/#PAD-RDG$/)
  await page.waitForFunction(() => document.querySelector('.strip h2')?.textContent === 'London Paddington to Reading' && document.querySelector('.verdict'), null, { timeout: 30000 }).catch(() => {})
  say(page.url().endsWith('#PAD-RDG') && (await page.locator('.strip h2').innerText()) === 'London Paddington to Reading', 'Swap opens the other way')
  await page.getByRole('button', { name: 'Change' }).click()
  say(await page.getByLabel('From').inputValue() === 'London Paddington', 'Change shows the boxes, filled in')
  await page.getByRole('button', { name: 'Check again' }).click()
  await settled()
  say(await page.locator('.verdict').isVisible(), 'Check again fetches afresh')
  await page.goto(BASE + '#MAN-MIA')
  await settled()
  const fold = page.locator('details.trains-fold summary')
  if (await fold.count()) {
    await fold.click()
    say(await page.locator('table.trains').isVisible(), 'the fold opens the list of trains')
  } else console.log('note: Manchester Airport had no trains to list just now')

  // Copy a link to this journey.
  await page.getByRole('button', { name: 'Copy a link to this journey' }).click()
  await page.waitForTimeout(300)
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  say(/^Here's how the trains from Manchester Piccadilly to Manchester Airport were looking at .* From Trainchecker\.\nhttp:\/\/localhost:4620\/#MAN-MIA$/.test(copied), `copied: ${copied.replace('\n', ' ⏎ ')}`)

  // The quote's picture, copied.
  await page.getByRole('button', { name: 'Share this quote' }).click()
  await page.waitForFunction(() => document.querySelector('.qstatus')?.textContent === 'Copied', null, { timeout: 5000 }).catch(() => {})
  say((await page.locator('.qstatus').innerText()) === 'Copied', 'the quote picture is copied')
  const img = await page.evaluate(async () => {
    const items = await navigator.clipboard.read()
    const b = await items[0].getType('image/png')
    const bmp = await createImageBitmap(b)
    return [bmp.width, bmp.height]
  })
  say(img[0] === 2400, `picture ${img[0]}×${img[1]}`)

  // The last week. This session holds one key at a time (now the live board's), so the history's
  // answers are the real ones it gave at 8.55pm for Reading to London Paddington, weekdays
  // November 10th to 16th: 5pm to 5.30pm and 5.30pm to 6pm (vite preview, both asked at once).
  const REAL = {
    '1700': { n: 26, w3: 8, w10: 21, w30: 26, w120: 26, dates: ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-16'], elizabeth: 1 },
    '1730': { n: 30, w3: 17, w10: 29, w30: 30, w120: 30, dates: ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-16'], elizabeth: 0 },
  }
  const asked = []
  await page.route('**/api/week?**', async (route) => {
    const q = new URL(route.request().url()).searchParams
    asked.push([...q].map(([k, v]) => `${k}=${v}`).join('&'))
    await new Promise((r) => setTimeout(r, 1500))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(REAL[q.get('start')]) })
  })
  await page.goto(BASE + '#RDG-PAD')
  await settled()
  await page.getByLabel('An hour of departure').selectOption('17')
  await page.getByRole('button', { name: 'Show the last week' }).click()
  say((await page.locator('.hist-result').innerText()) === 'Fetching weekday trains between 5pm and 6pm over the last week from National Rail. This usually takes less than a minute.', 'the loading line')
  await page.waitForSelector('.hist-result .big, .hist-failed', { timeout: 120000 })
  console.log('     asked: ' + asked.join('\n            '))
  console.log('     ' + (await page.locator('.hist-result').innerText()).replace(/\n+/g, '\n     '))
  say((await page.locator('.hist-result .big').innerText()) === 'On the five weekdays from Tuesday November 10th to Monday November 16th, about half of the 56 trains that left Reading between 5pm and 6pm reached London Paddington within three minutes of the timetable. Of the others, about three quarters were less than 10 minutes late, and the rest 10 to 30 minutes late.', 'the last week: the sentence for the hour')
  await page.screenshot({ path: `${__dirname}/last-week-result-1200.png`, clip: await page.locator('.sec.block').boundingBox() })
  await page.unroute('**/api/week?**')

  say(errors.length === 0, `no script errors ${errors.join(' | ')}`)
  await browser.close()
})()
