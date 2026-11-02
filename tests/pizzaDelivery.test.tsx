import { StrictMode, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PizzaDelivery } from '../src/components/PizzaDelivery'
import { createInitialGameState } from '../src/game/gameLogic'

interface TestApp {
  canvas: HTMLCanvasElement
  init: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  tick: (deltaMS: number) => void
}
const harness = vi.hoisted(() => ({ apps: [] as TestApp[] }))
vi.mock('pixi.js', () => ({
  Application: class {
    canvas = document.createElement('canvas')
    init = vi.fn(async () => {})
    destroy = vi.fn(() => this.canvas.remove())
    stop = vi.fn()
    start = vi.fn()
    stage = { addChild: vi.fn() }
    callback: ((ticker: { deltaMS: number }) => void) | null = null
    ticker = { add: (callback: (ticker: { deltaMS: number }) => void) => { this.callback = callback } }
    tick(deltaMS: number) { this.callback?.({ deltaMS }) }
    constructor() { harness.apps.push(this) }
  },
}))
vi.mock('../src/rendering/PizzaFlightRenderer', () => ({
  PizzaFlightRenderer: class {
    renderFlight = vi.fn()
  },
}))

let root: Root | undefined
let host: HTMLDivElement
const pilot = createInitialGameState('creature_01').creatures[0]
const onFinish = vi.fn()
const onExit = vi.fn()
const onRetry = vi.fn()
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  harness.apps.length = 0
  onFinish.mockReset()
  onExit.mockReset()
  onRetry.mockReset()
})
afterEach(async () => {
  await act(async () => root?.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

async function render(strict = false) {
  const game = <PizzaDelivery pilot={pilot} highscore={0} canRetry onFinish={onFinish} onExit={onExit} onRetry={onRetry} />
  await act(async () => { root?.render(strict ? <StrictMode>{game}</StrictMode> : game) })
  return harness.apps[harness.apps.length - 1]
}

describe('delivery UI lifecycle', () => {
  it('switches adjacent lanes with keyboard and touch, while countdown blocks input', async () => {
    const app = await render()
    await act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })) })
    expect(host.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain('Mitte')
    await act(async () => {
      app.tick(3010)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    })
    expect(host.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain('oben')
    await act(async () => {
      app.tick(200)
      host.querySelectorAll('.flight-controls button')[1].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
    })
    expect(host.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain('Mitte')
    await act(async () => {
      app.tick(200)
      host.querySelectorAll<HTMLButtonElement>('.flight-controls button')[1].click()
    })
    expect(host.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain('unten')
  })

  it('stops at defeat, books only once and surfaces save errors with an idempotent retry', async () => {
    onFinish.mockRejectedValueOnce(new Error('Speicher voll')).mockResolvedValueOnce({
      runId: 'run', success: false, toppings: 3, score: 30, xp: 0,
    })
    const app = await render()
    await act(async () => { app.tick(70_000) })
    expect(app.stop).toHaveBeenCalled()
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('Speicher voll')
    expect(host.textContent).toContain('noch nicht gespeichert')
    const retrySave = [...host.querySelectorAll('button')].find((button) => button.textContent === 'Ergebnis erneut speichern')
    await act(async () => { retrySave?.click() })
    expect(onFinish).toHaveBeenCalledTimes(2)
    expect(host.textContent).toContain('Erhaltene XP: 0')
    expect(host.querySelector('[role="alert"]')).toBeNull()
    expect(host.querySelector('canvas')).toBeNull()
  })

  it('destroys both StrictMode applications and unregisters keyboard/visibility listeners on leaving', async () => {
    const windowRemove = vi.spyOn(window, 'removeEventListener')
    const documentRemove = vi.spyOn(document, 'removeEventListener')
    const app = await render(true)
    expect(harness.apps).toHaveLength(2)
    expect(harness.apps[0].destroy).toHaveBeenCalledWith(true, { children: true })
    await act(async () => { root?.unmount(); root = undefined })
    expect(app.destroy).toHaveBeenCalledWith(true, { children: true })
    expect(windowRemove).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(documentRemove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(host.querySelector('canvas')).toBeNull()
  })

  it('pauses while hidden and resumes only an unfinished flight', async () => {
    const app = await render()
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(app.stop).toHaveBeenCalledTimes(1)
    hidden.mockReturnValue(false)
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(app.start).toHaveBeenCalledTimes(2)
    onFinish.mockResolvedValue({ runId: 'run', success: false, toppings: 3, score: 30, xp: 0 })
    await act(async () => { app.tick(70_000) })
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(app.start).toHaveBeenCalledTimes(2)
  })
})
