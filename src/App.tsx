import { useEffect, useRef, useState } from 'react'
import { ParentPinDialog } from './components/ParentPinDialog'
import { PizzaDelivery } from './components/PizzaDelivery'
import type { RoomObject } from './components/PixiCreature'
import { DEFAULT_PROFILES, TASKS } from './data/gameContent'
import { FLIGHT, PIZZA_GAME_ID } from './data/minigames'
import { ROOM_LAYOUT } from './data/room'
import { findProduct, PLACEMENT_SLOTS } from './data/shop'
import { interact, renameCreature, selectCreature } from './game/gameLogic'
import { affordableProductCount, lowNeeds, msUntilEnergy, taskSummary } from './game/insights'
import { finishDelivery, startDelivery } from './game/pizzaFlight'
import { regenerateCreature } from './game/progression'
import { placeItem, purchaseProduct, removeItem } from './game/shop'
import { calendarDate, requestTask } from './game/tasks'
import { CollectionScreen } from './screens/CollectionScreen'
import { CreatureSheet } from './screens/CreatureSheet'
import { formatWait, NestScreen } from './screens/NestScreen'
import { ProfileScreen, Splash } from './screens/ProfileScreen'
import { ProductSheet, ShopScreen } from './screens/ShopScreen'
import { StarterScreen } from './screens/StarterScreen'
import { BookingHistorySheet, TasksScreen } from './screens/TasksScreen'
import { confirmTask, ensureProfiles, loadGameState, mutateGameState, openGameDatabase } from './storage/database'
import { CreatureArt } from './ui/Art'
import { TabBar, TopBar, type NavBadge, type View } from './ui/Chrome'
import { FeedbackProvider, useFeedback, type BurstKind, type Point } from './ui/feedback'
import { Icon } from './ui/Icon'
import type { AnimationState, Creature, CreatureId, FlightState, GameState, Interaction, PlayerProfile, ProfileId, SlotId } from './models'

type SheetState = { type: 'creature'; welcome?: boolean } | { type: 'product'; id: string } | { type: 'history' } | null

const REACTIONS: Record<Interaction, AnimationState> = {
  tap: 'happy', pet: 'happy', feed: 'eat', sleep: 'sleep', play: 'play',
}
const BURSTS: Record<Interaction, { kind: BurstKind; count: number }> = {
  tap: { kind: 'sparkle', count: 6 }, pet: { kind: 'heart', count: 9 }, feed: { kind: 'crumb', count: 12 },
  sleep: { kind: 'zzz', count: 3 }, play: { kind: 'play', count: 7 },
}

export default function App() {
  return (
    <FeedbackProvider>
      <Game />
    </FeedbackProvider>
  )
}

function Game() {
  const feedback = useFeedback()
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
  const [srMessage, setSrMessage] = useState('')
  const [pinDialog, setPinDialog] = useState<{ taskId: string; date: string } | 'change' | null>(null)
  const [today, setToday] = useState(() => calendarDate())
  const [saving, setSaving] = useState(false)
  const [held, setHeld] = useState<string | null>(null)
  const [decorating, setDecorating] = useState(false)
  const [sheet, setSheet] = useState<SheetState>(null)
  const [coachDone, setCoachDone] = useState(false)
  const savingRef = useRef(false)
  const [now, setNow] = useState(Date.now)
  const [delivery, setDelivery] = useState<{ runId: string; pilot: Creature } | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const levelMemory = useRef<{ key: string; level: number } | null>(null)

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
    setSrMessage('')
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

  // Level-Aufstieg feiern, sobald das aktive Wesen ein neues Level erreicht.
  const activeStored = gameState?.creatures.find((entry) => entry.id === gameState.activeCreatureId)
  useEffect(() => {
    if (!activeStored || !profileId) {
      levelMemory.current = null
      return
    }
    const key = `${profileId}:${activeStored.id}`
    const previous = levelMemory.current
    levelMemory.current = { key, level: activeStored.level }
    if (previous?.key === key && activeStored.level > previous.level) {
      feedback.celebrate({
        eyebrow: 'Level-Aufstieg',
        title: `Level ${activeStored.level}!`,
        subtitle: activeStored.level >= 20 ? `${activeStored.name} hat das höchste Level erreicht.` : `${activeStored.name} ist gewachsen.`,
        art: <CreatureArt assetId={activeStored.assetId} mood="happy" />,
        tone: 'lilac',
      })
    }
  }, [activeStored?.id, activeStored?.level, profileId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateGameState(change: (state: GameState) => GameState): Promise<GameState | null> {
    if (!profileId || !database.current || savingRef.current) return null
    savingRef.current = true
    setSaving(true)
    try {
      const nextState = await mutateGameState(database.current, profileId, change)
      if (currentProfile.current === profileId) {
        stateRef.current = nextState
        setGameState(nextState)
        setError('')
        return nextState
      }
      return null
    } catch (cause) {
      if (currentProfile.current === profileId) {
        setError(cause instanceof Error ? cause.message : 'Änderungen konnten nicht gespeichert werden. Prüfe bitte den freien Speicherplatz.')
        feedback.haptic('warn')
      }
      return null
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  function navigate(next: View) {
    setDelivery(null)
    setDecorating(false)
    setHeld(null)
    setView(next)
    window.scrollTo?.({ top: 0 })
  }

  function switchProfile() {
    setProfileId(null)
    setGameState(null)
    setSheet(null)
    setDecorating(false)
    setHeld(null)
    setCoachDone(false)
    navigate('room')
  }

  /** Bildschirmpunkt über dem Wesen im Spielzimmer, für Partikel und Zahlen. */
  function stagePoint(x: number, y: number): Point | null {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: rect.left + rect.width * x / ROOM_LAYOUT.width, y: rect.top + rect.height * y / ROOM_LAYOUT.height }
  }
  const creaturePoint = () => stagePoint(ROOM_LAYOUT.creature.x, ROOM_LAYOUT.creature.y - 40)

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
      setDecorating(false)
      setDelivery({ runId, pilot })
      setReaction({ state: 'idle', key: 0 })
      setError('')
      feedback.haptic('tap')
      window.scrollTo?.({ top: 0 })
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
    if (next.lastDeliveryResult.success) feedback.haptic('success')
    return next.lastDeliveryResult
  }

  function tapSlot(slotId: SlotId) {
    const state = stateRef.current
    if (!state) return
    const slot = PLACEMENT_SLOTS.find((entry) => entry.id === slotId)
    const point = slot ? stagePoint(slot.x, slot.y - 20) : null
    const placed = state.house.placements[slotId]
    if (held && state.ownedItemIds.includes(held)) {
      const productId = held
      setHeld(null)
      void updateGameState((current) => placeItem(current, slotId, productId)).then((next) => {
        if (!next) return
        feedback.burst('puff', point, 9)
        feedback.haptic('tap')
        setSrMessage(`${findProduct(productId)?.name} steht jetzt: ${slot?.label}.`)
      })
    } else if (placed) {
      setHeld(placed)
      feedback.haptic('tap')
      void updateGameState((current) => removeItem(current, slotId)).then((next) => {
        if (next) setSrMessage(`${findProduct(placed)?.name} aufgehoben. Tippe auf einen Platz.`)
      })
    }
  }

  function tapObject(productId: string) {
    const interaction = findProduct(productId)?.interaction
    if (interaction) handleInteraction(interaction)
  }

  function handleInteraction(action: Interaction, origin?: Element | null) {
    if (savingRef.current) return
    const state = stateRef.current
    if (!state) return
    const next = interact(state, action, Date.now())
    if (next === state) {
      const text = 'Zum Spielen brauchst du mindestens 10 Energie. Schlafen hilft dir dabei.'
      feedback.toast(text, 'warn', 'bolt')
      feedback.haptic('warn')
      setSrMessage(text)
      if (origin instanceof HTMLElement) {
        origin.classList.remove('is-denied')
        void origin.offsetWidth
        origin.classList.add('is-denied')
      }
      return
    }
    const before = state.creatures.find((entry) => entry.id === state.activeCreatureId)
    const after = next.creatures.find((entry) => entry.id === next.activeCreatureId)
    const gained = (after?.xp ?? 0) - (before?.xp ?? 0)
    setReaction((previous) => ({ state: REACTIONS[action], key: previous.key + 1 }))
    setCoachDone(true)
    const point = creaturePoint()
    feedback.burst(BURSTS[action].kind, point, BURSTS[action].count)
    if (gained) feedback.floatText(`+${gained} XP`, point, 'xp')
    else feedback.floatText('XP-Pause', point, 'muted')
    feedback.haptic('tap')
    setSrMessage(gained ? `Schön gemacht! +${gained} XP.` : 'Dein Wesen freut sich! Neue XP gibt es nach einer kurzen Pause.')
    void updateGameState((latest) => interact(latest, action, Date.now()))
  }

  async function chooseStarter(id: CreatureId) {
    const next = await updateGameState((state) => selectCreature(state, id))
    const chosen = next?.creatures.find((entry) => entry.id === id)
    if (!chosen) return
    feedback.celebrate({
      eyebrow: 'Willkommen im Nest',
      title: `Hallo, ${chosen.name}!`,
      subtitle: `Dein ${chosen.species} zieht bei dir ein. Gib ihm gleich einen Namen.`,
      art: <CreatureArt assetId={chosen.assetId} mood="happy" />,
      action: 'Namen geben',
      onDone: () => setSheet({ type: 'creature', welcome: true }),
    })
  }

  async function activateCreature(id: CreatureId, announce = true) {
    const next = await updateGameState((state) => selectCreature(state, id))
    const friend = next?.creatures.find((entry) => entry.id === id)
    if (friend && announce) feedback.toast(`${friend.name} ist jetzt im Spielzimmer.`, 'success', 'nest')
    return friend
  }

  async function requestTaskDone(taskId: string, origin: Element) {
    const next = await updateGameState((state) => requestTask(state, taskId))
    if (!next) return
    feedback.burst('sparkle', origin, 7)
    feedback.haptic('tap')
    feedback.toast('Gemeldet! Jetzt bestätigt eine erwachsene Person.', 'success', 'hourglass')
  }

  function celebrateApproval(taskId: string, state: GameState) {
    const task = TASKS.find((entry) => entry.id === taskId)
    if (!task) return
    window.setTimeout(() => {
      const tile = document.querySelector(`[data-task-id="${taskId}"] .task-tile`)
      feedback.flyStars(tile, task.reward)
      feedback.burst('star', tile, 8)
      feedback.toast(`+${task.reward} ${task.reward === 1 ? 'Stern' : 'Sterne'} für „${task.title}“`, 'success', 'star')
      const summary = taskSummary(state, calendarDate())
      if (summary.completed === summary.total) {
        window.setTimeout(() => feedback.celebrate({
          eyebrow: 'Heute', title: 'Alle Aufgaben geschafft!',
          subtitle: 'Danke für deine Hilfe. Morgen gibt es neue Sterne zu verdienen.', icon: 'star', tone: 'gold',
        }), 900)
      }
    }, 120)
  }

  async function buyProduct(productId: string) {
    const next = await updateGameState((state) => purchaseProduct(state, productId))
    const ok = Boolean(next?.ownedItemIds.includes(productId))
    if (ok) feedback.haptic('success')
    return ok
  }

  async function meetNewCreature() {
    const state = stateRef.current
    const newest = state?.creatures[state.creatures.length - 1]
    setSheet(null)
    if (!newest) return
    navigate('room')
    const friend = await activateCreature(newest.id, false)
    if (friend) {
      feedback.celebrate({
        eyebrow: 'Neuer Freund', title: `${friend.name} ist eingezogen!`,
        subtitle: `Dein ${friend.species} hat eigene Bedürfnisse, Energie und XP.`,
        art: <CreatureArt assetId={friend.assetId} mood="happy" />, tone: 'mint',
      })
    }
  }

  async function rename(creatureId: CreatureId, name: string) {
    const next = await updateGameState((state) => renameCreature(state, creatureId, name))
    const saved = next?.creatures.find((entry) => entry.id === creatureId)?.name === name.trim()
    if (saved) {
      feedback.toast(`Schöner Name: ${name.trim()}`, 'success', 'pencil')
      feedback.burst('sparkle', document.querySelector('.nameplate'), 8)
    } else if (next) {
      feedback.toast('Der Name braucht 1 bis 24 Zeichen.', 'warn')
    }
    return saved
  }

  if (loading && !profileId) return <Splash text="Dein Fabelnest wird vorbereitet …" />

  if (!profileId) {
    return <ProfileScreen profiles={profiles.length ? profiles : DEFAULT_PROFILES} error={error}
      onSelect={(id) => { setError(''); setProfileId(id) }} />
  }

  if (loading) return <Splash text="Dein Spielzimmer wird geöffnet …" />

  if (!gameState) {
    return (
      <main className="splash">
        <p className="banner banner-error" role="alert">{error || 'Der Spielstand ist nicht verfügbar.'}</p>
        <button className="btn btn-primary btn-lg" onClick={() => { setProfileId(null); setError('') }}>
          Profil wechseln
        </button>
      </main>
    )
  }

  const profileIndex = Math.max(0, profiles.findIndex((profile) => profile.id === profileId))
  const activeProfile = profiles.find((profile) => profile.id === profileId)
  const creature = activeStored ? regenerateCreature(activeStored, now) : undefined
  const roomObjects: RoomObject[] = PLACEMENT_SLOTS.flatMap((slot) => {
    const product = findProduct(gameState.house.placements[slot.id] ?? '')
    return product ? [{
      productId: product.id, assetId: product.assetId, label: product.name,
      x: slot.x, y: slot.y, interactive: Boolean(product.interaction),
    }] : []
  })
  const tasks = taskSummary(gameState, today)
  const affordable = affordableProductCount(gameState)
  const badges: Partial<Record<View, NavBadge>> = {}
  if (tasks.pending) badges.tasks = { count: tasks.pending, tone: 'amber', label: `${tasks.pending} warten auf Elternfreigabe` }
  else if (tasks.open) badges.tasks = { count: tasks.open, tone: 'gold', label: `${tasks.open} offen` }
  if (affordable && creature) badges.shop = { count: affordable, tone: 'gold', label: `${affordable} kaufbar` }
  if (creature && lowNeeds(creature).length && view !== 'room') badges.room = { tone: 'amber', label: `${creature.name} braucht Pflege` }
  const productSheet = sheet?.type === 'product' ? findProduct(sheet.id) : undefined
  const focus = Boolean(delivery && view === 'room')

  return (
    <div className={`app-shell${focus ? ' is-focus' : ''}`}>
      {!focus && (
        <TopBar profileName={activeProfile?.name ?? 'Profil'} profileIndex={profileIndex} coins={gameState.coins}
          disabled={saving} onSwitchProfile={switchProfile} onOpenShop={() => navigate('shop')} />
      )}
      {!focus && <TabBar view={view} badges={badges} onNavigate={navigate} />}

      <main className="page" inert={saving} aria-busy={saving}>
        {error && (
          <p className="banner banner-error" role="alert">
            <Icon name="info" size={20} /> <span>{error}</span>
            <button className="icon-btn icon-btn-sm" onClick={() => setError('')} aria-label="Hinweis schließen"><Icon name="close" size={18} /></button>
          </p>
        )}
        <p className="sr-only" role="status" aria-live="polite">{srMessage}</p>

        <div key={focus ? 'flight' : view} className="view-transition">
          {!creature && view === 'room' && <StarterScreen onChoose={(id) => void chooseStarter(id)} />}

          {focus && delivery && (
            <PizzaDelivery key={delivery.runId} pilot={delivery.pilot}
              highscore={gameState.minigameHighscores[PIZZA_GAME_ID] ?? 0}
              canRetry={Boolean(creature && creature.energy >= FLIGHT.energyCost)}
              retryHint={creature ? `Genug Energie ist ${formatWait(msUntilEnergy(creature, FLIGHT.energyCost, now))} da.` : undefined}
              onFinish={saveDeliveryResult}
              onRetry={() => void launchDelivery()}
              onExit={() => setDelivery(null)} />
          )}

          {creature && !delivery && view === 'room' && (
            <NestScreen
              state={gameState} creature={creature} now={now} today={today}
              reaction={reaction} roomObjects={roomObjects} stageRef={stageRef}
              decorating={decorating} held={held} showCoach={!coachDone && creature.xp === 0}
              onInteract={handleInteraction}
              onObjectTap={tapObject}
              onSelectCreature={(id) => void activateCreature(id)}
              onOpenCreature={() => setSheet({ type: 'creature' })}
              onLaunchDelivery={() => void launchDelivery()}
              onDeliveryBlocked={(reason) => { feedback.toast(reason, 'warn', 'bolt'); feedback.haptic('warn') }}
              onDecorate={(active) => {
                setDecorating(active)
                setHeld(null)
                if (active) window.scrollTo?.({ top: 0, behavior: 'smooth' })
              }}
              onHold={setHeld}
              onTapSlot={tapSlot}
              onOpenShop={() => navigate('shop')}
            />
          )}

          {view === 'tasks' && (
            <TasksScreen state={gameState} today={today}
              onRequest={(taskId, origin) => void requestTaskDone(taskId, origin)}
              onApprove={(taskId) => setPinDialog({ taskId, date: today })}
              onManagePin={() => setPinDialog('change')}
              onShowHistory={() => setSheet({ type: 'history' })} />
          )}

          {view === 'shop' && (
            <ShopScreen state={gameState} hasCreature={Boolean(creature)} onOpen={(id) => setSheet({ type: 'product', id })} />
          )}

          {view === 'collection' && (
            <CollectionScreen state={gameState} activeId={creature?.id ?? null}
              onActivate={(id) => void activateCreature(id)}
              onOpenShopProduct={(id) => { navigate('shop'); setSheet({ type: 'product', id }) }} />
          )}
        </div>
      </main>

      {sheet?.type === 'creature' && creature && (
        <CreatureSheet key={creature.id} creature={creature} welcome={sheet.welcome}
          onRename={(name) => rename(creature.id, name)} onClose={() => setSheet(null)} />
      )}
      {productSheet && (
        <ProductSheet key={productSheet.id} product={productSheet} state={gameState}
          onBuy={() => buyProduct(productSheet.id)}
          onPlace={() => { setSheet(null); navigate('room'); setDecorating(true); setHeld(productSheet.id) }}
          onMeet={() => void meetNewCreature()}
          onEarn={() => { setSheet(null); navigate('tasks') }}
          onChooseStarter={() => { setSheet(null); navigate('room') }}
          onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'history' && <BookingHistorySheet bookings={gameState.starBookings} onClose={() => setSheet(null)} />}

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
            celebrateApproval(pinDialog.taskId, next)
          }}
        />
      )}
    </div>
  )
}
