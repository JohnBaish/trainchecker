// Station names and codes for the chooser: all 2,616 from National Rail's Knowledgebase Stations
// feed (scripts/build-stations.ts, November 17th 2026), bundled with the page, so typing in the
// boxes sends nothing anywhere.
import LIST from '../data/stations.json' with { type: 'json' }

export const STATIONS = LIST as [string, string][]
const BY_CODE = new Map(STATIONS)

export const nameOf = (code: string) => BY_CODE.get(code) ?? code

const norm = (s: string) => s.toLowerCase().replace(/[’'.,()-]/g, ' ').replace(/\s+/g, ' ').trim()

/** The station a box's words mean: its exact name, or its three-letter code. */
export function resolve(text: string): string | null {
  const t = norm(text)
  if (!t) return null
  const code = text.trim().toUpperCase()
  if (/^[A-Z]{3}$/.test(code) && BY_CODE.has(code)) return code
  const hit = STATIONS.find(([, n]) => norm(n) === t)
  return hit ? hit[0] : null
}

/** Up to eight suggestions: a matching code first, then names starting with the words, then
 *  names with a word starting with them, then any containing them. */
export function suggest(text: string, max = 8): [string, string][] {
  const t = norm(text)
  if (!t) return []
  const code = text.trim().toUpperCase()
  const score = ([c, n]: [string, string]) => {
    const x = norm(n)
    if (c === code) return 0
    if (x.startsWith(t)) return 1
    if (x.includes(' ' + t)) return 2
    if (x.includes(t)) return 3
    return 9
  }
  return STATIONS.map((s) => [score(s), s] as const).filter(([k]) => k < 9).sort((a, b) => a[0] - b[0]).slice(0, max).map(([, s]) => s)
}

/** Whether the suggestions can close because the box already holds a station's full name. Not for
 *  a code that happens to be a word typed on the way to a name: "Ivy" is Ivybridge's code (IVY), and
 *  closing there made the list vanish and come back at "Ivyb" (John, November 18th 2026). */
export function complete(text: string, list: [string, string][]): boolean {
  return list.length === 1 && norm(list[0][1]) === norm(text)
}
