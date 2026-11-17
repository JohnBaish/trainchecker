// The journey after "#" (#RDG-PAD: station codes, M14), never sent to the server, and the
// recent journeys kept on the visitor's own device (SPEC §7, answer 12).

export type Journey = { from: string; to: string }

export function parseHash(hash: string): Journey | null {
  const m = /^#?([A-Za-z]{3})-([A-Za-z]{3})$/.exec(decodeURIComponent(hash))
  return m ? { from: m[1].toUpperCase(), to: m[2].toUpperCase() } : null
}
export const hashOf = (j: Journey) => `#${j.from}-${j.to}`

export type Recent = Journey & { label: string }
const KEY = 'trainchecker.recent'

export function recentJourneys(): Recent[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((x) => x && /^[A-Z]{3}$/.test(x.from) && /^[A-Z]{3}$/.test(x.to) && typeof x.label === 'string').slice(0, 4) : []
  } catch {
    return []
  }
}

/** Puts a journey at the front of the recent list (four kept). */
export function remember(r: Recent) {
  try {
    const rest = recentJourneys().filter((x) => x.from !== r.from || x.to !== r.to)
    localStorage.setItem(KEY, JSON.stringify([r, ...rest].slice(0, 4)))
  } catch {
    // Not kept; the page still works.
  }
}
