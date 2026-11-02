import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Sprite, Spritesheet, Text, type Ticker } from 'pixi.js'
import { ASSETS, placeholderColor } from '../assets/registry'

const OUTLINE = '#9e477d'

function drawShape(assetId: string): Graphics {
  const color = placeholderColor(assetId)
  const source = ASSETS[assetId]?.source
  const shape = source?.type === 'generated' ? source.shape : 'sparkle'
  const g = new Graphics()
  if (shape === 'plane') {
    g.poly([-54, 4, 45, 4, 55, 17, -48, 17]).fill(color)
      .poly([-5, 6, -30, 34, 20, 6]).fill(color)
      .poly([-45, 5, -55, -22, -30, 5]).fill(color)
      .ellipse(6, -1, 25, 16).stroke({ color: OUTLINE, width: 3 })
      .moveTo(55, -10).lineTo(55, 30).stroke({ color: OUTLINE, width: 5 })
  } else if (shape === 'cow') {
    g.ellipse(0, 0, 30, 18).fill(color)
      .roundRect(12, -22, 23, 23, 5).fill(color)
      .poly([12, -20, 7, -32, 21, -22, 32, -32, 33, -20]).fill(color)
      .rect(-22, 12, 8, 15).fill(color).rect(12, 12, 8, 15).fill(color)
      .circle(-9, -3, 6).fill(OUTLINE).circle(25, -14, 3).fill(OUTLINE)
  } else if (shape === 'toilet') {
    g.roundRect(-29, -26, 18, 30, 3).fill(color)
      .ellipse(4, 0, 29, 12).fill(color).stroke({ color: OUTLINE, width: 3 })
      .poly([-15, 4, 20, 4, 10, 25, -12, 25]).fill(color)
      .ellipse(4, 0, 15, 5).stroke({ color: OUTLINE, width: 2 })
  } else if (shape === 'topping') {
    g.circle(0, 0, 13).fill(color).stroke({ color: OUTLINE, width: 2 })
      .circle(-4, -4, 3).fill(OUTLINE).circle(5, 4, 3).fill(OUTLINE)
  } else if (shape === 'pizza') {
    g.poly([-25, -18, 25, -18, 0, 25]).fill(color).stroke({ color: OUTLINE, width: 3 })
      .circle(-6, -6, 4).fill(OUTLINE).circle(5, 5, 4).fill(OUTLINE)
  } else if (shape === 'alien') {
    g.ellipse(0, 20, 48, 70).fill(color)
      .ellipse(0, -40, 56, 48).fill(color)
      .ellipse(-23, -42, 12, 18).fill(OUTLINE).ellipse(23, -42, 12, 18).fill(OUTLINE)
      .moveTo(-18, -13).quadraticCurveTo(0, 0, 18, -13).stroke({ color: OUTLINE, width: 3 })
  } else if (shape === 'space') {
    g.rect(-320, -200, 640, 400).fill(color)
    for (let i = 0; i < 22; i++) {
      g.star((i * 97 % 640) - 320, (i * 73 % 400) - 200, 4, 4, 2).fill('#d777ae')
    }
    g.circle(180, -125, 35).fill('#f5b5d6')
      .ellipse(180, -125, 54, 9).stroke({ color: OUTLINE, width: 3 })
  } else if (shape === 'lamp') {
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
  private sprite: Sprite | AnimatedSprite | null = null
  private bounceLeft = 0

  constructor(private readonly assetId: string, label: string, interactive: boolean, private readonly size?: { width: number; height: number }) {
    super()
    this.placeholder = new Container()
    const text = new Text({
      text: label,
      style: { fontSize: 14, fontWeight: '700', fill: '#7a2e5c', fontFamily: 'sans-serif' },
    })
    text.anchor.set(0.5, 0)
    text.position.set(0, ASSETS[assetId]?.kind === 'minigame' ? 34 : 6)
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
    if (!source || source.type === 'generated') return
    try {
      const loaded: unknown = await Assets.load(source.src)
      if (this.disposed) return
      let sprite: Sprite | AnimatedSprite
      if (source.type === 'spritesheet') {
        const options = source.animations.idle
        if (!(loaded instanceof Spritesheet) || !options || !loaded.animations[options.animation]?.length) {
          throw new Error('Das Objekt-Spritesheet benötigt eine idle-Animation.')
        }
        const animated = new AnimatedSprite(loaded.animations[options.animation])
        animated.autoUpdate = false
        animated.animationSpeed = options.speed ?? 0.12
        animated.loop = options.loop ?? true
        animated.anchor.set(options.anchor?.x ?? 0.5, options.anchor?.y ?? 0.5)
        animated.scale.set(options.scale ?? 1)
        animated.play()
        sprite = animated
      } else {
        sprite = Sprite.from(source.src)
        sprite.anchor.set(0.5, this.size ? 0.5 : 1)
      }
      if (this.size) {
        const fit = Math.min(this.size.width / sprite.width, this.size.height / sprite.height)
        sprite.scale.set(sprite.scale.x * fit, sprite.scale.y * fit)
      }
      this.sprite = sprite
      this.addChildAt(sprite, 0)
      this.placeholder.visible = false
    } catch (cause) {
      console.warn(`Objekt-Asset ${this.assetId} nicht verfügbar; pinkfarbener Platzhalter bleibt aktiv.`, cause)
    }
  }

  bounce(): void {
    this.bounceLeft = 250
  }

  update(ticker: Ticker): void {
    this.bounceLeft = Math.max(0, this.bounceLeft - ticker.deltaMS)
    this.placeholder.y = this.bounceLeft > 0 ? -14 : 0
    if (this.sprite instanceof AnimatedSprite) this.sprite.update(ticker)
  }

  override destroy(): void {
    this.disposed = true
    super.destroy({ children: true })
  }
}
