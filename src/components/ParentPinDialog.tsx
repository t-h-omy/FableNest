import { useEffect, useRef, useState } from 'react'
import { hasParentPin, setParentPin, type openGameDatabase } from '../storage/database'
import { vibrate } from '../ui/feedback'
import { Icon } from '../ui/Icon'

interface Props {
  database: Awaited<ReturnType<typeof openGameDatabase>>
  taskTitle?: string
  onConfirm: (pin: string) => Promise<void>
  onClose: () => void
}

export function ParentPinDialog({ database, taskTitle, onConfirm, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'loading' | 'setup' | 'confirm' | 'change'>('loading')
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [errorKey, setErrorKey] = useState(0)

  useEffect(() => {
    dialog.current?.showModal()
    let active = true
    void hasParentPin(database).then((exists) => {
      if (active) setMode(exists ? (taskTitle ? 'confirm' : 'change') : 'setup')
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Der Eltern-PIN konnte nicht geladen werden.')
    })
    return () => { active = false }
  }, [database, taskTitle])

  const editing = mode === 'setup' || mode === 'change'

  async function submit() {
    if (busy || mode === 'loading') return
    setBusy(true)
    setError('')
    try {
      if (editing) {
        if (newPin !== repeat) throw new Error('Die neuen PIN-Eingaben stimmen nicht überein.')
        await setParentPin(database, newPin, mode === 'change' ? pin : undefined)
        if (!taskTitle) {
          onClose()
          return
        }
        setPin('')
        setNewPin('')
        setRepeat('')
        setMode('confirm')
        setNotice('Eltern-PIN gespeichert. Gib ihn jetzt zur Aufgabenbestätigung ein.')
      } else {
        await onConfirm(pin)
        onClose()
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Die Freigabe konnte nicht gespeichert werden. Bitte versuche es erneut.')
      setErrorKey((key) => key + 1)
      vibrate('warn')
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'setup' ? 'Eltern-PIN festlegen' : mode === 'change' ? 'Eltern-PIN ändern' : 'Aufgabe bestätigen'
  const pinField = 'pin-input'

  return (
    <dialog ref={dialog} className="sheet pin-sheet" aria-labelledby="pin-title" onCancel={(event) => {
      event.preventDefault()
      if (!busy) onClose()
    }}>
      <form className="sheet-panel" onSubmit={(event) => { event.preventDefault(); void submit() }}>
        <span className="sheet-grip" aria-hidden="true" />
        <header className="sheet-header">
          <div>
            <p className="eyebrow"><Icon name="lock" size={14} /> Für Erwachsene</p>
            <h2 id="pin-title">{title}</h2>
          </div>
          <button type="button" className="icon-btn" disabled={busy} onClick={onClose} aria-label="Schließen"><Icon name="close" /></button>
        </header>
        <div className="sheet-body">
          {taskTitle && (
            <p className="pin-task"><Icon name="tasks" size={20} /> <span>Freigabe für <strong>„{taskTitle}“</strong></span></p>
          )}
          <p className="sheet-note">Der Eltern-PIN gilt für beide Profile und bleibt nur auf diesem Gerät.</p>
          {mode === 'loading' && <p role="status" className="sheet-note">Elternfreigabe wird geladen …</p>}
          {notice && <p role="status" className="banner banner-success"><Icon name="check" size={18} /> {notice}</p>}
          <div key={errorKey} className={`pin-fields${errorKey ? ' is-error' : ''}`}>
            {mode !== 'setup' && mode !== 'loading' && (
              <label className="pin-label">
                {mode === 'change' ? 'Bisheriger Eltern-PIN' : 'Eltern-PIN'}
                <input className={pinField} autoFocus type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{4,6}" minLength={4} maxLength={6} required value={pin} onChange={(event) => setPin(event.target.value)} disabled={busy} />
              </label>
            )}
            {editing && <>
              <label className="pin-label">
                Neuer Eltern-PIN (4–6 Ziffern)
                <input className={pinField} autoFocus={mode === 'setup'} type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4,6}" minLength={4} maxLength={6} required value={newPin} onChange={(event) => setNewPin(event.target.value)} disabled={busy} />
              </label>
              <label className="pin-label">
                Neuen Eltern-PIN wiederholen
                <input className={pinField} type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4,6}" minLength={4} maxLength={6} required value={repeat} onChange={(event) => setRepeat(event.target.value)} disabled={busy} />
              </label>
            </>}
          </div>
          {error && <p className="banner banner-error" role="alert">{error}</p>}
          <div className="sheet-actions sheet-actions-row">
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>Abbrechen</button>
            <button className="btn btn-primary" disabled={busy || mode === 'loading'} type="submit">
              {busy ? 'Wird gespeichert …' : editing ? 'PIN speichern' : 'Bestätigen und Sterne vergeben'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
