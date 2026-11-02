import { FLIGHT, MINIGAMES, PIZZA_GAME_ID } from '../data/minigames'
import type { FlightEntity, FlightLane, FlightState, GameState } from '../models'
import { addXp, regenerateEnergy } from './progression'
import { calendarDate } from './tasks'

export interface Hitbox { x: number; y: number; width: number; height: number }

export function overlaps(a: Hitbox, b: Hitbox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y
}

export function flightHitbox(x: number, lane: FlightLane, topping = false): Hitbox {
  const width = topping ? 26 : 64
  const height = topping ? 26 : 42
  return { x: x - width / 2, y: FLIGHT.laneY[lane] - height / 2, width, height }
}

export function createCourse(): FlightEntity[] {
  const entities: FlightEntity[] = []
  for (let distance = FLIGHT.firstObstacle, wave = 0; distance < FLIGHT.distance - 450; distance += FLIGHT.obstacleSpacing, wave++) {
    const lane = (wave * 2 % 3) as FlightLane
    // Only one blocked lane per wave; the gap allows two adjacent lane changes.
    entities.push({ id: entities.length, kind: wave % 2 ? 'toilet' : 'cow', lane, distance, removed: false })
    entities.push({
      id: entities.length, kind: 'topping', lane: ((lane + 1) % 3) as FlightLane,
      distance, removed: false,
    })
  }
  return entities
}

export function createFlight(): FlightState {
  return {
    phase: 'countdown', phaseTime: 0, distance: 0, lane: 1, moveCooldown: 0,
    lives: 3, invulnerable: 0, toppings: 0, score: 0, entities: createCourse(),
  }
}

export function moveFlight(state: FlightState, direction: -1 | 1): FlightState {
  if (state.phase !== 'flying' || state.moveCooldown > 0) return state
  const lane = Math.max(0, Math.min(2, state.lane + direction)) as FlightLane
  return lane === state.lane ? state : { ...state, lane, moveCooldown: FLIGHT.laneChangeSeconds }
}

function step(state: FlightState, seconds: number): FlightState {
  if (state.phase === 'won' || state.phase === 'lost') return state
  const next = {
    ...state, phaseTime: state.phaseTime + seconds,
    moveCooldown: state.moveCooldown - seconds < 1e-9 ? 0 : state.moveCooldown - seconds,
    invulnerable: state.invulnerable - seconds < 1e-9 ? 0 : state.invulnerable - seconds,
  }
  if (state.phase === 'countdown') {
    if (next.phaseTime + 1e-9 >= FLIGHT.countdownSeconds) {
      next.phase = 'flying'
      next.phaseTime = 0
    }
    return next
  }
  if (state.phase === 'delivering') {
    if (next.phaseTime + 1e-9 >= FLIGHT.deliverySeconds) {
      next.phase = 'won'
      next.phaseTime = 0
    }
    return next
  }
  next.distance = Math.min(FLIGHT.distance, state.distance + FLIGHT.speed * seconds)
  const player = flightHitbox(FLIGHT.playerX, next.lane)
  next.entities = state.entities.map((entity) => {
    if (entity.removed) return entity
    const x = FLIGHT.playerX + entity.distance - next.distance
    if (overlaps(player, flightHitbox(x, entity.lane, entity.kind === 'topping'))) {
      if (entity.kind === 'topping') {
        next.toppings++
        next.score += FLIGHT.scorePerTopping
      } else if (next.invulnerable === 0) {
        next.lives--
        next.invulnerable = FLIGHT.invulnerabilitySeconds
      }
      return { ...entity, removed: true }
    }
    return entity
  })
  if (next.lives <= 0) {
    next.phase = 'lost'
    next.phaseTime = 0
  } else if (next.distance + 1e-7 >= FLIGHT.distance) {
    next.distance = FLIGHT.distance
    next.phase = 'delivering'
    next.phaseTime = 0
  }
  return next
}

export function advanceFlight(state: FlightState, seconds: number): FlightState {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Die Flugzeit ist ungültig.')
  // Substeps prevent tunnelling and keep damage consistent even on slow displays.
  let next = state
  let remaining = seconds
  while (remaining > 1e-9 && next.phase !== 'won' && next.phase !== 'lost') {
    const untilTransition = next.phase === 'countdown' ? FLIGHT.countdownSeconds - next.phaseTime
      : next.phase === 'delivering' ? FLIGHT.deliverySeconds - next.phaseTime
        : (FLIGHT.distance - next.distance) / FLIGHT.speed
    const delta = Math.min(remaining, 1 / 120, Math.max(0, untilTransition))
    next = step(next, delta)
    remaining -= delta
  }
  return next
}

export function isMinigameUnlocked(state: GameState, id: string): boolean {
  const definition = MINIGAMES.find((game) => game.id === id)
  return Boolean(definition && (definition.unlockedByDefault || state.unlockedMinigameIds.includes(id)))
}

export function startDelivery(state: GameState, runId: string, now: number): GameState {
  if (!runId || state.pendingDelivery?.runId === runId) throw new Error('Diese Lieferung wurde bereits gestartet.')
  if (!isMinigameUnlocked(state, PIZZA_GAME_ID)) throw new Error('Dieses Minispiel ist noch gesperrt.')
  const refreshed = regenerateEnergy(state, now)
  const pilot = refreshed.creatures.find((creature) => creature.id === state.activeCreatureId)
  if (!pilot) throw new Error('Wähle zuerst ein Wesen als Pilot.')
  if (pilot.energy < FLIGHT.energyCost) throw new Error('Für den Flug brauchst du 20 Energie. Schlafen oder eine Pause helfen.')
  return {
    ...refreshed,
    creatures: refreshed.creatures.map((creature) => creature.id === pilot.id
      ? { ...creature, energy: creature.energy - FLIGHT.energyCost, energyUpdatedAt: Math.max(now, creature.energyUpdatedAt) }
      : creature),
    pendingDelivery: { runId, creatureId: pilot.id },
    lastDeliveryResult: null,
  }
}

export function finishDelivery(state: GameState, runId: string, flight: FlightState, now: number): GameState {
  if (state.lastDeliveryResult?.runId === runId) return state
  const pending = state.pendingDelivery
  if (!pending || pending.runId !== runId) throw new Error('Diese Lieferung ist nicht mehr aktiv. Das Ergebnis wurde nicht gebucht.')
  if (flight.phase !== 'won' && flight.phase !== 'lost') throw new Error('Die Lieferung ist noch nicht abgeschlossen.')
  if (state.activeCreatureId !== pending.creatureId) throw new Error('Das aktive Wesen wurde inzwischen gewechselt. Das Ergebnis wurde nicht gebucht.')
  const pilot = state.creatures.find((creature) => creature.id === pending.creatureId)
  if (!pilot) throw new Error('Der Pilot konnte nicht gefunden werden.')
  const success = flight.phase === 'won'
  const date = calendarDate(new Date(now))
  const count = pilot.deliveryXpDates[date] ?? 0
  const reward = success && count < FLIGHT.dailyDeliveries
    ? Math.min(FLIGHT.maxXp, FLIGHT.baseXp + FLIGHT.toppingXp * flight.toppings) : 0
  const rewarded = addXp(pilot, reward)
  return {
    ...state,
    creatures: state.creatures.map((creature) => creature.id !== pilot.id ? creature : {
      ...rewarded,
      deliveryXpDates: reward ? { ...pilot.deliveryXpDates, [date]: count + 1 } : pilot.deliveryXpDates,
    }),
    pendingDelivery: null,
    minigameHighscores: {
      ...state.minigameHighscores,
      [PIZZA_GAME_ID]: Math.max(state.minigameHighscores[PIZZA_GAME_ID] ?? 0, flight.score),
    },
    lastDeliveryResult: { runId, success, toppings: flight.toppings, score: flight.score, xp: rewarded.xp - pilot.xp },
  }
}
