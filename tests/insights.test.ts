import { describe, expect, it } from 'vitest'
import { ENERGY_REGEN_MS, INTERACTIONS, TASKS } from '../src/data/gameContent'
import { PLACEMENT_SLOTS } from '../src/data/shop'
import { ROOM_LAYOUT } from '../src/data/room'
import { createInitialGameState, interact } from '../src/game/gameLogic'
import {
  affordableProductCount, deliveriesWithXpLeft, levelProgress, lowNeeds, missingStars,
  msUntilEnergy, taskSummary, xpCooldownLeft, xpCooldownProgress,
} from '../src/game/insights'
import { purchaseProduct } from '../src/game/shop'
import { approveTask, calendarDate, requestTask } from '../src/game/tasks'

const day = new Date(2026, 10, 3, 12)
const creature = () => createInitialGameState('creature_01').creatures[0]

describe('UI insights', () => {
  it('lists low needs from most to least urgent', () => {
    expect(lowNeeds({ happiness: 80, satiety: 70, energy: 75 })).toEqual([])
    expect(lowNeeds({ happiness: 20, satiety: 5, energy: 29 })).toEqual(['satiety', 'happiness', 'energy'])
    expect(lowNeeds({ happiness: 30, satiety: 30, energy: 30 })).toEqual([])
  })

  it('reports XP cooldowns without changing state', () => {
    const now = 1_000_000
    const state = interact(createInitialGameState('creature_01'), 'pet', now)
    const pet = state.creatures[0]
    expect(xpCooldownLeft(pet, 'feed', now)).toBe(0)
    expect(xpCooldownLeft(pet, 'pet', now)).toBe(INTERACTIONS.pet.cooldownMs)
    expect(xpCooldownProgress(pet, 'pet', now + INTERACTIONS.pet.cooldownMs / 2)).toBeCloseTo(0.5)
    expect(xpCooldownLeft(pet, 'pet', now + INTERACTIONS.pet.cooldownMs + 5)).toBe(0)
    expect(xpCooldownProgress(pet, 'pet', now + INTERACTIONS.pet.cooldownMs * 3)).toBe(1)
  })

  it('computes the waiting time until enough energy for a flight', () => {
    const base = { energy: 15, energyUpdatedAt: 0 }
    expect(msUntilEnergy(base, 20, 0)).toBe(5 * ENERGY_REGEN_MS)
    expect(msUntilEnergy(base, 20, 20_000)).toBe(5 * ENERGY_REGEN_MS - 20_000)
    expect(msUntilEnergy({ energy: 20, energyUpdatedAt: 0 }, 20, 0)).toBe(0)
    expect(msUntilEnergy({ energy: 99, energyUpdatedAt: 0 }, 140, 0)).toBe(ENERGY_REGEN_MS)
  })

  it('describes level progress including the maximum level', () => {
    expect(levelProgress({ xp: 0, level: 1 })).toEqual({ level: 1, current: 0, span: 100, ratio: 0, max: false })
    expect(levelProgress({ xp: 345, level: 4 })).toMatchObject({ current: 45, span: 100, ratio: 0.45 })
    expect(levelProgress({ xp: 1900, level: 20 })).toMatchObject({ max: true, ratio: 1, span: 0 })
    expect(levelProgress(creature())).toMatchObject({ level: 1, ratio: 0 })
  })

  it('summarises today’s tasks and the stars still available', () => {
    const date = calendarDate(day)
    let state = createInitialGameState('creature_01')
    const all = TASKS.reduce((sum, task) => sum + task.reward, 0)
    expect(taskSummary(state, date)).toEqual({ total: TASKS.length, open: TASKS.length, pending: 0, completed: 0, starsLeft: all })
    state = requestTask(state, TASKS[0].id, day)
    state = requestTask(state, TASKS[1].id, day)
    state = approveTask(state, TASKS[1].id, date, day)
    expect(taskSummary(state, date)).toEqual({
      total: TASKS.length, open: TASKS.length - 2, pending: 1, completed: 1, starsLeft: all - TASKS[1].reward,
    })
  })

  it('counts affordable products and missing stars', () => {
    const state = { ...createInitialGameState('creature_01'), coins: 10 }
    expect(affordableProductCount(state)).toBe(2)
    expect(affordableProductCount(purchaseProduct(state, 'play-ball'))).toBe(0)
    expect(affordableProductCount({ ...createInitialGameState(), coins: 50 })).toBe(2)
    expect(missingStars(state, 20)).toBe(10)
    expect(missingStars(state, 5)).toBe(0)
  })

  it('counts XP deliveries left for today', () => {
    const date = calendarDate(day)
    expect(deliveriesWithXpLeft(creature(), date)).toBe(3)
    expect(deliveriesWithXpLeft({ deliveryXpDates: { [date]: 2 } }, date)).toBe(1)
    expect(deliveriesWithXpLeft({ deliveryXpDates: { [date]: 5 } }, date)).toBe(0)
  })

  it('keeps every placement slot inside the room grid', () => {
    for (const slot of PLACEMENT_SLOTS) {
      expect(slot.x).toBeGreaterThan(0)
      expect(slot.x).toBeLessThan(ROOM_LAYOUT.width)
      expect(slot.y).toBeGreaterThan(0)
      expect(slot.y).toBeLessThan(ROOM_LAYOUT.height)
    }
  })
})
