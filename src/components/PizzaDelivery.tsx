import { Application } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { FLIGHT } from '../data/minigames'
import { advanceFlight, createFlight, moveFlight } from '../game/pizzaFlight'
import { PizzaFlightRenderer } from '../rendering/PizzaFlightRenderer'
import type { Creature, DeliveryResult, FlightState } from '../models'

interface Props {
  pilot: Creature
  highscore: number
  canRetry: boolean
  onFinish: (flight: FlightState) => Promise<DeliveryResult>
  onRetry: () => void
  onExit: () => void
}

export function PizzaDelivery(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const flight = useRef(createFlight())
  const latest = useRef(props)
  latest.current = props
  const [hud, setHud] = useState(flight.current)
  const [result, setResult] = useState<DeliveryResult | null>(null)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [booking, setBooking] = useState(false)
  const mounted = useRef(false)
  const bookingRef = useRef(false)

  async function bookResult() {
    if (bookingRef.current) return
    bookingRef.current = true
    setBooking(true)
    setError('')
    try {
      const saved = await latest.current.onFinish(flight.current)
      if (mounted.current) setResult(saved)
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Das Ergebnis konnte nicht gespeichert werden.')
    } finally {
      bookingRef.current = false
      if (mounted.current) setBooking(false)
    }
  }
  const bookLatest = useRef(bookResult)
  bookLatest.current = bookResult

  function move(direction: -1 | 1) {
    flight.current = moveFlight(flight.current, direction)
    setHud(flight.current)
  }

  useEffect(() => {
    mounted.current = true
    let disposed = false
    let initialized = false
    const app = new Application()
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      if (flight.current.phase !== 'flying') return
      event.preventDefault()
      if (!event.repeat) move(event.key === 'ArrowUp' ? -1 : 1)
    }
    const visibility = () => {
      if (!initialized) return
      if (document.hidden) app.stop()
      else if (flight.current.phase !== 'won' && flight.current.phase !== 'lost') app.start()
    }

    async function start() {
      try {
        await app.init({
          width: FLIGHT.width, height: FLIGHT.height, backgroundAlpha: 0,
          antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2),
        })
        if (disposed || !host.current) {
          app.destroy(true, { children: true })
          return
        }
        initialized = true
        app.ticker.minFPS = 0
        app.canvas.setAttribute('aria-hidden', 'true')
        app.canvas.className = 'pixi-canvas'
        app.canvas.style.width = '100%'
        app.canvas.style.height = 'auto'
        host.current.appendChild(app.canvas)
        const scene = new PizzaFlightRenderer(latest.current.pilot, flight.current)
        app.stage.addChild(scene)
        window.addEventListener('keydown', keydown)
        document.addEventListener('visibilitychange', visibility)
        app.ticker.add((ticker) => {
          flight.current = advanceFlight(flight.current, ticker.deltaMS / 1000)
          scene.renderFlight(flight.current, ticker)
          setHud(flight.current)
          if (flight.current.phase === 'won' || flight.current.phase === 'lost') {
            app.stop()
            void bookLatest.current()
          }
        })
        visibility()
      } catch (cause) {
        console.error('Die Pizzalieferung konnte nicht gezeichnet werden.', cause)
        if (!disposed) {
          setUnavailable(true)
          setError('Die Flugansicht ist nicht verfügbar. Bitte kehre ins Zimmer zurück.')
        }
        if (initialized) {
          initialized = false
          app.destroy(true, { children: true })
        }
        window.removeEventListener('keydown', keydown)
        document.removeEventListener('visibilitychange', visibility)
      }
    }
    void start()
    return () => {
      disposed = true
      mounted.current = false
      window.removeEventListener('keydown', keydown)
      document.removeEventListener('visibilitychange', visibility)
      if (initialized) app.destroy(true, { children: true })
    }
  }, [])

  const terminal = hud.phase === 'won' || hud.phase === 'lost'
  const progress = Math.min(100, Math.floor(hud.distance / FLIGHT.distance * 100))
  const laneNames = ['oben', 'Mitte', 'unten']

  return (
    <section className="pizza-game" aria-labelledby="pizza-title">
      <h1 id="pizza-title">Interdimensionale Pizzalieferung</h1>
      <p>{props.pilot.name} steuert das Flugzeug. Weiche Kühen und Toiletten aus und sammle Pizzabeläge!</p>
      <div className="flight-hud">
        <span aria-label={`${hud.lives} von 3 Lebenspunkten`}>Leben: {hud.lives} / 3</span>
        <span>Beläge: {hud.toppings}</span>
        <span>Score: {hud.score}</span>
        <span>Highscore: {Math.max(props.highscore, result?.score ?? 0)}</span>
      </div>
      <label className="flight-progress">
        Strecke: {progress} %
        <progress max={100} value={progress} aria-label="Zurückgelegte Strecke" />
      </label>
      <div className="flight-playfield">
        {!result && !unavailable && (
          <div className="flight-stage">
            <div ref={host} className="flight-canvas-host" role="img" aria-label={`${props.pilot.name} im Cockpit, Flughöhe ${laneNames[hud.lane]}`} />
            {hud.phase === 'countdown' && (
              <p className="flight-overlay" role="status">Bereit? {Math.max(1, Math.ceil(FLIGHT.countdownSeconds - hud.phaseTime))}</p>
            )}
            {hud.phase === 'delivering' && <p className="flight-announcement" role="status">Eine Pizza für unseren Alien-Kunden!</p>}
          </div>
        )}
        {!terminal && !unavailable && (
          <div className="flight-controls">
            <button className="button-primary" disabled={hud.phase !== 'flying' || hud.lane === 0}
              onPointerDown={(event) => {
                if (event.button !== 0) return
                event.preventDefault()
                move(-1)
              }}
              onClick={(event) => { if (event.detail === 0) move(-1) }}>↑ Hoch</button>
            <span>Flughöhe: {laneNames[hud.lane]}</span>
            <button className="button-primary" disabled={hud.phase !== 'flying' || hud.lane === 2}
              onPointerDown={(event) => {
                if (event.button !== 0) return
                event.preventDefault()
                move(1)
              }}
              onClick={(event) => { if (event.detail === 0) move(1) }}>↓ Runter</button>
          </div>
        )}
      </div>
      {!terminal && !unavailable && <p>Tippe auf Hoch/Runter oder nutze die Pfeiltasten. Jede Taste wechselt eine Flughöhe.</p>}
      {terminal && (
        <div className="content-card flight-result" role="status">
          <h2>{hud.phase === 'won' ? 'Pizza ausgeliefert!' : 'Diesmal hat es nicht geklappt.'}</h2>
          <p>{hud.phase === 'won' ? 'Der Alien freut sich über eure Lieferung.' : 'Auch Piloten üben. Beim nächsten Flug klappt es bestimmt besser.'}</p>
          <p>Beläge: {hud.toppings} · Score: {hud.score}</p>
          <p>Erhaltene XP: {result ? result.xp : booking ? 'werden gespeichert …' : 'noch nicht gespeichert'}</p>
          {result && result.success && result.xp === 0 && <p>Heute sind die drei XP-Lieferungen bereits geschafft oder dein Wesen ist auf Level 20. Dein Highscore zählt weiter!</p>}
          {error && !result && <button className="button-primary" disabled={booking} onClick={() => void bookResult()}>Ergebnis erneut speichern</button>}
          {result && <button className="button-primary" disabled={!props.canRetry} onClick={props.onRetry}>Erneut fliegen (−20 Energie)</button>}
          {result && !props.canRetry && <p>Für den nächsten Flug brauchst du 20 Energie. Schlafen oder eine Pause helfen.</p>}
        </div>
      )}
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="button-secondary" disabled={booking} onClick={props.onExit}>
        {terminal ? 'Zurück ins Zimmer' : 'Flug verlassen'}
      </button>
      {!terminal && <p>Beim Verlassen endet dieser Flug ohne XP. Die Startenergie bleibt verbraucht.</p>}
    </section>
  )
}
