import type { CreatureDefinition, Interaction, PlayerProfile, Task } from '../models'

export const DEFAULT_PROFILES: PlayerProfile[] = [
  { id: 'player-1', name: 'Sternchen' },
  { id: 'player-2', name: 'Mondlicht' },
]

export const CREATURES: CreatureDefinition[] = [
  {
    id: 'creature_01',
    name: 'Mika',
    species: 'Wolkenfuchs',
    assetId: 'creature-mika',
  },
  {
    id: 'creature_02',
    name: 'Lumi',
    species: 'Sternendrache',
    assetId: 'creature-lumi',
  },
]

export const INTERACTIONS: Record<Interaction, {
  xp: number
  cooldownMs: number
  energy: number
  happiness: number
  satiety: number
}> = {
  pet: { xp: 5, cooldownMs: 15_000, energy: 0, happiness: 8, satiety: 0 },
  tap: { xp: 2, cooldownMs: 10_000, energy: 0, happiness: 2, satiety: 0 },
  feed: { xp: 8, cooldownMs: 30_000, energy: 0, happiness: 3, satiety: 20 },
  sleep: { xp: 6, cooldownMs: 60_000, energy: 25, happiness: 0, satiety: 0 },
  play: { xp: 10, cooldownMs: 20_000, energy: -10, happiness: 15, satiety: -5 },
}

export const TASKS: Task[] = [
  {
    id: 'clear-plates',
    title: 'Teller abräumen',
    description: 'Bring die benutzten Teller vom Tisch in die Küche.',
    reward: 1,
  },
  {
    id: 'empty-dishwasher',
    title: 'Spülmaschine ausräumen',
    description: 'Räume das saubere Geschirr an seinen Platz.',
    reward: 3,
  },
  {
    id: 'tidy-room',
    title: 'Zimmer aufräumen',
    description: 'Mach es dir in deinem Zimmer wieder gemütlich.',
    reward: 5,
  },
  {
    id: 'fold-laundry',
    title: 'Wäsche zusammenlegen',
    description: 'Lege die saubere Wäsche ordentlich zusammen.',
    reward: 5,
  },
]
