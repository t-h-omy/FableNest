import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { deleteDB } from 'idb'
import { ensureProfiles, loadGameState, openGameDatabase, saveGameState } from '../src/storage/database'
import { DEFAULT_PROFILES } from '../src/data/gameContent'
import { purchaseProduct } from '../src/game/shop'
import { createInitialGameState, GAME_STATE_VERSION, interact, renameCreature, selectCreature } from '../src/game/gameLogic'

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
    expect(reloadedFirst.schemaVersion).toBe(GAME_STATE_VERSION)
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
    await expect(saveGameState(database, 'player-1', migratedState)).rejects.toThrow()
    expect(await database.get('gameStates', 'player-1')).toEqual(futureState)
    database.close()
  })

  it.each([
    ['mika', 'creature_01'],
    ['lumi', 'creature_02'],
    ['pippin', 'creature_02'],
  ])('migrates legacy %s without losing progress', async (legacyId, migratedId) => {
    const name = `fabelnest-legacy-${Math.random()}`
    databaseNames.push(name)
    const database = await openGameDatabase(name)
    await database.put('gameStates', {
      schemaVersion: 1, coins: 42, house: { level: 2, decorItemIds: ['pink-cushion'] },
      ownedItemIds: ['pink-cushion'], completedTaskIds: ['read-book'],
      creature: { id: legacyId, name: 'Funkel', species: 'Wolkenfuchs', assetId: 'creature-mika', energy: 12, happiness: 34 },
    }, 'player-1')
    const migrated = await loadGameState(database, 'player-1')
    expect(migrated.schemaVersion).toBe(GAME_STATE_VERSION)
    expect(migrated.coins).toBe(54)
    expect(migrated.ownedItemIds).toEqual([])
    expect(migrated.house.placements).toEqual({})
    expect(migrated.completedTaskIds).toEqual(['read-book'])
    expect(migrated.creatures).toHaveLength(1)
    expect(migrated.creatures[0]).toMatchObject({
      id: migratedId, name: 'Funkel', energy: 12, happiness: 34, xp: 0, level: 1, satiety: 70,
    })
    expect(await database.get('gameStates', 'player-1')).toEqual(migrated)
    database.close()
  })

  it('restores names, active creature, individual levels, needs and cooldowns after reopening', async () => {
    const name = `fabelnest-creatures-${Math.random()}`
    databaseNames.push(name)
    const database = await openGameDatabase(name)
    const initial = { ...createInitialGameState('creature_02'), coins: 50 }
    const acquired = purchaseProduct(initial, 'second-creature')
    const named = renameCreature(acquired, 'creature_01', 'Stern')
    let state = selectCreature(named, 'creature_01')
    for (let time = 0; time < 300_000; time += 15_000) state = interact(state, 'pet', time)
    state = interact(state, 'play', 300_000)
    await saveGameState(database, 'player-1', state)
    database.close()
    const reopened = await openGameDatabase(name)
    const restored = await loadGameState(reopened, 'player-1')
    expect(restored).toEqual(state)
    expect(restored.creatures[1].level).toBe(2)
    expect(restored.creatures[0].level).toBe(1)
    expect(interact(restored, 'pet', 285_001).creatures[1].xp).toBe(restored.creatures[1].xp)
    expect((await loadGameState(reopened, 'player-2')).creatures).toEqual([])
    reopened.close()
  })
})
