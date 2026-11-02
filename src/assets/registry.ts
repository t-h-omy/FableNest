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
  kind: 'creature' | 'decor' | 'care' | 'room'
  source:
    | { type: 'generated'; color: string; shape: 'round-creature' | 'sparkle' }
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
  'decor-cushion': {
    id: 'generated-decor-cushion',
    kind: 'decor',
    source: { type: 'generated', color: '#f3a5cc', shape: 'sparkle' },
  },
  'decor-lamp': {
    id: 'generated-decor-lamp',
    kind: 'decor',
    source: { type: 'generated', color: '#eaa0c6', shape: 'sparkle' },
  },
  'care-snack': {
    id: 'generated-care-snack',
    kind: 'care',
    source: { type: 'generated', color: '#eb91b8', shape: 'sparkle' },
  },
}

export function placeholderColor(assetId: string): string {
  const asset = ASSETS[assetId]
  return asset?.source.type === 'generated' ? asset.source.color : '#ef8fc1'
}
