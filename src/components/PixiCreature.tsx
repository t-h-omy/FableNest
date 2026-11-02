import { Application, Graphics, type FederatedPointerEvent } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { placeholderColor } from '../assets/registry'
import { CreatureRenderer } from '../rendering/CreatureRenderer'
import { ObjectRenderer } from '../rendering/ObjectRenderer'
import type { AnimationState, Interaction } from '../models'

export interface RoomObject {
  productId: string
  assetId: string
  label: string
  x: number
  y: number
  interactive: boolean
}

interface PixiCreatureProps {
  assetId: string
  name: string
  species: string
  animation: AnimationState
  animationKey: number
  objects: RoomObject[]
  onObjectTap: (productId: string) => void
  onInteract: (action: Interaction) => void
}

export function PixiCreature(props: PixiCreatureProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<CreatureRenderer | null>(null)
  const latest = useRef(props)
  latest.current = props
  const [unavailable, setUnavailable] = useState(false)
  const objectsKey = props.objects.map((entry) => `${entry.productId}@${entry.x},${entry.y}`).join(';')

  useEffect(() => {
    let disposed = false
    let initialized = false
    const app = new Application()
    setUnavailable(false)

    async function start() {
      try {
        await app.init({
          width: 640, height: 400, backgroundAlpha: 0, antialias: true,
          autoDensity: false, resolution: Math.min(window.devicePixelRatio || 1, 2),
        })
        if (disposed || !hostRef.current) {
          app.destroy(true, { children: true })
          return
        }
        initialized = true
        app.canvas.setAttribute('aria-hidden', 'true')
        app.canvas.className = 'pixi-canvas'
        app.canvas.style.width = '100%'
        app.canvas.style.height = 'auto'
        hostRef.current.appendChild(app.canvas)

        const room = new Graphics()
          .roundRect(0, 0, 640, 400, 22).fill(placeholderColor('room-background'))
          .rect(0, 295, 640, 105).fill('#f5b5d6')
          .roundRect(50, 40, 100, 110, 12).fill('#fff0f8')
          .ellipse(320, 320, 110, 20).fill('#df97bc')
        app.stage.addChild(room)
        const objects = latest.current.objects.map((entry) => {
          const object = new ObjectRenderer(entry.assetId, entry.label, entry.interactive)
          object.position.set(entry.x, entry.y)
          if (entry.interactive) {
            object.on('pointertap', () => {
              object.bounce()
              latest.current.onObjectTap(entry.productId)
            })
          }
          app.stage.addChild(object)
          void object.load()
          return object
        })

        const creature = new CreatureRenderer(props.assetId)
        creature.position.set(320, 230)
        creature.setAnimation(latest.current.animation)
        rendererRef.current = creature
        app.stage.addChild(creature)

        let gesture: { id: number; x: number; y: number; distance: number; stroked: boolean } | null = null
        creature.on('pointerdown', (event: FederatedPointerEvent) => {
          if (gesture) return
          const point = event.getLocalPosition(creature)
          gesture = { id: event.pointerId, x: point.x, y: point.y, distance: 0, stroked: false }
        })
        creature.on('globalpointermove', (event: FederatedPointerEvent) => {
          if (!gesture || gesture.id !== event.pointerId) return
          const point = event.getLocalPosition(creature)
          if (!creature.hitArea?.contains(point.x, point.y)) return
          gesture.distance += Math.hypot(point.x - gesture.x, point.y - gesture.y)
          gesture.x = point.x
          gesture.y = point.y
          if (gesture.distance >= 24 && !gesture.stroked) {
            gesture.stroked = true
            latest.current.onInteract('pet')
          }
        })
        creature.on('pointerup', (event: FederatedPointerEvent) => {
          if (!gesture || gesture.id !== event.pointerId) return
          if (!gesture.stroked) latest.current.onInteract('tap')
          gesture = null
        })
        const cancel = (event: FederatedPointerEvent) => {
          if (gesture?.id === event.pointerId) gesture = null
        }
        creature.on('pointerupoutside', cancel)
        creature.on('pointercancel', cancel)
        app.ticker.add((ticker) => {
          creature.update(ticker.deltaMS)
          objects.forEach((object) => object.update(ticker))
        })
        await creature.load()
      } catch (cause) {
        console.error('Das Spielzimmer konnte nicht gezeichnet werden.', cause)
        if (!disposed) setUnavailable(true)
        if (initialized) {
          initialized = false
          rendererRef.current = null
          app.destroy(true, { children: true })
        }
      }
    }

    void start()
    return () => {
      disposed = true
      rendererRef.current = null
      if (initialized) app.destroy(true, { children: true })
    }
  }, [props.assetId, objectsKey])

  useEffect(() => {
    rendererRef.current?.setAnimation(props.animation)
  }, [props.animation, props.animationKey])

  return (
    <div className="creature-stage" aria-label={`${props.name}, dein ${props.species}`}>
      <div
        className="pixi-canvas-host"
        ref={hostRef}
        role="button"
        tabIndex={0}
        aria-label={`${props.name} antippen. Zum Streicheln über das Wesen wischen.`}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (!event.repeat) props.onInteract('tap')
          }
        }}
      />
      {unavailable && <p role="status">Die Zimmeransicht ist nicht verfügbar. Du kannst die Pflegeknöpfe weiter nutzen.</p>}
      {unavailable && <div className="creature-fallback" style={{ backgroundColor: placeholderColor(props.assetId) }} aria-hidden="true" />}
    </div>
  )
}
