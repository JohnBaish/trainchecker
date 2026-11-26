import { Component, useEffect, useState, type ReactNode } from 'react'
import { parseHash, hashOf, type Journey } from './lib/route.ts'
import { Chooser } from './components/Chooser.tsx'
import { FollowView } from './components/FollowView.tsx'
import { followHash, parseFollow, type FollowLink } from './lib/follow.ts'
import { JourneyView } from './components/JourneyView.tsx'
import { INTRO, Tail } from './components/Tail.tsx'
import { ThemeSwitch } from './components/ThemeSwitch.tsx'

// The first visit (the station boxes and what Trainchecker does) and a journey's page, chosen by
// the address after "#" (#RDG-PAD), which browsers never send to the server.

/** The safety net (house style §5): if a page can't be shown, a message and a way back, rather
 *  than an empty page. Keyed by the journey, so a new one starts afresh. */
class SafetyNet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="card load-failed" role="alert">
        <p>Sorry, this page couldn't be shown. Choose another journey, or try again later.</p>
        <a className="btn btn-secondary" href="#">Choose again</a>
      </div>
    )
  }
}

export default function App() {
  const [journey, setJourney] = useState<Journey | null>(() => parseHash(location.hash))
  // "Follow my progress" (John, November 26th 2026): #RDG-PAD/follow/1805-10781475-20261126, one train's page.
  const [follow, setFollow] = useState<FollowLink | null>(() => parseFollow(location.hash))
  useEffect(() => {
    const onHash = () => {
      setJourney(parseHash(location.hash))
      setFollow(parseFollow(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return (
    <>
      <nav className="nav">
        <a className="nav-brand" href="#">Trainchecker</a>
        <ThemeSwitch />
      </nav>
      <main className="col screen">
        <SafetyNet key={follow ? followHash(follow) : journey ? hashOf(journey) : 'first'}>
          {follow ? <FollowView key={followHash(follow)} link={follow} /> : journey ? <JourneyView key={hashOf(journey)} journey={journey} /> : (
            <>
              <Chooser first />
              <p className="intro">{INTRO}</p>
            </>
          )}
        </SafetyNet>
        <Tail quote={!journey && !follow} />
      </main>
    </>
  )
}
