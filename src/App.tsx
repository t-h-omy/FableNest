import { useEffect, useRef, useState } from 'react'
import { PixiCreature, type RoomObject } from './components/PixiCreature'
import { ParentPinDialog } from './components/ParentPinDialog'
import { PizzaDelivery } from './components/PizzaDelivery'
import { placeholderColor } from './assets/registry'
import { CREATURES, DEFAULT_PROFILES, LEVEL_THRESHOLDS, TASKS } from './data/gameContent'
import { FLIGHT, MINIGAMES, PIZZA_GAME_ID } from './data/minigames'
import { findProduct, PLACEMENT_SLOTS, SHOP_PRODUCTS } from './data/shop'
import { interact, renameCreature, selectCreature } from './game/gameLogic'
import { finishDelivery, isMinigameUnlocked, startDelivery } from './game/pizzaFlight'
import { regenerateCreature } from './game/progression'
import { checkPurchase, isPlaceable, placeItem, purchaseProduct, removeItem } from './game/shop'
import { calendarDate, requestTask, taskStatus } from './game/tasks'
import { confirmTask, ensureProfiles, loadGameState, mutateGameState, openGameDatabase } from './storage/database'
import type { AnimationState, Creature, FlightState, GameState, Interaction, PlayerProfile, ProfileId, SlotId } from './models'
import type { CSSProperties } from 'react'

type View = 'room' | 'tasks' | 'shop' | 'collection'

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'room', label: 'Spielzimmer' },
  { id: 'tasks', label: 'Aufgaben' },
  { id: 'shop', label: 'Shop' },
  { id: 'collection', label: 'Sammlung' },
]

export default function App() {
  const database = useRef<Awaited<ReturnType<typeof openGameDatabase>> | null>(null)
  const [profiles, setProfiles] = useState<PlayerProfile[]>([])
  const [profileId, setProfileId] = useState<ProfileId | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [view, setView] = useState<View>('room')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const stateRef = useRef<GameState | null>(null)
  const currentProfile = useRef(profileId)
  currentProfile.current = profileId
  const [reaction, setReaction] = useState<{ state: AnimationState; key: number }>({ state: 'idle', key: 0 })
  const [message, setMessage] = useState('')
  const [pinDialog, setPinDialog] = useState<{ taskId: string; date: string } | 'change' | null>(null)
  const [today, setToday] = useState(() => calendarDate())
  const [saving, setSaving] = useState(false)
  const [held, setHeld] = useState<string | null>(null)
  const savingRef = useRef(false)
  const [now, setNow] = useState(Date.now)
  const [delivery, setDelivery] = useState<{ runId: string; pilot: Creature } | null>(null)

  useEffect(() => {
    const refresh = () => { setToday(calendarDate()); setNow(Date.now()) }
    const timer = window.setInterval(refresh, 1000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    setReaction({ state: 'idle', key: 0 })
    setMessage('')
  }, [gameState?.activeCreatureId, profileId])

  useEffect(() => {
    if (reaction.state === 'idle') return
    const timer = window.setTimeout(() => {
      setReaction((previous) => ({ state: 'idle', key: previous.key + 1 }))
    }, reaction.state === 'sleep' ? 5000 : 1800)
    return () => window.clearTimeout(timer)
  }, [reaction])

  useEffect(() => {
    let active = true
    void openGameDatabase()
      .then(async (openedDatabase) => {
        if (!active) {
          openedDatabase.close()
          return
        }
        database.current = openedDatabase
        const storedProfiles = await ensureProfiles(openedDatabase)
        if (active) {
          setProfiles(storedProfiles)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setError('Dein Spielstand konnte nicht geladen werden. Bitte prüfe die Speichereinstellungen deines Browsers.')
          setLoading(false)
        }
      })

    return () => {
      active = false
      database.current?.close()
    }
  }, [])

  useEffect(() => {
    if (!profileId || !database.current) return
    let active = true
    setLoading(true)
    setGameState(null)
    stateRef.current = null
    void loadGameState(database.current, profileId)
      .then((loadedState) => {
        if (active) {
          setGameState(loadedState)
          stateRef.current = loadedState
          setLoading(false)
          setError('')
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Der Spielstand konnte nicht geöffnet werden.')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [profileId])

  const placeableOwned = SHOP_PRODUCTS.filter((product) =>
    isPlaceable(product) && gameState?.ownedItemIds.includes(product.id))
  const roomObjects: RoomObject[] = PLACEMENT_SLOTS.flatMap((slot) => {
    const product = findProduct(gameState?.house.placements[slot.id] ?? '')
    return product ? [{
      productId: product.id, assetId: product.assetId, label: product.name,
      x: slot.x, y: slot.y, interactive: Boolean(product.interaction),
    }] : []
  })

  async function updateGameState(change: (state: GameState) => GameState) {
    if (!profileId || !database.current || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const nextState = await mutateGameState(database.current, profileId, change)
      if (currentProfile.current === profileId) {
        stateRef.current = nextState
        setGameState(nextState)
        setError('')
      }
    } catch (cause) {
      if (currentProfile.current === profileId) {
        setError(cause instanceof Error ? cause.message : 'Änderungen konnten nicht gespeichert werden. Prüfe bitte den freien Speicherplatz.')
      }
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  function navigate(next: View) {
    setDelivery(null)
    setView(next)
  }

  async function launchDelivery() {
    if (!database.current || !profileId || savingRef.current) return
    const runId = crypto.randomUUID()
    savingRef.current = true
    setSaving(true)
    try {
      const next = await mutateGameState(database.current, profileId, (state) => startDelivery(state, runId, Date.now()))
      if (currentProfile.current !== profileId) return
      const pilot = next.creatures.find((entry) => entry.id === next.activeCreatureId)
      if (!pilot) throw new Error('Der Pilot konnte nicht gefunden werden.')
      stateRef.current = next
      setGameState(next)
      setDelivery({ runId, pilot })
      setReaction({ state: 'idle', key: 0 })
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Der Flug konnte nicht gestartet werden.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function saveDeliveryResult(flight: FlightState) {
    if (!database.current || !profileId || !delivery) throw new Error('Der Spielstand ist nicht verfügbar.')
    const next = await mutateGameState(database.current, profileId,
      (state) => finishDelivery(state, delivery.runId, flight, Date.now()))
    if (!next.lastDeliveryResult) throw new Error('Das Ergebnis konnte nicht gebucht werden.')
    if (currentProfile.current === profileId) {
      stateRef.current = next
      setGameState(next)
    }
    return next.lastDeliveryResult
  }

  function tapSlot(slotId: SlotId) {
    const state = stateRef.current
    if (!state) return
    const placed = state.house.placements[slotId]
    if (held && state.ownedItemIds.includes(held)) {
      const productId = held
      setHeld(null)
      void updateGameState((current) => placeItem(current, slotId, productId))
    } else if (placed) {
      setHeld(placed)
      void updateGameState((current) => removeItem(current, slotId))
    }
  }

  function tapObject(productId: string) {
    const interaction = findProduct(productId)?.interaction
    if (interaction) handleInteraction(interaction)
  }

  function handleInteraction(action: Interaction) {
    if (savingRef.current) return
    const state = stateRef.current
    if (!state) return
    const next = interact(state, action, Date.now())
    if (next === state) {
      setMessage('Zum Spielen brauchst du mindestens 10 Energie. Schlafen hilft dir dabei.')
      return
    }
    const before = state.creatures.find((entry) => entry.id === state.activeCreatureId)
    const after = next.creatures.find((entry) => entry.id === next.activeCreatureId)
    const gained = (after?.xp ?? 0) - (before?.xp ?? 0)
    const animations: Record<Interaction, AnimationState> = {
      tap: 'happy', pet: 'happy', feed: 'eat', sleep: 'sleep', play: 'play',
    }
    setReaction((previous) => ({ state: animations[action], key: previous.key + 1 }))
    setMessage(gained ? `Schön gemacht! +${gained} XP.` : 'Dein Wesen freut sich! Neue XP gibt es nach einer kurzen Pause.')
    void updateGameState((latest) => interact(latest, action, Date.now()))
  }

  if (loading) {
    return <main className="loading-screen" aria-live="polite">Dein Fabelnest wird vorbereitet …</main>
  }

  if (!profileId) {
    return (
      <main className="profile-screen">
        <div className="profile-intro">
          <div className="brand-mark" aria-hidden="true">✦</div>
          <p className="eyebrow">Dein kleines Abenteuer</p>
          <h1>Willkommen im Fabelnest</h1>
          <p>Wähle dein Profil und kümmere dich um ein magisches Wesen.</p>
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="profile-options" aria-label="Profil auswählen">
          {(profiles.length ? profiles : DEFAULT_PROFILES).map((profile, index) => (
            <button
              className="profile-card"
              key={profile.id}
              onClick={() => setProfileId(profile.id)}
            >
              <span className={`profile-avatar profile-avatar-${index + 1}`} aria-hidden="true">
                {index === 0 ? '✦' : '☾'}
              </span>
              <span>
                <strong>{profile.name}</strong>
                <span className="profile-caption">Eigenes Spielzimmer</span>
              </span>
              <span className="profile-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
        <p className="privacy-note">Dein Spielstand bleibt auf diesem Gerät.</p>
      </main>
    )
  }

  if (loading) {
    return <main className="loading-screen" aria-live="polite">Dein Spielzimmer wird geöffnet …</main>
  }

  if (!gameState) {
    return (
      <main className="loading-screen">
        <p className="error-message" role="alert">{error || 'Der Spielstand ist nicht verfügbar.'}</p>
        <button className="button-primary" onClick={() => { setProfileId(null); setError('') }}>
          Profil wechseln
        </button>
      </main>
    )
  }

  const activeProfile = profiles.find((profile) => profile.id === profileId)
  const storedCreature = gameState.creatures.find((entry) => entry.id === gameState.activeCreatureId)
  const creature = storedCreature ? regenerateCreature(storedCreature, now) : undefined
  const levelStart = creature ? LEVEL_THRESHOLDS[creature.level - 1] : 0
  const nextLevel = creature ? LEVEL_THRESHOLDS[creature.level] : undefined

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#room" onClick={(event) => { event.preventDefault(); navigate('room') }}>
          <span className="wordmark-icon" aria-hidden="true">✦</span>
          Fabelnest
        </a>
        <div className="topbar-actions">
          <span className="coin-badge" aria-label={`${gameState.coins} Sterne`} aria-live="polite">
            <span aria-hidden="true">✦</span> {gameState.coins}
          </span>
          <button className="profile-switch" disabled={saving} onClick={() => { setProfileId(null); setGameState(null); navigate('room') }}>
            <span className="profile-dot" aria-hidden="true" />
            <span>{activeProfile?.name ?? 'Profil'}</span>
            <span className="switch-label"> wechseln</span>
          </button>
        </div>
      </header>

      <nav className="main-nav" aria-label="Hauptnavigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item${view === item.id ? ' active' : ''}`}
            onClick={() => navigate(item.id)}
            aria-current={view === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="page-content" inert={saving} aria-busy={saving}>
        {error && <p className="error-message" role="alert">{error}</p>}
        {!creature && view === 'room' && (
          <section aria-labelledby="starter-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Euer Abenteuer beginnt</p>
                <h1 id="starter-title">Wähle dein kostenloses Startwesen</h1>
              </div>
            </div>
            <p>Beide können deine Freunde werden. Das zweite Wesen wartet später im Shop auf dich.</p>
            <div className="collection-grid">
              {CREATURES.map((entry) => (
                <article className="content-card creature-card" key={entry.id}>
                  <div className="collection-creature" style={{ '--creature-color': placeholderColor(entry.assetId) } as CSSProperties} aria-hidden="true"><span /></div>
                  <h2>{entry.name}</h2>
                  <p>{entry.species}</p>
                  <button className="button-primary" onClick={() => void updateGameState((state) => selectCreature(state, entry.id))}>
                    {entry.name} kostenlos wählen
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
        {delivery && view === 'room' && (
          <PizzaDelivery key={delivery.runId} pilot={delivery.pilot}
            highscore={gameState.minigameHighscores[PIZZA_GAME_ID] ?? 0}
            canRetry={Boolean(creature && creature.energy >= FLIGHT.energyCost)}
            onFinish={saveDeliveryResult}
            onRetry={() => void launchDelivery()}
            onExit={() => setDelivery(null)} />
        )}
        {creature && !delivery && view === 'room' && (
          <section aria-labelledby="room-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Ein Ort nur für euch</p>
                <h1 id="room-title">Dein Spielzimmer</h1>
              </div>
              <span className="level-chip">Nest · Stufe {gameState.house.level}</span>
            </div>
            <label className="creature-switch">
              Aktives Wesen
              <select value={creature.id} onChange={(event) => {
                const id = event.target.value
                void updateGameState((state) => selectCreature(state, id))
              }}>
                {gameState.creatures.map((friend) => <option key={friend.id} value={friend.id}>{friend.name}</option>)}
              </select>
            </label>
            <div className="room-panel">
              <PixiCreature
                assetId={creature.assetId} name={creature.name} species={creature.species}
                animation={reaction.state} animationKey={reaction.key}
                objects={roomObjects}
                onObjectTap={tapObject}
                onInteract={handleInteraction}
              />
              <div className="creature-caption">
                <span className="creature-species">{creature.species}</span>
                <h2>{creature.name}</h2>
                <p>Level {creature.level} / 20 · {creature.xp} XP</p>
                <progress aria-label="Fortschritt zum nächsten Level" max={nextLevel === undefined ? 1 : nextLevel - levelStart}
                  value={nextLevel === undefined ? 1 : creature.xp - levelStart} />
                <form key={creature.id} className="name-form" onSubmit={(event) => {
                  event.preventDefault()
                  const name = new FormData(event.currentTarget).get('creatureName')
                  if (typeof name === 'string') void updateGameState((state) => renameCreature(state, creature.id, name))
                }}>
                  <label htmlFor="creature-name">Name deines Wesens</label>
                  <input id="creature-name" name="creatureName" defaultValue={creature.name} maxLength={24} required pattern=".*\S.*" />
                  <button className="button-secondary" type="submit">Namen speichern</button>
                </form>
              </div>
              <div className="creature-stats" aria-label="Wohlbefinden">
                <div className="stat">
                  <span>Fröhlichkeit</span>
                  <div className="stat-track" role="meter" aria-label="Fröhlichkeit" aria-valuenow={creature.happiness} aria-valuemin={0} aria-valuemax={100}>
                    <span className="stat-fill happiness" style={{ width: `${creature.happiness}%` }} />
                  </div>
                </div>
                <div className="stat">
                  <span>Sättigung</span>
                  <div className="stat-track" role="meter" aria-label="Sättigung" aria-valuenow={creature.satiety} aria-valuemin={0} aria-valuemax={100}>
                    <span className="stat-fill satiety" style={{ width: `${creature.satiety}%` }} />
                  </div>
                </div>
                <div className="stat">
                  <span>Energie</span>
                  <div className="stat-track" role="meter" aria-label="Energie" aria-valuenow={creature.energy} aria-valuemin={0} aria-valuemax={100}>
                    <span className="stat-fill energy" style={{ width: `${creature.energy}%` }} />
                  </div>
                  <div className="care-actions">
                    <p>Tippe dein Wesen an oder streichle es mit einer Wischbewegung.</p>
                    <div className="care-buttons">
                      <button className="button-primary" onClick={() => handleInteraction('pet')}>Streicheln</button>
                      <button className="button-primary" onClick={() => handleInteraction('feed')}>Füttern</button>
                      <button className="button-primary" onClick={() => handleInteraction('sleep')}>Schlafen</button>
                      <button className="button-secondary" disabled={creature.energy < 10} onClick={() => handleInteraction('play')}>Spielen (−10 Energie)</button>
                    </div>
                    <p>Pflege geht auch ohne Energie. Spielen braucht mindestens 10 Energie.</p>
                    <p role="status" aria-live="polite">{message || 'XP haben pro Aktion und Wesen eine kurze Pause.'}</p>
                  </div>
                </div>
              </div>
              <div className="minigame-launcher">
                <h2>Minispiele</h2>
                {MINIGAMES.map((game) => (
                  <article key={game.id} className="content-card">
                    <h3>{game.name}</h3>
                    <p>{game.description}</p>
                    <p>60 Sekunden Flug · 3 Leben · 20 Energie</p>
                    <p>Dein Highscore: {gameState.minigameHighscores[game.id] ?? 0}</p>
                    <p>Heute: {creature.deliveryXpDates[today] ?? 0} / 3 XP-Lieferungen mit {creature.name}.</p>
                    <button className="button-primary"
                      disabled={!isMinigameUnlocked(gameState, game.id) || creature.energy < FLIGHT.energyCost}
                      onClick={() => void launchDelivery()}>
                      {!isMinigameUnlocked(gameState, game.id) ? 'Noch gesperrt' : creature.energy < FLIGHT.energyCost ? 'Zu wenig Energie' : 'Pizza ausliefern (−20 Energie)'}
                    </button>
                  </article>
                ))}
                <p>Energie: {creature.energy} / 100. Pro Minute kommt 1 Energie zurück – auch bei geschlossener App.</p>
              </div>
              <div className="housing-panel">
                <h2>Einrichtung</h2>
                <p>
                  {held
                    ? `${findProduct(held)?.name} ausgewählt. Tippe auf einen Platz, um es dort hinzustellen.`
                    : 'Wähle einen Gegenstand und tippe dann auf einen Platz. Tippe auf einen belegten Platz, um den Gegenstand aufzuheben.'}
                </p>
                <div className="inventory-row">
                  {placeableOwned.length === 0 && <p>Im Shop findest du Dinge für dein Zimmer.</p>}
                  {placeableOwned.map((product) => (
                    <button key={product.id} className={held === product.id ? 'button-primary' : 'button-secondary'}
                      aria-pressed={held === product.id}
                      onClick={() => setHeld(held === product.id ? null : product.id)}>
                      {product.name}
                    </button>
                  ))}
                </div>
                <div className="slot-grid">
                  {PLACEMENT_SLOTS.map((slot) => {
                    const placed = findProduct(gameState.house.placements[slot.id] ?? '')
                    return (
                      <button key={slot.id} className={`slot-button${placed ? ' filled' : ''}`}
                        disabled={!held && !placed} onClick={() => tapSlot(slot.id)}>
                        <span className="item-category">{slot.label}</span>
                        <strong>{placed?.name ?? 'Frei'}</strong>
                      </button>
                    )
                  })}
                </div>
                {roomObjects.filter((entry) => entry.interactive).map((entry) => (
                  <button key={entry.productId} className="button-secondary" onClick={() => tapObject(entry.productId)}>
                    {entry.label} anstupsen
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {view === 'tasks' && (
          <section aria-labelledby="tasks-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Kleine Schritte, große Hilfe</p>
                <h1 id="tasks-title">Aufgaben</h1>
              </div>
              <span className="level-chip">{TASKS.filter((task) => taskStatus(gameState, task.id, today) === 'completed').length}/{TASKS.length} heute abgeschlossen</span>
            </div>
            <div className="card-list">
              {TASKS.map((task) => {
                const status = taskStatus(gameState, task.id, today)
                const completed = status === 'completed'
                return (
                  <article className="content-card task-card" key={task.id}>
                    <span className={`task-check${completed ? ' done' : ''}`} aria-hidden="true">
                      {completed ? '✓' : '○'}
                    </span>
                    <div className="card-copy">
                      <h2>{task.title}</h2>
                      <p>{task.description}</p>
                      <p className="task-status">{completed ? 'Heute abgeschlossen' : status === 'pending' ? 'Wartet auf Bestätigung' : 'Offen'}</p>
                    </div>
                    <div className="card-action">
                      <span className="reward">✦ {task.reward} {task.reward === 1 ? 'Stern' : 'Sterne'}</span>
                      <button
                        className={completed ? 'button-secondary' : 'button-primary'}
                        disabled={completed}
                        onClick={() => {
                          if (status === 'pending') setPinDialog({ taskId: task.id, date: today })
                          else void updateGameState((state) => requestTask(state, task.id))
                        }}
                      >
                        {completed ? 'Abgeschlossen' : status === 'pending' ? 'Elternfreigabe' : 'Als erledigt melden'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
            <p className="gentle-reminder">Frag vorher eine erwachsene Person, welche Aufgaben heute passen.</p>
            <p className="gentle-reminder">Sterne gibt es nach der Elternfreigabe, einmal pro Aufgabe und Kalendertag. Morgen sind alle Aufgaben wieder offen.</p>
            <button className="button-secondary parent-settings" onClick={() => setPinDialog('change')}>Eltern-PIN verwalten</button>
            {gameState.starBookings.length > 0 && (
              <details className="booking-history">
                <summary>Sternebuchungen ansehen</summary>
                <ul>
                  {gameState.starBookings.map((booking) => (
                    <li key={`${booking.date}-${booking.taskId}`}>{booking.date} · {booking.taskTitle} · +{booking.amount} Sterne</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}

        {view === 'shop' && (
          <section aria-labelledby="shop-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Mach es dir gemütlich</p>
                <h1 id="shop-title">Kleiner Nest-Shop</h1>
              </div>
              <span className="level-chip">✦ {gameState.coins} Sterne</span>
            </div>
            {!creature && <p>Wähle zuerst im Spielzimmer dein kostenloses Startwesen. Danach kannst du hier einkaufen.</p>}
            <div className="shop-grid">
              {SHOP_PRODUCTS.map((product) => {
                const check = checkPurchase(gameState, product)
                const owned = !check.ok && (check.reason === 'owned' || check.reason === 'no-creature')
                return (
                  <article className="content-card shop-card" key={product.id}>
                    <div className="item-art" style={{ '--item-color': placeholderColor(product.assetId) } as CSSProperties} aria-hidden="true">
                      <span>{product.kind === 'creature' ? '♥' : product.kind === 'toy' ? '●' : '✦'}</span>
                    </div>
                    <div className="shop-copy">
                      <span className="item-category">
                        {product.kind === 'creature' ? 'Neuer Freund' : product.kind === 'toy' ? 'Zum Spielen' : 'Für dein Zimmer'}
                      </span>
                      <h2>{product.name}</h2>
                      <p>{product.description}</p>
                      <div className="shop-buy-row">
                        <span className="reward">✦ {product.price}</span>
                        <button
                          className={owned ? 'button-secondary' : 'button-primary'}
                          disabled={!check.ok}
                          onClick={() => void updateGameState((state) => purchaseProduct(state, product.id))}
                        >
                          {owned ? 'Gekauft' : check.ok ? 'Kaufen' : check.reason === 'poor' ? 'Zu wenig Sterne' : 'Wähle zuerst ein Wesen'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {view === 'collection' && (
          <section aria-labelledby="collection-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Lerne magische Freunde kennen</p>
                <h1 id="collection-title">Wesen-Sammlung</h1>
              </div>
              <span className="level-chip">{gameState.creatures.length}/{CREATURES.length} Wesen</span>
            </div>
            <div className="collection-grid">
              {CREATURES.map((entry) => {
                const selected = creature?.id === entry.id
                const owned = gameState.creatures.find((friend) => friend.id === entry.id)
                return (
                  <article className={`content-card creature-card${selected ? ' selected' : ''}`} key={entry.id}>
                    <div className="collection-creature" style={{ '--creature-color': placeholderColor(entry.assetId) } as CSSProperties} aria-hidden="true">
                      <span />
                    </div>
                    <div>
                      <span className="item-category">{entry.species}</span>
                      <h2>{owned?.name ?? entry.name}</h2>
                      <p>{owned ? `Level ${owned.level} · ${owned.xp} XP` : 'Gesperrt · Im Shop für 20 Sterne erhältlich'}</p>
                    </div>
                    <button
                      className={selected ? 'button-secondary' : 'button-primary'}
                      disabled={selected || !owned}
                      onClick={() => void updateGameState((state) => selectCreature(state, entry.id))}
                    >
                      {selected ? 'Im Spielzimmer' : owned ? 'Aktivieren' : 'Gesperrt'}
                    </button>
                    {!owned && <button className="button-secondary" onClick={() => setView('shop')}>Zum Shop</button>}
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </main>
      {pinDialog && database.current && (
        <ParentPinDialog
          database={database.current}
          taskTitle={pinDialog === 'change' ? undefined : TASKS.find((task) => task.id === pinDialog.taskId)?.title}
          onClose={() => setPinDialog(null)}
          onConfirm={async (pin) => {
            if (pinDialog === 'change' || !database.current) return
            const next = await confirmTask(database.current, profileId, pinDialog.taskId, pinDialog.date, pin)
            stateRef.current = next
            setGameState(next)
            setToday(calendarDate())
            setError('')
          }}
        />
      )}
      <footer className="app-footer">Ein liebevolles Zuhause für kleine Fantasiewesen.</footer>
    </div>
  )
}
