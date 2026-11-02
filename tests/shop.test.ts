import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { deleteDB } from 'idb'
import { PLACEMENT_SLOTS, SHOP_PRODUCTS } from '../src/data/shop'
import { createInitialGameState, interact, selectCreature } from '../src/game/gameLogic'
import { checkPurchase, placeItem, purchaseProduct, removeItem } from '../src/game/shop'
import { findProduct } from '../src/data/shop'
import { ensureProfiles, loadGameState, mutateGameState, openGameDatabase } from '../src/storage/database'

const names: string[] = []
afterEach(async () => { await Promise.all(names.splice(0).map((name) => deleteDB(name))) })

const rich = () => ({ ...createInitialGameState('creature_01'), coins: 35 })

describe('shop', () => {
  it('configures the three products with their prices', () => {
    expect(SHOP_PRODUCTS.map((product) => [product.kind, product.price])).toEqual([
      ['decor', 5], ['toy', 10], ['creature', 20],
    ])
    expect(PLACEMENT_SLOTS).toHaveLength(3)
  })

  it('spends stars on all three products exactly once', () => {
    let state = rich()
    for (const product of SHOP_PRODUCTS) state = purchaseProduct(state, product.id)
    expect(state.coins).toBe(0)
    expect(state.ownedItemIds).toEqual(['star-lamp', 'play-ball', 'second-creature'])
    expect(state.creatures.map((creature) => creature.id)).toEqual(['creature_01', 'creature_02'])
    for (const product of SHOP_PRODUCTS) {
      expect(purchaseProduct({ ...state, coins: 99 }, product.id).coins).toBe(99)
    }
  })

  it('rejects purchases with too few stars or unknown products', () => {
    const poor = { ...rich(), coins: 4 }
    expect(purchaseProduct(poor, 'star-lamp')).toBe(poor)
    expect(checkPurchase(poor, findProduct('star-lamp'))).toEqual({ ok: false, reason: 'poor' })
    expect(purchaseProduct(poor, 'nope')).toBe(poor)
    const noStarter = { ...createInitialGameState(), coins: 50 }
    expect(purchaseProduct(noStarter, 'second-creature')).toBe(noStarter)
  })

  it('places, moves, swaps and removes furniture only when owned', () => {
    const state = purchaseProduct(purchaseProduct(rich(), 'star-lamp'), 'play-ball')
    expect(placeItem(state, 'floor-left', 'second-creature')).toBe(state)
    expect(placeItem(rich(), 'floor-left', 'star-lamp').house.placements).toEqual({})
    const placed = placeItem(state, 'floor-left', 'star-lamp')
    const moved = placeItem(placed, 'wall-shelf', 'star-lamp')
    expect(moved.house.placements).toEqual({ 'wall-shelf': 'star-lamp' })
    const both = placeItem(moved, 'floor-right', 'play-ball')
    expect(Object.keys(both.house.placements)).toHaveLength(2)
    expect(placeItem(both, 'wall-shelf', 'play-ball').house.placements).toEqual({ 'wall-shelf': 'play-ball' })
    expect(removeItem(both, 'wall-shelf').house.placements).toEqual({ 'floor-right': 'play-ball' })
    expect(removeItem(both, 'floor-left')).toBe(both)
  })

  it('keeps room and inventory when switching creatures', () => {
    const bought = purchaseProduct(purchaseProduct(rich(), 'star-lamp'), 'second-creature')
    const furnished = placeItem(bought, 'floor-left', 'star-lamp')
    const switched = selectCreature(interact(furnished, 'pet', 0), 'creature_02')
    expect(switched.house).toEqual(furnished.house)
    expect(switched.ownedItemIds).toEqual(furnished.ownedItemIds)
    expect(switched.creatures[0].xp).toBe(5)
    expect(selectCreature(switched, 'creature_01').activeCreatureId).toBe('creature_01')
  })

  it('persists purchases and placements per profile after reopening', async () => {
    const name = `fabelnest-shop-${Math.random()}`
    names.push(name)
    const database = await openGameDatabase(name)
    await ensureProfiles(database)
    await loadGameState(database, 'player-1')
    await mutateGameState(database, 'player-1', () => rich())
    await mutateGameState(database, 'player-1', (state) => purchaseProduct(state, 'play-ball'))
    await mutateGameState(database, 'player-1', (state) => placeItem(state, 'floor-right', 'play-ball'))
    database.close()
    const reopened = await openGameDatabase(name)
    const first = await loadGameState(reopened, 'player-1')
    expect(first.coins).toBe(25)
    expect(first.ownedItemIds).toEqual(['play-ball'])
    expect(first.house.placements).toEqual({ 'floor-right': 'play-ball' })
    const second = await loadGameState(reopened, 'player-2')
    expect(second.ownedItemIds).toEqual([])
    expect(second.house.placements).toEqual({})
    reopened.close()
  })
})
