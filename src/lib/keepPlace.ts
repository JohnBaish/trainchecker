// Keeping your place when the page is refreshed (John, November 26th 2026, option 2): the browser's
// own attempt lands somewhere unpredictable, as the trains arrive a moment after the page and every
// fold starts closed, so the page is shorter than it was (Chromium and Safari on an iPhone both).
//
// While a journey is showing, the page notes which section is at the top of the screen, how far
// down it you are, and which folds are open. After a refresh (and only a refresh: a new visit or
// another journey starts at the top), it opens those folds again and scrolls back to that section.
// The note is kept in the tab's own session storage: it stays on the device, goes when the tab is
// closed, and is never sent anywhere.
import { useEffect } from 'react'

type Place = { key: string; i: number; off: number; open: [string, number][] }
const store = (h: string) => `trainchecker-place-${h}`
/** How long after the trains arrive to keep trying (sections such as Exits load their own data). */
const TRY_FOR = 4000

const cards = () => [...document.querySelectorAll<HTMLElement>('main section.card')]
/** A section's name: its heading, or its class when it has none. */
const keyOf = (c: HTMLElement) => c.querySelector('h3')?.textContent?.trim() || c.className

function read(h: string): Place | null {
  try { const v = sessionStorage.getItem(store(h)); return v ? (JSON.parse(v) as Place) : null } catch { return null }
}

function save(h: string) {
  const cs = cards()
  const top = cs.find((c) => c.getBoundingClientRect().bottom > 8)
  if (!top) return
  const open: [string, number][] = []
  for (const c of cs) c.querySelectorAll('details').forEach((d, j) => { if (d.open) open.push([keyOf(c), j]) })
  try { sessionStorage.setItem(store(h), JSON.stringify({ key: keyOf(top), i: cs.indexOf(top), off: Math.round(-top.getBoundingClientRect().top), open })) } catch { /* private window: the browser's own behaviour */ }
}

const isReload = () => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'reload'

/** `ready`: the journey's trains are showing. */
export function useKeepPlace(hash: string, ready: boolean) {
  useEffect(() => {
    if (!ready) return
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    const place = isReload() ? read(hash) : null
    let restoring = !!place
    const started = Date.now()
    let found = 0
    const stop = () => { restoring = false }
    const tick = () => {
      if (!restoring || !place) return
      const cs = cards()
      for (const [k, j] of place.open) {
        const d = cs.find((c) => keyOf(c) === k)?.querySelectorAll('details')[j]
        if (d && !d.open) d.open = true
      }
      // By name, or (once the time is nearly up) by position, in case a heading changed with the trains.
      const late = Date.now() - started > TRY_FOR - 600
      const c = cs.find((x) => keyOf(x) === place.key) ?? (late ? cs[place.i] : undefined)
      if (c) {
        found ||= Date.now()
        window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY + place.off)
      }
      // Keep it in place for a moment as sections above it finish loading, then stop.
      if (Date.now() - started > TRY_FOR || (found && Date.now() - found > 1500)) restoring = false
      else setTimeout(tick, 100)
    }
    if (restoring) tick()
    // Anything you do yourself ends the restoring.
    const own = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    own.forEach((e) => window.addEventListener(e, stop, { passive: true }))
    let queued = false
    const note = () => {
      if (restoring || queued) return
      queued = true
      requestAnimationFrame(() => { queued = false; save(hash) })
    }
    window.addEventListener('scroll', note, { passive: true })
    document.addEventListener('toggle', note, true)
    window.addEventListener('pagehide', note)
    return () => {
      own.forEach((e) => window.removeEventListener(e, stop))
      window.removeEventListener('scroll', note)
      document.removeEventListener('toggle', note, true)
      window.removeEventListener('pagehide', note)
    }
  }, [hash, ready])
}
