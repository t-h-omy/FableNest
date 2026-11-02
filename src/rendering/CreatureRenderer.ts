import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Sprite, Spritesheet } from 'pixi.js'
import { ASSETS, placeholderColor } from '../assets/registry'
import type { AnimationState } from '../models'

export class CreatureRenderer extends Container {
  private readonly placeholder = new Container()
  private readonly symbol = new Graphics()
  private sprite: AnimatedSprite | Sprite | null = null
  private sheet: Spritesheet | null = null
  private state: AnimationState = 'idle'
  private elapsed = 0
  private disposed = false

  constructor(private readonly assetId: string) {
    super()
    const color = placeholderColor(assetId)
    const body = new Graphics()
      .ellipse(-48, -42, 23, 37).fill(color)
      .ellipse(48, -42, 23, 37).fill(color)
      .ellipse(0, 10, 72, 60).fill(color)
      .stroke({ color: '#9e477d', width: 3 })
    const face = new Graphics()
      .circle(-24, 5, 4).fill('#50394c')
      .circle(24, 5, 4).fill('#50394c')
      .moveTo(-9, 24).quadraticCurveTo(0, 34, 9, 24)
      .stroke({ color: '#9e477d', width: 3 })
    this.placeholder.addChild(body, face)
    this.addChild(this.placeholder, this.symbol)
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.hitArea = new Rectangle(-85, -85, 170, 170)
  }

  async load(): Promise<void> {
    const source = ASSETS[this.assetId]?.source
    if (!source || source.type === 'generated') return
    try {
      const loaded: unknown = await Assets.load(source.src)
      if (this.disposed) return
      if (source.type === 'spritesheet') {
        if (!(loaded instanceof Spritesheet)) throw new Error('Ungültiges Spritesheet')
        this.sheet = loaded
      } else {
        this.sprite = Sprite.from(source.src)
        this.sprite.anchor.set(0.5)
        this.addChildAt(this.sprite, 0)
      }
      this.setAnimation(this.state)
    } catch (cause) {
      console.warn(`Wesen-Asset ${this.assetId} nicht verfügbar; pinkfarbener Platzhalter bleibt aktiv.`, cause)
    }
  }

  setAnimation(state: AnimationState): void {
    this.state = state
    this.elapsed = 0
    this.symbol.clear()
    if (state === 'sleep') {
      this.symbol.moveTo(80, -70).lineTo(100, -70).lineTo(80, -50).lineTo(100, -50)
        .stroke({ color: '#9e477d', width: 4 })
    } else if (state === 'eat') {
      this.symbol.circle(80, 20, 13).fill('#ce5697')
    } else if (state === 'happy' || state === 'play') {
      this.symbol.star(85, -60, 5, 16, 8).fill('#ce5697')
    }
    const source = ASSETS[this.assetId]?.source
    if (this.sheet && source?.type === 'spritesheet') {
      const options = source.animations[state]
      const frames = options ? this.sheet.animations[options.animation] : undefined
      if (!options || !frames?.length) {
        if (this.sprite) this.sprite.visible = false
        this.placeholder.visible = true
        console.warn(`Animation ${state} für ${this.assetId} fehlt; verwende Platzhalter.`)
        return
      }
      if (this.sprite) {
        this.sprite.destroy()
        this.sprite = null
      }
      const sprite = new AnimatedSprite(frames)
      sprite.animationSpeed = options.speed ?? 0.12
      sprite.loop = options.loop ?? true
      sprite.scale.set(options.scale ?? 1)
      sprite.anchor.set(options.anchor?.x ?? 0.5, options.anchor?.y ?? 0.5)
      this.sprite = sprite
      this.addChildAt(sprite, 0)
      sprite.play()
    }
    this.placeholder.visible = !this.sprite
    if (this.sprite) this.sprite.visible = true
  }

  update(deltaMs: number): void {
    this.elapsed += deltaMs
    const t = this.elapsed / 1000
    const visual = this.placeholder
    visual.position.set(0, 0)
    visual.scale.set(1)
    visual.rotation = 0
    if (this.state === 'idle') visual.y = Math.sin(t * 2.5) * 4
    if (this.state === 'happy') {
      visual.y = -Math.abs(Math.sin(t * 7)) * 22
      visual.rotation = Math.sin(t * 7) * 0.08
    }
    if (this.state === 'eat') {
      visual.scale.set(1 + Math.sin(t * 10) * 0.04, 1 - Math.sin(t * 10) * 0.04)
      visual.rotation = Math.sin(t * 5) * 0.05
    }
    if (this.state === 'sleep') {
      visual.rotation = -0.3
      visual.y = 20
      visual.scale.set(1, 0.8 + Math.sin(t * 2) * 0.025)
    }
    if (this.state === 'play') {
      visual.x = Math.sin(t * 5) * 40
      visual.rotation = Math.sin(t * 5) * 0.2
    }
  }

  override destroy(): void {
    this.disposed = true
    super.destroy({ children: true })
  }
}
