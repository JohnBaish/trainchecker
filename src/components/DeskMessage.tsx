// Message home on a computer (John, November 26th 2026): Copy there can carry only a picture or words, not both, so the
// computer gets the message alone, with its link, and "Copy this message" copies them together.
import { useState } from 'react'
import { Icon } from './Icon.tsx'

export function DeskMessage({ text, url }: { text: string; url: string }) {
  const [said, setSaid] = useState('')
  const copy = async () => {
    setSaid('')
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setSaid('Copied')
    } catch {
      setSaid('Sorry, that couldn’t be copied')
    }
  }
  return (
    <div className="desk-message">
      <p>{text} <a href={url}>{url}</a></p>
      <div className="share-row box-share">
        <button type="button" className="btn btn-secondary" onClick={copy}><Icon name="copy" /> Copy this message</button>
        <span className="share-status" role="status">{said}</span>
      </div>
    </div>
  )
}
