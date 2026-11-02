import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { CREATURES, DEFAULT_PROFILES } from '../data/gameContent'
import { createCreature, createInitialGameState, GAME_STATE_VERSION } from '../game/gameLogic'
import type { Creature, GameState, PlayerProfile, ProfileId } from '../models'

const DATABASE_NAME = 'fabelnest'
const DATABASE_VERSION = 1

interface LegacyGameState extends Omit<GameState, 'creatures' | 'activeCreatureId'> {
  creature: Pick<Creature, 'name' | 'species' | 'assetId' | 'happiness' | 'energy'> & { id: string }
}

interface FabelnestDatabase extends DBSchema {
  profiles: {
    key: ProfileId
    value: PlayerProfile
  }
  gameStates: {
    key: ProfileId
    value: GameState | LegacyGameState
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
    if (savedState.schemaVersion !== 0 && savedState.schemaVersion !== 1) {
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
      migratedState = {
        schemaVersion: GAME_STATE_VERSION, coins: savedState.coins,
        house: savedState.house, ownedItemIds: savedState.ownedItemIds,
        completedTaskIds: savedState.completedTaskIds,
        creatures: [creature], activeCreatureId: creature.id,
      }
    } else {
      migratedState = { ...savedState, schemaVersion: GAME_STATE_VERSION }
    }
    await transaction.store.put(migratedState, profileId)
    await transaction.done
    return migratedState
  }

  await transaction.done
  if (!('creatures' in savedState)) throw new Error('Der Spielstand ist unvollständig.')
  return savedState
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
