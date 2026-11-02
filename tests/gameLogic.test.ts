import { describe, expect, it } from 'vitest'
import { CREATURES, INTERACTIONS, SHOP_ITEMS } from '../src/data/gameContent'
import type { Interaction } from '../src/models'
import {
  createInitialGameState,
  purchaseItem,
  purchaseCreature,
  renameCreature,
  interact,
  MAX_LEVEL,
  XP_PER_LEVEL,
  selectCreature,
} from '../src/game/gameLogic'

describe('game rules', () => {
  it('purchases an affordable item and rejects unaffordable or duplicate purchases', () => {
    const initial = { ...createInitialGameState(), coins: 20 }
    const item = SHOP_ITEMS[0]
    const purchased = purchaseItem(initial, item)

    expect(purchased.coins).toBe(initial.coins - item.price)
    expect(purchased.house.decorItemIds).toContain(item.id)
    expect(purchaseItem(purchased, item)).toBe(purchased)
    const broke = { ...initial, coins: 0 }
    expect(purchaseItem(broke, item)).toBe(broke)
  })

  it('chooses a free starter once and only switches to acquired creatures', () => {
    const firstProfile = createInitialGameState()
    const secondProfile = createInitialGameState()
    const selected = selectCreature(firstProfile, CREATURES[1].id)

    expect(selected.activeCreatureId).toBe(CREATURES[1].id)
    expect(selected.coins).toBe(firstProfile.coins)
    expect(firstProfile.creatures).toEqual([])
    expect(secondProfile.creatures).toEqual([])
    expect(selectCreature(selected, CREATURES[0].id)).toBe(selected)
    expect(selectCreature(selected, 'unknown')).toBe(selected)
  })

  it('purchases the second creature once without resetting either friend', () => {
    const starter = createInitialGameState('creature_01')
    const initial = { ...interact(starter, 'pet', 100), coins: 50 }
    const purchased = purchaseCreature(initial, 'creature_02')
    expect(purchased.coins).toBe(20)
    expect(purchased.creatures[0]).toEqual(initial.creatures[0])
    expect(purchased.creatures[1].xp).toBe(0)
    expect(purchaseCreature(purchased, 'creature_02')).toBe(purchased)
    expect(purchaseCreature(starter, 'creature_02')).toBe(starter)
    expect(purchaseCreature(createInitialGameState(), 'creature_02').creatures).toEqual([])
    const switched = selectCreature(purchased, 'creature_02')
    const named = renameCreature(interact(switched, 'feed', 100), 'creature_02', '  Nova  ')
    expect(named.creatures[1].name).toBe('Nova')
    expect(named.creatures[1].xp).toBe(8)
    expect(named.creatures[0].xp).toBe(5)
    expect(selectCreature(named, 'creature_01').creatures).toEqual(named.creatures)
    expect(renameCreature(named, 'creature_02', ' ')).toBe(named)
    expect(renameCreature(named, 'creature_02', 'x'.repeat(25))).toBe(named)
  })

  it('applies independent per-action and per-creature XP cooldowns, including timestamp zero', () => {
    let state = createInitialGameState('creature_01')
    state = interact(state, 'pet', 0)
    expect(state.creatures[0].xp).toBe(5)
    state = interact(state, 'pet', 14_999)
    expect(state.creatures[0].xp).toBe(5)
    expect(state.creatures[0].happiness).toBe(96)
    state = interact(state, 'pet', 15_000)
    expect(state.creatures[0].xp).toBe(10)
    state = interact(state, 'feed', 15_000)
    expect(state.creatures[0].xp).toBe(18)
    const second = selectCreature(purchaseCreature({ ...state, coins: 50 }, 'creature_02'), 'creature_02')
    expect(interact(second, 'pet', 15_000).creatures[1].xp).toBe(5)
    expect(interact(state, 'pet', 1).creatures[0].xp).toBe(18)
  })

  it('requires energy only for consuming activities and clamps all care values', () => {
    const state = createInitialGameState('creature_01')
    const tired = { ...state, creatures: [{ ...state.creatures[0], energy: 0, satiety: 99, happiness: 99 }] }
    expect(interact(tired, 'play', 0)).toBe(tired)
    expect(interact(tired, 'pet', 0).creatures[0].happiness).toBe(100)
    expect(interact(tired, 'tap', 0).creatures[0].xp).toBe(2)
    expect(interact(tired, 'feed', 0).creatures[0].satiety).toBe(100)
    expect(interact(tired, 'sleep', 0).creatures[0].energy).toBe(25)
    const ready = { ...state, creatures: [{ ...state.creatures[0], energy: 10, satiety: 1 }] }
    const played = interact(ready, 'play', 0)
    expect(played.creatures[0].energy).toBe(0)
    expect(played.creatures[0].satiety).toBe(0)
    expect(interact(state, 'feed', Number.NaN)).toBe(state)
  })

  it.each<Interaction>(['pet', 'tap', 'feed', 'sleep', 'play'])(
    'enforces the exact XP cooldown boundary for %s',
    (action) => {
      const rule = INTERACTIONS[action]
      const first = interact(createInitialGameState('creature_01'), action, 1000)
      const early = interact(first, action, 1000 + rule.cooldownMs - 1)
      const ready = interact(early, action, 1000 + rule.cooldownMs)
      expect(early.creatures[0].xp).toBe(rule.xp)
      expect(ready.creatures[0].xp).toBe(rule.xp * 2)
    },
  )

  it('levels individually at exact thresholds and caps level and XP at 20', () => {
    const state = createInitialGameState('creature_01')
    const almost = { ...state, creatures: [{ ...state.creatures[0], xp: 95 }] }
    const levelled = interact(almost, 'pet', 0)
    expect(levelled.creatures[0].level).toBe(2)
    const cap = (MAX_LEVEL - 1) * XP_PER_LEVEL
    const nearMax = { ...state, creatures: [{ ...state.creatures[0], xp: cap - 1, level: 19 }] }
    const maxed = interact(nearMax, 'feed', 0)
    expect(maxed.creatures[0].xp).toBe(cap)
    expect(maxed.creatures[0].level).toBe(20)
    expect(interact(maxed, 'feed', 30_000).creatures[0].xp).toBe(cap)
  })
})
