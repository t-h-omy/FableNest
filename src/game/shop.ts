import { CREATURES } from '../data/gameContent'
import { findProduct, PLACEMENT_SLOTS } from '../data/shop'
import type { GameState, ShopProduct, SlotId } from '../models'
import { createCreature } from './gameLogic'

export type PurchaseCheck = { ok: true } | { ok: false; reason: 'unknown' | 'owned' | 'poor' | 'no-starter' | 'no-creature' }

export function nextLockedCreatureId(state: GameState): string | undefined {
  return CREATURES.find((entry) => !state.creatures.some((creature) => creature.id === entry.id))?.id
}

export function checkPurchase(state: GameState, product: ShopProduct | undefined): PurchaseCheck {
  if (!product || !Number.isSafeInteger(product.price) || product.price < 0) return { ok: false, reason: 'unknown' }
  if (state.ownedItemIds.includes(product.id)) return { ok: false, reason: 'owned' }
  if (product.kind === 'creature') {
    if (!state.creatures.length) return { ok: false, reason: 'no-starter' }
    if (!nextLockedCreatureId(state)) return { ok: false, reason: 'no-creature' }
  }
  if (state.coins < product.price) return { ok: false, reason: 'poor' }
  return { ok: true }
}

export function purchaseProduct(state: GameState, productId: string): GameState {
  const product = findProduct(productId)
  if (!checkPurchase(state, product).ok || !product) return state
  const lockedId = product.kind === 'creature' ? nextLockedCreatureId(state) : undefined
  const definition = CREATURES.find((entry) => entry.id === lockedId)
  return {
    ...state,
    coins: state.coins - product.price,
    ownedItemIds: [...state.ownedItemIds, product.id],
    creatures: definition ? [...state.creatures, createCreature(definition)] : state.creatures,
  }
}

export function isPlaceable(product: ShopProduct | undefined): product is ShopProduct {
  return product?.kind === 'decor' || product?.kind === 'toy'
}

export function placeItem(state: GameState, slotId: SlotId, productId: string): GameState {
  const product = findProduct(productId)
  if (!isPlaceable(product) || !state.ownedItemIds.includes(productId) ||
    !PLACEMENT_SLOTS.some((slot) => slot.id === slotId)) return state
  if (state.house.placements[slotId] === productId) return state
  const placements = { ...state.house.placements }
  for (const key of Object.keys(placements) as SlotId[]) {
    if (placements[key] === productId) delete placements[key]
  }
  placements[slotId] = productId
  return { ...state, house: { ...state.house, placements } }
}

export function removeItem(state: GameState, slotId: SlotId): GameState {
  if (!state.house.placements[slotId]) return state
  const placements = { ...state.house.placements }
  delete placements[slotId]
  return { ...state, house: { ...state.house, placements } }
}
