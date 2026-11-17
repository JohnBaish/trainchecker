// Sharing (house style §17; SPEC §8.12 and §8.13).
//
// A journey: words and a link, no picture (M13, P2). On a touch screen the phone's share sheet
// gets the sentence, the link (sent separately) and a title; on a computer the sentence and the
// link are copied, one under the other.
//
// The quote of the day: a picture of the quote in the house style, with the sentence and a link
// to the first page. Always in the light colours; made on the visitor's device, and nothing is
// sent anywhere until the visitor chooses where it goes.
import type { Quote } from '../data/quotes.ts'
import { dateShort } from './sentences.ts'

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
export const quoteFileName = (d: Date) => `trainchecker-quote-${new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(d)}.png`
