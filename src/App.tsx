import { useEffect, useRef, useState } from 'react'
import { PixiCreature } from './components/PixiCreature'
import { placeholderColor } from './assets/registry'
import { CREATURES, DEFAULT_PROFILES, SHOP_ITEMS, TASKS } from './data/gameContent'
import { completeTask, purchaseItem, selectCreature } from './game/gameLogic'
import { ensureProfiles, loadGameState, openGameDatabase, saveGameState } from './storage/database'
import type { GameState, PlayerProfile, ProfileId } from './models'
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
    void loadGameState(database.current, profileId)
      .then((loadedState) => {
        if (active) {
          setGameState(loadedState)
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

  async function updateGameState(nextState: GameState) {
    setGameState(nextState)
    if (!profileId || !database.current) return
    try {
      await saveGameState(database.current, profileId, nextState)
      setError('')
    } catch {
      setError('Änderungen konnten nicht gespeichert werden. Prüfe bitte den freien Speicherplatz.')
    }
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
  const { creature } = gameState

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#room" onClick={(event) => { event.preventDefault(); setView('room') }}>
          <span className="wordmark-icon" aria-hidden="true">✦</span>
          Fabelnest
        </a>
        <div className="topbar-actions">
          <span className="coin-badge" aria-label={`${gameState.coins} Sternentaler`}>
            <span aria-hidden="true">✦</span> {gameState.coins}
          </span>
          <button className="profile-switch" onClick={() => { setProfileId(null); setGameState(null); setView('room') }}>
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

      <main className="page-content">
        {error && <p className="error-message" role="alert">{error}</p>}
        {view === 'room' && (
          <section aria-labelledby="room-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Ein Ort nur für euch</p>
                <h1 id="room-title">Dein Spielzimmer</h1>
              </div>
              <span className="level-chip">Nest · Stufe {gameState.house.level}</span>
            </div>
            <div className="room-panel">
              <div className="room-sky" aria-hidden="true">
                <span className="sky-star star-one">✦</span>
                <span className="sky-star star-two">✧</span>
                <span className="sky-star star-three">✦</span>
              </div>
              <PixiCreature assetId={creature.assetId} name={creature.name} species={creature.species} />
              <div className="creature-caption">
                <span className="creature-species">{creature.species}</span>
                <h2>{creature.name}</h2>
                <p>Schön, dass du da bist!</p>
              </div>
              <div className="creature-stats" aria-label="Wohlbefinden">
                <div className="stat">
                  <span>Fröhlichkeit</span>
                  <div className="stat-track" role="meter" aria-label="Fröhlichkeit" aria-valuenow={creature.happiness} aria-valuemin={0} aria-valuemax={100}>
                    <span className="stat-fill happiness" style={{ width: `${creature.happiness}%` }} />
                  </div>
                </div>
                <div className="stat">
                  <span>Energie</span>
                  <div className="stat-track" role="meter" aria-label="Energie" aria-valuenow={creature.energy} aria-valuemin={0} aria-valuemax={100}>
                    <span className="stat-fill energy" style={{ width: `${creature.energy}%` }} />
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
              <span className="level-chip">{gameState.completedTaskIds.length}/{TASKS.length} erledigt</span>
            </div>
            <div className="card-list">
              {TASKS.map((task) => {
                const completed = gameState.completedTaskIds.includes(task.id)
                return (
                  <article className="content-card task-card" key={task.id}>
                    <span className={`task-check${completed ? ' done' : ''}`} aria-hidden="true">
                      {completed ? '✓' : '○'}
                    </span>
                    <div className="card-copy">
                      <h2>{task.title}</h2>
                      <p>{task.description}</p>
                    </div>
                    <div className="card-action">
                      <span className="reward">✦ {task.reward}</span>
                      <button
                        className={completed ? 'button-secondary' : 'button-primary'}
                        disabled={completed}
                        onClick={() => void updateGameState(completeTask(gameState, task.id))}
                      >
                        {completed ? 'Erledigt' : 'Abholen'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
            <p className="gentle-reminder">Frag vorher eine erwachsene Person, welche Aufgaben heute passen.</p>
          </section>
        )}

        {view === 'shop' && (
          <section aria-labelledby="shop-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Mach es dir gemütlich</p>
                <h1 id="shop-title">Kleiner Nest-Shop</h1>
              </div>
              <span className="level-chip">✦ {gameState.coins} Taler</span>
            </div>
            <div className="shop-grid">
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
                          disabled={owned || !canAfford}
                          onClick={() => void updateGameState(purchaseItem(gameState, item))}
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
              <span className="level-chip">{CREATURES.length} Wesen</span>
            </div>
            <div className="collection-grid">
              {CREATURES.map((entry) => {
                const selected = creature.id === entry.id
                return (
                  <article className={`content-card creature-card${selected ? ' selected' : ''}`} key={entry.id}>
                    <div className="collection-creature" style={{ '--creature-color': placeholderColor(entry.assetId) } as CSSProperties} aria-hidden="true">
                      <span />
                    </div>
                    <div>
                      <span className="item-category">{entry.species}</span>
                      <h2>{entry.name}</h2>
                    </div>
                    <button
                      className={selected ? 'button-secondary' : 'button-primary'}
                      disabled={selected}
                      onClick={() => void updateGameState(selectCreature(gameState, entry.id))}
                    >
                      {selected ? 'Im Spielzimmer' : 'Auswählen'}
                    </button>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </main>
      <footer className="app-footer">Ein liebevolles Zuhause für kleine Fantasiewesen.</footer>
    </div>
  )
}
