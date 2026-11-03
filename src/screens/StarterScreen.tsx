import { useState } from 'react'
import { CREATURES } from '../data/gameContent'
import { CreatureArt } from '../ui/Art'
import { Icon } from '../ui/Icon'
import type { CreatureId } from '../models'

export function StarterScreen({ onChoose }: { onChoose: (id: CreatureId) => void }) {
  const [selected, setSelected] = useState<CreatureId | null>(null)
  const choice = CREATURES.find((entry) => entry.id === selected)

  return (
    <section className="screen starter" aria-labelledby="starter-title">
      <header className="screen-header">
        <p className="eyebrow">Euer Abenteuer beginnt</p>
        <h1 id="starter-title">Wähle dein Startwesen</h1>
        <p className="screen-lead">Es ist kostenlos. Das zweite Wesen wartet später im Shop auf dich.</p>
      </header>
      <div className="starter-grid" role="radiogroup" aria-label="Startwesen">
        {CREATURES.map((entry, index) => (
          <button key={entry.id} role="radio" aria-checked={selected === entry.id}
            className={`starter-card${selected === entry.id ? ' is-selected' : ''}`}
            style={{ animationDelay: `${index * 90}ms` }}
            onClick={() => setSelected(entry.id)}>
            <span className="starter-art"><CreatureArt assetId={entry.assetId} mood={selected === entry.id ? 'happy' : 'calm'} /></span>
            <span className="starter-name">{entry.name}</span>
            <span className="starter-species">{entry.species}</span>
            <span className="starter-check" aria-hidden="true"><Icon name="check" size={18} /></span>
          </button>
        ))}
      </div>
      <div className="sticky-cta">
        <button className="btn btn-primary btn-lg btn-block" disabled={!choice} onClick={() => choice && onChoose(choice.id)}>
          {choice ? `${choice.name} ins Nest holen` : 'Tippe auf ein Wesen'}
        </button>
      </div>
    </section>
  )
}
