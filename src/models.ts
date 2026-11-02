export type ProfileId = 'player-1' | 'player-2'

export interface PlayerProfile {
  id: ProfileId
  name: string
}

export interface Creature {
  id: string
  name: string
  species: string
  assetId: string
  happiness: number
  energy: number
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

export interface GameState {
  schemaVersion: number
  coins: number
  creature: Creature
  house: House
  ownedItemIds: string[]
  completedTaskIds: string[]
}
