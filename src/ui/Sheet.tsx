import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface SheetProps {
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  /** Verhindert das Schließen, solange etwas gespeichert wird. */
  locked?: boolean
  className?: string
}

/**
 * Bottom Sheet auf dem Smartphone, zentrierter Dialog ab Tablet-Breite.
 * Basiert auf <dialog> für Fokusfalle, Escape und Screenreader-Modalität.
 */
export function Sheet({ title, eyebrow, onClose, children, locked = false, className }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const latest = useRef({ onClose, locked })
  latest.current = { onClose, locked }

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) {
      try { element.showModal() } catch { element.setAttribute('open', '') }
    }
  }, [])

  const close = () => { if (!latest.current.locked) latest.current.onClose() }

  return (
    <dialog ref={dialog} className={`sheet${className ? ` ${className}` : ''}`} aria-labelledby="sheet-title"
      onCancel={(event) => { event.preventDefault(); close() }}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}>
      <div className="sheet-panel">
        <span className="sheet-grip" aria-hidden="true" />
        <header className="sheet-header">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id="sheet-title">{title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={close} disabled={locked} aria-label="Schließen">
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </dialog>
  )
}
