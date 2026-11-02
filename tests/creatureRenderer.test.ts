// @vitest-environment node
import { AnimatedSprite, Assets, Spritesheet, Texture } from 'pixi.js'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ASSETS, type AssetDefinition } from '../src/assets/registry'
import { CreatureRenderer } from '../src/rendering/CreatureRenderer'
import type { AnimationState } from '../src/models'

const loadAsset = vi.hoisted(() => vi.fn<() => Promise<unknown>>())
vi.mock('pixi.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pixi.js')>()
  return { ...actual, Assets: { load: loadAsset } }
})

const original = ASSETS['creature-mika']
const renderers: CreatureRenderer[] = []

beforeAll(() => {
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterAll(() => vi.unstubAllGlobals())

afterEach(() => {
  for (const renderer of renderers.splice(0)) renderer.destroy()
  ASSETS['creature-mika'] = original
  loadAsset.mockReset()
})

function createRenderer() {
  const renderer = new CreatureRenderer('creature-mika')
  renderers.push(renderer)
  return renderer
}

function useSheet(): Spritesheet {
  ASSETS['creature-mika'] = {
    ...original,
    source: {
      type: 'spritesheet', src: '/local/mika.json',
      animations: {
        idle: { animation: 'rest', speed: 0.2, loop: true, scale: 2, anchor: { x: 0.4, y: 0.8 } },
        happy: { animation: 'joy', speed: 0.4, loop: false, scale: 2 },
      },
    },
  } satisfies AssetDefinition
  const sheet = new Spritesheet(Texture.EMPTY, { frames: {}, meta: { scale: 1 } })
  sheet.animations = { rest: [Texture.EMPTY, Texture.EMPTY], joy: [Texture.EMPTY] }
  loadAsset.mockResolvedValue(sheet)
  return sheet
}

describe('CreatureRenderer', () => {
  it('uses visually distinct procedural motions without loading files', async () => {
    const renderer = createRenderer()
    await renderer.load()
    expect(loadAsset).not.toHaveBeenCalled()
    const poses = new Set<string>()
    for (const state of ['idle', 'happy', 'eat', 'sleep', 'play'] satisfies AnimationState[]) {
      renderer.setAnimation(state)
      renderer.update(210)
      const body = renderer.children[0]
      poses.add([body.x, body.y, body.rotation, body.scale.x, body.scale.y].join(','))
    }
    expect(poses.size).toBe(5)
  })

  it('loads named JSON animations and applies speed, looping, scale and anchor', async () => {
    useSheet()
    const renderer = createRenderer()
    await renderer.load()
    expect(Assets.load).toHaveBeenCalledWith('/local/mika.json')
    const idle = renderer.children[0]
    expect(idle).toBeInstanceOf(AnimatedSprite)
    if (!(idle instanceof AnimatedSprite)) throw new Error('Expected animation')
    expect(idle.animationSpeed).toBe(0.2)
    expect(idle.loop).toBe(true)
    expect(idle.scale.x).toBe(2)
    expect(idle.anchor.x).toBe(0.4)
    expect(idle.anchor.y).toBe(0.8)
    renderer.setAnimation('happy')
    const happy = renderer.children[0]
    if (!(happy instanceof AnimatedSprite)) throw new Error('Expected animation')
    expect(happy.animationSpeed).toBe(0.4)
    expect(happy.loop).toBe(false)
    expect(happy.scale.x).toBe(2)
    expect(idle.destroyed).toBe(true)
  })

  it('falls back for a missing animation and recovers on a supported state', async () => {
    useSheet()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const renderer = createRenderer()
    await renderer.load()
    renderer.setAnimation('sleep')
    expect(renderer.children[0].visible).toBe(false)
    expect(renderer.children[1].visible).toBe(true)
    expect(warning).toHaveBeenCalled()
    renderer.setAnimation('idle')
    expect(renderer.children[0].visible).toBe(true)
    expect(renderer.children[1].visible).toBe(false)
  })

  it('keeps its animated placeholder if JSON or texture loading fails', async () => {
    useSheet()
    loadAsset.mockRejectedValue(new Error('Datei fehlt'))
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const renderer = createRenderer()
    await renderer.load()
    renderer.setAnimation('eat')
    renderer.update(100)
    expect(renderer.children[0].visible).toBe(true)
    expect(renderer.children.some((child) => child instanceof AnimatedSprite)).toBe(false)
    expect(warning).toHaveBeenCalled()
  })

  it('ignores a load that completes after disposal', async () => {
    const sheet = useSheet()
    let finish: (value: Spritesheet) => void = () => { throw new Error('Load not started') }
    loadAsset.mockImplementation(() => new Promise<Spritesheet>((resolve) => { finish = resolve }))
    const renderer = new CreatureRenderer('creature-mika')
    const loading = renderer.load()
    renderer.destroy()
    finish(sheet)
    await loading
    expect(renderer.destroyed).toBe(true)
    expect(renderer.children).toHaveLength(0)
  })
})
