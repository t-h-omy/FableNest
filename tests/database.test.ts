import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { deleteDB } from 'idb'
import { ensureProfiles, loadGameState, openGameDatabase, saveGameState } from '../src/storage/database'
import { DEFAULT_PROFILES } from '../src/data/gameContent'

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
})
