// The end of every page: the quote of the day, "About these figures" and the footer. The words
// were agreed with John at the mock-ups (O8, "agreed for now"; SPEC §8.16).
import { useState } from 'react'
import { quoteOfTheDay } from '../data/quotes.ts'
import { quoteShareText } from '../lib/sentences.ts'
import { deliverImage, quoteFileName, quoteImage } from '../lib/share.ts'
import { Icon } from './Icon.tsx'

export const INTRO = "Trainchecker tells you, in plain English, how the trains from one station to another are running: the next four hours, which platforms they're leaving from, how the last two hours went, and any engineering work before the end of the weekend. For journeys with no change of train, for now."

const ABOUT = [
  'Trainchecker looks at trains that go straight from one station to the other, with no change. “On time” means within three minutes of the timetable.',
  '“Good news” means at most one train in 10 is cancelled or more than five minutes late (or one train, when there are fewer than 20). “Be prepared” means the journey is badly disrupted, three or more trains are cancelled, or engineering work closes the line today. Anything in between is “a mixed bag”.',
  'The next four hours, the platforms and the last two hours come from National Rail’s live departure boards, fetched when you open the page. Disruption and engineering work come from National Rail’s list of incidents. The last week comes from National Rail’s record of how trains ran, fetched only when you ask, as it takes a while.',
  'Train information from National Rail, supplied by the Rail Delivery Group through the Rail Data Marketplace. Trainchecker isn’t connected with or endorsed by either. Times can change at short notice, so check with National Rail or your train company before you travel.',
]

/** The quote of the day (John's quotes.ts, unchanged; option C revised). Verse lines, written
 *  " / " in the file, on separate lines. Its small Share makes a picture of the quote. */
function QuoteCard() {
  const [now] = useState(() => new Date())
  const q = quoteOfTheDay(now)
  const [status, setStatus] = useState('')
  const share = async () => {
    setStatus('')
    const r = await deliverImage(quoteImage(q, now), quoteFileName(now), { title: 'Trainchecker: quote of the day', text: quoteShareText(q.author, now), url: `${location.origin}/` })
    setStatus(r === 'copied' ? 'Copied' : r === 'saved' ? 'Saved as a picture' : '')
  }
  const lines = q.text.split(' / ')
  return (
    <section className="qc2" aria-label="Quote of the day">
      <div className="qmark" aria-hidden="true">“</div>
      <div>
        <div className="card-kicker">Quote of the day</div>
        <p className="qt">{lines.map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</p>
        <p className="qby">— {q.author}, {q.source}</p>
      </div>
      <div className="qend">
        <div className="qmark" aria-hidden="true">”</div>
        <button type="button" className="qs2" aria-label="Share this quote" title="Share this quote" onClick={share}><Icon name="share" /><span>Share</span></button>
        <span className="qstatus" role="status">{status}</span>
      </div>
    </section>
  )
}

export function Tail({ about = true }: { about?: boolean }) {
  return (
    <>
      <QuoteCard />
      {about && (
        <section className="card about">
          <h3>About these figures</h3>
          {ABOUT.map((p) => <p key={p}>{p}</p>)}
        </section>
      )}
      <footer className="footer-notice">
        <p>The stations you choose are sent to Trainchecker’s server only to ask National Rail for the trains; they aren’t recorded. Your device, rather than the website, stores your recent journeys and light or dark mode, so the page opens the same way next time. We collect anonymous visit statistics (no cookies, no personal data) to see how the site is used.</p>
        <p>Trainchecker is a free-to-use personal project by John Baish. More free tools at{' '}
          <a href="https://www.baish.net/" target="_blank" rel="noopener noreferrer">www.baish.net</a>. Contact: workshop@baish.net</p>
      </footer>
    </>
  )
}
