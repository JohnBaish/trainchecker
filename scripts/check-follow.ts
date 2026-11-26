// "Follow my progress" (John, November 26th 2026; design/follow-my-train/README.md): the agreed sentences, word for
// word, on the saved Reading to Paddington board at 6.24pm on November 17th 2026 (the arrival board made up from the
// departures, and some trains changed for cases the board didn't have: illustration only), the link, and the train
// followed across midnight. Run: node scripts/check-follow.ts
import { readFileSync } from 'node:fs'
import { trim } from '../api/live.ts'
import { analyse, type Snap } from '../src/lib/analyse.ts'
import { ago, followFor, followHash, parseFollow, ukDay, type FollowLink } from '../src/lib/follow.ts'

let passed = 0, failed = 0
function eq(what: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { passed++; return }
  failed++
  console.log(`FAIL ${what}\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`)
}

const s = JSON.parse(readFileSync(new URL('../design/mockups/snapshots/20261117-1824-RDG-PAD.json', import.meta.url), 'utf8'))
const plat = ['9', '11', '12', '10', '14', '8', '11A', '9', '12', '10', '13', '11', '9', '10', '12', '11']
type Svc = Snap['services'][number]
/** The board at 6.24pm (or `taken`), with `change` applied to the train with this id, the arrival board made up from it. */
function board(id: string, change: Partial<Svc> | null, taken = s.taken) {
  const snap = trim(s.from, s.to, taken, s.boards.map((b: { board: unknown }) => b.board))
  const services = snap.services.map((x) => (change && x.id.startsWith(id) ? { ...x, ...change } : x))
  return analyse({ ...snap, services, arrivals: services.map((x, i) => ({ ...x, platform: plat[i % plat.length] })) })
}
const link = (std: string, id: string, date = '20261117'): FollowLink => ({ from: 'RDG', to: 'PAD', std, id, date })
const say = (std: string, id: string, change: Partial<Svc> | null = null, date?: string) => followFor(board(id, change), link(std, id, date), '20261117').text

// The agreed sentences (John: "The wording of 1-14 is excellent", November 26th 2026).
const P = 'The 6.11pm train from Reading to London Paddington'
eq('1: left on time, between two stops', say('18:11', '10781475'), `${P} is on its way, now between Maidenhead and Slough. It left on time, 13 minutes ago, and it’s currently expected into London Paddington at 6.54pm, on platform 9.`)
eq('1: a non-stop run, no location', say('18:05', '10802565'), 'The 6.05pm train from Reading to London Paddington is on its way. It left on time, 19 minutes ago, and it’s currently expected into London Paddington at 6.29pm, on platform 11.')
eq('2: left on time, now late', say('18:01', '10802401'), 'The 6.01pm train from Reading to London Paddington is on its way. It left on time, 23 minutes ago, but it’s now running two minutes late, currently expected into London Paddington at 6.26pm, on platform 13.')
eq('3: left late, still as late', say('18:18', '10802537'), 'The 6.18pm train from Reading to London Paddington is on its way. It left three minutes late, at 6.21pm, so it’s currently expected into London Paddington at 6.43pm, on platform 11.')
eq('4: a little early', say('18:05', '10802565', { eta: '18:26' }), 'The 6.05pm train from Reading to London Paddington is on its way. It left on time, 19 minutes ago, and it’s running a little early, currently expected into London Paddington at 6.26pm, on platform 11.')
eq('5: made up some time, left under five minutes ago: "should" (John, November 26th 2026)', say('18:15', '10780583', { eta: '19:14' }), 'The 6.15pm Elizabeth Line train from Reading to London Paddington is on its way, now between Reading and Twyford. It left eight minutes late, at 6.23pm, but it should make up some time, and it’s currently expected into London Paddington five minutes late, at 7.14pm, on platform\u00a010.')
eq('5: made up some time, five minutes on (the clock moved on: made up)', followFor(board('10780583', { eta: '19:14' }, '2026-11-17T18:30:00Z'), link('18:15', '10780583'), '20261117').text.replace(/^.*? It left/, 'It left'), 'It left eight minutes late, at 6.23pm, but it’s made up some time, and it’s now running five minutes late, currently expected into London Paddington at 7.14pm, on platform\u00a010.')
eq('6: made up the time', say('17:46', '10780561'), 'The 5.46pm train from Reading to London Paddington is on its way, now between Hayes & Harlington and Southall. It left three minutes late, at 5.49pm, but it’s made up the time, and it’s currently expected into London Paddington as planned, at 6.39pm, on platform 9.')
eq('6: made up the time, left under five minutes ago: "should" (John, November 26th 2026; made up)', say('18:18', '10802537', { eta: '18:40' }), 'The 6.18pm train from Reading to London Paddington is on its way. It left three minutes late, at 6.21pm, but it should make up the time, and it’s currently expected into London Paddington as planned, at 6.40pm, on platform 11.')
eq('7: later still', say('18:15', '10780583', { eta: '19:21' }), 'The 6.15pm Elizabeth Line train from Reading to London Paddington is on its way, now between Reading and Twyford. It left eight minutes late, at 6.23pm, and it’s now running 12 minutes late, currently expected into London Paddington at 7.21pm, on platform 10.')
eq('8: how long ago', [0, 1, 13, 60, 70, 125].map(ago), ['just now', 'a minute ago', '13 minutes ago', 'an hour ago', 'an hour and 10 minutes ago', 'two hours and five minutes ago'])
eq('9: not left yet, late', say('18:26', '10802460'), 'The 6.26pm train from Reading to London Paddington hasn’t left yet. It’s expected to leave 20 minutes late, at 6.46pm, and get into London Paddington 13 minutes late, at 7.07pm, on platform 9.')
eq('9: not left yet, on time', say('18:32', '10802521'), 'The 6.32pm train from Reading to London Paddington hasn’t left yet. It’s expected to leave on time and get into London Paddington at 6.58pm, on platform 12.')
eq('10: delayed, no new time', say('18:32', '10802521', { etd: 'Delayed', eta: 'Delayed' }), 'The 6.32pm train from Reading to London Paddington is delayed, with no new time given yet. It was due to leave Reading at 6.32pm and get into London Paddington at 6.58pm.')
eq('11: arrived', say('17:50', '10802578'), 'The 5.50pm train from Reading got into London Paddington eight minutes late, at 6.21pm, on platform 12.')
eq('12: cancelled, with the reason', say('18:33', '10781476', { cancelled: true, reason: 'This train has been cancelled because of a fault on a train' }), 'The 6.33pm train from Reading to London Paddington has been cancelled because of a fault on a train.')
eq('13: a later day, gone from the boards', say('18:11', '99999999', null, '20261116'), 'This link was for the 6.11pm train from Reading to London Paddington on November 16th. It’s no longer being followed.')
eq('14: not on the boards', say('18:40', '12345678'), 'Trainchecker can’t find the 6.40pm train from Reading to London Paddington on National Rail’s boards at the moment. Please check again later.')
eq('14: long after its time', followFor(board('x', null), link('16:00', '12345678'), '20261117').text, 'The 4pm train from Reading to London Paddington is no longer on National Rail’s boards, so it will have finished its journey.')

// The platform: "not yet" when B's arrival board has the train but no platform; nothing when it hasn't the train.
{
  const a = board('x', null)
  const noP = { ...a, arr: a.arr!.map((x) => (x.id.startsWith('10781475') ? { ...x, platform: null } : x)) }
  const f = followFor(noP, link('18:11', '10781475'), '20261117')
  eq('platform: on the arrival board, none yet: "not yet"', [f.line?.platform, f.line?.noPlat, f.text.includes('platform')], [null, true, false])
  const g = followFor({ ...a, arr: a.arr!.filter((x) => !x.id.startsWith('10781475')) }, link('18:11', '10781475'), '20261117')
  eq('platform: not on the arrival board: nothing said', [g.line?.platform, g.line?.noPlat], [null, false])
}

// Across midnight (John, November 26th 2026): a link made on one day, opened just after midnight while the train is
// still on the boards, follows it; once it has gone from them, the later-day message.
eq('midnight: still on the boards, the day before in the link, followed', say('18:11', '10781475', null, '20261116').startsWith(`${P} is on its way`), true)
eq('midnight: same id but another booked time is not the train', followFor(board('x', null), link('18:12', '10781475', '20261116'), '20261117').state, 'stale')
eq('midnight: same day, same id, another booked time: not found', followFor(board('x', null), link('18:12', '10781475'), '20261117').state, 'missing')

// The link.
const l = link('18:11', '10781475')
eq('link: made and read back', parseFollow(followHash(l)), l)
eq('link: the address', followHash(l), '#RDG-PAD/follow/1811-10781475-20261117')
eq('link: a journey address is not a train link', parseFollow('#RDG-PAD'), null)
eq('link: the UK day just after midnight in winter', ukDay(new Date('2026-11-27T00:10:00Z')), '20261127')
eq('link: the UK day just after midnight in summer', ukDay(new Date('2026-07-01T23:10:00Z')), '20260702')

console.log(`check-follow: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
