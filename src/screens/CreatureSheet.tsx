import { useState } from 'react'
import { INTERACTIONS } from '../data/gameContent'
import { FLIGHT } from '../data/minigames'
import { levelProgress } from '../game/insights'
import { CreatureArt } from '../ui/Art'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'
import type { Creature } from '../models'

interface CreatureSheetProps {
  creature: Creature
  /** Begrüßungsmodus direkt nach der Wahl des Startwesens. */
  welcome?: boolean
  onRename: (name: string) => Promise<boolean>
  onClose: () => void
}

export function CreatureSheet({ creature, welcome = false, onRename, onClose }: CreatureSheetProps) {
  const [name, setName] = useState(creature.name)
  const [busy, setBusy] = useState(false)
  const progress = levelProgress(creature)
  const trimmed = name.trim()
  const unchanged = trimmed === creature.name

  async function submit() {
    if (busy) return
    if (unchanged) {
      onClose()
      return
    }
    setBusy(true)
    const saved = await onRename(trimmed)
    setBusy(false)
    if (saved) onClose()
  }

  return (
    <Sheet title={welcome ? 'Wie soll dein Wesen heißen?' : creature.name} eyebrow={welcome ? `Dein ${creature.species}` : creature.species}
      onClose={onClose} locked={busy} className="creature-sheet">
      <div className="creature-sheet-hero">
        <span className="creature-sheet-art"><CreatureArt assetId={creature.assetId} mood="happy" /></span>
        {!welcome && (
          <div className="creature-sheet-level">
            <p className="level-line"><strong>Level {progress.level}</strong> von 20 · {creature.xp} XP</p>
            <span className="meter meter-xp" role="progressbar" aria-label="Fortschritt zum nächsten Level"
              aria-valuemin={0} aria-valuemax={progress.max ? 1 : progress.span} aria-valuenow={progress.max ? 1 : progress.current}>
              <span className="meter-fill" style={{ width: `${progress.ratio * 100}%` }} />
            </span>
            <p className="level-next">{progress.max ? 'Höchstes Level erreicht.' : `Noch ${progress.span - progress.current} XP bis Level ${progress.level + 1}`}</p>
          </div>
        )}
      </div>

      <form className="name-form" onSubmit={(event) => { event.preventDefault(); void submit() }}>
        <label htmlFor="creature-name">Name deines Wesens</label>
        <div className="name-row">
          <input id="creature-name" name="creatureName" value={name} maxLength={24} required pattern=".*\S.*"
            autoComplete="off" enterKeyHint="done" onChange={(event) => setName(event.target.value)} disabled={busy} />
          <span className="name-count" aria-hidden="true">{name.length}/24</span>
        </div>
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy || !trimmed}>
          {busy ? 'Wird gespeichert …' : unchanged ? (welcome ? `${creature.name} passt so` : 'Fertig') : 'Namen speichern'}
        </button>
      </form>

      {!welcome && (
        <dl className="stat-list">
          <div><dt><Icon name="heart" filled size={16} /> Fröhlichkeit</dt><dd>{creature.happiness} / 100</dd></div>
          <div><dt><Icon name="apple" filled size={16} /> Sättigung</dt><dd>{creature.satiety} / 100</dd></div>
          <div><dt><Icon name="bolt" filled size={16} /> Energie</dt><dd>{creature.energy} / 100</dd></div>
        </dl>
      )}
      <ul className="tips">
        <li><Icon name="bolt" size={16} /> Pro Minute kommt 1 Energie zurück, auch bei geschlossener App.</li>
        <li><Icon name="sparkle" size={16} /> XP gibt es pro Aktion nach einer kurzen Pause wieder.</li>
        <li><Icon name="ball" size={16} /> Spielen braucht {-INTERACTIONS.play.energy} Energie, ein Lieferflug {FLIGHT.energyCost}. Pflege geht immer.</li>
      </ul>
    </Sheet>
  )
}
