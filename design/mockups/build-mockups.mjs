// Stage 2 mock-ups: puts the real snapshots (taken by fetch-snapshot.mjs, and the incidents
// feed) through analyse.mjs, sentences.mjs and incidents.mjs, and into page.src.html.
// Writes mockups.html (a complete page, for the repo and for checking in a browser) and, in
// the folder given, the same page without its <html>/<head> wrapper, for publishing as a
// private page (which adds its own). Usage: node build-mockups.mjs [<folder>]
import { readFileSync, writeFileSync } from 'node:fs'
import { analyse } from './analyse.mjs'
import { verdict, nextFour, platforms, lastTwoLines, shareWords, share, dayName, t12 } from './sentences.mjs'
import { readIncidents, forJourney } from './incidents.mjs'

const here = (f) => new URL(f, import.meta.url)
const STAMP = { 'KGX-YRK': '1947' }
const snap = (id) => JSON.parse(readFileSync(here(`./snapshots/20261117-${STAMP[id] || '1824'}-${id}.json`), 'utf8'))
const incidents = readIncidents(here('./snapshots/20261117-incidents.xml.gz').pathname)

const JOURNEYS = [
  ['PAD-RDG', '1. Good news'],
  ['RDG-PAD', '2. Good news, however…'],
  ['BTH-BRI', "3. It's a mixed bag"],
  ['MAN-MIA', '4. Be prepared'],
  ['RDG-CBG', '5. No direct train'],
  ['KGX-YRK', '6. A long journey (7.47pm)'],
]

// Hours offered for the last week: 5am to midnight (recommendation §2.6).
const HOURS = []
for (let h = 5; h < 24; h++) HOURS.push(`${t12(`${String(h).padStart(2, '0')}:00`)} to ${t12(`${String((h + 1) % 24).padStart(2, '0')}:00`)}`)

// The one real last-week figure: Reading to London Paddington, trains leaving 5pm to 6pm on
// the five weekdays November 10th to 16th 2026: 25 of 56 within 3 minutes (history service,
// stage 1, design/data-trial-2026-11-17.md §6.4).
const HISTORY_RESULT = {
  'RDG-PAD': {
    hour: '5pm to 6pm',
    text: `On the five weekdays from Tuesday November 10th to Monday November 16th, ${share(25, 56).bare} of the 56 trains that left Reading between 5pm and 6pm reached London Paddington within three minutes of the timetable.`,
  },
}

const journeys = JOURNEYS.map(([id, tab]) => {
  const a = analyse(snap(id))
  const [o, d] = id.split('-')
  const elizabeth = [...a.ahead, ...a.past].some((s) => /Elizabeth/i.test(s.operator))
  const res = HISTORY_RESULT[id]
  return {
    id, tab, from: a.from, to: a.to,
    swapId: JOURNEYS.some(([x]) => x === `${d}-${o}`) ? `${d}-${o}` : id,
    verdict: verdict(a), next: nextFour(a), platforms: platforms(a),
    lastTwo: a.verdict === 'none' ? null : lastTwoLines(a).join(' '), lastTwoInTop: a.worse,
    share: shareWords(a, { time: t12(a.now), date: dayName(new Date(a.taken)).replace(/^\w+ /, '') }),
    dateLine: dayName(new Date(a.taken)), timeLabel: t12(a.now),
    ahead: a.verdict === 'none' ? { items: [] } : forJourney(incidents, a),
    history: a.verdict === 'none' ? null : {
      intro: "If you'd like to see the reliability history of trains making this journey over the last week, choose an hour of departure and the results should load in under a minute.",
      hours: HOURS, chosenLabel: res ? res.hour : '6pm to 7pm', kindPlural: 'weekday trains',
      kindLine: 'Today is a weekday, so this looks at the weekdays of the last week (Saturdays and Sundays have their own timetables).',
      result: res ? res.text : null,
      note: elizabeth ? "Some Elizabeth line trains may be missing from these figures: National Rail's history often leaves them out when Paddington or Bond Street is one end of the journey." : null,
    },
  }
})

const taken = new Date(snap('PAD-RDG').taken)
const timeLabel = t12(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false }).format(taken))
const data = {
  taken: taken.toISOString(), dateLine: dayName(taken), dateShort: dayName(taken).replace(/^\w+ /, ''), timeLabel,
  takenLine: `${timeLabel} on ${dayName(taken)} 2026`,
  journeys,
  recent: [['RDG-PAD', 'Reading to London Paddington'], ['BTH-BRI', 'Bath Spa to Bristol Temple Meads'], ['MAN-MIA', 'Manchester Piccadilly to Manchester Airport']].map(([id, label]) => ({ id, label })),
  intro: "Trainchecker tells you, in plain English, how the trains from one station to another are running: the next four hours, which platforms they're leaving from, how the last two hours went, and any engineering work before the end of the weekend. For journeys with no change of train, for now.",
  about: [
    "Trainchecker looks at trains that go straight from one station to the other, with no change. “On time” means within 3 minutes of the timetable.",
    "“Good news” means at most one train in 10 is cancelled or more than 5 minutes late (or one train, when there are fewer than 20). “Be prepared” means the journey is badly disrupted, three or more trains are cancelled, or engineering work closes the line today. Anything in between is “a mixed bag”.",
    "The next four hours, the platforms and the last two hours come from National Rail’s live departure boards, fetched when you open the page. Disruption and engineering work come from National Rail’s list of incidents. The last week comes from National Rail’s record of how trains ran, fetched only when you ask, as it takes a while.",
    "Train information from National Rail, supplied by the Rail Delivery Group through the Rail Data Marketplace. Trainchecker isn’t connected with or endorsed by either. Times can change at short notice, so check with National Rail or your train company before you travel.",
  ],
  footer: [
    "The stations you choose are sent to Trainchecker’s server only to ask National Rail for the trains; they aren’t recorded. Your device, rather than the website, stores your recent journeys and light or dark mode, so the page opens the same way next time. We collect anonymous visit statistics (no cookies, no personal data) to see how the site is used.",
    'Trainchecker is a free-to-use personal project by John Baish. More free tools at www.baish.net. Contact: workshop@baish.net',
  ],
}

const json = JSON.stringify(data).replace(/</g, '\\u003c')
const page = readFileSync(here('./page.src.html'), 'utf8').replace('/*MOCK*/null', json)
writeFileSync(here('./mockups.html'), `<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${page}\n</body>\n</html>\n`)
if (process.argv[2]) writeFileSync(`${process.argv[2]}/trainchecker-mockups.html`, page)
console.log(`written: ${journeys.length} journeys, ${(json.length / 1024).toFixed(0)} KB of data`)
