import type { MinigameDefinition } from '../models'

export const PIZZA_GAME_ID = 'interdimensional-pizza'

export const MINIGAMES: MinigameDefinition[] = [{
  id: PIZZA_GAME_ID,
  name: 'Interdimensionale Pizzalieferung',
  shortName: 'Pizzalieferung',
  description: 'Fliege mit deinem Wesen durch den Weltraum und bring dem Alien seine Pizza!',
  unlockedByDefault: true,
}]

export const FLIGHT = {
  width: 640,
  height: 400,
  playerX: 110,
  laneY: [90, 200, 310],
  speed: 180,
  distance: 10_800,
  obstacleSpacing: 450,
  firstObstacle: 600,
  laneChangeSeconds: 0.18,
  countdownSeconds: 3,
  deliverySeconds: 2,
  invulnerabilitySeconds: 1,
  energyCost: 20,
  scorePerTopping: 10,
  baseXp: 20,
  toppingXp: 2,
  maxXp: 40,
  dailyDeliveries: 3,
} as const

export const FLIGHT_ART = {
  cow: { assetId: 'space-cow', label: 'Weltraumkuh' },
  toilet: { assetId: 'space-toilet', label: 'Toilette' },
  topping: { assetId: 'pizza-topping', label: 'Belag' },
} as const
