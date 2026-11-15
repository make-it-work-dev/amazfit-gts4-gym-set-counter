import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createWorkoutState,
  completeSet,
  syncRest,
  adjustRest,
  setDefaultRest,
  isValidPersistedWorkoutState,
  restoreWorkoutState,
  createReminderPulsePlan,
  addWorkoutHistory,
  restoreWorkoutHistory,
  createMusicLaunchRequest,
  resetWorkout,
  formatSeconds,
} from '../shared/workout-state.js'

test('starts ready for set one with a sixty second default rest', () => {
  assert.deepEqual(createWorkoutState(), {
    completedSets: 0,
    targetSets: 4,
    restSeconds: 60,
    remainingSeconds: 0,
    restEndAt: null,
    phase: 'ready',
  })
})

test('completing a non-final set starts a wall-clock rest countdown', () => {
  const next = completeSet(createWorkoutState(), 1_000)
  assert.equal(next.completedSets, 1)
  assert.equal(next.phase, 'rest')
  assert.equal(next.remainingSeconds, 60)
  assert.equal(next.restEndAt, 61_000)
})

test('completing the fourth set finishes the workout without rest', () => {
  let state = createWorkoutState()
  state = completeSet(state)
  state = { ...state, phase: 'ready', remainingSeconds: 0 }
  state = completeSet(state)
  state = { ...state, phase: 'ready', remainingSeconds: 0 }
  state = completeSet(state)
  state = { ...state, phase: 'ready', remainingSeconds: 0 }
  state = completeSet(state)

  assert.equal(state.completedSets, 4)
  assert.equal(state.phase, 'complete')
  assert.equal(state.remainingSeconds, 0)
})

test('wall-clock sync preserves elapsed time while the app is closed', () => {
  const resting = completeSet(createWorkoutState(), 1_000)
  const resumed = syncRest(resting, 31_000)
  assert.equal(resumed.phase, 'rest')
  assert.equal(resumed.remainingSeconds, 30)
  assert.equal(resumed.restEndAt, 61_000)
})

test('wall-clock sync becomes ready after the deadline', () => {
  const resting = completeSet(createWorkoutState(), 1_000)
  const next = syncRest(resting, 61_000)
  assert.equal(next.phase, 'ready')
  assert.equal(next.remainingSeconds, 0)
  assert.equal(next.restEndAt, null)
})

test('active rest can be adjusted in fifteen second steps but never below zero', () => {
  const resting = completeSet(createWorkoutState(), 1_000)
  assert.equal(adjustRest(resting, 15, 11_000).remainingSeconds, 65)
  assert.equal(adjustRest(resting, 15, 11_000).restEndAt, 76_000)

  const ended = adjustRest(resting, -60, 11_000)
  assert.equal(ended.remainingSeconds, 0)
  assert.equal(ended.phase, 'ready')
  assert.equal(ended.restEndAt, null)
})

test('settings change future rest duration between fifteen seconds and ten minutes', () => {
  assert.equal(setDefaultRest(createWorkoutState(), 90).restSeconds, 90)
  assert.equal(setDefaultRest(createWorkoutState(), 0).restSeconds, 15)
  assert.equal(setDefaultRest(createWorkoutState(), 999).restSeconds, 600)
})

test('rejects corrupt persisted rest metadata before it can trigger an alert', () => {
  assert.equal(isValidPersistedWorkoutState({ phase: 'rest', restEndAt: 500 }), false)
  assert.equal(isValidPersistedWorkoutState({
    completedSets: 1,
    targetSets: 4,
    restSeconds: 60,
    restEndAt: 500,
    phase: 'rest',
  }), true)
})

test('restores a valid persisted rest using the wall clock', () => {
  const restored = restoreWorkoutState({
    completedSets: 2,
    targetSets: 4,
    restSeconds: 75,
    remainingSeconds: 999,
    restEndAt: 31_000,
    phase: 'rest',
  }, 1_000)

  assert.equal(restored.completedSets, 2)
  assert.equal(restored.restSeconds, 75)
  assert.equal(restored.remainingSeconds, 30)
  assert.equal(restored.restEndAt, 31_000)
  assert.equal(restored.phase, 'rest')
})

test('recovers safely from corrupt persisted workout data', () => {
  assert.deepEqual(
    restoreWorkoutState({
      completedSets: 'many',
      targetSets: -2,
      restSeconds: Number.NaN,
      remainingSeconds: Number.NaN,
      restEndAt: 'later',
      phase: 'rest',
    }, 1_000),
    createWorkoutState(),
  )
})

test('strong rest reminder repeats for two seconds then stops', () => {
  assert.deepEqual(createReminderPulsePlan(), [0, 1000])
})

test('completed workouts are stored newest first and history is capped at twenty', () => {
  let history = []
  for (let index = 0; index < 22; index += 1) {
    history = addWorkoutHistory(history, createWorkoutState({
      targetSets: 4,
      restSeconds: 60 + index,
    }), 1_000 + index)
  }

  assert.equal(history.length, 20)
  assert.deepEqual(history[0], {
    completedAt: 1_021,
    sets: 4,
    restSeconds: 81,
  })
  assert.equal(history[19].completedAt, 1_002)
})

test('invalid history entries are discarded, deduplicated, and sorted newest first', () => {
  assert.deepEqual(restoreWorkoutHistory([
    { completedAt: 1_000, sets: 4, restSeconds: 60 },
    { completedAt: 3_000, sets: 4, restSeconds: 75 },
    { completedAt: 1_000, sets: 4, restSeconds: 60 },
    { completedAt: 'later', sets: 4, restSeconds: 60 },
    { completedAt: -1, sets: 4, restSeconds: 60 },
    { completedAt: 20_000, sets: 4, restSeconds: 60 },
    { completedAt: 2_000, sets: 4.5, restSeconds: 60 },
    null,
  ], 10_000), [
    { completedAt: 3_000, sets: 4, restSeconds: 75 },
    { completedAt: 1_000, sets: 4, restSeconds: 60 },
  ])
})

test('system music controls launch as a native app', () => {
  assert.deepEqual(createMusicLaunchRequest(1234), {
    appId: 1234,
    native: true,
  })
})

test('reset restores defaults', () => {
  const changed = { ...completeSet(createWorkoutState()), remainingSeconds: 45 }
  assert.deepEqual(resetWorkout(changed), createWorkoutState())
})

test('formats seconds as mm:ss', () => {
  assert.equal(formatSeconds(0), '00:00')
  assert.equal(formatSeconds(5), '00:05')
  assert.equal(formatSeconds(90), '01:30')
})
