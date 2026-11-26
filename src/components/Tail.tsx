// The end of every page: the quote of the day, "About these figures" and the footer. The words
// were agreed with John at the mock-ups (O8, "agreed for now"; SPEC §8.16).
import { useEffect, useState } from 'react'
import { quoteOfTheDay } from '../data/quotes.ts'
import { factShareText, quoteShareText } from '../lib/sentences.ts'
import { deliverImage, factFileName, factImage, quoteFileName, quoteImage } from '../lib/share.ts'
import { journeyFacts, pickFact, type PnData } from '../lib/passesNear.ts'
import { Icon } from './Icon.tsx'

export const INTRO = "Trainchecker tells you, in plain English, how the trains from one station to another are running: the next four hours, which platforms they're leaving from, how the last two hours went, any engineering work before the end of the weekend and, if you ask, how they ran over the last week. For journeys with no change of train, for now."

const ABOUT = [
  'Trainchecker looks at trains that go straight from one station to the other, with no change. “On time” means within three minutes of the timetable.',
  '“Good news” means at most one train in 10 is cancelled or more than five minutes late (or one train, when there are fewer than 20). “Be prepared” means the journey is badly disrupted, three or more trains are cancelled (and more than one in 20), or engineering work closes the line today. Anything in between is “a mixed bag”.',
  'The next four hours, the platforms and the last two hours come from National Rail’s live departure boards, and the arrivals, with the platforms trains come into, from its live arrival boards, both fetched when you open the page. Disruption and engineering work come from National Rail’s list of incidents. The last week comes from National Rail’s record of how trains ran, fetched only when you ask, as it takes a while.',
  'Train information from National Rail, supplied by the Rail Delivery Group through the Rail Data Marketplace. Trainchecker isn’t connected with or endorsed by either. Times can change at short notice, so check with National Rail or your train company before you travel.',
]

/** The quote of the day (John's quotes.ts, unchanged; option C revised). Verse lines, written
 *  " / " in the file, on separate lines. Its small Share makes a picture of the quote. */
export function QuoteCard() {
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

/** "Fact of the journey" (John, November 22nd 2026): laid out as the quote is, with no quotation
 *  marks or attribution and its own colour, just under the quote. One fact from the stretches the
 *  journey's train runs along, picked at random on each visit; nothing at all when none of them has
 *  one yet. Its Share makes a picture, as the quote's does. Sky blue (John's choice of three). */
export function FactCard({ from, to, fromName, toName, stops }: { from: string; to: string; fromName: string; toName: string; stops: string[] }) {
  const [fact, setFact] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const stopsKey = stops.join(',')
  useEffect(() => {
    let current = true
    import('../data/passes-near.json').then((m) => {
      if (!current) return
      const f = pickFact(journeyFacts(m.default as unknown as PnData, from, stopsKey ? stopsKey.split(',') : [], to))
      setFact(f ? f.text : null)
    }, () => {})
    return () => { current = false }
  }, [from, to, stopsKey])
  if (!fact) return null
  const share = async () => {
    setStatus('')
    const now = new Date()
    const r = await deliverImage(factImage(fact, fromName, toName, now), factFileName(now), { title: 'Trainchecker: fact of the journey', text: factShareText(fromName, toName), url: location.href })
    setStatus(r === 'copied' ? 'Copied' : r === 'saved' ? 'Saved as a picture' : '')
  }
  return (
    <section className="qc2 fact" aria-label="Fact of the journey">
      {/* Where the quote has its opening mark: left empty, so the two texts line up. */}
      <div aria-hidden="true"></div>
      <div>
        <div className="card-kicker">Fact of the journey</div>
        <p className="qt">{fact}</p>
      </div>
      <div className="qend">
        <button type="button" className="qs2" aria-label="Share this fact" title="Share this fact" onClick={share}><Icon name="share" /><span>Share</span></button>
        <span className="qstatus" role="status">{status}</span>
      </div>
    </section>
  )
}

/** On a journey's page the quote comes earlier, before "The last two hours" (John, November 17th
 *  2026, stage 4), so JourneyView shows it and `quote` is false. */
export function Tail({ about = true, quote = true }: { about?: boolean; quote?: boolean }) {
  return (
    <>
      {quote && <QuoteCard />}
      {about && (
        <section className="card about">
          <h3>About these figures</h3>
          {ABOUT.map((p) => <p key={p}>{p}</p>)}
          {/* The credit OpenStreetMap asks for; John's words (November 21st 2026). */}
          {/* Extended for Station exits (Claude's draft, November 22nd 2026). */}
          <p>The directions between platforms in the Connections section, and the ways out in the Station exits section, come from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>, with National Rail’s station maps for the larger stations.</p>
          {/* Fact of the journey (Claude's draft, with John's changes, November 22nd 2026). */}
          <p>The Fact of the Journey is something near one stretch of line between two stations on your journey, picked at random each time you visit. Left and right are as the train is going. Facing backwards? Look the other way. The stretches of line come from OpenStreetMap; the facts were checked against Historic England’s list of historic places, Wikipedia and other sources (contains Historic England data © Historic England 2026).</p>
          {/* Find my train from my location (Claude's draft, November 26th 2026). */}
          <p>Find my train from my location, in the Connections and Exits sections, uses your device’s location only when you tap it, and only on your device: it isn’t sent to Trainchecker or anyone else. It compares where you are with where each train should be by National Rail’s times, so it can only say which train you’re probably taking. The stations’ positions come from National Rail, and from OpenStreetMap where the two differ.</p>
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
