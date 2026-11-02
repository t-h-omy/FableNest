import { useEffect, useRef, useState } from 'react'
import { hasParentPin, setParentPin, type openGameDatabase } from '../storage/database'

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
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog ref={dialog} className="pin-dialog" aria-labelledby="pin-title" onCancel={(event) => {
      event.preventDefault()
      if (!busy) onClose()
    }}>
      <form onSubmit={(event) => { event.preventDefault(); void submit() }}>
        <h2 id="pin-title">{mode === 'setup' ? 'Eltern-PIN festlegen' : mode === 'change' ? 'Eltern-PIN ändern' : 'Aufgabe bestätigen'}</h2>
        <p>{taskTitle ? `Freigabe für „${taskTitle}“. ` : ''}Der Eltern-PIN gilt für beide Profile und bleibt nur auf diesem Gerät.</p>
        {mode === 'loading' && <p role="status">Elternfreigabe wird geladen …</p>}
        {notice && <p role="status">{notice}</p>}
        {mode !== 'setup' && mode !== 'loading' && (
          <label>
            {mode === 'change' ? 'Bisheriger Eltern-PIN' : 'Eltern-PIN'}
            <input autoFocus type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{4,6}" minLength={4} maxLength={6} required value={pin} onChange={(event) => setPin(event.target.value)} disabled={busy} />
          </label>
        )}
        {editing && <>
          <label>
            Neuer Eltern-PIN (4–6 Ziffern)
            <input autoFocus={mode === 'setup'} type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4,6}" minLength={4} maxLength={6} required value={newPin} onChange={(event) => setNewPin(event.target.value)} disabled={busy} />
          </label>
          <label>
            Neuen Eltern-PIN wiederholen
            <input type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4,6}" minLength={4} maxLength={6} required value={repeat} onChange={(event) => setRepeat(event.target.value)} disabled={busy} />
          </label>
        </>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="button-secondary" disabled={busy} onClick={onClose}>Abbrechen</button>
          <button className="button-primary" disabled={busy || mode === 'loading'} type="submit">
            {busy ? 'Wird gespeichert …' : editing ? 'PIN speichern' : 'Bestätigen und Sterne vergeben'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
