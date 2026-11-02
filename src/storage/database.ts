import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DEFAULT_PROFILES } from '../data/gameContent'
import { createInitialGameState, GAME_STATE_VERSION } from '../game/gameLogic'
import type { GameState, PlayerProfile, ProfileId } from '../models'

const DATABASE_NAME = 'fabelnest'
const DATABASE_VERSION = 1

interface FabelnestDatabase extends DBSchema {
  profiles: {
    key: ProfileId
    value: PlayerProfile
  }
  gameStates: {
    key: ProfileId
    value: GameState
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
  const savedState = await database.get('gameStates', profileId)
  if (!savedState) {
    const newState = createInitialGameState()
    await database.put('gameStates', newState, profileId)
    return newState
  }

  if (savedState.schemaVersion > GAME_STATE_VERSION) {
    throw new Error('Dieser Spielstand wurde mit einer neueren Version erstellt.')
  }

  if (savedState.schemaVersion !== GAME_STATE_VERSION) {
    const migratedState = { ...createInitialGameState(), ...savedState, schemaVersion: GAME_STATE_VERSION }
    await database.put('gameStates', migratedState, profileId)
    return migratedState
  }

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
  await database.put('gameStates', state, profileId)
}
