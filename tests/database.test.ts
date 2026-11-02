import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { deleteDB } from 'idb'
import { ensureProfiles, loadGameState, openGameDatabase, saveGameState } from '../src/storage/database'
import { DEFAULT_PROFILES } from '../src/data/gameContent'
import { GAME_STATE_VERSION } from '../src/game/gameLogic'

const databaseNames: string[] = []

afterEach(async () => {
  await Promise.all(databaseNames.splice(0).map((name) => deleteDB(name)))
})

describe('local profile storage', () => {
  it('creates two independent profiles and reloads each versioned save', async () => {
    const name = `fabelnest-test-${Math.random()}`
    databaseNames.push(name)
    const database = await openGameDatabase(name)

    expect(await ensureProfiles(database)).toEqual(DEFAULT_PROFILES)
    const firstSave = await loadGameState(database, 'player-1')
    const secondSave = await loadGameState(database, 'player-2')
    await saveGameState(database, 'player-1', { ...firstSave, coins: 48 })
    database.close()

    const reopenedDatabase = await openGameDatabase(name)
    const reloadedFirst = await loadGameState(reopenedDatabase, 'player-1')
    const reloadedSecond = await loadGameState(reopenedDatabase, 'player-2')

    expect(reloadedFirst.coins).toBe(48)
    expect(reloadedFirst.schemaVersion).toBe(1)
    expect(reloadedSecond.coins).toBe(secondSave.coins)
    reopenedDatabase.close()
  })

  it('migrates older saves and preserves unknown newer saves', async () => {
    const name = `fabelnest-version-test-${Math.random()}`
    databaseNames.push(name)
    const database = await openGameDatabase(name)
    const oldState = { ...(await loadGameState(database, 'player-1')), schemaVersion: 0, coins: 34 }
    await database.put('gameStates', oldState, 'player-1')

    const migratedState = await loadGameState(database, 'player-1')
    expect(migratedState.schemaVersion).toBe(GAME_STATE_VERSION)
    expect(migratedState.coins).toBe(34)

    const futureState = { ...migratedState, schemaVersion: GAME_STATE_VERSION + 1, coins: 99 }
    await database.put('gameStates', futureState, 'player-1')
    await expect(loadGameState(database, 'player-1')).rejects.toThrow()
    expect(await database.get('gameStates', 'player-1')).toEqual(futureState)
    database.close()
  })
})
