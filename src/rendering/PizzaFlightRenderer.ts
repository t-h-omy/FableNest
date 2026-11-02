import { Container, type Ticker } from 'pixi.js'
import { FLIGHT, FLIGHT_ART } from '../data/minigames'
import type { Creature, FlightState } from '../models'
import { CreatureRenderer } from './CreatureRenderer'
import { ObjectRenderer } from './ObjectRenderer'

export class PizzaFlightRenderer extends Container {
  private readonly backgrounds: ObjectRenderer[] = []
  private readonly plane = new Container()
  private readonly pilot: CreatureRenderer
  private readonly pizza = new ObjectRenderer('delivery-pizza', 'Pizza', false, { width: 50, height: 45 })
  private readonly alien = new ObjectRenderer('alien-customer', 'Alien-Kunde', false, { width: 112, height: 180 })
  private readonly objects = new Map<number, ObjectRenderer>()
  private readonly planeArt = new ObjectRenderer('pizza-plane', 'Pizzaflieger', false, { width: 110, height: 55 })

  constructor(creature: Creature, flight: FlightState) {
    super()
    for (let i = 0; i < 2; i++) {
      const background = new ObjectRenderer('pizza-space', '', false, { width: 640, height: 400 })
      this.backgrounds.push(background)
      this.addChild(background)
      void background.load()
    }
    flight.entities.forEach((entity) => {
      const art = FLIGHT_ART[entity.kind]
      const size = entity.kind === 'topping' ? { width: 26, height: 26 } : { width: 64, height: 50 }
      const object = new ObjectRenderer(art.assetId, art.label, false, size)
      this.objects.set(entity.id, object)
      this.addChild(object)
      void object.load()
    })
    this.pilot = new CreatureRenderer(creature.assetId)
    this.pilot.eventMode = 'none'
    this.pilot.scale.set(0.27)
    this.pilot.position.set(0, -21)
    this.pilot.setAnimation('idle')
    this.plane.addChild(this.planeArt, this.pilot)
    this.addChild(this.alien, this.plane, this.pizza)
    void this.pilot.load()
    void this.planeArt.load()
    void this.alien.load()
    void this.pizza.load()
    this.renderFlight(flight)
  }

  renderFlight(state: FlightState, ticker?: Ticker): void {
    this.backgrounds.forEach((background, index) => {
      background.position.set(320 + index * 640 - (state.distance * 0.25 % 640), 200)
      if (ticker) background.update(ticker)
    })
    this.plane.position.set(FLIGHT.playerX, FLIGHT.laneY[state.lane])
    this.plane.alpha = state.invulnerable > 0 ? 0.45 + Math.sin(state.invulnerable * 30) * 0.2 : 1
    this.pilot.update(ticker?.deltaMS ?? 0)
    if (ticker) this.planeArt.update(ticker)
    state.entities.forEach((entity) => {
      const object = this.objects.get(entity.id)
      if (!object) return
      const x = FLIGHT.playerX + entity.distance - state.distance
      object.visible = !entity.removed && x > -80 && x < 720
      object.position.set(x, FLIGHT.laneY[entity.lane])
      if (object.visible && ticker) object.update(ticker)
    })
    const arriving = state.phase === 'delivering' || state.phase === 'won'
    this.alien.visible = state.distance > FLIGHT.distance - 600
    this.alien.position.set(530 + Math.max(0, FLIGHT.distance - state.distance), 205)
    if (ticker) this.alien.update(ticker)
    this.pizza.visible = state.phase !== 'lost'
    const delivery = arriving ? Math.min(1, state.phase === 'won' ? 1 : state.phaseTime / FLIGHT.deliverySeconds) : 0
    this.pizza.position.set(
      FLIGHT.playerX + 80 + delivery * 295,
      FLIGHT.laneY[state.lane] + 5 + (205 - FLIGHT.laneY[state.lane]) * delivery,
    )
    if (ticker) this.pizza.update(ticker)
  }
}
