// Share under a box of words (John, November 25th 2026): the platform location guide (tap a
// platform) and Exits once a train is chosen. The picture is the Connections answer's (share.ts
// answerImage): the box's words in the dark colours, under a heading, its paragraphs kept apart.
// Wording agreed by John: "Share these directions" for both; the headings and words sent as drafted.
import { useState } from 'react'
import { clock } from '../lib/analyse.ts'
import { dayName, t12 } from '../lib/sentences.ts'
import { answerImage, deliverImage, isTouch } from '../lib/share.ts'
import { Icon } from './Icon.tsx'

export type BoxWords = {
  kicker: string // "PLATFORM GUIDE"
  heading: string // the picture's heading
  text: string // the box's words, as on the page
  paras?: string[] // its paragraphs, kept apart in the picture
  sent: string // the sentence sent with the picture
  what: string // the button: "Share these directions" / "Copy these directions"
  file: string
  hash: string // the journey, for the link sent with it
  title?: string // the share's title, when not "Trainchecker: " and the heading
  when?: string // top right of the picture, when not the day and time ('' for none)
  foot?: string // a line under the box (Message home)
}

export function BoxShare({ w, taken }: { w: BoxWords; taken: string }) {
  const [said, setSaid] = useState('')
  const touch = isTouch()
  const share = async () => {
    setSaid('')
    const canvas = answerImage({ kicker: w.kicker, heading: w.heading, text: w.text, paras: w.paras, edge: 'none', when: w.when ?? `${dayName(new Date(taken))}, ${t12(clock(taken))}`, foot: w.foot })
    const r = await deliverImage(canvas, w.file, { title: w.title ?? `Trainchecker: ${w.heading}`, text: w.sent, url: `${location.origin}/${w.hash}` })
    setSaid(r === 'copied' ? 'Copied' : r === 'saved' ? 'Saved as a picture' : '')
  }
  return (
    <div className="share-row box-share">
      <button type="button" className="btn btn-secondary" onClick={share}><Icon name={touch ? 'share' : 'copy'} /> {touch ? 'Share' : 'Copy'} {w.what}</button>
      <span className="share-status" role="status">{said}</span>
    </div>
  )
}
