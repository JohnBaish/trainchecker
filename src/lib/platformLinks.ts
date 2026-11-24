// How to get from one platform to another at a station ("over the footbridge"), for Connections.
// The table (src/data/platform-links.json) is made from OpenStreetMap by
// design/platform-links-trial/build_table.py; it's under the Open Database Licence (see
// src/data/platform-links-LICENCE.md). The words are John's (November 21st 2026).

/** One station: its platforms in groups on the level with each other, each group split into
 *  islands (platforms whose shapes touch on the map); and, for each pair of groups in order
 *  (1–2, 1–3, …, 2–3, …), one letter for how the walk crosses the line. */
export type StationLinks = { g: string[][][]; x: string; w?: string }
export type LinksTable = Record<string, StationLinks>

const WORDS: Record<string, string> = {
  b: 'over the footbridge',
  s: 'through the subway',
  e: 'over the footbridge or through the subway',
  r: 'which means going out of the station and round by the road',
  x: 'across the level crossing',
  B: 'over the footbridge or round through the concourse',
  S: 'through the subway or round through the concourse',
  E: 'over the footbridge, through the subway or round through the concourse',
  // u (over or under, the map doesn't say which) and ? (no walk found): nothing.
}

/** Where a board's label (9B, 11A) is on the map: itself, or the platform without its letter. */
function find(st: StationLinks, label: string): [number, number] | null {
  for (const l of [label, label.replace(/[A-Za-z]+$/, '')]) {
    if (!l) continue
    for (let g = 0; g < st.g.length; g++) {
      for (let i = 0; i < st.g[g].length; i++) if (st.g[g][i].includes(l)) return [g, i]
    }
  }
  return null
}

/** The words for getting from platform `from` to platform `to`, or '' when the table can't say. */
export function howToGet(st: StationLinks | null | undefined, from: string, to: string): string {
  if (!st || !from || !to || from === to) return ''
  const a = find(st, from), b = find(st, to)
  if (!a || !b) return ''
  // The same platform on the map (9A and 9B, say): nothing for now (John, November 21st 2026).
  if (a[0] === b[0] && a[1] === b[1] && from.replace(/[A-Za-z]+$/, '') === to.replace(/[A-Za-z]+$/, '')) return ''
  if (a[0] === b[0]) return a[1] === b[1] ? 'just across the platform' : 'on the same level'
  const [i, j] = a[0] < b[0] ? [a[0], b[0]] : [b[0], a[0]]
  const n = st.g.length
  // Pairs in order: (0,1), (0,2), …, (1,2), …
  const k = i * n - (i * (i + 1)) / 2 + (j - i - 1)
  // The station's own word for its footbridge, where John has given one (Reading's "bridge").
  return (WORDS[st.x[k]] ?? '').replace('footbridge', st.w ?? 'footbridge')
}
