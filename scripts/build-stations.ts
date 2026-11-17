// The station boxes' list: every station's name and three-letter code, from National Rail's
// Knowledgebase Stations feed (subscribed by John, November 17th 2026). Writes
// src/data/stations.json as [code, name] pairs, sorted by name. Run now and then by hand:
//
//   NODE_USE_ENV_PROXY=1 RDM_KB_STATIONS_KEY=… node scripts/build-stations.ts
//
// (from a cloud session, with the key saved through the secure form, the key's value can be any
// placeholder: the session's proxy adds the real one).
//
// The feed is split by the company that runs each station (stations-GW.xml and so on). On
// November 17th 2026 every two-letter code was tried once: these 34 had stations, 2,616 in
// all, among them Network Rail's own (NR: Reading, London Paddington), London Underground's
// Elizabeth line stations (LT) and Southend Airport (XS). A company that answers with an error
// stops the script, so a missing list is noticed rather than silently dropped.
import { writeFileSync } from 'node:fs'

const BASE = 'https://api1.raildata.org.uk/1010-knowlegebase-stations-xml-feed1_1/4.0'
const CODES = ['AW', 'CC', 'CH', 'EM', 'ES', 'GM', 'GN', 'GR', 'GW', 'GX', 'HS', 'HV', 'HX', 'IL', 'LE', 'LM', 'LN', 'LO', 'LT',
  'ME', 'NR', 'NT', 'SE', 'SN', 'SR', 'SW', 'TL', 'TP', 'VT', 'WM', 'XC', 'XP', 'XR', 'XS']
const key = process.env.RDM_KB_STATIONS_KEY
if (!key) { console.error('Set RDM_KB_STATIONS_KEY (see the top of this file).'); process.exit(1) }

const unescape = (s: string) => s.replace(/&amp;/g, '&').replace(/&apos;|&#39;/g, '’').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
const found = new Map<string, string>()
for (const code of CODES) {
  const r = await fetch(`${BASE}/stations-${code}.xml`, { headers: { 'x-apikey': key, 'User-Agent': 'trainchecker.baish.net' } })
  if (!r.ok) { console.error(`stations-${code}.xml: HTTP ${r.status}`); process.exit(1) }
  const xml = await r.text()
  let n = 0
  for (const [, s] of xml.matchAll(/<Station\b[^>]*>([\s\S]*?)<\/Station>/g)) {
    const crs = /<CrsCode>([A-Z]{3})<\/CrsCode>/.exec(s)?.[1]
    const name = /<Name>([^<]+)<\/Name>/.exec(s)?.[1]
    if (crs && name) { found.set(crs, unescape(name)); n++ }
  }
  console.log(`${code}: ${n}`)
}
const list = [...found].sort((a, b) => a[1].localeCompare(b[1], 'en-GB'))
writeFileSync(new URL('../src/data/stations.json', import.meta.url), JSON.stringify(list) + '\n')
console.log(`${list.length} stations`)
