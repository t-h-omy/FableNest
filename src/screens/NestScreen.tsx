import { useEffect, useState, type CSSProperties, type RefObject } from 'react'
import { PixiCreature, type RoomObject } from '../components/PixiCreature'
import { INTERACTIONS } from '../data/gameContent'
import { FLIGHT, MINIGAMES } from '../data/minigames'
import { ROOM_LAYOUT } from '../data/room'
import { findProduct, PLACEMENT_SLOTS, SHOP_PRODUCTS } from '../data/shop'
import { deliveriesWithXpLeft, levelProgress, LOW_NEED_THRESHOLD, lowNeeds, msUntilEnergy, xpCooldownLeft, xpCooldownProgress, type Need } from '../game/insights'
import { isMinigameUnlocked } from '../game/pizzaFlight'
import { isPlaceable } from '../game/shop'
import { CreatureArt, ProductArt } from '../ui/Art'
import { Icon, type IconName } from '../ui/Icon'
import { usePrevious } from '../ui/useCountUp'
import type { AnimationState, Creature, CreatureId, GameState, Interaction, SlotId } from '../models'

export const CARE_ACTIONS: { id: Exclude<Interaction, 'tap'>; label: string; icon: IconName; tone: string }[] = [
  { id: 'pet', label: 'Streicheln', icon: 'hand', tone: 'rose' },
  { id: 'feed', label: 'Füttern', icon: 'apple', tone: 'peach' },
  { id: 'sleep', label: 'Schlafen', icon: 'moon', tone: 'sky' },
  { id: 'play', label: 'Spielen', icon: 'ball', tone: 'mint' },
]

const NEEDS: { id: Need; label: string; icon: IconName; action: Interaction }[] = [
  { id: 'happiness', label: 'Fröhlichkeit', icon: 'heart', action: 'pet' },
  { id: 'satiety', label: 'Sättigung', icon: 'apple', action: 'feed' },
  { id: 'energy', label: 'Energie', icon: 'bolt', action: 'sleep' },
]

const PLAY_ENERGY = -INTERACTIONS.play.energy

export function formatWait(ms: number): string {
  const minutes = Math.ceil(ms / 60_000)
  if (minutes <= 1) return 'in unter 1 Minute'
  return `in ${minutes} Minuten`
}

const percent = (value: number, total: number) => `${(value / total) * 100}%`

interface NestScreenProps {
  state: GameState
  creature: Creature
  now: number
  today: string
  reaction: { state: AnimationState; key: number }
  roomObjects: RoomObject[]
  stageRef: RefObject<HTMLDivElement | null>
  decorating: boolean
  held: string | null
  showCoach: boolean
  onInteract: (action: Interaction, origin?: Element | null) => void
  onObjectTap: (productId: string) => void
  onSelectCreature: (id: CreatureId) => void
  onOpenCreature: () => void
  onLaunchDelivery: (origin: Element | null) => void
  onDeliveryBlocked: (reason: string) => void
  onDecorate: (active: boolean) => void
  onHold: (productId: string | null) => void
  onTapSlot: (slotId: SlotId) => void
  onOpenShop: () => void
}

export function NestScreen(props: NestScreenProps) {
  const { state, creature, now, today, decorating, held } = props
  const progress = levelProgress(creature)
  const needs = lowNeeds(creature)
  const sign = needs[0]
  const signAction = NEEDS.find((entry) => entry.id === sign)?.action
  const others = state.creatures.filter((friend) => friend.id !== creature.id)
  const placeable = SHOP_PRODUCTS.filter((product) => isPlaceable(product) && state.ownedItemIds.includes(product.id))
  const placedIds = new Set(Object.values(state.house.placements))
  const freeSlots = PLACEMENT_SLOTS.filter((slot) => !state.house.placements[slot.id]).length
  const heldProduct = held ? findProduct(held) : undefined

  return (
    <section className="screen nest" aria-labelledby="nest-title">
      <div className={`stage${decorating ? ' is-decorating' : ''}`} ref={props.stageRef}>
        <PixiCreature
          assetId={creature.assetId} name={creature.name} species={creature.species}
          animation={props.reaction.state} animationKey={props.reaction.key}
          objects={props.roomObjects}
          onObjectTap={props.onObjectTap}
          onInteract={(action) => props.onInteract(action, null)}
        />

        <div className="stage-hud">
          <div className="nameplate">
            <span className="nameplate-species">{creature.species}</span>
            <h1 id="nest-title" className="nameplate-name">{creature.name}</h1>
            <button className="nameplate-edit" onClick={props.onOpenCreature} aria-label={`Details zu ${creature.name} und Namen ändern`}>
              <Icon name="pencil" size={16} />
            </button>
          </div>
          <button className={`level-ring${progress.max ? ' is-max' : ''}`} onClick={props.onOpenCreature}
            style={{ '--p': progress.ratio } as CSSProperties}
            aria-label={progress.max ? `Level ${progress.level}, höchstes Level` : `Level ${progress.level}, ${progress.current} von ${progress.span} XP bis zum nächsten Level`}>
            <span className="level-ring-label">Lv</span>
            <span className="level-ring-value">{progress.level}</span>
          </button>
        </div>

        {others.length > 0 && !decorating && (
          <div className="stage-switcher">
            {others.map((friend) => (
              <button key={friend.id} className="switch-avatar" onClick={() => props.onSelectCreature(friend.id)}
                aria-label={`Zu ${friend.name} wechseln`}>
                <CreatureArt assetId={friend.assetId} />
                <Icon name="swap" size={14} className="switch-avatar-icon" />
              </button>
            ))}
          </div>
        )}

        {sign && !decorating && props.reaction.state === 'idle' && (
          <span key={sign} className={`need-sign need-${sign}`} aria-hidden="true">
            <Icon name={NEEDS.find((entry) => entry.id === sign)?.icon ?? 'heart'} filled size={22} />
          </span>
        )}

        {!decorating && (
          <div className="needs" role="group" aria-label="Wohlbefinden">
            {NEEDS.map((need) => <NeedMeter key={need.id} need={need} value={creature[need.id]} />)}
          </div>
        )}

        {props.showCoach && !decorating && others.length === 0 && (
          <p className="coach-bubble">
            <Icon name="hand" size={18} /> Tippe oder streichle {creature.name}
          </p>
        )}

        {decorating && PLACEMENT_SLOTS.map((slot) => {
          const placed = findProduct(state.house.placements[slot.id] ?? '')
          const status = held ? (placed ? 'swap' : 'target') : placed ? 'filled' : 'empty'
          return (
            <button key={slot.id} className={`slot-marker is-${status}`} disabled={status === 'empty'}
              style={{ left: percent(slot.x, ROOM_LAYOUT.width), top: percent(slot.y - 34, ROOM_LAYOUT.height) }}
              onClick={() => props.onTapSlot(slot.id)}
              aria-label={`${slot.label}: ${placed ? placed.name : 'frei'}${held ? `. ${heldProduct?.name ?? 'Gegenstand'} hier hinstellen` : placed ? '. Aufheben' : ''}`}>
              <Icon name={status === 'filled' ? 'liftUp' : status === 'swap' ? 'swap' : 'plus'} size={22} />
            </button>
          )
        })}

        {!decorating && props.roomObjects.filter((entry) => entry.interactive).map((entry) => (
          <button key={entry.productId} className="object-a11y"
            style={{ left: percent(entry.x, ROOM_LAYOUT.width), top: percent(entry.y - 30, ROOM_LAYOUT.height) }}
            onClick={() => props.onObjectTap(entry.productId)}>
            {entry.label} anstupsen
          </button>
        ))}
      </div>

      {decorating ? (
        <div className="decor-tray">
          <header className="decor-tray-header">
            <div>
              <p className="eyebrow">Einrichten · Nest-Stufe {state.house.level}</p>
              <p className="decor-hint" role="status">
                {heldProduct ? `${heldProduct.name} in der Hand. Tippe auf einen leuchtenden Platz.`
                  : placeable.length ? 'Wähle einen Gegenstand oder tippe auf einen belegten Platz, um ihn aufzuheben.'
                    : 'Noch nichts zum Aufstellen da.'}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => props.onDecorate(false)}>
              <Icon name="check" size={20} /> Fertig
            </button>
          </header>
          {placeable.length === 0 ? (
            <div className="empty-state">
              <Icon name="shop" size={28} />
              <p>Im Shop findest du Dinge für dein Zimmer.</p>
              <button className="btn btn-secondary" onClick={props.onOpenShop}>Zum Shop</button>
            </div>
          ) : (
            <div className="inventory" role="group" aria-label="Deine Gegenstände">
              {placeable.map((product) => {
                const slot = PLACEMENT_SLOTS.find((entry) => state.house.placements[entry.id] === product.id)
                return (
                  <button key={product.id} className={`inv-item${held === product.id ? ' is-held' : ''}`}
                    aria-pressed={held === product.id} onClick={() => props.onHold(held === product.id ? null : product.id)}>
                    <span className="inv-art"><ProductArt assetId={product.assetId} /></span>
                    <span className="inv-name">{product.name}</span>
                    <span className="inv-place">{held === product.id ? 'In der Hand' : slot ? slot.label : placedIds.has(product.id) ? 'Aufgestellt' : 'Im Inventar'}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="care-dock" role="group" aria-label="Pflegen">
            {CARE_ACTIONS.map((action) => {
              const left = xpCooldownLeft(creature, action.id, now)
              const ready = left === 0
              const blocked = action.id === 'play' && creature.energy < PLAY_ENERGY
              return (
                <button key={action.id}
                  className={`care-btn tone-${action.tone}${ready ? ' is-ready' : ''}${blocked ? ' is-blocked' : ''}${signAction === action.id ? ' is-suggested' : ''}`}
                  aria-disabled={blocked || undefined}
                  onClick={(event) => props.onInteract(action.id, event.currentTarget)}>
                  <span className="care-ring" style={{ '--p': xpCooldownProgress(creature, action.id, now) } as CSSProperties}>
                    <span className="care-core"><Icon name={action.icon} size={26} /></span>
                    {ready && <span className="care-xp" aria-hidden="true">XP</span>}
                  </span>
                  <span className="care-label">{action.label}</span>
                  {action.id === 'play' && <span className="care-cost" aria-hidden="true"><Icon name="bolt" filled size={12} />−{PLAY_ENERGY}</span>}
                  <span className="sr-only">
                    {blocked ? `, braucht ${PLAY_ENERGY} Energie` : ready ? ', XP bereit' : ', XP-Pause'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="launch-row">
            {MINIGAMES.map((game) => {
              const unlocked = isMinigameUnlocked(state, game.id)
              const tired = creature.energy < FLIGHT.energyCost
              const flightsLeft = deliveriesWithXpLeft(creature, today)
              const wait = msUntilEnergy(creature, FLIGHT.energyCost, now)
              return (
                <button key={game.id} className={`launch-card launch-game${!unlocked || tired ? ' is-blocked' : ''}`}
                  aria-disabled={!unlocked || tired || undefined}
                  onClick={(event) => {
                    if (!unlocked) props.onDeliveryBlocked('Dieses Minispiel ist noch gesperrt.')
                    else if (tired) props.onDeliveryBlocked(`Für den Flug brauchst du ${FLIGHT.energyCost} Energie. Genug Energie ist ${formatWait(wait)} da. Schlafen hilft sofort.`)
                    else props.onLaunchDelivery(event.currentTarget)
                  }}>
                  <span className="launch-icon"><Icon name="rocket" size={28} /></span>
                  <span className="launch-copy">
                    <span className="launch-title">{game.shortName ?? game.name}</span>
                    <span className="sr-only">. {game.description}</span>
                    {!unlocked || tired ? (
                      <span className="launch-sub is-warn">{!unlocked ? 'Noch gesperrt' : `Energie ${formatWait(wait)} bereit`}</span>
                    ) : (
                      <span className="launch-meta">
                        <span className="chip chip-energy"><Icon name="bolt" filled size={12} />−{FLIGHT.energyCost}</span>
                        <span className="chip">{flightsLeft ? `${flightsLeft}× XP heute` : 'XP heute geschafft'}</span>
                      </span>
                    )}
                    <span className="launch-sub launch-record">Rekord {state.minigameHighscores[game.id] ?? 0}</span>
                  </span>
                  <span className="launch-go" aria-hidden="true"><Icon name={tired || !unlocked ? 'hourglass' : 'play'} filled size={18} /></span>
                </button>
              )
            })}
            <button className="launch-card launch-decor" onClick={() => props.onDecorate(true)}>
              <span className="launch-icon"><Icon name="sofa" size={28} /></span>
              <span className="launch-copy">
                <span className="launch-title">Einrichten</span>
                <span className="launch-sub">
                  {placeable.length ? `${freeSlots} ${freeSlots === 1 ? 'Platz' : 'Plätze'} frei` : 'Noch leer'}
                </span>
              </span>
              <span className="launch-go" aria-hidden="true"><Icon name="chevron" size={18} /></span>
            </button>
          </div>
        </>
      )}
    </section>
  )
}

function NeedMeter({ need, value }: { need: (typeof NEEDS)[number]; value: number }) {
  const previous = usePrevious(value)
  const [change, setChange] = useState<'up' | 'down' | null>(null)
  useEffect(() => {
    if (previous === undefined || previous === value) return
    setChange(value > previous ? 'up' : 'down')
    const timer = window.setTimeout(() => setChange(null), 700)
    return () => window.clearTimeout(timer)
  }, [value, previous])
  return (
    <div className={`need need-${need.id}${value < LOW_NEED_THRESHOLD ? ' is-low' : ''}${change ? ` is-${change}` : ''}`}>
      <span className="need-icon"><Icon name={need.icon} filled size={18} /></span>
      <span className="need-body">
        <span className="need-label">{need.label}</span>
        <span className="meter" role="meter" aria-label={need.label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
          <span className="meter-fill" style={{ width: `${value}%` }} />
        </span>
      </span>
      <span className="need-value">{value}</span>
    </div>
  )
}
