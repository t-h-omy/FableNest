import type { AnimationState } from '../models'

export interface AnimationDefinition {
  animation: string
  speed?: number
  loop?: boolean
  scale?: number
  anchor?: { x: number; y: number }
}

export interface AssetDefinition {
  id: string
  kind: 'creature' | 'decor' | 'toy' | 'room' | 'minigame'
  source:
    | { type: 'generated'; color: string; shape: 'round-creature' | 'sparkle' | 'lamp' | 'ball' | 'plane' | 'cow' | 'toilet' | 'topping' | 'space' | 'pizza' | 'alien' }
    | { type: 'image'; src: string }
    | {
      type: 'spritesheet'
      src: string
      animations: Partial<Record<AnimationState, AnimationDefinition>>
    }
}

export const ASSETS: Record<string, AssetDefinition> = {
  'pizza-plane': { id: 'pizza-plane', kind: 'minigame', source: { type: 'generated', color: '#ef8fc1', shape: 'plane' } },
  'space-cow': { id: 'space-cow', kind: 'minigame', source: { type: 'generated', color: '#ef8fc1', shape: 'cow' } },
  'space-toilet': { id: 'space-toilet', kind: 'minigame', source: { type: 'generated', color: '#ef8fc1', shape: 'toilet' } },
  'pizza-topping': { id: 'pizza-topping', kind: 'minigame', source: { type: 'generated', color: '#ef8fc1', shape: 'topping' } },
  'pizza-space': { id: 'pizza-space', kind: 'minigame', source: { type: 'generated', color: '#ffe0ef', shape: 'space' } },
  'delivery-pizza': { id: 'delivery-pizza', kind: 'minigame', source: { type: 'generated', color: '#ef8fc1', shape: 'pizza' } },
  'alien-customer': { id: 'alien-customer', kind: 'minigame', source: { type: 'generated', color: '#ef8fc1', shape: 'alien' } },
  'creature-mika': {
    id: 'generated-creature-mika',
    kind: 'creature',
    source: { type: 'generated', color: '#ef8fc1', shape: 'round-creature' },
  },
  'creature-lumi': {
    id: 'generated-creature-lumi',
    kind: 'creature',
    source: { type: 'generated', color: '#e995c3', shape: 'round-creature' },
  },
  'room-background': {
    id: 'generated-room',
    kind: 'room',
    source: { type: 'generated', color: '#ffe0ef', shape: 'sparkle' },
  },
  'decor-lamp': {
    id: 'generated-decor-lamp',
    kind: 'decor',
    source: { type: 'generated', color: '#eaa0c6', shape: 'lamp' },
  },
  'toy-ball': {
    id: 'generated-toy-ball',
    kind: 'toy',
    source: { type: 'generated', color: '#f08cbc', shape: 'ball' },
  },
  'product-creature': {
    id: 'generated-product-creature',
    kind: 'creature',
    source: { type: 'generated', color: '#ef8fc1', shape: 'round-creature' },
  },
}

export function placeholderColor(assetId: string): string {
  const asset = ASSETS[assetId]
  return asset?.source.type === 'generated' ? asset.source.color : '#ef8fc1'
}
