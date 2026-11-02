import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { CREATURES, DEFAULT_PROFILES } from '../data/gameContent'
import { SHOP_PRODUCTS } from '../data/shop'
import { createCreature, createInitialGameState, GAME_STATE_VERSION } from '../game/gameLogic'
import { approveTask } from '../game/tasks'
import { createParentPin, verifyParentPin } from './parentPin'
import type { Creature, GameState, ParentPin, PlayerProfile, ProfileId } from '../models'

const DATABASE_NAME = 'fabelnest'
const DATABASE_VERSION = 2

interface LegacyHouse {
  level: number
  decorItemIds: string[]
}

interface PreviousGameState extends Omit<GameState, 'house' | 'taskRequests' | 'starBookings'> {
  house: LegacyHouse | GameState['house']
  taskRequests?: GameState['taskRequests']
  starBookings?: GameState['starBookings']
}

interface LegacyGameState extends Omit<PreviousGameState, 'creatures' | 'activeCreatureId' | 'house'> {
  house: LegacyHouse
  creature: Pick<Creature, 'name' | 'species' | 'assetId' | 'happiness' | 'energy'> & { id: string }
}

// Preise der früheren Shop-Gegenstände, damit frühere Käufe als Sterne zurückerstattet werden.
const LEGACY_ITEM_PRICES: Record<string, number> = { 'pink-cushion': 12, 'moon-lamp': 18, 'berry-snack': 8 }

function isCurrentState(state: GameState | PreviousGameState | LegacyGameState): state is GameState {
  return state.schemaVersion === GAME_STATE_VERSION && 'creatures' in state &&
    'taskRequests' in state && 'starBookings' in state && 'placements' in state.house
}

type UpgradableState = Pick<GameState, 'coins' | 'ownedItemIds' | 'completedTaskIds'> & {
  house: { level: number }
  taskRequests?: GameState['taskRequests']
  starBookings?: GameState['starBookings']
}

function upgradeToCurrent(old: UpgradableState, creatures: Creature[], activeCreatureId: GameState['activeCreatureId']): GameState {
  const known = new Set(SHOP_PRODUCTS.map((product) => product.id))
  const refund = old.ownedItemIds.reduce((sum, id) => sum + (known.has(id) ? 0 : LEGACY_ITEM_PRICES[id] ?? 0), 0)
  const ownedItemIds = old.ownedItemIds.filter((id) => known.has(id))
  if (creatures.length > 1 && !ownedItemIds.includes('second-creature')) ownedItemIds.push('second-creature')
  return {
    schemaVersion: GAME_STATE_VERSION,
    coins: old.coins + refund,
    creatures,
    activeCreatureId,
    house: { level: old.house.level, placements: {} },
    ownedItemIds,
    completedTaskIds: old.completedTaskIds,
    taskRequests: old.taskRequests ?? [],
    starBookings: old.starBookings ?? [],
  }
}

interface FabelnestDatabase extends DBSchema {
  profiles: {
    key: ProfileId
    value: PlayerProfile
  }
  gameStates: {
    key: ProfileId
    value: GameState | PreviousGameState | LegacyGameState
  }
  settings: {
    key: 'parentPin'
    value: ParentPin
  }
}

export function openGameDatabase(name = DATABASE_NAME): Promise<IDBPDatabase<FabelnestDatabase>> {
  return openDB<FabelnestDatabase>(name, DATABASE_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('profiles')) {
        database.createObjectStore('profiles', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('gameStates')) {
        database.createObjectStore('gameStates')
      }
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings')
      }
    },
  })
}

export async function ensureProfiles(database: IDBPDatabase<FabelnestDatabase>): Promise<PlayerProfile[]> {
  const transaction = database.transaction('profiles', 'readwrite')
  const store = transaction.objectStore('profiles')
  const profiles: PlayerProfile[] = []

  for (const profile of DEFAULT_PROFILES) {
    const storedProfile = await store.get(profile.id)
    if (!storedProfile) await store.put(profile)
    profiles.push(storedProfile ?? profile)
  }

  await transaction.done
  return profiles
}

export async function loadGameState(
  database: IDBPDatabase<FabelnestDatabase>,
  profileId: ProfileId,
): Promise<GameState> {
  const transaction = database.transaction('gameStates', 'readwrite')
  const savedState = await transaction.store.get(profileId)
  if (!savedState) {
    const newState = createInitialGameState()
    await transaction.store.put(newState, profileId)
    await transaction.done
    return newState
  }

  if (savedState.schemaVersion > GAME_STATE_VERSION) {
    await transaction.done
    throw new Error('Dieser Spielstand wurde mit einer neueren Version erstellt.')
  }

  if (savedState.schemaVersion !== GAME_STATE_VERSION) {
    if (![0, 1, 2, 3].includes(savedState.schemaVersion)) {
      await transaction.done
      throw new Error('Der Spielstand hat eine nicht unterstützte Version.')
    }
    let migratedState: GameState
    if ('creature' in savedState) {
      const old = savedState.creature
      const legacyIds: Record<string, string> = {
        mika: 'creature_01', lumi: 'creature_02', pippin: 'creature_02',
        creature_01: 'creature_01', creature_02: 'creature_02',
      }
      const definition = CREATURES.find((entry) => entry.id === legacyIds[old.id])
      if (!definition) {
        await transaction.done
        throw new Error('Das gespeicherte Wesen ist unbekannt. Dein Spielstand bleibt unverändert.')
      }
      const creature = {
        ...createCreature(definition), name: old.name,
        energy: old.energy, happiness: old.happiness,
      }
      migratedState = upgradeToCurrent(savedState, [creature], creature.id)
    } else {
      migratedState = upgradeToCurrent(savedState, savedState.creatures, savedState.activeCreatureId)
    }
    await transaction.store.put(migratedState, profileId)
    await transaction.done
    return migratedState
  }

  await transaction.done
  if (!isCurrentState(savedState)) {
    throw new Error('Der Spielstand ist unvollständig.')
  }
  return savedState
}

export async function hasParentPin(database: IDBPDatabase<FabelnestDatabase>): Promise<boolean> {
  return (await database.get('settings', 'parentPin')) !== undefined
}

export async function setParentPin(
  database: IDBPDatabase<FabelnestDatabase>,
  pin: string,
  previousPin?: string,
): Promise<void> {
  const previous = await database.get('settings', 'parentPin')
  if (previous) await verifyParentPin(previousPin ?? '', previous)
  const next = await createParentPin(pin)
  const transaction = database.transaction('settings', 'readwrite')
  const current = await transaction.store.get('parentPin')
  if (current?.hash !== previous?.hash || current?.salt !== previous?.salt) {
    await transaction.done
    throw new Error('Der Eltern-PIN wurde inzwischen geändert. Bitte versuche es erneut.')
  }
  await transaction.store.put(next, 'parentPin')
  await transaction.done
}

export async function mutateGameState(
  database: IDBPDatabase<FabelnestDatabase>,
  profileId: ProfileId,
  change: (state: GameState) => GameState,
  approval?: { pin: string; taskId: string; date: string },
): Promise<GameState> {
  const checkedPin = approval ? await database.get('settings', 'parentPin') : undefined
  if (approval) {
    if (!checkedPin) throw new Error('Bitte lege zuerst einen Eltern-PIN fest.')
    await verifyParentPin(approval.pin, checkedPin)
  }
  const transaction = database.transaction(['gameStates', 'settings'], 'readwrite')
  const stored = await transaction.objectStore('gameStates').get(profileId)
  const currentPin = approval ? await transaction.objectStore('settings').get('parentPin') : undefined
  if (approval && (currentPin?.hash !== checkedPin?.hash || currentPin?.salt !== checkedPin?.salt)) {
    await transaction.done
    throw new Error('Der Eltern-PIN wurde inzwischen geändert. Bitte versuche es erneut.')
  }
  if (!stored || !isCurrentState(stored)) {
    await transaction.done
    throw new Error('Der Spielstand muss erneut geladen werden. Er wurde nicht überschrieben.')
  }
  let next: GameState
  try {
    next = approval ? approveTask(stored, approval.taskId, approval.date) : change(stored)
  } catch (cause) {
    await transaction.done
    throw cause
  }
  await transaction.objectStore('gameStates').put(next, profileId)
  await transaction.done
  return next
}

export async function confirmTask(
  database: IDBPDatabase<FabelnestDatabase>,
  profileId: ProfileId,
  taskId: string,
  date: string,
  pin: string,
): Promise<GameState> {
  return mutateGameState(database, profileId, (state) => state, { pin, taskId, date })
}

export async function saveGameState(
  database: IDBPDatabase<FabelnestDatabase>,
  profileId: ProfileId,
  state: GameState,
): Promise<void> {
  if (state.schemaVersion !== GAME_STATE_VERSION) {
    throw new Error('Der Spielstand hat eine nicht unterstützte Version.')
  }
  const transaction = database.transaction('gameStates', 'readwrite')
  const storedState = await transaction.store.get(profileId)
  if (storedState && storedState.schemaVersion > GAME_STATE_VERSION) {
    await transaction.done
    throw new Error('Ein neuerer Spielstand darf nicht überschrieben werden.')
  }
  await transaction.store.put(state, profileId)
  await transaction.done
}
