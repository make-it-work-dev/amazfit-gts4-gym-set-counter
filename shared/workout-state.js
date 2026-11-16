const DEFAULT_TARGET_SETS = 4
const DEFAULT_REST_SECONDS = 60
const MIN_REST_SECONDS = 15
const MAX_REST_SECONDS = 600

export const BODY_PARTS = [
  'CHEST',
  'BICEPS',
  'TRICEPS',
  'SHOULDERS',
  'LEGS',
  'BACK',
  'OTHER',
]

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

export function setTargetSets(state, targetSets) {
  const minimum = Math.max(1, state.completedSets + (state.phase === 'complete' ? 0 : 1))
  return {
    ...state,
    targetSets: Math.min(20, Math.max(minimum, Math.round(targetSets))),
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

export function restorePendingCompletionAt(saved, nowMs = Date.now()) {
  return Number.isInteger(saved) && saved > 0 && saved <= nowMs ? saved : null
}

export function createReminderPulsePlan(seconds = 2) {
  const pulseCount = Math.max(1, Math.floor(seconds))
  return Array.from({ length: pulseCount }, (_, index) => index * 1000)
}

export function addWorkoutHistory(history, workout, bodyPart, completedAt = Date.now()) {
  const existing = Array.isArray(history) ? history : []
  const entry = {
    completedAt,
    bodyPart: BODY_PARTS.includes(bodyPart) ? bodyPart : 'OTHER',
    sets: workout.targetSets,
    restSeconds: workout.restSeconds,
  }
  return restoreWorkoutHistory([entry, ...existing])
}

export function removeWorkoutHistory(history, completedAt) {
  if (!Array.isArray(history)) return []
  return history.filter((entry) => entry.completedAt !== completedAt)
}

export function shiftHistoryDate(timestamp, deltaDays, nowMs = Date.now()) {
  const shifted = new Date(timestamp)
  if (!Number.isFinite(shifted.getTime())) return nowMs
  shifted.setDate(shifted.getDate() + Math.trunc(deltaDays))
  return Math.min(shifted.getTime(), nowMs)
}

export function paginateWorkoutHistory(history, requestedPage, pageSize = 5) {
  const entries = Array.isArray(history) ? history : []
  const safePageSize = Math.max(1, Math.floor(pageSize))
  const pageCount = Math.max(1, Math.ceil(entries.length / safePageSize))
  const requested = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 0
  const page = Math.max(0, Math.min(pageCount - 1, requested))
  const start = page * safePageSize
  return {
    entries: entries.slice(start, start + safePageSize),
    page,
    pageCount,
  }
}

export function restoreWorkoutHistory(saved, nowMs = Date.now()) {
  if (!Array.isArray(saved)) return []

  const latestByTimestamp = new Map()
  saved.forEach((entry) => {
    const validTimestamp = entry &&
      Number.isInteger(entry.completedAt) &&
      entry.completedAt > 0 &&
      entry.completedAt <= nowMs &&
      Number.isFinite(new Date(entry.completedAt).getTime())
    const validBodyPart = entry && (
      typeof entry.bodyPart === 'undefined' || BODY_PARTS.includes(entry.bodyPart)
    )
    const validSets = entry && Number.isInteger(entry.sets) && entry.sets >= 1 && entry.sets <= 20
    const validRest = entry && Number.isInteger(entry.restSeconds) &&
      entry.restSeconds >= MIN_REST_SECONDS && entry.restSeconds <= MAX_REST_SECONDS

    if (validTimestamp && validBodyPart && validSets && validRest && !latestByTimestamp.has(entry.completedAt)) {
      latestByTimestamp.set(entry.completedAt, {
        completedAt: entry.completedAt,
        bodyPart: entry.bodyPart || 'OTHER',
        sets: entry.sets,
        restSeconds: entry.restSeconds,
      })
    }
  })

  return [...latestByTimestamp.values()]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 20)
}

export function createMusicLaunchRequest(appId) {
  return {
    appId,
    native: true,
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
