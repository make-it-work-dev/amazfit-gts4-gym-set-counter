const DEFAULT_TARGET_SETS = 4
const DEFAULT_REST_SECONDS = 60
const MIN_REST_SECONDS = 15
const MAX_REST_SECONDS = 600

export function createWorkoutState({
  targetSets = DEFAULT_TARGET_SETS,
  restSeconds = DEFAULT_REST_SECONDS,
} = {}) {
  return {
    completedSets: 0,
    targetSets,
    restSeconds,
    remainingSeconds: 0,
    restEndAt: null,
    phase: 'ready',
  }
}

export function completeSet(state, nowMs = Date.now()) {
  if (state.phase === 'complete') return state

  const completedSets = Math.min(state.completedSets + 1, state.targetSets)
  const finished = completedSets >= state.targetSets

  return {
    ...state,
    completedSets,
    remainingSeconds: finished ? 0 : state.restSeconds,
    restEndAt: finished ? null : nowMs + state.restSeconds * 1000,
    phase: finished ? 'complete' : 'rest',
  }
}

export function syncRest(state, nowMs = Date.now()) {
  if (state.phase !== 'rest') return state

  const restEndAt = state.restEndAt ?? nowMs + state.remainingSeconds * 1000
  const remainingSeconds = Math.max(0, Math.ceil((restEndAt - nowMs) / 1000))
  if (remainingSeconds === 0) {
    return {
      ...state,
      remainingSeconds: 0,
      restEndAt: null,
      phase: 'ready',
    }
  }

  return {
    ...state,
    remainingSeconds,
    restEndAt,
  }
}

export function adjustRest(state, deltaSeconds, nowMs = Date.now()) {
  const current = syncRest(state, nowMs)
  if (current.phase !== 'rest') return current

  const remainingSeconds = Math.max(0, current.remainingSeconds + deltaSeconds)
  if (remainingSeconds === 0) {
    return {
      ...current,
      remainingSeconds: 0,
      restEndAt: null,
      phase: 'ready',
    }
  }

  return {
    ...current,
    remainingSeconds,
    restEndAt: nowMs + remainingSeconds * 1000,
  }
}

export function setDefaultRest(state, seconds) {
  const restSeconds = Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, Math.round(seconds)))
  return {
    ...state,
    restSeconds,
  }
}

export function isValidPersistedWorkoutState(saved) {
  if (!saved || typeof saved !== 'object') return false

  const validTarget = Number.isFinite(saved.targetSets) && saved.targetSets >= 1 && saved.targetSets <= 20
  const validCompleted = Number.isFinite(saved.completedSets) && saved.completedSets >= 0
  const validRest = Number.isFinite(saved.restSeconds)
  const validPhase = ['ready', 'rest', 'complete'].includes(saved.phase)
  const validRestEnd = saved.phase !== 'rest' || (Number.isFinite(saved.restEndAt) && saved.restEndAt > 0)
  return validTarget && validCompleted && validRest && validPhase && validRestEnd
}

export function restoreWorkoutState(saved, nowMs = Date.now()) {
  if (!isValidPersistedWorkoutState(saved)) return createWorkoutState()

  const targetSets = Math.floor(saved.targetSets)
  const completedSets = Math.min(targetSets, Math.floor(saved.completedSets))
  const base = setDefaultRest(createWorkoutState({ targetSets }), saved.restSeconds)

  if (completedSets >= targetSets || saved.phase === 'complete') {
    return {
      ...base,
      completedSets: completedSets >= targetSets ? targetSets : completedSets,
      phase: completedSets >= targetSets ? 'complete' : 'ready',
    }
  }

  if (saved.phase === 'rest') {
    if (!Number.isFinite(saved.restEndAt) || saved.restEndAt <= 0) return createWorkoutState()
    return syncRest({
      ...base,
      completedSets,
      phase: 'rest',
      restEndAt: saved.restEndAt,
      remainingSeconds: 0,
    }, nowMs)
  }

  return {
    ...base,
    completedSets,
    phase: 'ready',
  }
}

export function createReminderPulsePlan(seconds = 5) {
  const pulseCount = Math.max(1, Math.floor(seconds))
  return Array.from({ length: pulseCount }, (_, index) => index * 1000)
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
