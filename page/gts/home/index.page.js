import { createWidget, widget, prop } from '@zos/ui'
import {
  Vibrator,
  VIBRATOR_SCENE_SHORT_STRONG,
  VIBRATOR_SCENE_DURATION_LONG,
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
  addWorkoutHistory,
  restoreWorkoutHistory,
  normalizeMusicInfo,
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
  HISTORY_BUTTON,
  MUSIC_BUTTON,
  SETTINGS_BUTTON,
  SETTINGS_TITLE,
  SETTINGS_VALUE,
  SETTINGS_MINUS,
  SETTINGS_PLUS,
  SETTINGS_SAVE,
  HISTORY_TITLE,
  HISTORY_ROW,
  HISTORY_BACK,
  MUSIC_TITLE,
  MUSIC_TRACK,
  MUSIC_ARTIST,
  MUSIC_PREV,
  MUSIC_PLAY,
  MUSIC_NEXT,
  MUSIC_STATUS,
  MUSIC_BACK,
} from './index.style'

const SNAPSHOT_KEY = 'gymSetsSnapshot'
const WORKOUT_KEY = 'gymSetsWorkout'
const HISTORY_KEY = 'gymSetsHistory'
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
    historyOpen: false,
    musicOpen: false,
    musicSensor: null,
    musicChangeHandler: null,
    musicAvailable: false,
    musicInfo: normalizeMusicInfo(null),
    history: [],
    alertOnBuild: false,
    ui: {},
  },

  onInit() {
    setWakeUpRelaunch({ relaunch: true })
    this.clearPendingAlarm()

    const snapshot = localStorage.getItem(SNAPSHOT_KEY, null)
    const hasSnapshot = snapshot && typeof snapshot === 'object'
    const saved = hasSnapshot ? snapshot.workout : localStorage.getItem(WORKOUT_KEY, null)
    const savedHistory = hasSnapshot ? snapshot.history : localStorage.getItem(HISTORY_KEY, [])
    const wasResting = isValidPersistedWorkoutState(saved) && saved.phase === 'rest'
    this.state.workout = restoreWorkoutState(saved, Date.now())
    this.state.history = restoreWorkoutHistory(savedHistory)
    this.state.alertOnBuild = wasResting && this.state.workout.phase === 'ready'
    this.saveWorkout()
    localStorage.removeItem(WORKOUT_KEY)
    localStorage.removeItem(HISTORY_KEY)
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
    this.state.ui.history = createWidget(widget.BUTTON, {
      ...HISTORY_BUTTON,
      click_func: () => this.openHistory(),
    })
    this.state.ui.music = createWidget(widget.BUTTON, {
      ...MUSIC_BUTTON,
      click_func: () => this.openMusic(),
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

    this.state.ui.historyTitle = createWidget(widget.TEXT, HISTORY_TITLE)
    this.state.ui.historyRows = Array.from({ length: 5 }, (_, index) =>
      createWidget(widget.TEXT, {
        ...HISTORY_ROW,
        y: HISTORY_ROW.y + index * 50,
      }))
    this.state.ui.historyBack = createWidget(widget.BUTTON, {
      ...HISTORY_BACK,
      click_func: () => this.closeHistory(),
    })

    this.state.ui.musicTitle = createWidget(widget.TEXT, MUSIC_TITLE)
    this.state.ui.musicTrack = createWidget(widget.TEXT, MUSIC_TRACK)
    this.state.ui.musicArtist = createWidget(widget.TEXT, MUSIC_ARTIST)
    this.state.ui.musicPrev = createWidget(widget.BUTTON, {
      ...MUSIC_PREV,
      click_func: () => this.previousTrack(),
    })
    this.state.ui.musicPlay = createWidget(widget.BUTTON, {
      ...MUSIC_PLAY,
      click_func: () => this.toggleMusic(),
    })
    this.state.ui.musicNext = createWidget(widget.BUTTON, {
      ...MUSIC_NEXT,
      click_func: () => this.nextTrack(),
    })
    this.state.ui.musicStatus = createWidget(widget.TEXT, MUSIC_STATUS)
    this.state.ui.musicBack = createWidget(widget.BUTTON, {
      ...MUSIC_BACK,
      click_func: () => this.closeMusic(),
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
    if (this.state.workout.phase === 'complete') {
      this.state.history = addWorkoutHistory(this.state.history, this.state.workout, Date.now())
    }
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
    this.state.historyOpen = false
    this.state.settingsOpen = true
    this.render()
  },

  closeSettings() {
    this.state.settingsOpen = false
    this.saveWorkout()
    this.render()
  },

  openHistory() {
    this.state.settingsOpen = false
    this.state.historyOpen = true
    this.render()
  },

  closeHistory() {
    this.state.historyOpen = false
    this.render()
  },

  openMusic() {
    this.state.settingsOpen = false
    this.state.historyOpen = false
    this.state.musicOpen = true
    this.initializeMusicControls()
    this.render()
  },

  closeMusic() {
    this.state.musicOpen = false
    this.render()
  },

  initializeMusicControls() {
    if (this.state.musicSensor) {
      this.updateMusicInfo()
      return
    }

    if (
      typeof hmSensor === 'undefined' ||
      !hmSensor.id ||
      typeof hmSensor.id.MUSIC === 'undefined'
    ) {
      this.state.musicAvailable = false
      return
    }

    try {
      const sensor = hmSensor.createSensor(hmSensor.id.MUSIC)
      if (!sensor) return
      sensor.audInit()
      const handler = () => {
        this.updateMusicInfo()
        this.render()
      }
      sensor.addEventListener(hmSensor.event.CHANGE, handler)
      this.state.musicSensor = sensor
      this.state.musicChangeHandler = handler
      this.state.musicAvailable = true
      this.updateMusicInfo()
    } catch (error) {
      this.state.musicAvailable = false
      this.state.musicSensor = null
    }
  },

  updateMusicInfo() {
    const sensor = this.state.musicSensor
    if (!sensor) {
      this.state.musicInfo = normalizeMusicInfo(null)
      return
    }
    this.state.musicInfo = normalizeMusicInfo({
      title: sensor.title,
      artist: sensor.artist,
      isPlaying: sensor.isPlaying,
    })
  },

  toggleMusic() {
    const sensor = this.state.musicSensor
    if (!sensor) return
    try {
      if (sensor.isPlaying) sensor.audPause()
      else sensor.audPlay()
      setTimeout(() => {
        this.updateMusicInfo()
        this.render()
      }, 250)
    } catch (error) {}
  },

  previousTrack() {
    const sensor = this.state.musicSensor
    if (!sensor) return
    try {
      sensor.audPrev()
    } catch (error) {}
  },

  nextTrack() {
    const sensor = this.state.musicSensor
    if (!sensor) return
    try {
      sensor.audNext()
    } catch (error) {}
  },

  formatHistoryEntry(entry) {
    const date = new Date(entry.completedAt)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes} - ${entry.sets} SETS`
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
      vibrator.start({ mode: VIBRATOR_SCENE_DURATION_LONG })
      pulseIndex += 1

      if (pulseIndex >= pulsePlan.length) {
        if (this.state.reminderIntervalId !== null) {
          clearInterval(this.state.reminderIntervalId)
          this.state.reminderIntervalId = null
        }
        this.state.reminderStopTimeoutId = setTimeout(() => {
          vibrator.stop()
          this.state.reminderStopTimeoutId = null
        }, 1100)
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
    localStorage.setItem(SNAPSHOT_KEY, {
      workout: this.state.workout,
      history: this.state.history,
    })
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
    const showMain = !this.state.settingsOpen && !this.state.historyOpen && !this.state.musicOpen
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
    this.setVisible(this.state.ui.history, showMain)
    this.setVisible(this.state.ui.music, showMain)
    this.setVisible(this.state.ui.settings, showMain)
    this.setVisible(this.state.ui.done, showMain && !isResting && !isComplete)

    this.setVisible(this.state.ui.settingsTitle, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsValue, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsMinus, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsPlus, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsSave, this.state.settingsOpen)

    this.setVisible(this.state.ui.historyTitle, this.state.historyOpen)
    this.setVisible(this.state.ui.historyBack, this.state.historyOpen)
    this.state.ui.historyRows.forEach((row, index) => {
      const entry = this.state.history[index]
      const text = entry
        ? this.formatHistoryEntry(entry)
        : index === 0 ? 'NO COMPLETED WORKOUTS' : ''
      row.setProperty(prop.TEXT, text)
      this.setVisible(row, this.state.historyOpen && text.length > 0)
    })

    const music = this.state.musicInfo
    this.state.ui.musicTrack.setProperty(prop.TEXT, music.title)
    this.state.ui.musicArtist.setProperty(prop.TEXT, music.artist)
    this.state.ui.musicStatus.setProperty(
      prop.TEXT,
      this.state.musicAvailable
        ? music.isPlaying ? 'PLAYING' : 'PAUSED'
        : 'MUSIC CONTROL UNAVAILABLE',
    )
    this.setVisible(this.state.ui.musicTitle, this.state.musicOpen)
    this.setVisible(this.state.ui.musicTrack, this.state.musicOpen)
    this.setVisible(this.state.ui.musicArtist, this.state.musicOpen)
    this.setVisible(this.state.ui.musicPrev, this.state.musicOpen)
    this.setVisible(this.state.ui.musicPlay, this.state.musicOpen)
    this.setVisible(this.state.ui.musicNext, this.state.musicOpen)
    this.setVisible(this.state.ui.musicStatus, this.state.musicOpen)
    this.setVisible(this.state.ui.musicBack, this.state.musicOpen)
  },

  onDestroy() {
    if (this.state.intervalId !== null) clearInterval(this.state.intervalId)
    if (
      this.state.musicSensor &&
      this.state.musicChangeHandler &&
      typeof this.state.musicSensor.removeEventListener === 'function' &&
      typeof hmSensor !== 'undefined'
    ) {
      try {
        this.state.musicSensor.removeEventListener(
          hmSensor.event.CHANGE,
          this.state.musicChangeHandler,
        )
      } catch (error) {}
    }
    this.stopRestReminder()
    this.state.workout = syncRest(this.state.workout, Date.now())
    this.saveWorkout()
    this.scheduleRestAlarm()
    resetDropWristScreenOff()
    resetPalmScreenOff()
    resetPageBrightTime()
  },
})
