import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './feedback'

/**
 * Zählt eine Zahl sichtbar hoch oder runter, statt sie springen zu lassen.
 * Beim ersten Rendern steht sofort der Zielwert da; ohne requestAnimationFrame
 * oder bei reduzierter Bewegung wird ebenfalls direkt der Zielwert gezeigt.
 */
export function useCountUp(target: number, { duration = 700, from }: { duration?: number; from?: number } = {}): number {
  const [shown, setShown] = useState(from ?? target)
  const shownRef = useRef(shown)
  shownRef.current = shown

  useEffect(() => {
    const start = shownRef.current
    if (start === target) return
    if (typeof requestAnimationFrame !== 'function' || prefersReducedMotion()) {
      setShown(target)
      return
    }
    let frame = 0
    const began = performance.now()
    const tick = (time: number) => {
      const progress = Math.min(1, (time - began) / duration)
      const eased = 1 - (1 - progress) ** 3
      setShown(Math.round(start + (target - start) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return shown
}

/** Liefert den Wert aus dem vorherigen Rendern. */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => { ref.current = value }, [value])
  return ref.current
}
