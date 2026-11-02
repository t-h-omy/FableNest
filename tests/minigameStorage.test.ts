import 'fake-indexeddb/auto'
import { deleteDB } from 'idb'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialGameState, GAME_STATE_VERSION } from '../src/game/gameLogic'
import { createFlight, finishDelivery, startDelivery } from '../src/game/pizzaFlight'
import { PIZZA_GAME_ID } from '../src/data/minigames'
import { calendarDate } from '../src/game/tasks'
import { loadGameState, mutateGameState, openGameDatabase } from '../src/storage/database'
import type { FlightState } from '../src/models'

const names: string[] = []
const now = new Date(2026, 10, 2, 12).getTime()
afterEach(async () => {
  vi.useRealTimers()
  await Promise.all(names.splice(0).map((name) => deleteDB(name)))
})
async function setup() {
  const name = `pizza-storage-${Math.random()}`
  names.push(name)
  return { name, database: await openGameDatabase(name) }
}
const won: FlightState = { ...createFlight(), phase: 'won', toppings: 5, score: 50 }

describe('persistent deliveries', () => {
  it('migrates schema 4 without losing room placements, creatures, balances or task history', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now)
    const { database } = await setup()
    const current = createInitialGameState('creature_01')
    const { energyUpdatedAt: _time, deliveryXpDates: _dates, ...oldCreature } = current.creatures[0]
    const old = {
      schemaVersion: 4, coins: 17, creatures: [{ ...oldCreature, xp: 138, level: 2 }],
      activeCreatureId: current.activeCreatureId,
      house: { level: 2, placements: { 'wall-shelf': 'star-lamp' as const } },
      ownedItemIds: ['star-lamp', 'play-ball'], completedTaskIds: ['old'],
      taskRequests: [{ taskId: 'clear-plates', date: '2026-11-02' }],
      starBookings: [{ taskId: 'tidy-room', date: '2026-11-01', taskTitle: 'Zimmer', amount: 5 }],
    }
    try {
      await database.put('gameStates', old, 'player-1')
      const migrated = await loadGameState(database, 'player-1')
      expect(migrated).toMatchObject({
        ...old, schemaVersion: GAME_STATE_VERSION,
        creatures: [{ ...old.creatures[0], energyUpdatedAt: now, deliveryXpDates: {} }],
        unlockedMinigameIds: [PIZZA_GAME_ID], minigameHighscores: {}, pendingDelivery: null, lastDeliveryResult: null,
      })
      expect(await database.get('gameStates', 'player-1')).toEqual(migrated)
    } finally { database.close() }
  })

  it('persists energy debit immediately and restores XP, daily limits and profile highscores after reopening', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now)
    const { name, database } = await setup()
    await loadGameState(database, 'player-1')
    await mutateGameState(database, 'player-1', () => createInitialGameState('creature_01'))
    await mutateGameState(database, 'player-1', (state) => startDelivery(state, 'run', now))
    database.close()
    const reopened = await openGameDatabase(name)
    try {
      expect((await loadGameState(reopened, 'player-1')).creatures[0].energy).toBe(55)
      await Promise.all([
        mutateGameState(reopened, 'player-1', (state) => finishDelivery(state, 'run', won, now)),
        mutateGameState(reopened, 'player-1', (state) => finishDelivery(state, 'run', won, now)),
      ])
      const restored = await loadGameState(reopened, 'player-1')
      expect(restored.creatures[0]).toMatchObject({
        xp: 30, energy: 55, deliveryXpDates: { [calendarDate(new Date(now))]: 1 },
      })
      expect(restored.minigameHighscores[PIZZA_GAME_ID]).toBe(50)
      expect(restored.pendingDelivery).toBeNull()
      expect(restored.lastDeliveryResult?.xp).toBe(30)
      expect((await loadGameState(reopened, 'player-2')).minigameHighscores).toEqual({})
    } finally { reopened.close() }
    const afterRestart = await openGameDatabase(name)
    try {
      vi.spyOn(Date, 'now').mockReturnValue(now + 10 * 60_000)
      const restored = await loadGameState(afterRestart, 'player-1')
      expect(restored.creatures[0].energy).toBe(65)
      expect(restored.creatures[0].xp).toBe(30)
      expect(restored.creatures[0].deliveryXpDates[calendarDate(new Date(now))]).toBe(1)
      expect(restored.minigameHighscores[PIZZA_GAME_ID]).toBe(50)
    } finally { afterRestart.close() }
  })

  it('does not overwrite unknown newer saves during minigame start or result booking', async () => {
    const { database } = await setup()
    try {
      const future = { ...createInitialGameState('creature_01'), schemaVersion: GAME_STATE_VERSION + 1 }
      await database.put('gameStates', future, 'player-1')
      await expect(mutateGameState(database, 'player-1', (state) => startDelivery(state, 'run', now))).rejects.toThrow()
      await expect(mutateGameState(database, 'player-1', (state) => finishDelivery(state, 'run', won, now))).rejects.toThrow()
      expect(await database.get('gameStates', 'player-1')).toEqual(future)
    } finally { database.close() }
  })
})
