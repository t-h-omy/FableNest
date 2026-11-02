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
  { id: 'floor-left', label: 'Boden links', x: 105, y: 345 },
  { id: 'floor-right', label: 'Boden rechts', x: 535, y: 345 },
  { id: 'wall-shelf', label: 'Regal an der Wand', x: 480, y: 150 },
]

export function findProduct(id: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((product) => product.id === id)
}
