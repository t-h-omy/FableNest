export type PlaceholderAsset = {
  id: string
  kind: 'creature' | 'decor'
  color: string
  shape: 'round-creature' | 'sparkle'
}

export const ASSETS: Record<string, PlaceholderAsset> = {
  creature: {
    id: 'generated-creature',
    kind: 'creature',
    color: '#ef8fc1',
    shape: 'round-creature',
  },
  decor: {
    id: 'generated-decor',
    kind: 'decor',
    color: '#f3a5cc',
    shape: 'sparkle',
  },
}
