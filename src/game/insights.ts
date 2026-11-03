import { ENERGY_REGEN_MS, INTERACTIONS, LEVEL_THRESHOLDS, TASKS } from '../data/gameContent'
import { FLIGHT } from '../data/minigames'
import { SHOP_PRODUCTS } from '../data/shop'
import type { Creature, GameState, Interaction } from '../models'
import { checkPurchase } from './shop'
import { taskStatus } from './tasks'

/** Abgeleitete, rein lesende Werte für Hinweise und Feedback in der Oberfläche. Verändert nie den Spielstand. */

export type Need = 'happiness' | 'satiety' | 'energy'

/** Unter diesem Wert zeigt das Wesen ein Bedürfnis-Zeichen. */
export const LOW_NEED_THRESHOLD = 30

export function lowNeeds(creature: Pick<Creature, Need>): Need[] {
  return (['happiness', 'satiety', 'energy'] as const)
    .filter((need) => creature[need] < LOW_NEED_THRESHOLD)
    .sort((a, b) => creature[a] - creature[b])
}

/** Verbleibende Millisekunden, bis eine Aktion wieder XP gibt. 0 heißt: XP bereit. */
export function xpCooldownLeft(creature: Pick<Creature, 'lastXpAt'>, action: Interaction, now: number): number {
  const last = creature.lastXpAt[action]
  if (last === undefined) return 0
  return Math.max(0, INTERACTIONS[action].cooldownMs - (now - last))
}

/** Anteil der abgelaufenen XP-Pause von 0 (gerade benutzt) bis 1 (bereit). */
export function xpCooldownProgress(creature: Pick<Creature, 'lastXpAt'>, action: Interaction, now: number): number {
  return 1 - xpCooldownLeft(creature, action, now) / INTERACTIONS[action].cooldownMs
}

/** Wartezeit, bis ein bereits regeneriertes Wesen den Energie-Zielwert erreicht. */
export function msUntilEnergy(creature: Pick<Creature, 'energy' | 'energyUpdatedAt'>, target: number, now: number): number {
  if (creature.energy >= target) return 0
  const missing = Math.min(100, target) - creature.energy
  const elapsed = Math.max(0, now - creature.energyUpdatedAt) % ENERGY_REGEN_MS
  return Math.max(0, missing * ENERGY_REGEN_MS - elapsed)
}

export interface LevelProgress {
  level: number
  /** XP innerhalb des aktuellen Levels. */
  current: number
  /** XP-Spanne des aktuellen Levels; 0 auf dem Höchstlevel. */
  span: number
  ratio: number
  max: boolean
}

export function levelProgress(creature: Pick<Creature, 'xp' | 'level'>): LevelProgress {
  const start = LEVEL_THRESHOLDS[creature.level - 1] ?? 0
  const next = LEVEL_THRESHOLDS[creature.level]
  if (next === undefined) return { level: creature.level, current: creature.xp - start, span: 0, ratio: 1, max: true }
  const span = next - start
  const current = Math.max(0, creature.xp - start)
  return { level: creature.level, current, span, ratio: Math.min(1, current / span), max: false }
}

export interface TaskSummary {
  total: number
  open: number
  pending: number
  completed: number
  /** Sterne, die heute noch verdient werden können (offen oder wartend). */
  starsLeft: number
}

export function taskSummary(state: GameState, date: string): TaskSummary {
  const summary: TaskSummary = { total: TASKS.length, open: 0, pending: 0, completed: 0, starsLeft: 0 }
  for (const task of TASKS) {
    const status = taskStatus(state, task.id, date)
    summary[status === 'completed' ? 'completed' : status]++
    if (status !== 'completed') summary.starsLeft += task.reward
  }
  return summary
}

/** Anzahl der Shop-Produkte, die jetzt sofort gekauft werden können. */
export function affordableProductCount(state: GameState): number {
  return SHOP_PRODUCTS.filter((product) => checkPurchase(state, product).ok).length
}

/** Fehlende Sterne bis zum Preis; 0, wenn genug vorhanden sind. */
export function missingStars(state: Pick<GameState, 'coins'>, price: number): number {
  return Math.max(0, price - state.coins)
}

export function deliveriesWithXpLeft(creature: Pick<Creature, 'deliveryXpDates'>, date: string): number {
  return Math.max(0, FLIGHT.dailyDeliveries - (creature.deliveryXpDates[date] ?? 0))
}
