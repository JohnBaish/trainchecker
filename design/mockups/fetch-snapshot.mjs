// Stage 2 mock-ups: saves the Live Departure Board's real answers for some journeys, as
// the app would ask for them (the last two hours and the next four, with calling points),
// so the mock-ups' sentences come from real data. Not part of the app.
// Needs the Live Departure Board key in the x-apikey header (added by the cloud session's
// proxy here) and, on Node 22, NODE_USE_ENV_PROXY=1 to go through that proxy.
// Usage: node fetch-snapshot.mjs RDG:PAD MAN:MIA ...
import { writeFileSync } from 'node:fs'
const BASE = 'https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120'
const H = { 'x-apikey': 'proxy-injected', 'User-Agent': 'trainchecker-mockups' }
async function get(path) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`${BASE}/${path}`, { headers: H })
    if (r.ok) return r.json()
    await new Promise((res) => setTimeout(res, 1500))
  }
  throw new Error(`failed: ${path}`)
}
const WINDOWS = [[-120, 60], [-60, 60], [0, 60], [60, 60], [119, 120]]
for (const pair of process.argv.slice(2)) {
  const [o, d] = pair.split(':')
  const taken = new Date().toISOString()
  const boards = []
  for (const [off, win] of WINDOWS) {
    boards.push({ off, win, board: await get(`GetDepBoardWithDetails/${o}?numRows=150&filterCrs=${d}&filterType=to&timeOffset=${off}&timeWindow=${win}`) })
  }
  const plain = await get(`GetDepartureBoard/${o}?numRows=1&filterCrs=${d}&filterType=to`)
  const stamp = taken.slice(0, 16).replace(/[-:]/g, '').replace('T', '-')
  const file = new URL(`./snapshots/${stamp}-${o}-${d}.json`, import.meta.url)
  writeFileSync(file, JSON.stringify({ taken, from: o, to: d, boards, messages: plain.nrccMessages || [] }))
  const n = boards.reduce((a, b) => a + (b.board.trainServices || []).length, 0)
  console.log(`${o}-${d}: ${n} rows, ${(plain.nrccMessages || []).length} messages`)
}
