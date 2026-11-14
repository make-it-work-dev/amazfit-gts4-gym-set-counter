const DEFAULT_TARGET_SETS = 4
const DEFAULT_REST_SECONDS = 90

export function createWorkoutState({
  targetSets = DEFAULT_TARGET_SETS,
  restSeconds = DEFAULT_REST_SECONDS,
} = {}) {
  return {
    completedSets: 0,
    targetSets,
    restSeconds,
    remainingSeconds: 0,
    phase: 'ready',
  }
}

export function completeSet(state) {
  if (state.phase === 'complete') return state

  const completedSets = Math.min(state.completedSets + 1, state.targetSets)
  const finished = completedSets >= state.targetSets

  return {
    ...state,
    completedSets,
    remainingSeconds: finished ? 0 : state.restSeconds,
    phase: finished ? 'complete' : 'rest',
  }
}

export function tickRest(state) {
  if (state.phase !== 'rest') return state

  const remainingSeconds = Math.max(0, state.remainingSeconds - 1)
  return {
    ...state,
    remainingSeconds,
    phase: remainingSeconds === 0 ? 'ready' : 'rest',
  }
}

export function adjustRest(state, deltaSeconds) {
  if (state.phase !== 'rest') return state
  return {
    ...state,
    remainingSeconds: Math.max(0, state.remainingSeconds + deltaSeconds),
  }
}

export function resetWorkout(state) {
  return createWorkoutState({
    targetSets: state.targetSets,
    restSeconds: state.restSeconds,
  })
}

export function formatSeconds(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutesPart = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secondsPart = String(seconds % 60).padStart(2, '0')
  return `${minutesPart}:${secondsPart}`
}
