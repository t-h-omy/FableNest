import { Assets, Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js'
import { ASSETS, placeholderColor } from '../assets/registry'

const OUTLINE = '#9e477d'

function drawShape(assetId: string): Graphics {
  const color = placeholderColor(assetId)
  const source = ASSETS[assetId]?.source
  const shape = source?.type === 'generated' ? source.shape : 'sparkle'
  const g = new Graphics()
  if (shape === 'lamp') {
    g.roundRect(-5, -34, 10, 34, 3).fill(color).stroke({ color: OUTLINE, width: 3 })
      .ellipse(0, 6, 22, 7).fill(color).stroke({ color: OUTLINE, width: 3 })
      .poly([-26, -34, 26, -34, 14, -72, -14, -72]).fill(color).stroke({ color: OUTLINE, width: 3 })
  } else if (shape === 'ball') {
    g.circle(0, -26, 26).fill(color).stroke({ color: OUTLINE, width: 3 })
      .moveTo(-22, -34).quadraticCurveTo(0, -14, 22, -34).stroke({ color: OUTLINE, width: 3 })
  } else {
    g.star(0, -30, 5, 30, 14).fill(color).stroke({ color: OUTLINE, width: 3 })
  }
  return g
}

/** Pinkfarbener Platzhalter mit Beschriftung; Bild-Assets aus der Registry ersetzen ihn nach dem Laden. */
export class ObjectRenderer extends Container {
  private readonly placeholder: Container
  private disposed = false

  constructor(private readonly assetId: string, label: string, interactive: boolean) {
    super()
    this.placeholder = new Container()
    const text = new Text({
      text: label,
      style: { fontSize: 14, fontWeight: '700', fill: '#7a2e5c', fontFamily: 'sans-serif' },
    })
    text.anchor.set(0.5, 0)
    text.position.set(0, 6)
    this.placeholder.addChild(drawShape(assetId), text)
    this.addChild(this.placeholder)
    if (interactive) {
      this.eventMode = 'static'
      this.cursor = 'pointer'
      this.hitArea = new Rectangle(-45, -80, 90, 105)
    }
  }

  async load(): Promise<void> {
    const source = ASSETS[this.assetId]?.source
    if (source?.type !== 'image') return
    try {
      await Assets.load(source.src)
      if (this.disposed) return
      const sprite = Sprite.from(source.src)
      sprite.anchor.set(0.5, 1)
      this.addChildAt(sprite, 0)
      this.placeholder.visible = false
    } catch (cause) {
      console.warn(`Objekt-Asset ${this.assetId} nicht verfügbar; pinkfarbener Platzhalter bleibt aktiv.`, cause)
    }
  }

  bounce(): void {
    this.placeholder.y = -14
    setTimeout(() => { if (!this.disposed) this.placeholder.y = 0 }, 250)
  }

  override destroy(): void {
    this.disposed = true
    super.destroy({ children: true })
  }
}
