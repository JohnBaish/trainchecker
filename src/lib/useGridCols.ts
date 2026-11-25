// How many items sit side by side in a CSS grid (one on a phone): so an answer can be drawn under the
// row of the train you tapped (Exits and Connections, John, November 25th 2026).
import { useLayoutEffect, useRef, useState, type DependencyList } from 'react'

/** A ref for the grid, and its number of columns, measured again when it resizes or `deps` change
 *  (the grid may appear only after something has loaded). */
export function useGridCols(deps: DependencyList) {
  const ref = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setCols(Math.max(1, getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return [ref, cols] as const
}

/** The index of the item after which the answer goes: the last one in the tapped item's row. */
export const rowEnd = (picked: number, cols: number, n: number) => (picked < 0 ? -1 : Math.min(n, Math.ceil((picked + 1) / cols) * cols) - 1)
