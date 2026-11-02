import { describe, expect, it } from 'vitest'
import { FLIGHT, MINIGAMES, PIZZA_GAME_ID } from '../src/data/minigames'
import { ENERGY_REGEN_MS, LEVEL_THRESHOLDS } from '../src/data/gameContent'
import { createInitialGameState, interact, selectCreature } from '../src/game/gameLogic'
import {
  advanceFlight, createCourse, createFlight, finishDelivery, flightHitbox,
  isMinigameUnlocked, moveFlight, overlaps, startDelivery,
} from '../src/game/pizzaFlight'
import { regenerateCreature, regenerateEnergy } from '../src/game/progression'
import { purchaseProduct } from '../src/game/shop'
import { calendarDate } from '../src/game/tasks'
import type { FlightEntity, FlightState, GameState } from '../src/models'

const now = new Date(2026, 10, 2, 12).getTime()
const initial = () => {
  const state = createInitialGameState('creature_01')
  return { ...state, creatures: state.creatures.map((creature) => ({ ...creature, energyUpdatedAt: now })) }
}
const flying = (entities: FlightEntity[] = []): FlightState => ({ ...createFlight(), phase: 'flying', entities })
const obstacle = (distance: number, id = 0): FlightEntity => ({ id, distance, lane: 1, kind: 'cow', removed: false })
const won = (toppings = 0): FlightState => ({ ...flying(), phase: 'won', distance: FLIGHT.distance, toppings, score: toppings * FLIGHT.scorePerTopping })
const restart = (state: GameState, runId: string, time = now) => startDelivery({
  ...state, creatures: state.creatures.map((creature) => ({ ...creature, energy: 100 })),
}, runId, time)

describe('pizza flight', () => {
  it('starts with three lives and a three-second countdown, without moving or accepting lane changes', () => {
    const state = createFlight()
    expect(state.lives).toBe(3)
    expect(moveFlight(state, -1)).toBe(state)
    const early = advanceFlight(state, 2.99)
    expect(early.phase).toBe('countdown')
    expect(early.distance).toBe(0)
    const ready = advanceFlight(state, 3)
    expect(ready.phase).toBe('flying')
    expect(ready.distance).toBe(0)
    expect(advanceFlight(ready, 1).distance).toBeCloseTo(FLIGHT.speed)
  })

  it('moves only to adjacent lanes, respects a short cooldown and clamps both ends', () => {
    const top = moveFlight(flying(), -1)
    expect(top.lane).toBe(0)
    expect(moveFlight(top, 1)).toBe(top)
    const ready = advanceFlight(top, 0.2)
    expect(moveFlight(ready, -1)).toBe(ready)
    const middle = moveFlight(ready, 1)
    expect(middle.lane).toBe(1)
    const bottom = moveFlight(advanceFlight(middle, 0.2), 1)
    expect(bottom.lane).toBe(2)
    const bottomReady = advanceFlight(bottom, 0.2)
    expect(moveFlight(bottomReady, 1)).toBe(bottomReady)
  })

  it('uses rectangular overlap, not touching edges or other lanes', () => {
    const box = flightHitbox(FLIGHT.playerX, 1)
    expect(overlaps(box, box)).toBe(true)
    expect(overlaps(box, { ...box, x: box.x + box.width })).toBe(false)
    expect(overlaps(box, { ...box, y: box.y + box.height })).toBe(false)
    expect(overlaps(box, flightHitbox(FLIGHT.playerX, 0))).toBe(false)
  })

  it.each(['cow', 'toilet'] as const)('loses one life for a %s and remains invulnerable for one second', (kind) => {
    const first = advanceFlight(flying([{ ...obstacle(0), kind }]), 1 / 120)
    expect(first.lives).toBe(2)
    expect(first.invulnerable).toBe(1)
    const immune = advanceFlight({
      ...first, entities: [obstacle(first.distance, 1)],
    }, 0.5)
    expect(immune.lives).toBe(2)
    const ready = advanceFlight(immune, 0.5)
    expect(ready.invulnerable).toBe(0)
    const hit = advanceFlight({ ...ready, entities: [obstacle(ready.distance, 2)] }, 1 / 120)
    expect(hit.lives).toBe(1)
    const lost = advanceFlight({
      ...hit, invulnerable: 0, entities: [obstacle(hit.distance, 3)],
    }, 1 / 120)
    expect(lost.phase).toBe('lost')
    expect(lost.lives).toBe(0)
    expect(advanceFlight(lost, 10)).toBe(lost)
  })

  it('collects each topping once and avoids damage on an unblocked lane', () => {
    const state = flying([obstacle(0), { ...obstacle(0, 1), kind: 'topping', lane: 0 }])
    const collected = advanceFlight(moveFlight(state, -1), 0.1)
    expect(collected.lives).toBe(3)
    expect(collected.toppings).toBe(1)
    expect(collected.score).toBe(FLIGHT.scorePerTopping)
    expect(advanceFlight(collected, 0.2).toppings).toBe(1)
  })

  it('ends the defined distance after 60 seconds, delivers to the alien, then wins', () => {
    const early = advanceFlight(flying(), 59.9)
    expect(early.phase).toBe('flying')
    const arrived = advanceFlight(flying(), 60)
    expect(arrived.distance).toBe(FLIGHT.distance)
    expect(arrived.phase).toBe('delivering')
    expect(advanceFlight(arrived, 1.99).phase).toBe('delivering')
    const delivered = advanceFlight(arrived, 2)
    expect(delivered.phase).toBe('won')
    expect(advanceFlight(delivered, 10)).toBe(delivered)
  })

  it('is delta-time independent and never tunnels through obstacles on long frames', () => {
    const simulate = (fps: number) => {
      let state = flying([obstacle(180)])
      for (let frame = 0; frame < fps * 2; frame++) state = advanceFlight(state, 1 / fps)
      return state
    }
    const slow = simulate(30)
    const fast = simulate(144)
    expect(slow.distance).toBeCloseTo(fast.distance, 7)
    expect(slow.lives).toBe(fast.lives)
    expect(advanceFlight(flying([obstacle(180)]), 2).lives).toBe(2)
    expect(() => advanceFlight(flying(), NaN)).toThrow()
    expect(() => advanceFlight(flying(), -1)).toThrow()
  })

  it('provides a reachable safe lane for every wave and a complete damage-free collectible route', () => {
    const course = createCourse()
    expect(new Set(course.map((entity) => entity.kind))).toEqual(new Set(['cow', 'toilet', 'topping']))
    let previousDistance = 0
    for (const entity of course.filter((entry) => entry.kind !== 'topping')) {
      const gap = entity.distance - previousDistance
      expect((gap - 128) / FLIGHT.speed).toBeGreaterThan(2 * FLIGHT.laneChangeSeconds)
      expect(course.filter((entry) => entry.kind !== 'topping' && entry.distance === entity.distance)).toHaveLength(1)
      previousDistance = entity.distance
    }
    let state: FlightState = { ...createFlight(), phase: 'flying' }
    while (state.phase === 'flying') {
      const next = course.find((entity) => entity.kind === 'topping' && entity.distance >= state.distance - 30)
      if (next && state.distance > next.distance - 300 && state.lane !== next.lane) {
        state = moveFlight(state, state.lane < next.lane ? 1 : -1)
      }
      state = advanceFlight(state, 1 / 60)
    }
    expect(state.phase).toBe('delivering')
    expect(state.lives).toBe(3)
    expect(state.toppings).toBe(course.filter((entity) => entity.kind === 'topping').length)
  })
})

describe('delivery progression', () => {
  it('unlocks the first registry entry independently of level', () => {
    expect(MINIGAMES).toHaveLength(1)
    expect(isMinigameUnlocked(initial(), PIZZA_GAME_ID)).toBe(true)
    expect(isMinigameUnlocked(initial(), 'unknown')).toBe(false)
    expect(LEVEL_THRESHOLDS).toHaveLength(20)
  })

  it('deducts exactly 20 energy at start, rejects insufficient energy and never charges again at finish', () => {
    const started = startDelivery(initial(), 'run', now)
    expect(started.creatures[0].energy).toBe(55)
    expect(started.pendingDelivery).toEqual({ runId: 'run', creatureId: 'creature_01' })
    expect(() => startDelivery(started, 'run', now)).toThrow()
    const tired = { ...initial(), creatures: [{ ...initial().creatures[0], energy: 19 }] }
    expect(() => startDelivery(tired, 'poor', now)).toThrow(/20 Energie/)
    const exact = { ...initial(), creatures: [{ ...initial().creatures[0], energy: 20 }] }
    expect(startDelivery(exact, 'exact', now).creatures[0].energy).toBe(0)
    expect(finishDelivery(started, 'run', won(), now).creatures[0].energy).toBe(55)
    expect(() => startDelivery(createInitialGameState(), 'none', now)).toThrow()
  })

  it.each([[0, 20], [1, 22], [9, 38], [10, 40], [20, 40]])('grants %i toppings exactly %i XP', (toppings, xp) => {
    const state = finishDelivery(startDelivery(initial(), 'run', now), 'run', won(toppings), now)
    expect(state.creatures[0].xp).toBe(xp)
    expect(state.lastDeliveryResult?.xp).toBe(xp)
  })

  it('credits only the active pilot, caps XP at level 20 and does not change size/species', () => {
    const pair = purchaseProduct({ ...initial(), coins: 20 }, 'second-creature')
    const active = selectCreature(pair, 'creature_02')
    const started = startDelivery(active, 'run', now)
    const finished = finishDelivery(started, 'run', won(5), now)
    expect(finished.creatures[0]).toEqual(started.creatures[0])
    expect(finished.creatures[1].xp).toBe(30)
    expect(finished.creatures[1].species).toBe(active.creatures[1].species)
    const nearCap = { ...initial(), creatures: [{ ...initial().creatures[0], xp: 1899, level: 19 }] }
    const capped = finishDelivery(startDelivery(nearCap, 'cap', now), 'cap', won(), now)
    expect(capped.creatures[0]).toMatchObject({ xp: 1900, level: 20 })
    expect(capped.lastDeliveryResult?.xp).toBe(1)
  })

  it('does not award XP for a defeat, but stores its score and does not consume a daily XP slot', () => {
    const lost = { ...won(3), phase: 'lost' as const }
    const finished = finishDelivery(startDelivery(initial(), 'run', now), 'run', lost, now)
    expect(finished.lastDeliveryResult).toMatchObject({ xp: 0, score: 30, success: false })
    expect(finished.creatures[0].deliveryXpDates).toEqual({})
    expect(finished.minigameHighscores[PIZZA_GAME_ID]).toBe(30)
  })

  it('awards only the first three successful deliveries per creature and local calendar day', () => {
    let state = initial()
    for (let i = 0; i < 4; i++) state = finishDelivery(restart(state, `run-${i}`), `run-${i}`, won(10), now)
    expect(state.creatures[0].xp).toBe(120)
    expect(state.lastDeliveryResult?.xp).toBe(0)
    expect(state.creatures[0].deliveryXpDates[calendarDate(new Date(now))]).toBe(3)
    // Switching to the other friend does not share the daily limit.
    state = selectCreature(purchaseProduct({ ...state, coins: 20 }, 'second-creature'), 'creature_02')
    state = finishDelivery(restart(state, 'other'), 'other', won(), now)
    expect(state.creatures[1].xp).toBe(20)
    const tomorrow = new Date(2026, 10, 3, 0, 0).getTime()
    state = selectCreature(state, 'creature_01')
    state = finishDelivery(restart(state, 'tomorrow', tomorrow), 'tomorrow', won(), tomorrow)
    expect(state.creatures[0].xp).toBe(140)
    expect(state.creatures[0].deliveryXpDates[calendarDate(new Date(tomorrow))]).toBe(1)
  })

  it('uses the arrival date at midnight, not the start date', () => {
    const midnight = new Date(2026, 10, 3).getTime()
    const started = startDelivery(initial(), 'midnight', midnight - 60_000)
    const finished = finishDelivery(started, 'midnight', won(), midnight)
    expect(finished.creatures[0].deliveryXpDates[calendarDate(new Date(midnight))]).toBe(1)
  })

  it('books a result once, never lowers a highscore and rejects abandoned or unfinished runs', () => {
    const started = startDelivery(initial(), 'run', now)
    expect(() => finishDelivery(started, 'run', createFlight(), now)).toThrow()
    expect(() => finishDelivery(started, 'wrong', won(), now)).toThrow()
    const first = finishDelivery(started, 'run', won(10), now)
    expect(finishDelivery(first, 'run', won(10), now)).toBe(first)
    const second = finishDelivery(restart(first, 'second'), 'second', won(1), now)
    expect(second.minigameHighscores[PIZZA_GAME_ID]).toBe(100)
    const replaced = startDelivery(started, 'replacement', now)
    expect(() => finishDelivery(replaced, 'run', won(), now)).toThrow()
  })

  it('never rewards a different active creature after a cross-tab switch', () => {
    const pair = purchaseProduct({ ...initial(), coins: 20 }, 'second-creature')
    const started = startDelivery(pair, 'run', now)
    expect(() => finishDelivery(selectCreature(started, 'creature_02'), 'run', won(), now)).toThrow(/gewechselt/)
  })
})

describe('energy regeneration', () => {
  it('restores one point per full minute including closed-app time, retains remainder and caps at 100', () => {
    const creature = { ...initial().creatures[0], energy: 0 }
    expect(regenerateCreature(creature, now + ENERGY_REGEN_MS - 1)).toBe(creature)
    const restored = regenerateCreature(creature, now + ENERGY_REGEN_MS * 3 + 30_000)
    expect(restored.energy).toBe(3)
    expect(restored.energyUpdatedAt).toBe(now + ENERGY_REGEN_MS * 3)
    expect(regenerateCreature(restored, now + ENERGY_REGEN_MS * 4).energy).toBe(4)
    expect(regenerateCreature(creature, now + ENERGY_REGEN_MS * 200).energy).toBe(100)
    expect(regenerateCreature(creature, now - 1)).toBe(creature)
    expect(() => regenerateEnergy(initial(), NaN)).toThrow()
  })

  it('allows a start after regeneration, without banking energy above 100', () => {
    const state = initial()
    const exhausted = { ...state, creatures: [{ ...state.creatures[0], energy: 19 }] }
    const launched = startDelivery(exhausted, 'run', now + ENERGY_REGEN_MS)
    expect(launched.creatures[0].energy).toBe(0)
    const full = { ...state, creatures: [{ ...state.creatures[0], energy: 100 }] }
    const later = now + ENERGY_REGEN_MS * 300
    const spent = startDelivery(full, 'full', later)
    expect(spent.creatures[0].energy).toBe(80)
    expect(regenerateCreature(spent.creatures[0], later + ENERGY_REGEN_MS - 1).energy).toBe(80)
  })

  it('shares regenerated energy with care without discarding it or mutating inactive friends', () => {
    const state = initial()
    const played = interact(state, 'play', now + ENERGY_REGEN_MS * 2)
    expect(played.creatures[0].energy).toBe(67)
    expect(played.creatures[0].energyUpdatedAt).toBe(now + ENERGY_REGEN_MS * 2)
  })
})
