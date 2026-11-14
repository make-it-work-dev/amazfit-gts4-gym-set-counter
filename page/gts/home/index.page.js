import { createWidget, widget, prop } from '@zos/ui'
import {
  Vibrator,
  VIBRATOR_SCENE_SHORT_STRONG,
  VIBRATOR_SCENE_DURATION,
} from '@zos/sensor'
import { localStorage } from '@zos/storage'
import {
  setPageBrightTime,
  resetPageBrightTime,
  setWakeUpRelaunch,
  pauseDropWristScreenOff,
  resetDropWristScreenOff,
  pausePalmScreenOff,
  resetPalmScreenOff,
} from '@zos/display'
import { setLaunchAppTimeout, clearLaunchAppTimeout } from '@zos/router'
import { getPackageInfo } from '@zos/app'

import {
  createWorkoutState,
  completeSet,
  syncRest,
  setDefaultRest,
  isValidPersistedWorkoutState,
  restoreWorkoutState,
  createReminderPulsePlan,
  resetWorkout,
  formatSeconds,
} from '../../../shared/workout-state'
import {
  COLORS,
  TITLE,
  SETS,
  STATUS,
  TIMER,
  DONE_BUTTON,
  RESET_BUTTON,
  SETTINGS_BUTTON,
  SETTINGS_TITLE,
  SETTINGS_VALUE,
  SETTINGS_MINUS,
  SETTINGS_PLUS,
  SETTINGS_SAVE,
} from './index.style'

const WORKOUT_KEY = 'gymSetsWorkout'
const ALARM_KEY = 'gymSetsAlarmId'
const ALARM_FAILED_KEY = 'gymSetsAlarmFailedAt'
const APP_ID = getPackageInfo().appId || 2889041
const PAGE_URL = 'page/gts/home/index.page'
const KEEP_SCREEN_ON_MS = 2147483000
const vibrator = new Vibrator()

Page({
  state: {
    workout: createWorkoutState(),
    intervalId: null,
    reminderIntervalId: null,
    reminderStopTimeoutId: null,
    settingsOpen: false,
    alertOnBuild: false,
    ui: {},
  },

  onInit() {
    setWakeUpRelaunch({ relaunch: true })
    this.clearPendingAlarm()

    const saved = localStorage.getItem(WORKOUT_KEY, null)
    const wasResting = isValidPersistedWorkoutState(saved) && saved.phase === 'rest'
    this.state.workout = restoreWorkoutState(saved, Date.now())
    this.state.alertOnBuild = wasResting && this.state.workout.phase === 'ready'
    this.saveWorkout()
  },

  build() {
    setPageBrightTime({ brightTime: KEEP_SCREEN_ON_MS })
    pauseDropWristScreenOff({ duration: 0 })
    pausePalmScreenOff({ duration: 0 })

    this.state.ui.background = createWidget(widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: 390,
      h: 450,
      color: COLORS.background,
    })

    this.state.ui.title = createWidget(widget.TEXT, TITLE)
    this.state.ui.sets = createWidget(widget.TEXT, SETS)
    this.state.ui.status = createWidget(widget.TEXT, STATUS)
    this.state.ui.timer = createWidget(widget.TEXT, TIMER)
    this.state.ui.done = createWidget(widget.BUTTON, {
      ...DONE_BUTTON,
      click_func: () => this.logSet(),
    })
    this.state.ui.reset = createWidget(widget.BUTTON, {
      ...RESET_BUTTON,
      click_func: () => this.reset(),
    })
    this.state.ui.settings = createWidget(widget.BUTTON, {
      ...SETTINGS_BUTTON,
      click_func: () => this.openSettings(),
    })

    this.state.ui.settingsTitle = createWidget(widget.TEXT, SETTINGS_TITLE)
    this.state.ui.settingsValue = createWidget(widget.TEXT, SETTINGS_VALUE)
    this.state.ui.settingsMinus = createWidget(widget.BUTTON, {
      ...SETTINGS_MINUS,
      click_func: () => this.changeDefaultRest(-15),
    })
    this.state.ui.settingsPlus = createWidget(widget.BUTTON, {
      ...SETTINGS_PLUS,
      click_func: () => this.changeDefaultRest(15),
    })
    this.state.ui.settingsSave = createWidget(widget.BUTTON, {
      ...SETTINGS_SAVE,
      click_func: () => this.closeSettings(),
    })

    this.render()
    if (this.state.alertOnBuild) {
      this.startRestReminder()
      this.state.alertOnBuild = false
    }
    this.state.intervalId = setInterval(() => this.onSecond(), 1000)
  },

  onSecond() {
    const previous = this.state.workout
    const next = syncRest(previous, Date.now())
    if (
      next.phase === previous.phase &&
      next.remainingSeconds === previous.remainingSeconds
    ) return

    this.state.workout = next
    this.saveWorkout()
    if (previous.phase === 'rest' && next.phase === 'ready') {
      this.startRestReminder()
    }
    this.render()
  },

  logSet() {
    const current = syncRest(this.state.workout, Date.now())
    if (current.phase === 'rest' || current.phase === 'complete') return

    this.stopRestReminder()
    this.state.workout = completeSet(current, Date.now())
    this.saveWorkout()
    vibrator.start({ mode: VIBRATOR_SCENE_SHORT_STRONG })
    this.render()
  },

  reset() {
    this.stopRestReminder()
    this.state.workout = resetWorkout(this.state.workout)
    this.saveWorkout()
    this.render()
  },

  openSettings() {
    this.state.settingsOpen = true
    this.render()
  },

  closeSettings() {
    this.state.settingsOpen = false
    this.saveWorkout()
    this.render()
  },

  changeDefaultRest(seconds) {
    this.state.workout = setDefaultRest(
      this.state.workout,
      this.state.workout.restSeconds + seconds,
    )
    this.saveWorkout()
    this.render()
  },

  startRestReminder() {
    this.stopRestReminder()
    const pulsePlan = createReminderPulsePlan()
    let pulseIndex = 0

    const pulse = () => {
      vibrator.start({ mode: VIBRATOR_SCENE_DURATION })
      pulseIndex += 1

      if (pulseIndex >= pulsePlan.length) {
        if (this.state.reminderIntervalId !== null) {
          clearInterval(this.state.reminderIntervalId)
          this.state.reminderIntervalId = null
        }
        this.state.reminderStopTimeoutId = setTimeout(() => {
          vibrator.stop()
          this.state.reminderStopTimeoutId = null
        }, 700)
      }
    }

    pulse()
    if (pulsePlan.length > 1) {
      this.state.reminderIntervalId = setInterval(pulse, 1000)
    }
  },

  stopRestReminder() {
    if (this.state.reminderIntervalId !== null) {
      clearInterval(this.state.reminderIntervalId)
      this.state.reminderIntervalId = null
    }
    if (this.state.reminderStopTimeoutId !== null) {
      clearTimeout(this.state.reminderStopTimeoutId)
      this.state.reminderStopTimeoutId = null
    }
    vibrator.stop()
  },

  saveWorkout() {
    localStorage.setItem(WORKOUT_KEY, this.state.workout)
  },

  clearPendingAlarm() {
    const timeoutId = localStorage.getItem(ALARM_KEY, 0)
    if (timeoutId <= 0) return true

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        clearLaunchAppTimeout({ timeoutId })
        localStorage.removeItem(ALARM_KEY)
        localStorage.removeItem(ALARM_FAILED_KEY)
        return true
      } catch (error) {}
    }

    localStorage.setItem(ALARM_FAILED_KEY, Date.now())
    return false
  },

  tryScheduleRestAlarm(state) {
    try {
      return setLaunchAppTimeout({
        appId: APP_ID,
        url: PAGE_URL,
        utc: state.restEndAt,
        params: { reason: 'rest_complete' },
      })
    } catch (error) {
      return 0
    }
  },

  scheduleRestAlarm() {
    if (!this.clearPendingAlarm()) return
    const state = syncRest(this.state.workout, Date.now())
    if (state.phase !== 'rest' || !state.restEndAt) {
      localStorage.removeItem(ALARM_FAILED_KEY)
      return
    }

    let timeoutId = this.tryScheduleRestAlarm(state)
    if (timeoutId <= 0) timeoutId = this.tryScheduleRestAlarm(state)

    if (timeoutId > 0) {
      localStorage.setItem(ALARM_KEY, timeoutId)
      localStorage.removeItem(ALARM_FAILED_KEY)
    } else {
      localStorage.setItem(ALARM_FAILED_KEY, state.restEndAt)
    }
  },

  setVisible(target, visible) {
    target.setProperty(prop.VISIBLE, visible)
  },

  render() {
    const state = this.state.workout
    const isResting = state.phase === 'rest'
    const isComplete = state.phase === 'complete'
    const showMain = !this.state.settingsOpen
    const nextSet = Math.min(state.completedSets + 1, state.targetSets)

    this.state.ui.sets.setProperty(prop.TEXT, `${state.completedSets} / ${state.targetSets}`)
    this.state.ui.timer.setProperty(
      prop.TEXT,
      isResting ? formatSeconds(state.remainingSeconds) : isComplete ? 'DONE' : formatSeconds(state.restSeconds),
    )
    this.state.ui.status.setProperty(
      prop.TEXT,
      isResting ? 'REST' : isComplete ? 'WORKOUT COMPLETE' : `READY FOR SET ${nextSet}`,
    )
    this.state.ui.settingsValue.setProperty(prop.TEXT, formatSeconds(state.restSeconds))

    this.setVisible(this.state.ui.title, showMain)
    this.setVisible(this.state.ui.sets, showMain)
    this.setVisible(this.state.ui.status, showMain)
    this.setVisible(this.state.ui.timer, showMain)
    this.setVisible(this.state.ui.reset, showMain)
    this.setVisible(this.state.ui.settings, showMain)
    this.setVisible(this.state.ui.done, showMain && !isResting && !isComplete)

    this.setVisible(this.state.ui.settingsTitle, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsValue, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsMinus, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsPlus, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsSave, this.state.settingsOpen)
  },

  onDestroy() {
    if (this.state.intervalId !== null) clearInterval(this.state.intervalId)
    this.stopRestReminder()
    this.state.workout = syncRest(this.state.workout, Date.now())
    this.saveWorkout()
    this.scheduleRestAlarm()
    resetDropWristScreenOff()
    resetPalmScreenOff()
    resetPageBrightTime()
  },
})
