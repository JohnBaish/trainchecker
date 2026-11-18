const { chromium, devices } = require('playwright')
;(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage()
  await p.goto('http://localhost:4620/')
  const from = p.getByRole('combobox', { name: 'From' })
  await from.tap()
  for (const ch of 'Ivybridge') { await p.keyboard.type(ch); console.log(JSON.stringify(await from.inputValue()), (await p.locator('.suggest li').allInnerTexts()).map((x) => x.split('\n')[0]).slice(0, 3).join(', ') || '(none)') }
  await b.close()
})()
