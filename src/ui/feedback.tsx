import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/**
 * Juice-System von Fabelnest: Toasts, Partikel, schwebende Zahlen, fliegende Sterne,
 * Konfetti, Feiern und Haptik. Alles ist rein visuell und verändert keinen Spielstand.
 */

export type ToastTone = 'info' | 'success' | 'warn' | 'error'
export type BurstKind = 'heart' | 'crumb' | 'zzz' | 'sparkle' | 'play' | 'puff' | 'star'
export type FloatTone = 'xp' | 'star' | 'muted' | 'energy'
export type HapticKind = 'tap' | 'success' | 'warn' | 'hit'
export interface Point { x: number; y: number }
type Anchor = Element | Point | null | undefined

export interface Celebration {
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: IconName
  /** Optionaler Inhalt statt des Icons, etwa das Wesen. */
  art?: ReactNode
  tone?: 'gold' | 'lilac' | 'mint'
  action?: string
  /** Wird nach dem Schließen aufgerufen, etwa um den nächsten Schritt zu öffnen. */
  onDone?: () => void
}

interface Toast { id: number; text: string; tone: ToastTone; icon?: IconName }
interface Particle { id: number; kind: BurstKind; x: number; y: number; dx: number; dy: number; rot: number; size: number; delay: number; hue: number }
interface Floater { id: number; text: string; tone: FloatTone; x: number; y: number }
interface Flyer { id: number; x: number; y: number; tx: number; ty: number; delay: number }

interface FeedbackApi {
  toast: (text: string, tone?: ToastTone, icon?: IconName) => void
  burst: (kind: BurstKind, at: Anchor, count?: number) => void
  floatText: (text: string, at: Anchor, tone?: FloatTone) => void
  flyStars: (from: Anchor, count: number) => void
  celebrate: (celebration: Celebration) => void
  haptic: (kind: HapticKind) => void
  registerStarTarget: (element: HTMLElement | null) => void
  /** Zählt hoch, sobald fliegende Sterne am Zähler ankommen. */
  starLandings: number
}

const noop = () => {}
const FeedbackContext = createContext<FeedbackApi>({
  toast: noop, burst: noop, floatText: noop, flyStars: noop, celebrate: noop, haptic: noop,
  registerStarTarget: noop, starLandings: 0,
})

export const useFeedback = () => useContext(FeedbackContext)

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const HAPTICS: Record<HapticKind, number | number[]> = {
  tap: 8, success: [14, 50, 22], warn: [30, 60, 30], hit: 70,
}

export function vibrate(kind: HapticKind) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(HAPTICS[kind])
  } catch {
    // Haptik ist optional.
  }
}

function resolve(anchor: Anchor, fy = 0.5): Point {
  if (!anchor) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  if ('x' in anchor && 'y' in anchor && !(anchor instanceof Element)) return anchor
  const rect = (anchor as Element).getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height * fy }
}

const PARTICLE_LIFETIME = 1600
const TOAST_LIFETIME = 2800
const MAX_PARTICLES = 80

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [flyers, setFlyers] = useState<Flyer[]>([])
  const [celebrations, setCelebrations] = useState<(Celebration & { id: number })[]>([])
  const [starLandings, setStarLandings] = useState(0)
  const nextId = useRef(1)
  const timers = useRef(new Set<number>())
  const starTarget = useRef<HTMLElement | null>(null)

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current.clear()
  }, [])

  const later = useCallback((ms: number, run: () => void) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      run()
    }, ms)
    timers.current.add(timer)
  }, [])

  const toast = useCallback((text: string, tone: ToastTone = 'info', icon?: IconName) => {
    const id = nextId.current++
    setToasts((list) => [...list.filter((entry) => entry.text !== text), { id, text, tone, icon }].slice(-2))
    later(TOAST_LIFETIME, () => setToasts((list) => list.filter((entry) => entry.id !== id)))
  }, [later])

  const burst = useCallback((kind: BurstKind, at: Anchor, count = 8) => {
    const origin = resolve(at, 0.45)
    const amount = prefersReducedMotion() ? Math.min(2, count) : count
    const created: Particle[] = Array.from({ length: amount }, (_, index) => {
      const angle = kind === 'zzz' ? -Math.PI / 2 + 0.5 + index * 0.18
        : kind === 'puff' ? Math.PI * (index / Math.max(1, amount - 1))
          : -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3
      const distance = kind === 'puff' ? 34 + Math.random() * 18 : 60 + Math.random() * 70
      return {
        id: nextId.current++, kind, x: origin.x + (Math.random() - 0.5) * 30, y: origin.y,
        dx: Math.cos(angle) * distance * (kind === 'puff' ? 1 : 1.1),
        dy: Math.sin(angle) * distance - (kind === 'puff' ? -6 : 20),
        rot: (Math.random() - 0.5) * 120, size: 0.7 + Math.random() * 0.6,
        delay: index * (kind === 'zzz' ? 180 : 28), hue: Math.floor(Math.random() * 5),
      }
    })
    setParticles((list) => [...list, ...created].slice(-MAX_PARTICLES))
    const ids = new Set(created.map((entry) => entry.id))
    later(PARTICLE_LIFETIME + amount * 180, () => setParticles((list) => list.filter((entry) => !ids.has(entry.id))))
  }, [later])

  const floatText = useCallback((text: string, at: Anchor, tone: FloatTone = 'xp') => {
    const origin = resolve(at, 0.3)
    const id = nextId.current++
    setFloaters((list) => [...list, { id, text, tone, x: origin.x, y: origin.y }])
    later(1300, () => setFloaters((list) => list.filter((entry) => entry.id !== id)))
  }, [later])

  const flyStars = useCallback((from: Anchor, count: number) => {
    const start = resolve(from)
    const target = starTarget.current ? resolve(starTarget.current) : { x: window.innerWidth - 48, y: 30 }
    const amount = Math.max(1, Math.min(prefersReducedMotion() ? 1 : 8, count))
    const created = Array.from({ length: amount }, (_, index) => ({
      id: nextId.current++, x: start.x + (Math.random() - 0.5) * 40, y: start.y + (Math.random() - 0.5) * 20,
      tx: target.x, ty: target.y, delay: index * 70,
    }))
    setFlyers((list) => [...list, ...created])
    created.forEach((flyer) => later(720 + flyer.delay, () => {
      setFlyers((list) => list.filter((entry) => entry.id !== flyer.id))
      setStarLandings((value) => value + 1)
    }))
  }, [later])

  const celebrate = useCallback((celebration: Celebration) => {
    const id = nextId.current++
    setCelebrations((list) => [...list, { ...celebration, id }])
    vibrate('success')
  }, [])

  const registerStarTarget = useCallback((element: HTMLElement | null) => {
    starTarget.current = element
  }, [])

  const api = useMemo<FeedbackApi>(() => ({
    toast, burst, floatText, flyStars, celebrate, haptic: vibrate, registerStarTarget, starLandings,
  }), [toast, burst, floatText, flyStars, celebrate, registerStarTarget, starLandings])

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((entry) => (
          <p key={entry.id} className={`toast toast-${entry.tone}`}>
            <Icon name={entry.icon ?? (entry.tone === 'success' ? 'check' : entry.tone === 'warn' ? 'info' : entry.tone === 'error' ? 'close' : 'sparkle')} size={20} />
            <span>{entry.text}</span>
          </p>
        ))}
      </div>
      <div className="fx-layer" aria-hidden="true">
        {particles.map((entry) => (
          <span key={entry.id} className={`fx-particle fx-${entry.kind} fx-hue-${entry.hue}`} style={{
            left: entry.x, top: entry.y, '--dx': `${entry.dx}px`, '--dy': `${entry.dy}px`,
            '--rot': `${entry.rot}deg`, '--s': entry.size, '--delay': `${entry.delay}ms`,
          } as CSSProperties}>
            {entry.kind === 'zzz' ? 'z' : entry.kind === 'puff' || entry.kind === 'crumb' ? null
              : <Icon name={entry.kind === 'heart' ? 'heart' : entry.kind === 'play' ? 'ball' : entry.kind === 'star' ? 'star' : 'sparkle'} filled={entry.kind !== 'play'} size={22} />}
          </span>
        ))}
        {floaters.map((entry) => (
          <span key={entry.id} className={`fx-float fx-float-${entry.tone}`} style={{ left: entry.x, top: entry.y }}>{entry.text}</span>
        ))}
        {flyers.map((entry) => (
          <span key={entry.id} className="fx-flyer" style={{
            left: entry.x, top: entry.y, '--tx': `${entry.tx - entry.x}px`, '--ty': `${entry.ty - entry.y}px`, '--delay': `${entry.delay}ms`,
          } as CSSProperties}>
            <span className="fx-flyer-inner"><Icon name="star" filled size={22} /></span>
          </span>
        ))}
      </div>
      {celebrations[0] && (
        <CelebrationDialog key={celebrations[0].id} celebration={celebrations[0]}
          onClose={() => {
            const done = celebrations[0].onDone
            setCelebrations((list) => list.slice(1))
            done?.()
          }} />
      )}
    </FeedbackContext.Provider>
  )
}

function CelebrationDialog({ celebration, onClose }: { celebration: Celebration; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const confetti = useMemo(() => prefersReducedMotion() ? [] : Array.from({ length: 36 }, (_, index) => ({
    id: index, x: Math.random() * 100, delay: Math.random() * 500, drift: (Math.random() - 0.5) * 160,
    spin: 360 + Math.random() * 540, hue: index % 5, shape: index % 3,
  })), [])

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) {
      try { element.showModal() } catch { element.setAttribute('open', '') }
    }
  }, [])

  return (
    <dialog ref={dialog} className={`celebration tone-${celebration.tone ?? 'gold'}`} aria-labelledby="celebration-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="celebration-confetti" aria-hidden="true">
        {confetti.map((piece) => (
          <i key={piece.id} className={`confetti confetti-${piece.shape} fx-hue-${piece.hue}`} style={{
            left: `${piece.x}%`, '--delay': `${piece.delay}ms`, '--drift': `${piece.drift}px`, '--spin': `${piece.spin}deg`,
          } as CSSProperties} />
        ))}
      </div>
      <div className="celebration-card">
        <div className="celebration-rays" aria-hidden="true" />
        <div className="celebration-art" aria-hidden="true">
          {celebration.art ?? <Icon name={celebration.icon ?? 'star'} filled size={72} />}
        </div>
        {celebration.eyebrow && <p className="eyebrow">{celebration.eyebrow}</p>}
        <h2 id="celebration-title">{celebration.title}</h2>
        {celebration.subtitle && <p className="celebration-subtitle">{celebration.subtitle}</p>}
        <button className="btn btn-primary btn-lg" autoFocus onClick={onClose}>{celebration.action ?? 'Weiter'}</button>
      </div>
    </dialog>
  )
}
