import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { deleteDB } from 'idb'
import { TASKS } from '../src/data/gameContent'
import { createFlight, finishDelivery, startDelivery } from '../src/game/pizzaFlight'
import { interact, renameCreature, selectCreature } from '../src/game/gameLogic'
import { purchaseProduct } from '../src/game/shop'
import { approveTask, calendarDate, requestTask } from '../src/game/tasks'
import { loadGameState, openGameDatabase, saveGameState } from '../src/storage/database'

const databaseNames: string[] = []

afterEach(async () => {
  await Promise.all(databaseNames.splice(0).map((name) => deleteDB(name)))
})

describe('complete local gameplay loop', () => {
  it('keeps care, minigame XP, household stars, purchases and both creatures after reopening', async () => {
    const name = `fabelnest-integration-${Math.random()}`
    databaseNames.push(name)
    const database = await openGameDatabase(name)
    try {
      const now = Date.now()
      let state = await loadGameState(database, 'player-1')

      state = selectCreature(state, 'creature_01')
      state = renameCreature(state, 'creature_01', 'Flocke')
      state = interact(state, 'pet', now)
      const delivery = startDelivery(state, 'integration-run', now)
      const won = { ...createFlight(), phase: 'won' as const, toppings: 2, score: 20 }
      state = finishDelivery(delivery, 'integration-run', won, now)
      expect(state.creatures[0].xp).toBeGreaterThan(5)

      for (const day of [1, 2, 3]) {
        const date = new Date(2026, 2, day, 12)
        for (const task of TASKS.slice(0, 3)) {
          state = requestTask(state, task.id, date)
          state = approveTask(state, task.id, calendarDate(date), date)
        }
      }
      expect(state.coins).toBe(27)

      state = purchaseProduct(state, 'star-lamp')
      state = purchaseProduct(state, 'second-creature')
      state = selectCreature(state, 'creature_02')
      expect(state.coins).toBe(2)
      expect(state.creatures.map((creature) => creature.id)).toEqual(['creature_01', 'creature_02'])
      expect(state.activeCreatureId).toBe('creature_02')

      await saveGameState(database, 'player-1', state)
    } finally {
      database.close()
    }

    const reopened = await openGameDatabase(name)
    try {
      const restored = await loadGameState(reopened, 'player-1')
      const otherProfile = await loadGameState(reopened, 'player-2')
      expect(restored).toMatchObject({
        coins: 2,
        activeCreatureId: 'creature_02',
        ownedItemIds: ['star-lamp', 'second-creature'],
        creatures: [
          { id: 'creature_01', name: 'Flocke', xp: expect.any(Number) },
          { id: 'creature_02', xp: 0 },
        ],
      })
      expect(restored.starBookings).toHaveLength(9)
      expect(otherProfile.coins).toBe(0)
      expect(otherProfile.creatures).toEqual([])
    } finally {
      reopened.close()
    }
  })
})
