import { TASKS } from '../data/gameContent'
import type { GameState } from '../models'

export function calendarDate(now = new Date()): string {
  if (!Number.isFinite(now.getTime())) throw new Error('Das Datum ist ungültig.')
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function taskStatus(state: GameState, taskId: string, date: string): 'open' | 'pending' | 'completed' {
  if (state.starBookings.some((entry) => entry.taskId === taskId && entry.date === date)) return 'completed'
  return state.taskRequests.some((entry) => entry.taskId === taskId && entry.date === date) ? 'pending' : 'open'
}

export function requestTask(state: GameState, taskId: string, now = new Date()): GameState {
  if (!TASKS.some((task) => task.id === taskId)) throw new Error('Diese Aufgabe ist unbekannt.')
  const date = calendarDate(now)
  if (taskStatus(state, taskId, date) !== 'open') throw new Error('Diese Aufgabe wurde heute bereits gemeldet.')
  return {
    ...state,
    taskRequests: [...state.taskRequests.filter((entry) => entry.date === date), { taskId, date }],
  }
}

// Only the storage approval transaction calls this after checking the parent PIN.
export function approveTask(state: GameState, taskId: string, requestDate: string, now = new Date()): GameState {
  const task = TASKS.find((entry) => entry.id === taskId)
  if (!task || !Number.isSafeInteger(task.reward) || task.reward <= 0) throw new Error('Die Aufgabenbelohnung ist ungültig.')
  if (requestDate !== calendarDate(now)) throw new Error('Diese Meldung ist abgelaufen. Bitte melde die Aufgabe heute erneut.')
  if (taskStatus(state, taskId, requestDate) !== 'pending') throw new Error('Diese Aufgabe wartet nicht auf Bestätigung.')
  const coins = state.coins + task.reward
  if (!Number.isSafeInteger(coins) || coins < 0) throw new Error('Der Sternenkontostand ist ungültig.')
  return {
    ...state,
    coins,
    taskRequests: state.taskRequests.filter((entry) => !(entry.taskId === taskId && entry.date === requestDate)),
    starBookings: [...state.starBookings, { taskId, taskTitle: task.title, date: requestDate, amount: task.reward }],
  }
}
