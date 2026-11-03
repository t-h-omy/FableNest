import { Application, Graphics, type FederatedPointerEvent } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { placeholderColor } from '../assets/registry'
import { ROOM_LAYOUT } from '../data/room'
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
          width: ROOM_LAYOUT.width, height: ROOM_LAYOUT.height, backgroundAlpha: 0, antialias: true,
          autoDensity: false, resolution: Math.min(window.devicePixelRatio || 1, 2),
        })
        if (disposed || !hostRef.current) {
          app.destroy(true, { children: true })
          return
        }
        initialized = true
        app.canvas.setAttribute('aria-hidden', 'true')
        app.canvas.className = 'pixi-canvas room-canvas'
        app.canvas.style.width = '100%'
        app.canvas.style.height = 'auto'
        hostRef.current.appendChild(app.canvas)

        const { width, height, floorY, window: pane, shelf, creature: spot } = ROOM_LAYOUT
        // Pinker Platzhalterraum: Wand, Boden, Fenster, Regal und Schatten unter dem Wesen.
        const room = new Graphics()
          .rect(0, 0, width, height).fill(placeholderColor('room-background'))
          .rect(0, floorY, width, height - floorY).fill('#f5b5d6')
          .rect(0, floorY, width, 6).fill('#ec9fc8')
          .roundRect(pane.x, pane.y, pane.width, pane.height, 14).fill('#fff0f8')
          .rect(pane.x + pane.width / 2 - 2, pane.y, 4, pane.height).fill('#f5c6de')
          .rect(pane.x, pane.y + pane.height / 2 - 2, pane.width, 4).fill('#f5c6de')
          .roundRect(shelf.x, shelf.y, shelf.width, 12, 6).fill('#df97bc')
          .ellipse(spot.x, spot.y + 78 * spot.scale, 112, 20).fill('#df97bc')
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
        creature.position.set(spot.x, spot.y)
        creature.scale.set(spot.scale)
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
      {unavailable && <div className="creature-fallback" style={{ backgroundColor: placeholderColor(props.assetId) }} aria-hidden="true" />}
      {unavailable && <p className="stage-fallback-note" role="status">Die Zimmeransicht ist nicht verfügbar. Du kannst die Pflegeknöpfe weiter nutzen.</p>}
    </div>
  )
}
