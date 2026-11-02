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
  kind: 'creature' | 'decor' | 'toy' | 'room'
  source:
    | { type: 'generated'; color: string; shape: 'round-creature' | 'sparkle' | 'lamp' | 'ball' }
    | { type: 'image'; src: string }
    | {
      type: 'spritesheet'
      src: string
      animations: Partial<Record<AnimationState, AnimationDefinition>>
    }
}

export const ASSETS: Record<string, AssetDefinition> = {
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
