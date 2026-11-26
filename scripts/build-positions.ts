// Every station's map position, for "Find my train from my location" (John, November 26th 2026;
// design/find-my-train/README.md). From National Rail's Knowledgebase Stations feed (the same
// files as scripts/build-stations.ts), checked against the OpenStreetMap track the passes-near
// work drew (design/passes-near/stretches.json, stations in England only). Writes
// src/data/station-pos.json as { CRS: [latitude, longitude] }, to five decimal places (about a
// metre). Run now and then by hand:
//
//   NODE_USE_ENV_PROXY=1 RDM_KB_STATIONS_KEY=… node scripts/build-positions.ts
//
// (from a cloud session, with the key saved through the secure form, the key's value can be any
// placeholder: the session's proxy adds the real one).
//
// Checked on November 26th 2026: half the feed's positions are within 39 metres of the track's
// station ends, 99 in 100 within 320 metres. Where the two differ by more than FAR metres, the
// track's is used instead (Burnham-on-Crouch is in the North Sea in the feed, Canary Wharf
// (Elizabeth line) has its longitude's sign wrong, and six more are 570 metres to 1.3 km out);
// the script lists each one it changes.
import { readFileSync, writeFileSync } from 'node:fs'

const BASE = 'https://api1.raildata.org.uk/1010-knowlegebase-stations-xml-feed1_1/4.0'
const CODES = ['AW', 'CC', 'CH', 'EM', 'ES', 'GM', 'GN', 'GR', 'GW', 'GX', 'HS', 'HV', 'HX', 'IL', 'LE', 'LM', 'LN', 'LO', 'LT',
  'ME', 'NR', 'NT', 'SE', 'SN', 'SR', 'SW', 'TL', 'TP', 'VT', 'WM', 'XC', 'XP', 'XR', 'XS']
const FAR = 500
const key = process.env.RDM_KB_STATIONS_KEY
if (!key) { console.error('Set RDM_KB_STATIONS_KEY (see the top of this file).'); process.exit(1) }

const metres = (a: [number, number], b: [number, number]) =>
  Math.hypot((b[0] - a[0]) * 111320, (b[1] - a[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180))

const feed = new Map<string, [number, number]>()
for (const code of CODES) {
  const r = await fetch(`${BASE}/stations-${code}.xml`, { headers: { 'x-apikey': key, 'User-Agent': 'trainchecker.baish.net' } })
  if (!r.ok) { console.error(`stations-${code}.xml: HTTP ${r.status}`); process.exit(1) }
  const xml = await r.text()
  for (const [, s] of xml.matchAll(/<Station\b[^>]*>([\s\S]*?)<\/Station>/g)) {
    const crs = /<CrsCode>([A-Z]{3})<\/CrsCode>/.exec(s)?.[1]
    const lat = /<Latitude>(-?[\d.]+)<\/Latitude>/.exec(s)?.[1]
    const lon = /<Longitude>(-?[\d.]+)<\/Longitude>/.exec(s)?.[1]
    if (crs && lat && lon) feed.set(crs, [Number(lat), Number(lon)])
  }
}

// The track's station ends: each stretch's track runs from a to b, as [longitude, latitude].
type Stretch = { a: string; b: string; track?: [number, number][] }
const raw = JSON.parse(readFileSync(new URL('../design/passes-near/stretches.json', import.meta.url), 'utf8'))
const stretches: Stretch[] = Array.isArray(raw.stretches) ? raw.stretches : Object.values(raw.stretches)
const ends = new Map<string, [number, number][]>()
for (const s of stretches) {
  if (!s.track?.length) continue
  const [a, b] = [s.track[0], s.track[s.track.length - 1]]
  if (!ends.has(s.a)) ends.set(s.a, [])
  if (!ends.has(s.b)) ends.set(s.b, [])
  ends.get(s.a)!.push([a[1], a[0]])
  ends.get(s.b)!.push([b[1], b[0]])
}

const codes: string[] = JSON.parse(readFileSync(new URL('../src/data/stations.json', import.meta.url), 'utf8')).map((p: [string, string]) => p[0])
const out: Record<string, [number, number]> = {}
const round = (n: number) => Math.round(n * 1e5) / 1e5
for (const c of codes) {
  const f = feed.get(c)
  const e = ends.get(c)
  const track: [number, number] | null = e ? [e.reduce((t, p) => t + p[0], 0) / e.length, e.reduce((t, p) => t + p[1], 0) / e.length] : null
  let p = f ?? track
  if (f && track && metres(f, track) > FAR) {
    console.log(`${c}: the track's position, ${Math.round(metres(f, track))} metres from the feed's`)
    p = track
  }
  if (!p) { console.error(`${c}: no position`); process.exit(1) }
  out[c] = [round(p[0]), round(p[1])]
}
writeFileSync(new URL('../src/data/station-pos.json', import.meta.url), JSON.stringify(out) + '\n')
console.log(`${Object.keys(out).length} stations`)
