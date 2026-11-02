import { CREATURES, INTERACTIONS } from '../data/gameContent'
import type { Creature, CreatureDefinition, GameState, Interaction, Item } from '../models'

export const GAME_STATE_VERSION = 3
export const MAX_LEVEL = 20
export const XP_PER_LEVEL = 100

export function createCreature(definition: CreatureDefinition): Creature {
  return {
    id: definition.id, name: definition.name, species: definition.species,
    assetId: definition.assetId, happiness: 80, energy: 75, satiety: 70,
    xp: 0, level: 1, lastXpAt: {},
  }
}

export function createInitialGameState(creatureId?: string): GameState {
  const definition = CREATURES.find((entry) => entry.id === creatureId)

  return {
    schemaVersion: GAME_STATE_VERSION,
    coins: 0,
    creatures: definition ? [createCreature(definition)] : [],
    activeCreatureId: definition?.id ?? null,
    house: { level: 1, decorItemIds: [] },
    ownedItemIds: [],
    completedTaskIds: [],
    taskRequests: [],
    starBookings: [],
  }
}

export function purchaseItem(state: GameState, item: Item): GameState {
  if (!Number.isSafeInteger(item.price) || item.price < 0 ||
    state.ownedItemIds.includes(item.id) || state.coins < item.price) return state

  const isDecoration = item.category === 'decor'
  return {
    ...state,
    coins: state.coins - item.price,
    ownedItemIds: [...state.ownedItemIds, item.id],
    house: isDecoration
      ? { ...state.house, decorItemIds: [...state.house.decorItemIds, item.id] }
      : state.house,
    creatures: state.creatures.map((creature) =>
      item.category === 'care' && creature.id === state.activeCreatureId
        ? { ...creature, energy: Math.min(100, creature.energy + 20) }
        : creature),
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

export function purchaseCreature(state: GameState, creatureId: string): GameState {
  const definition = CREATURES.find((entry) => entry.id === creatureId)
  if (!definition || !state.creatures.length || state.coins < definition.price ||
    state.creatures.some((creature) => creature.id === creatureId)) return state
  return {
    ...state, coins: state.coins - definition.price,
    creatures: [...state.creatures, createCreature(definition)],
  }
}

export function renameCreature(state: GameState, creatureId: string, name: string): GameState {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 24) return state
  return { ...state, creatures: state.creatures.map((creature) =>
    creature.id === creatureId ? { ...creature, name: trimmed } : creature) }
}

export function interact(state: GameState, action: Interaction, now: number): GameState {
  const rule = INTERACTIONS[action]
  const active = state.creatures.find((creature) => creature.id === state.activeCreatureId)
  if (!active || active.energy + rule.energy < 0 || !Number.isFinite(now) || now < 0) return state
  const last = active.lastXpAt[action]
  const reward = last === undefined || now - last >= rule.cooldownMs
  const xp = Math.min((MAX_LEVEL - 1) * XP_PER_LEVEL, active.xp + (reward ? rule.xp : 0))
  const clamp = (value: number) => Math.max(0, Math.min(100, value))
  return {
    ...state,
    creatures: state.creatures.map((creature) => creature.id !== active.id ? creature : {
      ...creature, xp, level: Math.min(MAX_LEVEL, 1 + Math.floor(xp / XP_PER_LEVEL)),
      energy: clamp(creature.energy + rule.energy),
      happiness: clamp(creature.happiness + rule.happiness),
      satiety: clamp(creature.satiety + rule.satiety),
      lastXpAt: reward ? { ...creature.lastXpAt, [action]: now } : creature.lastXpAt,
    }),
  }
}
