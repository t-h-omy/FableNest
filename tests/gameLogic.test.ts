import { describe, expect, it } from 'vitest'
import { CREATURES, SHOP_ITEMS, TASKS } from '../src/data/gameContent'
import {
  completeTask,
  createInitialGameState,
  purchaseItem,
  selectCreature,
} from '../src/game/gameLogic'

describe('game rules', () => {
  it('rewards a task once and ignores unknown tasks', () => {
    const initial = createInitialGameState()
    const completed = completeTask(initial, TASKS[0].id)

    expect(completed.coins).toBe(initial.coins + TASKS[0].reward)
    expect(completeTask(completed, TASKS[0].id)).toBe(completed)
    expect(completeTask(initial, 'not-a-task')).toBe(initial)
  })

  it('purchases an affordable item and rejects unaffordable or duplicate purchases', () => {
    const initial = createInitialGameState()
    const item = SHOP_ITEMS[0]
    const purchased = purchaseItem(initial, item)

    expect(purchased.coins).toBe(initial.coins - item.price)
    expect(purchased.house.decorItemIds).toContain(item.id)
    expect(purchaseItem(purchased, item)).toBe(purchased)
    const broke = { ...initial, coins: 0 }
    expect(purchaseItem(broke, item)).toBe(broke)
  })

  it('selects a known creature without mutating another profile save', () => {
    const firstProfile = createInitialGameState()
    const secondProfile = createInitialGameState()
    const selected = selectCreature(firstProfile, CREATURES[1].id)

    expect(selected.creature.id).toBe(CREATURES[1].id)
    expect(firstProfile.creature.id).toBe(CREATURES[0].id)
    expect(secondProfile.creature.id).toBe(CREATURES[0].id)
    expect(selectCreature(selected, 'unknown')).toBe(selected)
  })
})
