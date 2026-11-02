// @vitest-environment node
import 'fake-indexeddb/auto'
import { deleteDB, openDB } from 'idb'
import { afterEach, describe, expect, it } from 'vitest'
import { TASKS } from '../src/data/gameContent'
import { GAME_STATE_VERSION } from '../src/game/gameLogic'
import { calendarDate, requestTask } from '../src/game/tasks'
import { confirmTask, hasParentPin, loadGameState, mutateGameState, openGameDatabase, setParentPin } from '../src/storage/database'
import { createParentPin } from '../src/storage/parentPin'

const names: string[] = []
afterEach(async () => {
  await Promise.all(names.splice(0).map((name) => deleteDB(name)))
})

async function setup() {
  const name = `fabelnest-tasks-${Math.random()}`
  names.push(name)
  const database = await openGameDatabase(name)
  await loadGameState(database, 'player-1')
  await loadGameState(database, 'player-2')
  return { name, database }
}

describe('persistent parent approval', () => {
  it.each(['123', '1234567', '12ab', ' 1234', '１２３４'])('rejects invalid PIN %s', async (pin) => {
    await expect(createParentPin(pin)).rejects.toThrow('4 bis 6')
  })

  it('requires a PIN, rejects wrong input, then persists every task booking and isolates profiles', async () => {
    const { name, database } = await setup()
    try {
      expect(await hasParentPin(database)).toBe(false)
      const task = TASKS[0]
      await mutateGameState(database, 'player-1', (state) => requestTask(state, task.id))
      await expect(confirmTask(database, 'player-1', task.id, calendarDate(), '1234')).rejects.toThrow('zuerst')
      await setParentPin(database, '1234')
      const pending = await loadGameState(database, 'player-1')
      await expect(confirmTask(database, 'player-1', task.id, calendarDate(), '9999')).rejects.toThrow('stimmt nicht')
      expect(await loadGameState(database, 'player-1')).toEqual(pending)
      await confirmTask(database, 'player-1', task.id, calendarDate(), '1234')
      for (const other of TASKS.slice(1)) {
        await mutateGameState(database, 'player-1', (state) => requestTask(state, other.id))
        await confirmTask(database, 'player-1', other.id, calendarDate(), '1234')
      }
      database.close()
      const reopened = await openGameDatabase(name)
      try {
        expect(await hasParentPin(reopened)).toBe(true)
        const restored = await loadGameState(reopened, 'player-1')
        expect(restored.coins).toBe(14)
        expect(restored.starBookings).toHaveLength(4)
        expect((await loadGameState(reopened, 'player-2')).coins).toBe(0)
        await mutateGameState(reopened, 'player-2', (state) => requestTask(state, task.id))
        expect((await confirmTask(reopened, 'player-2', task.id, calendarDate(), '1234')).coins).toBe(1)
        expect((await loadGameState(reopened, 'player-1')).coins).toBe(14)
      } finally { reopened.close() }
    } finally { database.close() }
  })

  it('preserves pending requests after restarting and requires the old PIN to change it', async () => {
    const { name, database } = await setup()
    await setParentPin(database, '123456')
    await mutateGameState(database, 'player-1', (state) => requestTask(state, TASKS[0].id))
    database.close()
    const reopened = await openGameDatabase(name)
    try {
      expect((await loadGameState(reopened, 'player-1')).taskRequests).toHaveLength(1)
      await expect(setParentPin(reopened, '9876', '0000')).rejects.toThrow()
      await expect(setParentPin(reopened, '9876')).rejects.toThrow()
      await setParentPin(reopened, '9876', '123456')
      await expect(confirmTask(reopened, 'player-1', TASKS[0].id, calendarDate(), '123456')).rejects.toThrow()
      expect((await confirmTask(reopened, 'player-1', TASKS[0].id, calendarDate(), '9876')).coins).toBe(1)
      const stored = await reopened.get('settings', 'parentPin')
      expect(stored?.hash).not.toBe('9876')
      expect(stored?.salt).toHaveLength(32)
    } finally { reopened.close() }
  })

  it('serializes competing approvals from separate tabs without duplicate rewards', async () => {
    const { name, database } = await setup()
    const other = await openGameDatabase(name)
    try {
      await setParentPin(database, '1234')
      await mutateGameState(database, 'player-1', (state) => requestTask(state, TASKS[0].id))
      const results = await Promise.allSettled([
        confirmTask(database, 'player-1', TASKS[0].id, calendarDate(), '1234'),
        confirmTask(other, 'player-1', TASKS[0].id, calendarDate(), '1234'),
      ])
      expect(results.filter((entry) => entry.status === 'fulfilled')).toHaveLength(1)
      const restored = await loadGameState(database, 'player-1')
      expect(restored.coins).toBe(1)
      expect(restored.starBookings).toHaveLength(1)
      await expect(confirmTask(database, 'player-1', TASKS[0].id, calendarDate(), '1234')).rejects.toThrow()
    } finally { database.close(); other.close() }
  })

  it('keeps both bookings when different tasks are approved concurrently', async () => {
    const { name, database } = await setup()
    const other = await openGameDatabase(name)
    try {
      await setParentPin(database, '1234')
      await Promise.all(TASKS.slice(0, 2).map((task) =>
        mutateGameState(database, 'player-1', (state) => requestTask(state, task.id))))
      await Promise.all([
        confirmTask(database, 'player-1', TASKS[0].id, calendarDate(), '1234'),
        confirmTask(other, 'player-1', TASKS[1].id, calendarDate(), '1234'),
      ])
      const restored = await loadGameState(database, 'player-1')
      expect(restored.coins).toBe(4)
      expect(restored.starBookings).toHaveLength(2)
      expect(restored.taskRequests).toEqual([])
    } finally { database.close(); other.close() }
  })

  it('rejects expired approvals without changing the saved balance or request', async () => {
    const { database } = await setup()
    try {
      await setParentPin(database, '1234')
      const oldDate = new Date(2020, 0, 1, 12)
      const pending = await mutateGameState(database, 'player-1', (state) => requestTask(state, TASKS[0].id, oldDate))
      await expect(confirmTask(database, 'player-1', TASKS[0].id, calendarDate(oldDate), '1234')).rejects.toThrow('abgelaufen')
      expect(await loadGameState(database, 'player-1')).toEqual(pending)
    } finally { database.close() }
  })

  it('does not replace a PIN when two setup dialogs compete', async () => {
    const { name, database } = await setup()
    const other = await openGameDatabase(name)
    try {
      const outcomes = await Promise.allSettled([
        setParentPin(database, '1234'),
        setParentPin(other, '5678'),
      ])
      expect(outcomes.filter((entry) => entry.status === 'fulfilled')).toHaveLength(1)
      expect(outcomes.filter((entry) => entry.status === 'rejected')).toHaveLength(1)
      expect(await hasParentPin(database)).toBe(true)
    } finally { database.close(); other.close() }
  })

  it('upgrades the old database and migrates v2 balances without inventing dated bookings', async () => {
    const name = `fabelnest-v2-${Math.random()}`
    names.push(name)
    const old = await openDB(name, 1, { upgrade(db) {
      db.createObjectStore('profiles', { keyPath: 'id' })
      db.createObjectStore('gameStates')
    } })
    const oldState = {
      schemaVersion: 2, coins: 37, creatures: [], activeCreatureId: null,
      house: { level: 1, decorItemIds: [] }, ownedItemIds: [], completedTaskIds: ['tidy-room'],
    }
    await old.put('gameStates', oldState, 'player-1')
    old.close()
    const database = await openGameDatabase(name)
    try {
      const migrated = await loadGameState(database, 'player-1')
      expect(migrated).toEqual({ ...oldState, schemaVersion: GAME_STATE_VERSION, taskRequests: [], starBookings: [] })
      expect(await hasParentPin(database)).toBe(false)
      await setParentPin(database, '1234')
      const future = { ...migrated, schemaVersion: GAME_STATE_VERSION + 1 }
      await database.put('gameStates', future, 'player-1')
      await expect(mutateGameState(database, 'player-1', (state) => requestTask(state, TASKS[0].id))).rejects.toThrow()
      await expect(confirmTask(database, 'player-1', TASKS[0].id, calendarDate(), '1234')).rejects.toThrow()
      expect(await database.get('gameStates', 'player-1')).toEqual(future)
    } finally { database.close() }
  })
})
