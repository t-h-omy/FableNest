import { Application, Container, Graphics } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { ASSETS } from '../assets/registry'

interface PixiCreatureProps {
  color: string
  name: string
}

export function PixiCreature({ color, name }: PixiCreatureProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let disposed = false
    let initialized = false
    const app = new Application()

    async function start() {
      try {
        await app.init({
          width: 320,
          height: 220,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
        })

        if (disposed || !hostRef.current) {
          app.destroy(true)
          return
        }

        initialized = true
        app.canvas.setAttribute('aria-hidden', 'true')
        app.canvas.className = 'pixi-canvas'
        hostRef.current.replaceChildren(app.canvas)

        const creature = new Container()
        creature.x = app.screen.width / 2
        creature.y = app.screen.height / 2
        app.stage.addChild(creature)

        const body = new Graphics()
          .ellipse(0, 12, 72, 60)
          .fill(color)
          .stroke({ color: '#9e477d', width: 3 })
        const leftEar = new Graphics()
          .ellipse(-48, -34, 24, 37)
          .fill(color)
          .stroke({ color: '#9e477d', width: 3 })
        const rightEar = new Graphics()
          .ellipse(48, -34, 24, 37)
          .fill(color)
          .stroke({ color: '#9e477d', width: 3 })
        const face = new Graphics()
          .circle(-24, 7, 4)
          .circle(24, 7, 4)
          .stroke({ color: '#50394c', width: 4 })
          .moveTo(-8, 24)
          .quadraticCurveTo(0, 32, 8, 24)
          .stroke({ color: '#9e477d', width: 3 })
        const sparkle = new Graphics()
          .star(0, 0, 4, 8, 4)
          .fill(ASSETS.decor.color)
        sparkle.x = 81
        sparkle.y = -60

        creature.addChild(leftEar, rightEar, body, face, sparkle)
        app.ticker.add((ticker) => {
          creature.y = app.screen.height / 2 + Math.sin(ticker.lastTime / 420) * 5
        })
      } catch {
        if (!disposed) setUnavailable(true)
        if (initialized) app.destroy(true)
      }
    }

    void start()
    return () => {
      disposed = true
      if (initialized) app.destroy(true)
    }
  }, [color])

  return (
    <div className="creature-stage" ref={hostRef} aria-label={`${name}, dein ${name === 'Mika' ? 'Wolkenfuchs' : 'Fantasiewesen'}`}>
      {unavailable && <div className="creature-fallback" style={{ backgroundColor: color }} aria-hidden="true" />}
      <span className="visually-hidden">{name} ist im Spielzimmer.</span>
    </div>
  )
}
