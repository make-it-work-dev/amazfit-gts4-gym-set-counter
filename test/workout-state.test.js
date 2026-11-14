import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createWorkoutState,
  completeSet,
  tickRest,
  adjustRest,
  resetWorkout,
  formatSeconds,
} from '../shared/workout-state.js'

test('starts ready for set one with four target sets', () => {
  assert.deepEqual(createWorkoutState(), {
    completedSets: 0,
    targetSets: 4,
    restSeconds: 90,
    remainingSeconds: 0,
    phase: 'ready',
  })
})

test('completing a non-final set starts the rest countdown', () => {
  const next = completeSet(createWorkoutState())
  assert.equal(next.completedSets, 1)
  assert.equal(next.phase, 'rest')
  assert.equal(next.remainingSeconds, 90)
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

test('rest countdown becomes ready when it reaches zero', () => {
  const state = { ...completeSet(createWorkoutState()), remainingSeconds: 1 }
  const next = tickRest(state)
  assert.equal(next.phase, 'ready')
  assert.equal(next.remainingSeconds, 0)
})

test('rest can be adjusted in fifteen second steps but never below zero', () => {
  const resting = completeSet(createWorkoutState())
  assert.equal(adjustRest(resting, 15).remainingSeconds, 105)
  assert.equal(adjustRest({ ...resting, remainingSeconds: 10 }, -15).remainingSeconds, 0)
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
