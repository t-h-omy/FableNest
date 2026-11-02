import { useEffect, useRef, useState } from 'react'
import { PixiCreature } from './components/PixiCreature'
import { ParentPinDialog } from './components/ParentPinDialog'
import { placeholderColor } from './assets/registry'
import { CREATURES, DEFAULT_PROFILES, SHOP_ITEMS, TASKS } from './data/gameContent'
import { interact, purchaseCreature, purchaseItem, renameCreature, selectCreature, XP_PER_LEVEL } from './game/gameLogic'
import { calendarDate, requestTask, taskStatus } from './game/tasks'
import { confirmTask, ensureProfiles, loadGameState, mutateGameState, openGameDatabase } from './storage/database'
import type { AnimationState, GameState, Interaction, PlayerProfile, ProfileId } from './models'
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
  const savingRef = useRef(false)

  useEffect(() => {
    const refresh = () => setToday(calendarDate())
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
  const creature = gameState.creatures.find((entry) => entry.id === gameState.activeCreatureId)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#room" onClick={(event) => { event.preventDefault(); setView('room') }}>
          <span className="wordmark-icon" aria-hidden="true">✦</span>
          Fabelnest
        </a>
        <div className="topbar-actions">
          <span className="coin-badge" aria-label={`${gameState.coins} Sterne`} aria-live="polite">
            <span aria-hidden="true">✦</span> {gameState.coins}
          </span>
          <button className="profile-switch" disabled={saving} onClick={() => { setProfileId(null); setGameState(null); setView('room') }}>
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
            onClick={() => setView(item.id)}
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
        {creature && view === 'room' && (
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
                decorAssetIds={SHOP_ITEMS.filter((item) => gameState.house.decorItemIds.includes(item.id)).map((item) => item.assetId)}
                onInteract={handleInteraction}
              />
              <div className="creature-caption">
                <span className="creature-species">{creature.species}</span>
                <h2>{creature.name}</h2>
                <p>Level {creature.level} / 20 · {creature.xp} XP</p>
                <progress aria-label="Fortschritt zum nächsten Level" max={XP_PER_LEVEL} value={creature.level === 20 ? XP_PER_LEVEL : creature.xp % XP_PER_LEVEL} />
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
              <p className="room-decor">
                {gameState.house.decorItemIds.length
                  ? `Dein Nest hat ${gameState.house.decorItemIds.length} ${gameState.house.decorItemIds.length === 1 ? 'Schatz' : 'Schätze'}.`
                  : 'Dein Nest wartet auf deine eigene Deko.'}
              </p>
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
              {CREATURES.map((entry) => {
                const owned = gameState.creatures.some((friend) => friend.id === entry.id)
                return (
                  <article className="content-card shop-card" key={entry.id}>
                    <div className="collection-creature" style={{ '--creature-color': placeholderColor(entry.assetId) } as CSSProperties} aria-hidden="true"><span /></div>
                    <div className="shop-copy">
                      <h2>{entry.name}</h2>
                      <p>{entry.species} · Ein neuer Freund mit eigenen Werten.</p>
                      <div className="shop-buy-row">
                        <span className="reward">✦ {entry.price}</span>
                        <button className="button-primary" disabled={!creature || owned || gameState.coins < entry.price}
                          onClick={() => void updateGameState((state) => purchaseCreature(state, entry.id))}>
                          {owned ? 'Schon bei dir' : gameState.coins < entry.price ? 'Zu teuer' : 'Wesen kaufen'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
              {SHOP_ITEMS.map((item) => {
                const owned = gameState.ownedItemIds.includes(item.id)
                const canAfford = gameState.coins >= item.price
                return (
                  <article className="content-card shop-card" key={item.id}>
                    <div className="item-art" style={{ '--item-color': placeholderColor(item.assetId) } as CSSProperties} aria-hidden="true">
                      <span>{item.category === 'care' ? '✿' : '✦'}</span>
                    </div>
                    <div className="shop-copy">
                      <span className="item-category">{item.category === 'care' ? 'Für dein Wesen' : 'Für dein Nest'}</span>
                      <h2>{item.name}</h2>
                      <p>{item.description}</p>
                      <div className="shop-buy-row">
                        <span className="reward">✦ {item.price}</span>
                        <button
                          className={owned ? 'button-secondary' : 'button-primary'}
                          disabled={!creature || owned || !canAfford}
                          onClick={() => void updateGameState((state) => purchaseItem(state, item))}
                        >
                          {owned ? 'Gekauft' : canAfford ? 'Kaufen' : 'Zu teuer'}
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
                      <p>{owned ? `Level ${owned.level} · ${owned.xp} XP` : 'Gesperrt · Im Shop erhältlich'}</p>
                    </div>
                    <button
                      className={selected ? 'button-secondary' : 'button-primary'}
                      disabled={selected || !owned}
                      onClick={() => void updateGameState((state) => selectCreature(state, entry.id))}
                    >
                      {selected ? 'Im Spielzimmer' : owned ? 'Auswählen' : 'Gesperrt'}
                    </button>
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
