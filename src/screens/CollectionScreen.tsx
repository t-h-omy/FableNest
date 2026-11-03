import { CREATURES } from '../data/gameContent'
import { SHOP_PRODUCTS } from '../data/shop'
import { levelProgress } from '../game/insights'
import { CreatureArt } from '../ui/Art'
import { Icon } from '../ui/Icon'
import type { CreatureId, GameState } from '../models'

interface CollectionScreenProps {
  state: GameState
  activeId: CreatureId | null
  onActivate: (id: CreatureId) => void
  onOpenShopProduct: (productId: string) => void
}

export function CollectionScreen({ state, activeId, onActivate, onOpenShopProduct }: CollectionScreenProps) {
  const creatureProduct = SHOP_PRODUCTS.find((product) => product.kind === 'creature')
  return (
    <section className="screen collection" aria-labelledby="collection-title">
      <header className="screen-header screen-header-row">
        <div>
          <p className="eyebrow">Lerne magische Freunde kennen</p>
          <h1 id="collection-title">Sammlung</h1>
        </div>
        <span className="count-badge" aria-label={`${state.creatures.length} von ${CREATURES.length} Wesen`}>
          <strong>{state.creatures.length}</strong>/{CREATURES.length}
        </span>
      </header>
      <div className="collection-grid">
        {CREATURES.map((entry, index) => {
          const owned = state.creatures.find((friend) => friend.id === entry.id)
          const active = activeId === entry.id
          const progress = owned ? levelProgress(owned) : null
          return (
            <article key={entry.id} className={`creature-card${active ? ' is-active' : ''}${owned ? '' : ' is-locked'}`}
              style={{ animationDelay: `${index * 80}ms` }} aria-labelledby={`creature-${entry.id}`}>
              {active && <span className="active-ribbon"><Icon name="nest" size={14} /> Aktiv</span>}
              <span className="creature-card-art"><CreatureArt assetId={entry.assetId} locked={!owned} /></span>
              <p className="creature-card-species">{entry.species}</p>
              <h2 id={`creature-${entry.id}`}>{owned?.name ?? entry.name}</h2>
              {owned && progress ? (
                <>
                  <p className="creature-card-level">Level {owned.level} · {owned.xp} XP</p>
                  <span className="meter meter-xp" aria-hidden="true"><span className="meter-fill" style={{ width: `${progress.ratio * 100}%` }} /></span>
                  <button className={`btn btn-block ${active ? 'btn-secondary' : 'btn-primary'}`} disabled={active} onClick={() => onActivate(entry.id)}>
                    {active ? 'Ist aktiv' : 'Aktivieren'}
                  </button>
                </>
              ) : (
                <>
                  <p className="creature-card-level">Gesperrt{creatureProduct ? ` · Im Shop für ${creatureProduct.price} Sterne` : ''}</p>
                  {creatureProduct && (
                    <button className="btn btn-secondary btn-block" onClick={() => onOpenShopProduct(creatureProduct.id)}>
                      <Icon name="shop" size={18} /> Zum Shop
                    </button>
                  )}
                </>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
