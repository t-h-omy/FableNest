import { useState, type CSSProperties } from 'react'
import { SHOP_PRODUCTS } from '../data/shop'
import { missingStars } from '../game/insights'
import { checkPurchase, isPlaceable } from '../game/shop'
import { ProductArt } from '../ui/Art'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'
import type { GameState, ProductKind, ShopProduct } from '../models'

export const KIND_LABEL: Record<ProductKind, string> = {
  decor: 'Für dein Zimmer', toy: 'Zum Spielen', creature: 'Neuer Freund',
}

type CardState = 'buy' | 'poor' | 'owned' | 'no-starter'

function cardState(state: GameState, product: ShopProduct): CardState {
  const check = checkPurchase(state, product)
  if (check.ok) return 'buy'
  if (check.reason === 'owned' || check.reason === 'no-creature') return 'owned'
  if (check.reason === 'no-starter') return 'no-starter'
  return check.reason === 'poor' ? 'poor' : 'owned'
}

export function ShopScreen({ state, hasCreature, onOpen }: { state: GameState; hasCreature: boolean; onOpen: (id: string) => void }) {
  return (
    <section className="screen shop" aria-labelledby="shop-title">
      <header className="screen-header">
        <p className="eyebrow">Mach es dir gemütlich</p>
        <h1 id="shop-title">Nest-Shop</h1>
        <p className="screen-lead">Tausche deine Sterne aus den Aufgaben gegen Schätze für dein Nest.</p>
      </header>
      {!hasCreature && (
        <p className="banner banner-info"><Icon name="info" size={20} /> Wähle zuerst im Spielzimmer dein kostenloses Startwesen. Danach kannst du hier einkaufen.</p>
      )}
      <div className="shop-grid">
        {SHOP_PRODUCTS.map((product, index) => {
          const status = cardState(state, product)
          const missing = missingStars(state, product.price)
          return (
            <button key={product.id} className={`product-card is-${status} kind-${product.kind}`} style={{ animationDelay: `${index * 70}ms` }}
              onClick={() => onOpen(product.id)}
              aria-label={`${product.name}, ${product.price} Sterne. ${status === 'buy' ? 'Kann gekauft werden' : status === 'owned' ? 'Im Besitz' : status === 'poor' ? `Dir fehlen ${missing} Sterne` : 'Erst Startwesen wählen'}`}>
              <span className="product-art-tile"><ProductArt assetId={product.assetId} /></span>
              {status === 'owned' && <span className="product-ribbon"><Icon name="check" size={14} /> Im Besitz</span>}
              <span className="product-kind">{KIND_LABEL[product.kind]}</span>
              <span className="product-name">{product.name}</span>
              {status === 'poor' ? (
                <span className="product-progress">
                  <span className="meter meter-gold"><span className="meter-fill" style={{ width: `${Math.min(100, state.coins / product.price * 100)}%` }} /></span>
                  <span className="product-missing">noch {missing} <Icon name="star" filled size={12} /></span>
                </span>
              ) : (
                <span className={`price-tag${status === 'buy' ? ' is-affordable' : ''}`}>
                  <Icon name="star" filled size={16} /> {product.price}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

interface ProductSheetProps {
  product: ShopProduct
  state: GameState
  onBuy: () => Promise<boolean>
  onPlace: () => void
  onMeet: () => void
  onEarn: () => void
  onChooseStarter: () => void
  onClose: () => void
}

export function ProductSheet({ product, state, onBuy, onPlace, onMeet, onEarn, onChooseStarter, onClose }: ProductSheetProps) {
  const [busy, setBusy] = useState(false)
  const [bought, setBought] = useState(false)
  const status = cardState(state, product)
  const missing = missingStars(state, product.price)

  async function buy() {
    if (busy) return
    setBusy(true)
    const ok = await onBuy()
    setBusy(false)
    if (ok) setBought(true)
  }

  return (
    <Sheet title={bought ? 'Gekauft!' : product.name} eyebrow={KIND_LABEL[product.kind]} onClose={onClose} locked={busy}
      className={`product-sheet${bought ? ' is-bought' : ''}`}>
      <div className="product-sheet-hero">
        {bought && <span className="sheet-burst" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} style={{ '--i': index } as CSSProperties} />)}</span>}
        <span className="product-sheet-art"><ProductArt assetId={product.assetId} /></span>
      </div>
      {bought ? (
        <>
          <p className="sheet-lead" role="status">
            {product.kind === 'creature' ? 'Ein neuer Freund ist eingezogen. Er hat eigene Werte und eigenes Level.'
              : `${product.name} gehört jetzt dir.${isPlaceable(product) ? ' Stell es in deinem Zimmer auf.' : ''}`}
          </p>
          <div className="sheet-actions">
            {product.kind === 'creature' ? (
              <button className="btn btn-primary btn-lg btn-block" onClick={onMeet}><Icon name="heart" filled size={20} /> Kennenlernen</button>
            ) : isPlaceable(product) ? (
              <button className="btn btn-primary btn-lg btn-block" onClick={onPlace}><Icon name="sofa" size={20} /> Jetzt aufstellen</button>
            ) : null}
            <button className="btn btn-secondary btn-block" onClick={onClose}>Weiter stöbern</button>
          </div>
        </>
      ) : (
        <>
          <p className="sheet-lead">{product.description}</p>
          <p className="product-sheet-price"><Icon name="star" filled size={20} /> {product.price} Sterne <span>· Du hast {state.coins}</span></p>
          <div className="sheet-actions">
            {status === 'buy' && (
              <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={() => void buy()}>
                {busy ? 'Wird gekauft …' : <>Kaufen für {product.price} <Icon name="star" filled size={18} /></>}
              </button>
            )}
            {status === 'poor' && (
              <>
                <p className="sheet-note">Dir fehlen noch {missing} {missing === 1 ? 'Stern' : 'Sterne'}. Sterne gibt es für erledigte Aufgaben.</p>
                <button className="btn btn-secondary btn-lg btn-block" onClick={onEarn}><Icon name="tasks" size={20} /> Sterne verdienen</button>
              </>
            )}
            {status === 'no-starter' && (
              <button className="btn btn-secondary btn-lg btn-block" onClick={onChooseStarter}>Wähle zuerst ein Wesen</button>
            )}
            {status === 'owned' && (
              <>
                <p className="sheet-note"><Icon name="check" size={16} /> {product.kind === 'creature' ? 'Alle Wesen wohnen schon bei dir.' : 'Schon in deinem Besitz.'}</p>
                {isPlaceable(product) && <button className="btn btn-secondary btn-lg btn-block" onClick={onPlace}><Icon name="sofa" size={20} /> Im Zimmer aufstellen</button>}
              </>
            )}
          </div>
        </>
      )}
    </Sheet>
  )
}
