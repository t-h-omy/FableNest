import { ENERGY_REGEN_MS, LEVEL_THRESHOLDS } from '../data/gameContent'
import type { Creature, GameState } from '../models'

export function levelForXp(xp: number): number {
  return Math.max(1, LEVEL_THRESHOLDS.filter((threshold) => xp >= threshold).length)
}

export function addXp(creature: Creature, reward: number): Creature {
  const xp = Math.min(LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1], creature.xp + reward)
  return { ...creature, xp, level: levelForXp(xp) }
}

export function regenerateCreature(creature: Creature, now: number): Creature {
  const ticks = Math.floor((now - creature.energyUpdatedAt) / ENERGY_REGEN_MS)
  if (ticks <= 0) return creature
  return {
    ...creature,
    energy: Math.min(100, creature.energy + ticks),
    energyUpdatedAt: creature.energyUpdatedAt + ticks * ENERGY_REGEN_MS,
  }
}

export function regenerateEnergy(state: GameState, now: number): GameState {
  if (!Number.isFinite(now) || now < 0) throw new Error('Die Energiezeit ist ungültig.')
  return { ...state, creatures: state.creatures.map((creature) => regenerateCreature(creature, now)) }
}
