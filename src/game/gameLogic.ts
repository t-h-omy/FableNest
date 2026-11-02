import { CREATURES, INTERACTIONS } from '../data/gameContent'
import { MINIGAMES } from '../data/minigames'
import { addXp, regenerateCreature } from './progression'
import type { Creature, CreatureDefinition, GameState, Interaction } from '../models'

export const GAME_STATE_VERSION = 5
export const MAX_LEVEL = 20
export const XP_PER_LEVEL = 100

export function createCreature(definition: CreatureDefinition): Creature {
  return {
    id: definition.id, name: definition.name, species: definition.species,
    assetId: definition.assetId, happiness: 80, energy: 75, satiety: 70,
    xp: 0, level: 1, lastXpAt: {}, energyUpdatedAt: Date.now(), deliveryXpDates: {},
  }
}

export function createInitialGameState(creatureId?: string): GameState {
  const definition = CREATURES.find((entry) => entry.id === creatureId)

  return {
    schemaVersion: GAME_STATE_VERSION,
    coins: 0,
    creatures: definition ? [createCreature(definition)] : [],
    activeCreatureId: definition?.id ?? null,
    house: { level: 1, placements: {} },
    ownedItemIds: [],
    completedTaskIds: [],
    taskRequests: [],
    starBookings: [],
    unlockedMinigameIds: MINIGAMES.filter((game) => game.unlockedByDefault).map((game) => game.id),
    minigameHighscores: {},
    pendingDelivery: null,
    lastDeliveryResult: null,
  }
}

export function selectCreature(state: GameState, creatureId: string): GameState {
  const definition = CREATURES.find((entry) => entry.id === creatureId)
  if (!definition) return state
  if (!state.creatures.length) {
    return { ...state, creatures: [createCreature(definition)], activeCreatureId: definition.id }
  }
  if (!state.creatures.some((creature) => creature.id === creatureId)) return state
  return { ...state, activeCreatureId: definition.id }
}

export function renameCreature(state: GameState, creatureId: string, name: string): GameState {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 24) return state
  return { ...state, creatures: state.creatures.map((creature) =>
    creature.id === creatureId ? { ...creature, name: trimmed } : creature) }
}

export function interact(state: GameState, action: Interaction, now: number): GameState {
  const rule = INTERACTIONS[action]
  const stored = state.creatures.find((creature) => creature.id === state.activeCreatureId)
  if (!stored || !Number.isFinite(now) || now < 0) return state
  const active = regenerateCreature(stored, now)
  if (active.energy + rule.energy < 0) return state
  const last = active.lastXpAt[action]
  const reward = last === undefined || now - last >= rule.cooldownMs
  const clamp = (value: number) => Math.max(0, Math.min(100, value))
  return {
    ...state,
    creatures: state.creatures.map((creature) => creature.id !== active.id ? creature : {
      ...addXp(active, reward ? rule.xp : 0),
      energy: clamp(active.energy + rule.energy),
      energyUpdatedAt: rule.energy ? Math.max(active.energyUpdatedAt, now) : active.energyUpdatedAt,
      happiness: clamp(creature.happiness + rule.happiness),
      satiety: clamp(creature.satiety + rule.satiety),
      lastXpAt: reward ? { ...creature.lastXpAt, [action]: now } : creature.lastXpAt,
    }),
  }
}
