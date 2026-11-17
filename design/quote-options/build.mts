// Quote of the day: options A, B and C, with today's quote, the longest and a verse.
// Usage: node --experimental-strip-types build.mts  (writes options.html)
import { writeFileSync } from 'node:fs'
import { QUOTES, quoteOfTheDay } from '../../src/data/quotes.ts'
const today = quoteOfTheDay(new Date('2026-11-17T12:00:00Z'))
const longest = [...QUOTES].sort((a, b) => b.text.length - a.text.length)[0]
const verse = QUOTES.find((q) => q.text.startsWith('The Polar Bear'))!
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
// Verse lines are written with " / " in the file; shown here on separate lines (display only).
const lines = (s: string) => esc(s).split(' / ').join('<br>')
const share = '<button class="qshare"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></svg> Share this quote</button>'
const A = (q: any) => `<section class="card qa"><div class="card-kicker">Quote of the day</div><p class="qt">${lines(q.text)}</p><p class="qby">${esc(q.author)}, <i>${esc(q.source)}</i></p></section>`
const B = (q: any) => `<section class="qb"><div class="card-kicker">Quote of the day</div><p class="qt">“${lines(q.text)}”</p><p class="qby">${esc(q.author)} · ${esc(q.source)}</p></section>`
const C = (q: any) => `<section class="qc"><div class="qmark">“</div><div><div class="card-kicker">Quote of the day</div><p class="qt">${lines(q.text)}</p><p class="qby">— ${esc(q.author)}, ${esc(q.source)}</p>${share}</div></section>`
const smallShare = '<button class="qs2" aria-label="Share this quote" title="Share this quote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></svg><span>Share</span></button>'
const C2 = (q: any) => `<section class="qc2"><div class="qmark">“</div><div><div class="card-kicker">Quote of the day</div><p class="qt">${lines(q.text)}</p><p class="qby">— ${esc(q.author)}, ${esc(q.source)}</p></div><div class="qend"><div class="qmark">”</div>${smallShare}</div></section>`
const block = (name: string, desc: string, f: (q: any) => string) => `<div class="opt"><h2>${name}</h2><p class="desc">${desc}</p>${f(today)}<p class="also">With the longest quote:</p>${f(longest)}<p class="also">With a verse:</p>${f(verse)}</div>`
const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Quote of the day options</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:ital,wght@0,400;0,600;0,700;1,400&display=swap">
<style>
:root{--bg:#f5ead8;--surface:#ebddc5;--text:#201e1d;--muted:#645c50;--accent:#c67139;--accent700:#8c491a;--tint:#fff2eb;--divider:color-mix(in srgb,#201e1d 16%,transparent);--shadow:0 1px 2px color-mix(in srgb,#2e2b25 14%,transparent)}
:root[data-theme=dark]{color-scheme:dark;--bg:#24211e;--surface:#37332e;--text:#e8dfcf;--muted:#b0a593;--accent:#dd8a56;--accent700:#f2a573;--tint:#4a2a14;--divider:color-mix(in srgb,#e8dfcf 16%,transparent);--shadow:0 0 0 1px color-mix(in srgb,#e8dfcf 8%,transparent),0 4px 14px #0009}
:root[data-theme=dark] body{-webkit-font-smoothing:antialiased}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Figtree,sans-serif;font-size:15px;line-height:1.55}
main{max-width:1100px;margin:0 auto;padding:26px}
h1,h2{font-family:Caprasimo,serif;font-weight:400;margin:0 0 6px}h1{font-size:28px}h2{font-size:24px;margin-top:34px}
.desc{color:var(--muted);margin:0 0 14px}.also{color:var(--muted);font-size:12.5px;margin:18px 0 8px}
.card{background:var(--surface);border-radius:32px;padding:26px;box-shadow:var(--shadow)}
.card-kicker{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent700);font-weight:600}
/* A: a card like the page's others */
.qa .qt{font-size:17px;margin:8px 0 6px}.qa .qby{font-size:13px;color:var(--muted);margin:0}
/* B: no card; centred sign-off between hairlines, the quote in Caprasimo */
.qb{text-align:center;border-top:1px solid var(--divider);border-bottom:1px solid var(--divider);padding:26px 8%}
.qb .qt{font-family:Caprasimo,serif;font-size:22px;line-height:1.3;margin:10px 0 8px}.qb .qby{font-size:13px;color:var(--muted);margin:0}
/* C, revised */
.qc2{display:grid;grid-template-columns:56px 1fr 56px;gap:6px;background:var(--tint);border-radius:32px;padding:22px 14px 14px 18px;box-shadow:inset 6px 0 0 var(--accent)}
.qc2 .qt{font-size:18px;margin:6px 0 6px}.qc2 .qby{font-size:13px;color:var(--muted);margin:0 0 8px}
.qend{display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.qend .qmark{line-height:.55;margin-bottom:2px}
.qs2{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:44px;min-height:44px;padding:0;border:0;background:none;color:var(--muted);font:600 10px Figtree,sans-serif;letter-spacing:.04em;cursor:pointer}
.qs2 svg{width:14px;height:14px}.qs2:hover{color:var(--accent700)}
/* C: a tinted band with a large terracotta quotation mark, and a Share button */
.qc{display:grid;grid-template-columns:56px 1fr;gap:6px;background:var(--tint);border-radius:32px;padding:22px 26px 22px 18px;box-shadow:inset 6px 0 0 var(--accent)}
.qmark{font-family:Caprasimo,serif;font-size:76px;line-height:.9;color:var(--accent);text-align:center}
.qc .qt{font-size:18px;margin:6px 0 6px}.qc .qby{font-size:13px;color:var(--muted);margin:0 0 10px}
.qshare{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:8px 16px;border-radius:999px;border:1px solid var(--divider);background:transparent;color:var(--text);font-family:Caprasimo,serif;font-size:14px}
.qshare svg{width:15px;height:15px}
@media (max-width:720px){.qc2{grid-template-columns:30px 1fr 44px;padding:17px 8px 10px 12px}.qc2 .qt{font-size:16px}.qc2 .qmark{font-size:52px}main{padding:16px}.card{padding:17px}.qb{padding:20px 4px}.qb .qt{font-size:19px}.qc{grid-template-columns:34px 1fr;padding:17px 17px 17px 12px}.qmark{font-size:52px}.qa .qt{font-size:16px}.qc .qt{font-size:16px}}
</style></head><body><main>
<h1>Quote of the day: options</h1><p class="desc">Real quotes from quotes.ts: November 17th's (E. W. Hornung), the longest (Mark Twain) and a verse (Hilaire Belloc). Verse lines, written with " / " in the file, are shown on separate lines.</p>
${block('C, revised: a closing quotation mark, and a small Share beneath it', 'John chose C (November 17th); the closing mark matches the opening one, bottom right, with a small Share under it.', C2)}
${block('A. A card, like the rest of the page', 'The quote in the body font, the author and source beneath in grey, the source in italics.', A)}
${block('B. A centred sign-off, no card', 'Between two hairlines, the quote in Caprasimo (the heading font), the author and source beneath.', B)}
${block('C. A tinted band with a large quotation mark', 'Shown with a Share button, if you want one (it would make a picture of the quote).', C)}
</main></body></html>`
writeFileSync(new URL('./options.html', import.meta.url), html)
console.log('written')
