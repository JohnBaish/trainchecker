/** How a run of 12-hour times is said (house style §15; John, November 18th and 26th 2026). */

/** A list in reading order: "am" or "pm" said with the first time and again only when it changes
 *  ("6.44am, 6.48, 7.14"); on the hour it stays ("7pm"), as a bare "7" could read as a count. */
export function onceSay() {
  let last = ''
  return (s: string) => {
    if (s === 'midday' || s === 'midnight') { last = s === 'midday' ? 'pm' : 'am'; return s }
    const m = s.match(/^(.*?)(am|pm)$/)
    if (!m) return s
    const out = s.includes('.') && last === m[2] ? m[1] : s
    last = m[2]
    return out
  }
}

/** A range: "am" or "pm" said once, at the end ("7.24 to 8.24pm"); kept on both when it changes
 *  ("11.35pm and 5.15am") or when the first is on the hour ("5pm to 5.30pm"). */
export function rangeSay(a: string, b: string, sep = ' to '): string {
  const m1 = a.match(/^(.*\.\d\d)(am|pm)$/), m2 = b.match(/(am|pm)$/)
  return `${m1 && m2 && m1[2] === m2[1] ? m1[1] : a}${sep}${b}`
}
