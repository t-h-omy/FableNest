import { CREATURES, DEFAULT_PROFILES, SHOP_ITEMS, TASKS } from '../data/gameContent'
import type { GameState, Item, ProfileId } from '../models'

export const GAME_STATE_VERSION = 1

export function createInitialGameState(creatureId?: string): GameState {
  const creature = CREATURES.find((entry) => entry.id === creatureId) ?? CREATURES[0]

  return {
    schemaVersion: GAME_STATE_VERSION,
    coins: 20,
    creature: { ...creature },
    house: { level: 1, decorItemIds: [] },
    ownedItemIds: [],
    completedTaskIds: [],
  }
}

export function completeTask(state: GameState, taskId: string): GameState {
  const task = TASKS.find((entry) => entry.id === taskId)
  if (!task || state.completedTaskIds.includes(taskId)) return state

  return {
    ...state,
    coins: state.coins + task.reward,
    completedTaskIds: [...state.completedTaskIds, taskId],
  }
}

export function purchaseItem(state: GameState, item: Item): GameState {
  if (state.ownedItemIds.includes(item.id) || state.coins < item.price) return state

  const isDecoration = item.category === 'decor'
  return {
    ...state,
    coins: state.coins - item.price,
    ownedItemIds: [...state.ownedItemIds, item.id],
    house: isDecoration
      ? { ...state.house, decorItemIds: [...state.house.decorItemIds, item.id] }
      : state.house,
    creature:
      item.category === 'care'
        ? { ...state.creature, energy: Math.min(100, state.creature.energy + 20) }
        : state.creature,
  }
}

export function selectCreature(state: GameState, creatureId: string): GameState {
  const creature = CREATURES.find((entry) => entry.id === creatureId)
  if (!creature) return state
  return { ...state, creature: { ...creature } }
}

export function profileLabel(profileId: ProfileId): string {
  return DEFAULT_PROFILES.find((profile) => profile.id === profileId)?.name ?? 'Profil'
}

export function itemById(itemId: string): Item | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId)
}
