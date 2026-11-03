import type { PlacementSlot, ShopProduct } from '../models'

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'star-lamp',
    kind: 'decor',
    name: 'Sternenlampe',
    description: 'Ein sanftes Licht für dein Zimmer.',
    price: 5,
    assetId: 'decor-lamp',
  },
  {
    id: 'play-ball',
    kind: 'toy',
    name: 'Spielball',
    description: 'Tippe ihn an und dein Wesen spielt los.',
    price: 10,
    assetId: 'toy-ball',
    interaction: 'play',
  },
  {
    id: 'second-creature',
    kind: 'creature',
    name: 'Zweites Wesen',
    description: 'Ein neuer Freund mit eigenen Werten.',
    price: 20,
    assetId: 'product-creature',
  },
]

export const PLACEMENT_SLOTS: PlacementSlot[] = [
  // Koordinaten im Zimmerraster aus src/data/room.ts (640 × 480). Bodenplätze bleiben über der Bedürfnis-Leiste.
  { id: 'floor-left', label: 'Boden links', x: 104, y: 380 },
  { id: 'floor-right', label: 'Boden rechts', x: 536, y: 380 },
  { id: 'wall-shelf', label: 'Regal an der Wand', x: 480, y: 194 },
]

export function findProduct(id: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((product) => product.id === id)
}
