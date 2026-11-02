import { describe, expect, it } from 'vitest'
import { TASKS } from '../src/data/gameContent'
import { createInitialGameState, interact, purchaseItem } from '../src/game/gameLogic'
import { approveTask, calendarDate, requestTask, taskStatus } from '../src/game/tasks'
import { SHOP_ITEMS } from '../src/data/gameContent'

const day = new Date(2026, 10, 2, 12)
const tomorrow = new Date(2026, 10, 3, 0)

describe('household tasks and stars', () => {
  it('configures exactly the four requested rewards', () => {
    expect(TASKS.map(({ title, reward }) => [title, reward])).toEqual([
      ['Teller abräumen', 1], ['Spülmaschine ausräumen', 3],
      ['Zimmer aufräumen', 5], ['Wäsche zusammenlegen', 5],
    ])
  })

  it.each(TASKS)('requests and approves $title without changing creature XP', (task) => {
    const initial = createInitialGameState('creature_01')
    expect(initial.coins).toBe(0)
    expect(taskStatus(initial, task.id, calendarDate(day))).toBe('open')
    const pending = requestTask(initial, task.id, day)
    expect(pending.coins).toBe(0)
    expect(taskStatus(pending, task.id, calendarDate(day))).toBe('pending')
    const approved = approveTask(pending, task.id, calendarDate(day), day)
    expect(approved.coins).toBe(task.reward)
    expect(approved.creatures).toEqual(initial.creatures)
    expect(approved.taskRequests).toEqual([])
    expect(approved.starBookings).toEqual([{
      taskId: task.id, taskTitle: task.title, date: '2026-11-02', amount: task.reward,
    }])
    expect(taskStatus(approved, task.id, calendarDate(day))).toBe('completed')
    expect(() => requestTask(approved, task.id, day)).toThrow()
    expect(() => approveTask(approved, task.id, calendarDate(day), day)).toThrow()
    expect(initial.starBookings).toEqual([])
  })

  it('rejects unknown tasks, duplicate requests and approval without a request', () => {
    const state = createInitialGameState()
    expect(() => requestTask(state, 'unknown', day)).toThrow()
    expect(() => approveTask(state, TASKS[0].id, calendarDate(day), day)).toThrow()
    const pending = requestTask(state, TASKS[0].id, day)
    expect(() => requestTask(pending, TASKS[0].id, day)).toThrow()
  })

  it('resets at local midnight and never approves expired requests', () => {
    const task = TASKS[0]
    const beforeMidnight = new Date(2026, 10, 2, 23, 59, 59)
    const pending = requestTask(createInitialGameState(), task.id, beforeMidnight)
    expect(taskStatus(pending, task.id, calendarDate(tomorrow))).toBe('open')
    expect(() => approveTask(pending, task.id, calendarDate(day), tomorrow)).toThrow('abgelaufen')
    const completed = approveTask(pending, task.id, calendarDate(day), beforeMidnight)
    const again = approveTask(requestTask(completed, task.id, tomorrow), task.id, calendarDate(tomorrow), tomorrow)
    expect(again.coins).toBe(2)
    expect(again.starBookings.map((entry) => entry.date)).toEqual(['2026-11-02', '2026-11-03'])
    expect(requestTask(pending, task.id, tomorrow).taskRequests).toEqual([{ taskId: task.id, date: '2026-11-03' }])
  })

  it('keeps local dates across month and year boundaries', () => {
    expect(calendarDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
    expect(calendarDate(new Date(2027, 0, 1, 0))).toBe('2027-01-01')
    expect(() => calendarDate(new Date(NaN))).toThrow()
  })

  it('keeps profiles and XP separate and spends stars without a negative balance', () => {
    let first = createInitialGameState('creature_01')
    const second = createInitialGameState('creature_02')
    for (const task of TASKS) first = approveTask(requestTask(first, task.id, day), task.id, calendarDate(day), day)
    expect(first.coins).toBe(14)
    expect(second.coins).toBe(0)
    expect(second.starBookings).toEqual([])
    const cared = interact(first, 'pet', 0)
    expect(cared.coins).toBe(14)
    const bought = purchaseItem(cared, SHOP_ITEMS[0])
    expect(bought.coins).toBe(2)
    expect(bought.starBookings).toEqual(first.starBookings)
    expect(purchaseItem(bought, SHOP_ITEMS[1])).toBe(bought)
    expect(purchaseItem(bought, { ...SHOP_ITEMS[1], price: -10 })).toBe(bought)
  })
})
