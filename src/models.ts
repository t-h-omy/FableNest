export type ProfileId = 'player-1' | 'player-2'

export interface PlayerProfile {
  id: ProfileId
  name: string
}

export type CreatureId = 'creature_01' | 'creature_02'
export type AnimationState = 'idle' | 'happy' | 'eat' | 'sleep' | 'play'
export type Interaction = 'pet' | 'tap' | 'feed' | 'sleep' | 'play'

export interface CreatureDefinition {
  id: CreatureId
  name: string
  species: string
  assetId: string
}

export interface Creature {
  id: CreatureId
  name: string
  species: string
  assetId: string
  happiness: number
  energy: number
  satiety: number
  xp: number
  level: number
  lastXpAt: Partial<Record<Interaction, number>>
  energyUpdatedAt: number
  deliveryXpDates: Record<string, number>
}

export interface MinigameDefinition {
  id: string
  name: string
  description: string
  unlockedByDefault: boolean
  shopPrice?: number
}

export type FlightLane = 0 | 1 | 2
export type FlightEntityKind = 'cow' | 'toilet' | 'topping'

export interface FlightEntity {
  id: number
  kind: FlightEntityKind
  lane: FlightLane
  distance: number
  removed: boolean
}

export interface FlightState {
  phase: 'countdown' | 'flying' | 'delivering' | 'won' | 'lost'
  phaseTime: number
  distance: number
  lane: FlightLane
  moveCooldown: number
  lives: number
  invulnerable: number
  toppings: number
  score: number
  entities: FlightEntity[]
}

export interface DeliveryResult {
  runId: string
  success: boolean
  toppings: number
  score: number
  xp: number
}

export type SlotId = 'floor-left' | 'floor-right' | 'wall-shelf'

export interface House {
  level: number
  placements: Partial<Record<SlotId, string>>
}

export type ProductKind = 'decor' | 'toy' | 'creature'

export interface ShopProduct {
  id: string
  kind: ProductKind
  name: string
  description: string
  price: number
  assetId: string
  interaction?: Interaction
}

export interface PlacementSlot {
  id: SlotId
  label: string
  x: number
  y: number
}

export interface Task {
  id: string
  title: string
  description: string
  reward: number
}

export interface TaskRequest {
  taskId: string
  date: string
}

export interface StarBooking extends TaskRequest {
  taskTitle: string
  amount: number
}

export interface ParentPin {
  version: 1
  salt: string
  hash: string
}

export interface GameState {
  schemaVersion: number
  coins: number
  creatures: Creature[]
  activeCreatureId: CreatureId | null
  house: House
  ownedItemIds: string[]
  completedTaskIds: string[]
  taskRequests: TaskRequest[]
  starBookings: StarBooking[]
  unlockedMinigameIds: string[]
  minigameHighscores: Record<string, number>
  pendingDelivery: { runId: string; creatureId: CreatureId } | null
  lastDeliveryResult: DeliveryResult | null
}
