import type { CSSProperties } from 'react'
import { TASKS } from '../data/gameContent'
import { taskSummary } from '../game/insights'
import { taskStatus } from '../game/tasks'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'
import type { GameState, StarBooking } from '../models'

const stars = (amount: number) => `${amount} ${amount === 1 ? 'Stern' : 'Sterne'}`

interface TasksScreenProps {
  state: GameState
  today: string
  onRequest: (taskId: string, origin: Element) => void
  onApprove: (taskId: string) => void
  onManagePin: () => void
  onShowHistory: () => void
}

export function TasksScreen({ state, today, onRequest, onApprove, onManagePin, onShowHistory }: TasksScreenProps) {
  const summary = taskSummary(state, today)
  const allDone = summary.completed === summary.total

  return (
    <section className="screen tasks" aria-labelledby="tasks-title">
      <header className="screen-header screen-header-row">
        <div>
          <p className="eyebrow">Kleine Schritte, große Hilfe</p>
          <h1 id="tasks-title">Aufgaben</h1>
          <p className="screen-lead">
            {allDone ? 'Alles geschafft für heute. Morgen sind alle Aufgaben wieder offen.'
              : `Heute kannst du noch bis zu ${stars(summary.starsLeft)} verdienen.`}
          </p>
        </div>
        <span className={`progress-ring${allDone ? ' is-complete' : ''}`} style={{ '--p': summary.completed / summary.total } as CSSProperties}
          role="img" aria-label={`${summary.completed} von ${summary.total} heute abgeschlossen`}>
          <span><strong>{summary.completed}</strong>/{summary.total}</span>
        </span>
      </header>

      <ul className="task-list">
        {TASKS.map((task, index) => {
          const status = taskStatus(state, task.id, today)
          return (
            <li key={task.id} className={`task-card is-${status}`} data-task-id={task.id} style={{ animationDelay: `${index * 60}ms` }}>
              <span className="task-tile" aria-hidden="true">
                {status === 'completed' ? <Icon name="check" size={28} />
                  : status === 'pending' ? <Icon name="hourglass" size={26} />
                    : <><Icon name="star" filled size={22} /><strong>{task.reward}</strong></>}
              </span>
              <div className="task-copy">
                <h2>{task.title}</h2>
                <p>{task.description}</p>
                <p className="task-meta">
                  <span className={`status-chip status-${status}`}>
                    {status === 'completed' ? 'Heute erledigt' : status === 'pending' ? 'Wartet auf Bestätigung' : 'Offen'}
                  </span>
                  <span className="reward-chip"><Icon name="star" filled size={14} />{status === 'completed' ? `+${task.reward} erhalten` : stars(task.reward)}</span>
                </p>
              </div>
              {status !== 'completed' && (
                <div className="task-action">
                  {status === 'open' ? (
                    <button className="btn btn-primary btn-block" onClick={(event) => onRequest(task.id, event.currentTarget)}>
                      <Icon name="check" size={20} /> Erledigt melden
                    </button>
                  ) : (
                    <button className="btn btn-amber btn-block" onClick={() => onApprove(task.id)}>
                      <Icon name="lock" size={20} /> Elternfreigabe
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <details className="how-to">
        <summary><Icon name="info" size={20} /> So funktioniert’s <Icon name="chevron" size={18} className="how-to-chevron" /></summary>
        <ol>
          <li>Frag vorher eine erwachsene Person, welche Aufgaben heute passen.</li>
          <li>Erledige die Aufgabe und tippe auf „Erledigt melden“.</li>
          <li>Eine erwachsene Person bestätigt mit dem Eltern-PIN. Dann bekommst du deine Sterne.</li>
          <li>Sterne gibt es einmal pro Aufgabe und Kalendertag. Morgen sind alle Aufgaben wieder offen.</li>
        </ol>
      </details>

      <section className="parents-zone" aria-labelledby="parents-title">
        <h2 id="parents-title"><Icon name="lock" size={18} /> Für Erwachsene</h2>
        <div className="parents-actions">
          <button className="btn btn-ghost" onClick={onManagePin}><Icon name="key" size={20} /> Eltern-PIN verwalten</button>
          {state.starBookings.length > 0 && (
            <button className="btn btn-ghost" onClick={onShowHistory}>
              <Icon name="history" size={20} /> Sternebuchungen ansehen <span className="count-pill">{state.starBookings.length}</span>
            </button>
          )}
        </div>
      </section>
    </section>
  )
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(year, month - 1, day)
  if (!Number.isFinite(value.getTime())) return date
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'long' }).format(value)
}

export function BookingHistorySheet({ bookings, onClose }: { bookings: StarBooking[]; onClose: () => void }) {
  const days = [...new Set(bookings.map((entry) => entry.date))].sort().reverse()
  const total = bookings.reduce((sum, entry) => sum + entry.amount, 0)
  return (
    <Sheet title="Sternebuchungen" eyebrow="Für Erwachsene" onClose={onClose} className="history-sheet">
      <p className="history-total"><Icon name="star" filled size={18} /> Insgesamt {stars(total)} durch Aufgaben</p>
      {days.map((day) => (
        <section key={day} className="history-day">
          <h3>{formatDate(day)}</h3>
          <ul>
            {bookings.filter((entry) => entry.date === day).map((entry) => (
              <li key={`${entry.date}-${entry.taskId}`}>
                <span>{entry.taskTitle}</span>
                <strong>+{entry.amount} <Icon name="star" filled size={14} /></strong>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Sheet>
  )
}
