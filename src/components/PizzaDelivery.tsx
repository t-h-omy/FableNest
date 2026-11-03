import { Application } from 'pixi.js'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { FLIGHT } from '../data/minigames'
import { advanceFlight, createFlight, moveFlight } from '../game/pizzaFlight'
import { PizzaFlightRenderer } from '../rendering/PizzaFlightRenderer'
import { vibrate } from '../ui/feedback'
import { Icon } from '../ui/Icon'
import { useCountUp } from '../ui/useCountUp'
import type { Creature, DeliveryResult, FlightState } from '../models'

interface Props {
  pilot: Creature
  highscore: number
  canRetry: boolean
  /** Wartetext, bis wieder genug Energie für einen Flug da ist. */
  retryHint?: string
  onFinish: (flight: FlightState) => Promise<DeliveryResult>
  onRetry: () => void
  onExit: () => void
}

interface Pop { id: number; lane: number; text: string }

const laneNames = ['oben', 'Mitte', 'unten']

export function PizzaDelivery(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const flight = useRef(createFlight())
  const latest = useRef(props)
  latest.current = props
  const appRef = useRef<Application | null>(null)
  const paused = useRef(false)
  const startHighscore = useRef(props.highscore)
  const [hud, setHud] = useState(flight.current)
  const [result, setResult] = useState<DeliveryResult | null>(null)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [booking, setBooking] = useState(false)
  const [pause, setPause] = useState(false)
  const [hitKey, setHitKey] = useState(0)
  const [pops, setPops] = useState<Pop[]>([])
  const [go, setGo] = useState(false)
  const mounted = useRef(false)
  const bookingRef = useRef(false)
  const popId = useRef(1)

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
    if (paused.current) return
    flight.current = moveFlight(flight.current, direction)
    setHud(flight.current)
  }

  function react(previous: FlightState, next: FlightState) {
    if (next.lives < previous.lives) {
      setHitKey((key) => key + 1)
      vibrate('hit')
    }
    if (next.toppings > previous.toppings) {
      const id = popId.current++
      setPops((list) => [...list.slice(-4), { id, lane: next.lane, text: `+${FLIGHT.scorePerTopping}` }])
      window.setTimeout(() => { if (mounted.current) setPops((list) => list.filter((entry) => entry.id !== id)) }, 900)
      vibrate('tap')
    }
    if (previous.phase === 'countdown' && next.phase === 'flying') {
      setGo(true)
      window.setTimeout(() => { if (mounted.current) setGo(false) }, 700)
    }
  }
  const reactLatest = useRef(react)
  reactLatest.current = react

  function setPaused(value: boolean) {
    const app = appRef.current
    const phase = flight.current.phase
    if (phase === 'won' || phase === 'lost') return
    paused.current = value
    setPause(value)
    if (!app) return
    if (value) app.stop()
    else if (!document.hidden) app.start()
  }

  const pauseLatest = useRef(setPaused)
  pauseLatest.current = setPaused

  useEffect(() => {
    mounted.current = true
    let disposed = false
    let initialized = false
    const app = new Application()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.repeat) {
        pauseLatest.current(!paused.current)
        return
      }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      if (flight.current.phase !== 'flying') return
      event.preventDefault()
      if (!event.repeat) move(event.key === 'ArrowUp' ? -1 : 1)
    }
    const visibility = () => {
      if (!initialized) return
      if (document.hidden) app.stop()
      else if (!paused.current && flight.current.phase !== 'won' && flight.current.phase !== 'lost') app.start()
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
        appRef.current = app
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
          const previous = flight.current
          flight.current = advanceFlight(flight.current, ticker.deltaMS / 1000)
          scene.renderFlight(flight.current, ticker)
          reactLatest.current(previous, flight.current)
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
          appRef.current = null
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
      appRef.current = null
      window.removeEventListener('keydown', keydown)
      document.removeEventListener('visibilitychange', visibility)
      if (initialized) app.destroy(true, { children: true })
    }
  }, [])

  const terminal = hud.phase === 'won' || hud.phase === 'lost'
  const won = hud.phase === 'won'
  const progress = Math.min(100, Math.floor(hud.distance / FLIGHT.distance * 100))
  const record = Math.max(props.highscore, result?.score ?? 0)
  const newRecord = terminal && hud.score > 0 && hud.score > startHighscore.current
  const countdown = Math.max(1, Math.ceil(FLIGHT.countdownSeconds - hud.phaseTime))
  const xpShown = useCountUp(result?.xp ?? 0, { duration: 900 })
  const scoreShown = useCountUp(terminal ? hud.score : 0, { duration: 900, from: 0 })

  // Tippen über oder unter den Flieger wechselt die Flughöhe.
  function tapField(clientY: number) {
    const element = host.current
    if (!element || flight.current.phase !== 'flying') return
    const rect = element.getBoundingClientRect()
    if (!rect.height) return
    const planeY = rect.top + FLIGHT.laneY[flight.current.lane] / FLIGHT.height * rect.height
    if (Math.abs(clientY - planeY) < rect.height * 0.08) return
    move(clientY < planeY ? -1 : 1)
  }

  return (
    <section className={`pizza-game${terminal ? ' is-over' : ''}`} aria-labelledby="pizza-title">
      <header className="flight-top">
        {!terminal ? (
          <button className="icon-btn icon-btn-glass" onClick={() => setPaused(true)} disabled={booking} aria-label="Flug pausieren">
            <Icon name="pause" />
          </button>
        ) : <span className="flight-top-spacer" />}
        <h1 id="pizza-title" className="flight-title">Interdimensionale Pizzalieferung</h1>
        <span className="flight-record" aria-label={`Highscore ${record}`}><Icon name="trophy" size={16} /> {record}</span>
      </header>

      {!terminal && !unavailable && (
        <>
          <div className="flight-hud" role="group" aria-label="Fluganzeige">
            <span className="flight-lives" aria-label={`${hud.lives} von 3 Lebenspunkten`}>
              {[0, 1, 2].map((index) => (
                <span key={index} className={`life${index < hud.lives ? '' : ' is-lost'}`}><Icon name="heart" filled size={20} /></span>
              ))}
            </span>
            <span className="flight-stat"><Icon name="pizza" size={18} /> <span className="sr-only">Beläge: </span><strong key={hud.toppings} className="bump">{hud.toppings}</strong></span>
            <span className="flight-stat"><span className="flight-stat-label">Score</span> <strong>{hud.score}</strong></span>
          </div>
          <div className="flight-track" role="progressbar" aria-label="Zurückgelegte Strecke" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span className="flight-track-fill" style={{ width: `${progress}%` }} />
            <span className="flight-track-plane" style={{ left: `${progress}%` }} aria-hidden="true"><Icon name="plane" size={16} /></span>
            <span className="flight-track-goal" aria-hidden="true"><Icon name="pizza" size={16} /></span>
          </div>
        </>
      )}

      <div className="flight-playfield">
        {!result && !unavailable && (
          <div className={`flight-stage${hitKey ? ` is-hit-${hitKey % 2}` : ''}${terminal ? ' is-hidden' : ''}`}>
            <div ref={host} className="flight-canvas-host" role="img" aria-label={`${props.pilot.name} im Cockpit, Flughöhe ${laneNames[hud.lane]}`}
              onPointerDown={(event) => { if (event.button === 0) tapField(event.clientY) }} />
            {hud.phase === 'countdown' && (
              <p className="flight-countdown" role="status">
                <span className="flight-countdown-label">Bereit?</span>
                <span key={countdown} className="flight-countdown-number">{countdown}</span>
              </p>
            )}
            {go && <p className="flight-go" aria-hidden="true">Los!</p>}
            {hud.phase === 'delivering' && <p className="flight-announcement" role="status">Eine Pizza für unseren Alien-Kunden!</p>}
            {pops.map((pop) => (
              <span key={pop.id} className="flight-pop" aria-hidden="true"
                style={{ left: `${(FLIGHT.playerX + 30) / FLIGHT.width * 100}%`, top: `${FLIGHT.laneY[pop.lane] / FLIGHT.height * 100}%` }}>
                {pop.text}
              </span>
            ))}
          </div>
        )}
        {!terminal && !unavailable && (
          <div className="flight-controls">
            <button className="flight-btn" disabled={hud.phase !== 'flying' || hud.lane === 0}
              onPointerDown={(event) => {
                if (event.button !== 0) return
                event.preventDefault()
                move(-1)
              }}
              onClick={(event) => { if (event.detail === 0) move(-1) }}><Icon name="up" size={28} /> Hoch</button>
            <span className="lane-indicator" aria-label={`Flughöhe: ${laneNames[hud.lane]}`}>
              {[0, 1, 2].map((lane) => <i key={lane} className={lane === hud.lane ? 'is-current' : ''} />)}
            </span>
            <button className="flight-btn" disabled={hud.phase !== 'flying' || hud.lane === 2}
              onPointerDown={(event) => {
                if (event.button !== 0) return
                event.preventDefault()
                move(1)
              }}
              onClick={(event) => { if (event.detail === 0) move(1) }}><Icon name="down" size={28} /> Runter</button>
          </div>
        )}
      </div>
      {pause && (
        <div className="flight-pause" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <h2 id="pause-title">Pause</h2>
          <p>Beim Beenden endet dieser Flug ohne XP. Die Startenergie bleibt verbraucht.</p>
          <button className="btn btn-primary btn-lg btn-block" autoFocus onClick={() => setPaused(false)}>
            <Icon name="play" filled size={20} /> Weiterfliegen
          </button>
          <button className="btn btn-secondary btn-block" onClick={props.onExit}>Flug beenden</button>
        </div>
      )}
      {!terminal && !unavailable && <p className="flight-help">Tippe auf Hoch/Runter, über oder unter den Flieger, oder nutze die Pfeiltasten.</p>}

      {terminal && (
        <div className={`flight-result ${won ? 'is-won' : 'is-lost'}`} role="status">
          {won && (
            <span className="result-confetti" aria-hidden="true">
              {Array.from({ length: 18 }, (_, index) => <i key={index} className={`fx-hue-${index % 5}`} style={{ '--i': index } as CSSProperties} />)}
            </span>
          )}
          <span className="result-emblem" aria-hidden="true"><Icon name={won ? 'pizza' : 'heart'} size={44} /></span>
          <h2>{won ? 'Pizza ausgeliefert!' : 'Diesmal hat es nicht geklappt.'}</h2>
          <p className="result-lead">{won ? 'Der Alien freut sich über eure Lieferung.' : 'Auch Piloten üben. Beim nächsten Flug klappt es bestimmt besser.'}</p>
          {newRecord && <p className="record-ribbon"><Icon name="trophy" size={18} /> Neuer Highscore!</p>}
          <div className="result-stats">
            <p className="result-stat"><span>Beläge</span><strong>{hud.toppings}</strong></p>
            <p className="result-stat"><span>Score</span><strong>{scoreShown}</strong></p>
            <p className="result-stat result-xp">Erhaltene XP: <strong>{result ? xpShown : booking ? 'werden gespeichert …' : 'noch nicht gespeichert'}</strong></p>
          </div>
          {result && result.success && result.xp === 0 && <p className="result-note">Heute sind die drei XP-Lieferungen bereits geschafft oder dein Wesen ist auf Level 20. Dein Highscore zählt weiter!</p>}
          <div className="result-actions">
            {error && !result && <button className="btn btn-primary btn-lg btn-block" disabled={booking} onClick={() => void bookResult()}>Ergebnis erneut speichern</button>}
            {result && <button className="btn btn-primary btn-lg btn-block" disabled={!props.canRetry} onClick={props.onRetry}>Erneut fliegen (−20 Energie)</button>}
            {result && !props.canRetry && <p className="result-note">Für den nächsten Flug brauchst du 20 Energie. Schlafen oder eine Pause helfen.{props.retryHint ? ` ${props.retryHint}` : ''}</p>}
            <button className="btn btn-secondary btn-block" disabled={booking} onClick={props.onExit}>Zurück ins Zimmer</button>
          </div>
        </div>
      )}
      {error && <p className="banner banner-error" role="alert">{error}</p>}
      {unavailable && <button className="btn btn-secondary btn-block" onClick={props.onExit}>Zurück ins Zimmer</button>}
    </section>
  )
}
