import type { Creature, Item, PlayerProfile, Task } from '../models'

export const DEFAULT_PROFILES: PlayerProfile[] = [
  { id: 'player-1', name: 'Sternchen' },
  { id: 'player-2', name: 'Mondlicht' },
]

export const CREATURES: Creature[] = [
  {
    id: 'mika',
    name: 'Mika',
    species: 'Wolkenfuchs',
    color: '#ef8fc1',
    happiness: 80,
    energy: 75,
  },
  {
    id: 'lumi',
    name: 'Lumi',
    species: 'Sternendrache',
    color: '#bd8de5',
    happiness: 80,
    energy: 75,
  },
  {
    id: 'pippin',
    name: 'Pippin',
    species: 'Moosdrache',
    color: '#8bbf9f',
    happiness: 80,
    energy: 75,
  },
]

export const TASKS: Task[] = [
  {
    id: 'tidy-room',
    title: 'Zimmer aufräumen',
    description: 'Mach es dir in deinem Zimmer wieder gemütlich.',
    reward: 10,
  },
  {
    id: 'read-book',
    title: 'Ein Kapitel lesen',
    description: 'Tauche in eine spannende Geschichte ein.',
    reward: 8,
  },
  {
    id: 'water-plants',
    title: 'Pflanzen gießen',
    description: 'Hilf den Pflanzen, kräftig weiterzuwachsen.',
    reward: 6,
  },
]

export const SHOP_ITEMS: Item[] = [
  {
    id: 'pink-cushion',
    name: 'Sternenkissen',
    description: 'Ein weiches Kissen für süße Träume.',
    price: 12,
    category: 'decor',
    color: '#f3a5cc',
  },
  {
    id: 'moon-lamp',
    name: 'Mondlampe',
    description: 'Sanftes Licht für gemütliche Abende.',
    price: 18,
    category: 'decor',
    color: '#b8a2eb',
  },
  {
    id: 'berry-snack',
    name: 'Beeren-Snack',
    description: 'Ein kleiner Energieschub für dein Wesen.',
    price: 8,
    category: 'care',
    color: '#ec8c9d',
  },
]
