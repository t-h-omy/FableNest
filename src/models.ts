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
  price: number
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
}

export interface House {
  level: number
  decorItemIds: string[]
}

export interface Item {
  id: string
  name: string
  description: string
  price: number
  category: 'decor' | 'care'
  assetId: string
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
}
