import { Application, Container, Graphics } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { ASSETS, placeholderColor } from '../assets/registry'

interface PixiCreatureProps {
  assetId: string
  name: string
  species: string
}

export function PixiCreature({ assetId, name, species }: PixiCreatureProps) {
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
        hostRef.current.appendChild(app.canvas)

        const asset = ASSETS[assetId]
        if (!asset || asset.kind !== 'creature' || asset.source.type !== 'generated') {
          setUnavailable(true)
          app.destroy(true)
          initialized = false
          return
        }

        const creature = new Container()
        creature.x = app.screen.width / 2
        creature.y = app.screen.height / 2
        app.stage.addChild(creature)

        const body = new Graphics()
          .ellipse(0, 12, 72, 60)
          .fill(asset.source.color)
          .stroke({ color: '#9e477d', width: 3 })
        const leftEar = new Graphics()
          .ellipse(-48, -34, 24, 37)
          .fill(asset.source.color)
          .stroke({ color: '#9e477d', width: 3 })
        const rightEar = new Graphics()
          .ellipse(48, -34, 24, 37)
          .fill(asset.source.color)
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
          .fill(placeholderColor('decor-cushion'))
        sparkle.x = 81
        sparkle.y = -60

        creature.addChild(leftEar, rightEar, body, face, sparkle)
        app.ticker.add((ticker) => {
          creature.y = app.screen.height / 2 + Math.sin(ticker.lastTime / 420) * 5
        })
      } catch {
        if (!disposed) setUnavailable(true)
        if (initialized) {
          initialized = false
          app.destroy(true)
        }
      }
    }

    void start()
    return () => {
      disposed = true
      if (initialized) app.destroy(true)
    }
  }, [assetId])

  return (
    <div className="creature-stage" aria-label={`${name}, dein ${species}`}>
      <div className="pixi-canvas-host" ref={hostRef} aria-hidden="true" />
      {unavailable && <div className="creature-fallback" style={{ backgroundColor: placeholderColor(assetId) }} aria-hidden="true" />}
      <span className="visually-hidden">{name} ist im Spielzimmer.</span>
    </div>
  )
}
