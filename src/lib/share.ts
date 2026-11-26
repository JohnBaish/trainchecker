// Sharing (house style §17; SPEC §8.12 and §8.13).
//
// A journey: words and a link, no picture (M13, P2). On a touch screen the phone's share sheet
// gets the sentence, the link (sent separately) and a title; on a computer the sentence and the
// link are copied, one under the other.
//
// The platforms and arrivals lists: a picture of the list, a row per train, always in the dark
// colours (John, November 19th 2026), with the sentence and the journey's link.
//
// The quote of the day: a picture of the quote in the house style, with the sentence and a link
// to the first page. Always in the light colours; made on the visitor's device, and nothing is
// sent anywhere until the visitor chooses where it goes.
import type { Quote } from '../data/quotes.ts'
import { dateShort, type ListPicture } from './sentences.ts'

const touch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
export const isTouch = touch

export type ShareWords = { title: string; text: string; url: string }
export type Delivered = 'shared' | 'copied' | 'saved' | 'cancelled' | 'failed'

export async function shareText(words: ShareWords): Promise<Delivered> {
  if (touch() && navigator.share) {
    try {
      await navigator.share(words)
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(`${words.text}\n${words.url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}

// ---- The quote's picture ----

/** The light colours (organic.css and global.css), whatever the page's own mode. */
const C = { bg: '#f5ead8', band: '#fff2eb', text: '#201e1d', muted: '#645c50', accent: '#c67139', kicker: '#8c491a', rule: 'rgba(32,30,29,0.16)' }
const FIG = 'Figtree, system-ui, sans-serif'
const CAP = 'Caprasimo, Georgia, serif'
const W = 1200

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > width && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  return lines
}

/** The picture: a tinted band with large quotation marks (as on the page, option C revised), the
 *  quote (verse on separate lines), its author and source, then the date and the address. */
export function quoteImage(q: Quote, date: Date): HTMLCanvasElement {
  const scale = 2
  const canvas = document.createElement('canvas')
  const probe = canvas.getContext('2d')!
  const textX = 170, textW = W - textX - 170
  // Longer quotes in smaller type, so every picture stays a sensible shape.
  const size = q.text.length > 260 ? 30 : q.text.length > 160 ? 34 : 40
  probe.font = `${size}px ${FIG}`
  const lines = q.text.split(' / ').flatMap((l) => wrap(probe, l, textW))
  const lh = Math.round(size * 1.4)
  probe.font = `22px ${FIG}`
  const by = wrap(probe, `— ${q.author}, ${q.source}`, textW)
  const bandTop = 120, padTop = 70
  const bandH = padTop + lines.length * lh + 26 + by.length * 32 + 64
  const H = bandTop + bandH + 110
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = C.kicker
  ctx.font = `600 18px ${FIG}`
  ctx.fillText('TRAINCHECKER · QUOTE OF THE DAY', 60, 72)
  ctx.fillStyle = C.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText(dateShort(date), W - 60, 72)
  ctx.textAlign = 'left'

  // The band, with its terracotta edge on the left.
  const r = 36, x0 = 40, x1 = W - 40, y0 = bandTop, y1 = bandTop + bandH
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r)
  ctx.clip()
  ctx.fillStyle = C.band
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
  ctx.fillStyle = C.accent
  ctx.fillRect(x0, y0, 12, y1 - y0)
  ctx.restore()

  ctx.fillStyle = C.accent
  ctx.font = `150px ${CAP}`
  ctx.fillText('“', 66, y0 + 150)
  ctx.textAlign = 'right'
  ctx.fillText('”', x1 - 30, y1 - 4)
  ctx.textAlign = 'left'

  ctx.fillStyle = C.text
  ctx.font = `${size}px ${FIG}`
  lines.forEach((l, i) => ctx.fillText(l, textX, y0 + padTop + size + i * lh))
  ctx.fillStyle = C.muted
  ctx.font = `22px ${FIG}`
  const byTop = y0 + padTop + lines.length * lh + 26
  by.forEach((l, i) => ctx.fillText(l, textX, byTop + 22 + i * 32))

  ctx.strokeStyle = C.rule
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(60, y1 + 44); ctx.lineTo(W - 60, y1 + 44); ctx.stroke()
  ctx.fillStyle = C.kicker
  ctx.font = `30px ${CAP}`
  ctx.fillText('Trainchecker', 60, y1 + 88)
  ctx.fillStyle = C.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText('trainchecker.baish.net', W - 60, y1 + 86)
  ctx.textAlign = 'left'
  return canvas
}

/** The fact of the journey's picture (John, November 22nd 2026: as the quote's, without the
 *  quotation marks or attribution, in the fact's own colour), with the journey beneath the fact. */
const FACT = { band: '#e8eff5', edge: '#5d7f99' }
export function factImage(text: string, from: string, to: string, date: Date): HTMLCanvasElement {
  const scale = 2
  const canvas = document.createElement('canvas')
  const probe = canvas.getContext('2d')!
  const textX = 100, textW = W - textX - 120
  const size = text.length > 260 ? 30 : text.length > 160 ? 34 : 40
  probe.font = `${size}px ${FIG}`
  const lines = wrap(probe, text, textW)
  const lh = Math.round(size * 1.4)
  probe.font = `22px ${FIG}`
  const by = wrap(probe, `${from} to ${to}`, textW)
  const bandTop = 120, padTop = 56
  const bandH = padTop + lines.length * lh + 26 + by.length * 32 + 56
  const H = bandTop + bandH + 110
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = C.kicker
  ctx.font = `600 18px ${FIG}`
  ctx.fillText('TRAINCHECKER · FACT OF THE JOURNEY', 60, 72)
  ctx.fillStyle = C.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText(dateShort(date), W - 60, 72)
  ctx.textAlign = 'left'
  const r = 36, x0 = 40, x1 = W - 40, y0 = bandTop, y1 = bandTop + bandH
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r)
  ctx.clip()
  ctx.fillStyle = FACT.band
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
  ctx.fillStyle = FACT.edge
  ctx.fillRect(x0, y0, 12, y1 - y0)
  ctx.restore()
  ctx.fillStyle = C.text
  ctx.font = `${size}px ${FIG}`
  lines.forEach((l, i) => ctx.fillText(l, textX, y0 + padTop + size + i * lh))
  ctx.fillStyle = C.muted
  ctx.font = `22px ${FIG}`
  const byTop = y0 + padTop + lines.length * lh + 26
  by.forEach((l, i) => ctx.fillText(l, textX, byTop + 22 + i * 32))
  ctx.strokeStyle = C.rule
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(60, y1 + 44); ctx.lineTo(W - 60, y1 + 44); ctx.stroke()
  ctx.fillStyle = C.kicker
  ctx.font = `30px ${CAP}`
  ctx.fillText('Trainchecker', 60, y1 + 88)
  ctx.fillStyle = C.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText('trainchecker.baish.net', W - 60, y1 + 86)
  ctx.textAlign = 'left'
  return canvas
}

// ---- The two lists' pictures (John, November 19th 2026; options B, B1 and 3.1) ----

/** The dark colours (global.css), whatever the page's own mode. */
const D = { bg: '#24211e', band: '#37332e', text: '#e8dfcf', muted: '#b0a593', accent: '#dd8a56', kicker: '#f2a573', rule: 'rgba(232,223,207,0.16)', badge: '#4a2a14' }

function spaced(ctx: CanvasRenderingContext2D, px: string) {
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = px
}

/** Draws text to fit a width, a size smaller at a time if need be. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, width: number): number {
  let z = size
  do { ctx.font = `${weight} ${z}px ${FIG}`; if (ctx.measureText(text).width <= width) break; z -= 1 } while (z > 18)
  return z
}

export function listImage(p: ListPicture): HTMLCanvasElement {
  if (p.layout === 'hours') return hoursImage(p)
  const LW = 1080, scale = 2, pad = 60, inner = 52
  const canvas = document.createElement('canvas')
  const probe = canvas.getContext('2d')!
  probe.font = `52px ${CAP}`
  const title = wrap(probe, p.title, LW - pad * 2)
  probe.font = `24px ${FIG}`
  const x0 = pad + inner, x1 = LW - pad - inner
  const note = p.note ? wrap(probe, p.note, x1 - x0) : []
  probe.font = `26px ${FIG}`
  const before = p.before ? wrap(probe, p.before, x1 - x0) : []
  const beforeH = before.length ? before.length * 36 + 22 : 0
  const titleTop = 100, titleLh = 60
  const bandTop = titleTop + title.length * titleLh + 20
  // A late arrival's row is taller: the train, then "← two minutes late" on its own line, the arrow
  // pointing at the big time (John, November 20th 2026).
  const headH = p.one ? 70 : 50, rowHs = p.rows.map((r) => (r.arrow ? 110 : 90))
  const tops = rowHs.map((_, i) => rowHs.slice(0, i).reduce((a, b) => a + b, 0)), rowsH = rowHs.reduce((a, b) => a + b, 0)
  const bandH = 44 + beforeH + headH + rowsH - 18 + (note.length ? 26 + note.length * 34 : 0) + 44
  const H = bandTop + bandH + 110
  canvas.width = LW * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = D.bg
  ctx.fillRect(0, 0, LW, H)

  ctx.fillStyle = D.kicker
  ctx.font = `600 20px ${FIG}`
  spaced(ctx, '1.6px')
  ctx.fillText(p.kicker, pad, 72)
  spaced(ctx, '0px')
  ctx.fillStyle = D.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText(p.when, LW - pad, 72)
  ctx.textAlign = 'left'
  ctx.fillStyle = D.text
  ctx.font = `52px ${CAP}`
  title.forEach((l, i) => ctx.fillText(l, pad, titleTop + 36 + i * titleLh))

  // The band, with its terracotta edge on the left (as the quote's picture).
  const y0 = bandTop, y1 = bandTop + bandH
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(pad, y0, LW - pad * 2, bandH, 36)
  ctx.clip()
  ctx.fillStyle = D.band
  ctx.fillRect(pad, y0, LW - pad * 2, bandH)
  ctx.fillStyle = D.accent
  ctx.fillRect(pad, y0, 10, bandH)
  ctx.restore()

  const badge = (text: string, right: number, mid: number) => {
    ctx.font = `700 34px ${FIG}`
    const w = Math.max(92, ctx.measureText(text).width + 40)
    ctx.fillStyle = D.badge
    ctx.beginPath(); ctx.roundRect(right - w, mid - 26, w, 52, 18); ctx.fill()
    ctx.fillStyle = D.kicker
    ctx.textAlign = 'center'
    ctx.fillText(text, right - w / 2, mid + 12)
    ctx.textAlign = 'left'
    return w
  }
  const colX = x0 + 194
  let y = y0 + 44
  // Earlier trains with no platform yet, above the rows (John, November 22nd 2026).
  if (before.length) {
    ctx.fillStyle = D.text
    ctx.font = `26px ${FIG}`
    before.forEach((l, i) => ctx.fillText(l, x0, y + 26 + i * 36))
    y += beforeH
  }
  ctx.font = `600 18px ${FIG}`
  ctx.fillStyle = D.muted
  spaced(ctx, '1.4px')
  if (p.one) {
    const mid = y + 20
    ctx.fillText(p.heads[0], x0, mid + 7)
    const w = badge(p.one, x1, mid)
    ctx.font = `600 18px ${FIG}`
    ctx.fillStyle = D.muted
    ctx.textAlign = 'right'
    ctx.fillText('ALL FROM PLATFORM', x1 - w - 16, mid + 7)
    ctx.textAlign = 'left'
    // Arrivals with platforms: "FROM READING" over the trains too (November 25th 2026).
    if (p.heads[2]) ctx.fillText(p.heads[1], colX, mid + 7)
  } else {
    ctx.fillText(p.heads[0], x0, y + 14)
    const second = p.rows.some((r) => r.platform || r.noPlat)
    if (p.heads[2]) {
      ctx.fillText(p.heads[1], colX, y + 14)
      if (second) { ctx.textAlign = 'right'; ctx.fillText(p.heads[2], x1, y + 14); ctx.textAlign = 'left' }
    } else if (second) { ctx.textAlign = 'right'; ctx.fillText(p.heads[1], x1, y + 14); ctx.textAlign = 'left' }
    else ctx.fillText(p.heads[1], colX, y + 14)
  }
  spaced(ctx, '0px')
  y += headH

  p.rows.forEach((r, i) => {
    const top = y + tops[i], mid = top + rowHs[i] / 2
    ctx.strokeStyle = D.rule
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x1, top); ctx.stroke()
    // "?" for a delayed train with no time, in the lateness orange (John, November 19th 2026).
    ctx.fillStyle = r.time === '?' ? D.accent : D.text
    ctx.font = `700 36px ${FIG}`
    ctx.fillText(r.time, x0, mid + 13)
    const right = r.platform && !p.one ? x1 - badge(r.platform, x1, mid) - 20 : x1
    // A train with no platform yet: "not yet" where the badge would be (November 24th 2026).
    if (r.noPlat && !p.one) {
      ctx.font = `italic 26px ${FIG}`; ctx.fillStyle = D.muted; ctx.textAlign = 'right'
      ctx.fillText('not yet', x1, mid + 9); ctx.textAlign = 'left'
    }
    // The middle: the kind or "the 8.47pm" in grey, then lateness in orange; on two lines when
    // it won't fit on one at a readable size.
    const sep = r.mid && r.late ? (r.arrow ? '   ' : ' · ') : ''
    ctx.font = `600 28px ${FIG}`
    // The arrivals' arrow before the lateness (John, November 20th 2026): drawn as the page's icon is.
    const aw = (size: number) => (r.arrow ? size * 1.3 : 0)
    const arrow = (x: number, y: number, size: number) => {
      if (!r.arrow) return 0
      const s = size / 24, cy = y - size * 0.34
      ctx.save(); ctx.strokeStyle = D.accent; ctx.lineWidth = 2.75 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath(); ctx.moveTo(x + 12 * s, cy + 7 * s); ctx.lineTo(x + 5 * s, cy); ctx.lineTo(x + 12 * s, cy - 7 * s)
      ctx.moveTo(x + 19 * s, cy); ctx.lineTo(x + 5 * s, cy); ctx.stroke(); ctx.restore()
      return aw(size)
    }
    const oneLine = !r.arrow && ctx.measureText(r.mid + sep + r.late).width + aw(28) <= right - colX
    const draw = (text: string, weight: number, colour: string, x: number, y: number, size: number) => {
      ctx.font = `${weight} ${size}px ${FIG}`; ctx.fillStyle = colour; ctx.fillText(text, x, y)
      return ctx.measureText(text).width
    }
    if (oneLine) {
      let x = colX
      if (r.mid) x += draw(r.mid + sep, 400, D.muted, x, mid + 10, 28)
      if (r.late) { x += arrow(x, mid + 10, 28); draw(r.late, 600, D.accent, x, mid + 10, 28) }
    } else if (r.arrow) {
      const z = Math.min(fitFont(ctx, r.mid, 400, 28, right - colX), fitFont(ctx, r.late, 600, 28, right - colX - aw(28)))
      draw(r.mid, 400, D.muted, colX, mid - 8, z)
      draw(r.late, 600, D.accent, colX + arrow(colX, mid + 30, z), mid + 30, z)
    } else {
      const z = Math.min(fitFont(ctx, r.mid, 400, 26, right - colX), fitFont(ctx, r.late, 600, 26, right - colX - aw(26)))
      draw(r.mid, 400, D.muted, colX, mid - 6, z)
      draw(r.late, 600, D.accent, colX + arrow(colX, mid + 26, z), mid + 26, z)
    }
  })
  if (note.length) {
    ctx.fillStyle = D.muted
    ctx.font = `24px ${FIG}`
    const top = y + rowsH - 18 + 26
    note.forEach((l, i) => ctx.fillText(l, x0, top + 24 + i * 34))
  }

  ctx.strokeStyle = D.rule
  ctx.beginPath(); ctx.moveTo(pad, y1 + 44); ctx.lineTo(LW - pad, y1 + 44); ctx.stroke()
  ctx.fillStyle = D.kicker
  ctx.font = `30px ${CAP}`
  ctx.fillText('Trainchecker', pad, y1 + 88)
  ctx.fillStyle = D.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText('trainchecker.baish.net', LW - pad, y1 + 86)
  ctx.textAlign = 'left'
  return canvas
}

/** The later panel hour by hour (agreed by John, November 24th 2026): the panel's sentence, then a row
 *  per hour: "7.24 to 8.24pm" on the left, "11 trains" on the right, and under them, in orange, any
 *  that aren't on time ("one cancelled, one late"). */
function hoursImage(p: ListPicture): HTMLCanvasElement {
  const LW = 1080, scale = 2, pad = 60, inner = 52
  const canvas = document.createElement('canvas')
  const probe = canvas.getContext('2d')!
  probe.font = `52px ${CAP}`
  const title = wrap(probe, p.title, LW - pad * 2)
  const x0 = pad + inner, x1 = LW - pad - inner
  probe.font = `28px ${FIG}`
  const lead = p.before ? wrap(probe, p.before, x1 - x0) : []
  const leadH = lead.length ? lead.length * 40 + 30 : 0
  const titleTop = 100, titleLh = 60
  const bandTop = titleTop + title.length * titleLh + 20
  const rowHs = p.rows.map((r) => (r.late ? 124 : 92))
  const rowsH = rowHs.reduce((a, b) => a + b, 0)
  const bandH = 44 + leadH + rowsH + 30
  const H = bandTop + bandH + 110
  canvas.width = LW * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = D.bg
  ctx.fillRect(0, 0, LW, H)
  ctx.fillStyle = D.kicker
  ctx.font = `600 20px ${FIG}`
  spaced(ctx, '1.6px')
  ctx.fillText(p.kicker, pad, 72)
  spaced(ctx, '0px')
  ctx.fillStyle = D.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText(p.when, LW - pad, 72)
  ctx.textAlign = 'left'
  ctx.fillStyle = D.text
  ctx.font = `52px ${CAP}`
  title.forEach((l, i) => ctx.fillText(l, pad, titleTop + 36 + i * titleLh))
  const y0 = bandTop, y1 = bandTop + bandH
  ctx.save()
  ctx.beginPath(); ctx.roundRect(pad, y0, LW - pad * 2, bandH, 36); ctx.clip()
  ctx.fillStyle = D.band; ctx.fillRect(pad, y0, LW - pad * 2, bandH)
  ctx.fillStyle = D.accent; ctx.fillRect(pad, y0, 10, bandH)
  ctx.restore()
  let y = y0 + 44
  ctx.fillStyle = D.text
  ctx.font = `28px ${FIG}`
  lead.forEach((l, i) => ctx.fillText(l, x0, y + 28 + i * 40))
  y += leadH
  p.rows.forEach((r, i) => {
    const h = rowHs[i]
    ctx.strokeStyle = D.rule; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke()
    const mid = y + 56
    ctx.fillStyle = D.text; ctx.font = `700 34px ${FIG}`
    ctx.fillText(r.time, x0, mid)
    ctx.fillStyle = D.muted; ctx.font = `30px ${FIG}`; ctx.textAlign = 'right'
    ctx.fillText(r.mid, x1, mid); ctx.textAlign = 'left'
    if (r.late) { ctx.fillStyle = D.accent; ctx.font = `600 28px ${FIG}`; ctx.fillText(r.late, x0, mid + 40) }
    y += h
  })
  ctx.strokeStyle = D.rule
  ctx.beginPath(); ctx.moveTo(pad, y1 + 44); ctx.lineTo(LW - pad, y1 + 44); ctx.stroke()
  ctx.fillStyle = D.kicker
  ctx.font = `30px ${CAP}`
  ctx.fillText('Trainchecker', pad, y1 + 88)
  ctx.fillStyle = D.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText('trainchecker.baish.net', LW - pad, y1 + 86)
  ctx.textAlign = 'left'
  return canvas
}

/** "trainchecker-platforms-RDG-PAD.png" */
/** "Connections": a picture of the answer's box, in the dark colours as the lists are (John,
 *  November 21st 2026), its edge in the answer's colour. */
const EDGE: Record<string, string> = { good: '#aebf92', mixed: '#dd8a56', prepared: '#f08a7e', none: '#b0a593' }
/** `paras`: the box's paragraphs, kept apart as on the page (the location guide's entrances: John,
 *  November 25th 2026); otherwise `text` as one. */
/** `foot`: a line under the box (Message home's "Checked at 10.07am on November 26th"); `when` may then be ''. */
export function answerImage(o: { heading: string; text: string; edge: string; when: string; kicker?: string; paras?: string[]; foot?: string }): HTMLCanvasElement {
  const scale = 2
  const canvas = document.createElement('canvas')
  const probe = canvas.getContext('2d')!
  const textX = 110, textW = W - textX - 100
  const size = o.text.length > 520 ? 30 : 34, lh = Math.round(size * 1.45)
  probe.font = `${size}px ${FIG}`
  // Each paragraph's lines, then a blank half line between paragraphs ('' marks the gap).
  const lines = (o.paras ?? [o.text]).flatMap((p, k) => [...(k ? [''] : []), ...wrap(probe, p, textW)])
  const gapH = Math.round(lh * 0.5)
  const ys: number[] = []
  let yy = 0
  for (const l of lines) { ys.push(yy); yy += l === '' ? gapH : lh }
  probe.font = `44px ${CAP}`
  const head = wrap(probe, o.heading, W - 120)
  const headTop = 110, bandTop = headTop + head.length * 54 + 24, pad = 50
  const bandH = pad + yy + pad - 10
  const footH = o.foot ? 56 : 0
  const H = bandTop + bandH + 110 + footH
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = D.bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = D.kicker
  ctx.font = `600 18px ${FIG}`
  ctx.fillText(`TRAINCHECKER · ${o.kicker ?? 'CONNECTIONS'}`, 60, 72)
  ctx.fillStyle = D.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText(o.when, W - 60, 72)
  ctx.textAlign = 'left'
  ctx.fillStyle = D.text
  ctx.font = `44px ${CAP}`
  head.forEach((l, i) => ctx.fillText(l, 60, headTop + 44 + i * 54))
  const x0 = 40, x1 = W - 40, y0 = bandTop, y1 = bandTop + bandH
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x0, y0, x1 - x0, y1 - y0, 36)
  ctx.clip()
  ctx.fillStyle = D.band
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
  ctx.fillStyle = EDGE[o.edge] ?? EDGE.none
  ctx.fillRect(x0, y0, 12, y1 - y0)
  ctx.restore()
  ctx.fillStyle = D.text
  ctx.font = `${size}px ${FIG}`
  lines.forEach((l, i) => l && ctx.fillText(l, textX, y0 + pad + size - 6 + ys[i]))
  // Message home's "Checked at …" line under the box.
  if (o.foot) {
    ctx.fillStyle = D.muted
    ctx.font = `24px ${FIG}`
    ctx.fillText(o.foot, 60, y1 + 48)
  }
  const fy = y1 + footH
  ctx.strokeStyle = D.rule
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(60, fy + 44); ctx.lineTo(W - 60, fy + 44); ctx.stroke()
  ctx.fillStyle = D.kicker
  ctx.font = `30px ${CAP}`
  ctx.fillText('Trainchecker', 60, fy + 88)
  ctx.fillStyle = D.muted
  ctx.font = `20px ${FIG}`
  ctx.textAlign = 'right'
  ctx.fillText('trainchecker.baish.net', W - 60, fy + 86)
  ctx.textAlign = 'left'
  return canvas
}

export const listFileName = (kind: 'platforms' | 'arrivals', hash: string) => `trainchecker-${kind}-${hash.slice(1)}.png`

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Hands a picture over: the share sheet on a touch screen, else the clipboard, else a saved
 *  file. Call straight from the tap (as Riverwatcher's deliver()). */
export async function deliverImage(canvas: HTMLCanvasElement, filename: string, words: ShareWords): Promise<Delivered> {
  const blob = new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('No picture'))), 'image/png'))
  if (touch()) {
    const b = await blob
    const file = new File([b], filename, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], ...words })
        return 'shared'
      } catch (e) {
        if ((e as Error).name === 'AbortError') return 'cancelled'
      }
    }
    save(b, filename)
    return 'saved'
  }
  try {
    // The picture is handed over as a promise, made inside the click, which Safari needs.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return 'copied'
  } catch {
    save(await blob, filename)
    return 'saved'
  }
}

/** "trainchecker-quote-2026-11-17.png" */
export const factFileName = (d: Date) => `trainchecker-fact-${new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(d)}.png`
export const quoteFileName = (d: Date) => `trainchecker-quote-${new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(d)}.png`
