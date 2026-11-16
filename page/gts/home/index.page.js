import { createWidget, widget, prop } from '@zos/ui'
import {
  Vibrator,
  VIBRATOR_SCENE_SHORT_STRONG,
  VIBRATOR_SCENE_STRONG_REMINDER,
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
import {
  setLaunchAppTimeout,
  clearLaunchAppTimeout,
  launchApp,
  SYSTEM_APP_MUSIC,
} from '@zos/router'
import { getPackageInfo } from '@zos/app'

import {
  createWorkoutState,
  completeSet,
  syncRest,
  setDefaultRest,
  setTargetSets,
  isValidPersistedWorkoutState,
  restoreWorkoutState,
  restorePendingCompletionAt,
  createReminderPulsePlan,
  BODY_PARTS,
  addWorkoutHistory,
  removeWorkoutHistory,
  shiftHistoryDate,
  paginateWorkoutHistory,
  restoreWorkoutHistory,
  createMusicLaunchRequest,
  resetWorkout,
  formatSeconds,
} from '../../../shared/workout-state'
import {
  createLicenseState,
  applyLicenseStatus,
  canUseApp,
  shouldRequestLicenseSync,
} from '../../../shared/license-state'
import {
  COLORS,
  TITLE,
  LICENSE_TITLE,
  LICENSE_MESSAGE,
  SETS,
  STATUS,
  TIMER,
  DONE_BUTTON,
  RESET_BUTTON,
  HISTORY_BUTTON,
  MUSIC_BUTTON,
  SETTINGS_BUTTON,
  SETTINGS_SETS_VALUE,
  SETTINGS_SETS_MINUS,
  SETTINGS_SETS_PLUS,
  SETTINGS_VALUE,
  SETTINGS_MINUS,
  SETTINGS_PLUS,
  SETTINGS_SAVE,
  HISTORY_TITLE,
  HISTORY_ROW,
  HISTORY_PREV,
  HISTORY_NEXT,
  HISTORY_EDIT,
  HISTORY_BACK,
  HISTORY_EDIT_TITLE,
  HISTORY_EDIT_ROW,
  HISTORY_DELETE,
  HISTORY_ADD,
  HISTORY_EDIT_BACK,
  DATE_TITLE,
  DATE_VALUE,
  DATE_MINUS,
  DATE_PLUS,
  DATE_NEXT,
  DATE_CANCEL,
  BODY_PART_TITLE,
  BODY_PART_BUTTON,
  BODY_PART_OTHER,
  BODY_PART_BACK,
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
    license: createLicenseState(),
    lastPurchaseRequestAt: null,
    intervalId: null,
    reminderIntervalId: null,
    reminderStopTimeoutId: null,
    settingsOpen: false,
    historyOpen: false,
    historyEditOpen: false,
    datePickerOpen: false,
    bodyPartOpen: false,
    history: [],
    historyPage: 0,
    pendingHistoryDate: null,
    pendingHistoryMode: null,
    alertOnBuild: false,
    ui: {},
  },

  onInit() {
    setWakeUpRelaunch({ relaunch: true })
    this.clearPendingAlarm()

    const app = getApp()
    const kpay = app.globalData && app.globalData.kpay
    if (kpay && kpay.isLicensed()) {
      this.state.license = applyLicenseStatus(this.state.license, { status: 'licensed' })
    }
    if (kpay) {
      kpay.startPurchase()
      this.state.lastPurchaseRequestAt = Date.now()
    }

    const snapshot = localStorage.getItem(SNAPSHOT_KEY, null)
    const hasSnapshot = snapshot && typeof snapshot === 'object'
    const saved = hasSnapshot ? snapshot.workout : localStorage.getItem(WORKOUT_KEY, null)
    const savedHistory = hasSnapshot ? snapshot.history : localStorage.getItem(HISTORY_KEY, [])
    const wasResting = isValidPersistedWorkoutState(saved) && saved.phase === 'rest'
    this.state.workout = restoreWorkoutState(saved, Date.now())
    this.state.history = restoreWorkoutHistory(savedHistory)
    if (this.state.workout.phase === 'complete') {
      const pendingCompletionAt = restorePendingCompletionAt(
        hasSnapshot ? snapshot.pendingCompletionAt : null,
        Date.now(),
      )
      if (pendingCompletionAt !== null) {
        this.state.pendingHistoryDate = pendingCompletionAt
        this.state.pendingHistoryMode = 'completion'
        this.state.bodyPartOpen = true
      } else {
        this.state.workout = resetWorkout(this.state.workout)
      }
    }
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
    this.state.ui.licenseTitle = createWidget(widget.TEXT, LICENSE_TITLE)
    this.state.ui.licenseMessage = createWidget(widget.TEXT, LICENSE_MESSAGE)
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
      click_func: () => this.launchMusicControls(),
    })
    this.state.ui.settings = createWidget(widget.BUTTON, {
      ...SETTINGS_BUTTON,
      click_func: () => this.openSettings(),
    })

    this.state.ui.settingsSetsValue = createWidget(widget.TEXT, SETTINGS_SETS_VALUE)
    this.state.ui.settingsSetsMinus = createWidget(widget.BUTTON, {
      ...SETTINGS_SETS_MINUS,
      click_func: () => this.changeTargetSets(-1),
    })
    this.state.ui.settingsSetsPlus = createWidget(widget.BUTTON, {
      ...SETTINGS_SETS_PLUS,
      click_func: () => this.changeTargetSets(1),
    })
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
    this.state.ui.historyPrev = createWidget(widget.BUTTON, {
      ...HISTORY_PREV,
      click_func: () => this.changeHistoryPage(-1),
    })
    this.state.ui.historyNext = createWidget(widget.BUTTON, {
      ...HISTORY_NEXT,
      click_func: () => this.changeHistoryPage(1),
    })
    this.state.ui.historyEdit = createWidget(widget.BUTTON, {
      ...HISTORY_EDIT,
      click_func: () => this.openHistoryEditor(),
    })
    this.state.ui.historyBack = createWidget(widget.BUTTON, {
      ...HISTORY_BACK,
      click_func: () => this.closeHistory(),
    })

    this.state.ui.historyEditTitle = createWidget(widget.TEXT, HISTORY_EDIT_TITLE)
    this.state.ui.historyEditRows = Array.from({ length: 5 }, (_, index) =>
      createWidget(widget.TEXT, {
        ...HISTORY_EDIT_ROW,
        y: HISTORY_EDIT_ROW.y + index * 50,
      }))
    this.state.ui.historyDeleteButtons = Array.from({ length: 5 }, (_, index) =>
      createWidget(widget.BUTTON, {
        ...HISTORY_DELETE,
        y: HISTORY_DELETE.y + index * 50,
        click_func: () => this.removeHistoryAt(index),
      }))
    this.state.ui.historyEditPrev = createWidget(widget.BUTTON, {
      ...HISTORY_PREV,
      click_func: () => this.changeHistoryPage(-1),
    })
    this.state.ui.historyEditNext = createWidget(widget.BUTTON, {
      ...HISTORY_NEXT,
      click_func: () => this.changeHistoryPage(1),
    })
    this.state.ui.historyAdd = createWidget(widget.BUTTON, {
      ...HISTORY_ADD,
      click_func: () => this.startManualHistoryAdd(),
    })
    this.state.ui.historyEditBack = createWidget(widget.BUTTON, {
      ...HISTORY_EDIT_BACK,
      click_func: () => this.closeHistoryEditor(),
    })

    this.state.ui.dateTitle = createWidget(widget.TEXT, DATE_TITLE)
    this.state.ui.dateValue = createWidget(widget.TEXT, DATE_VALUE)
    this.state.ui.dateMinus = createWidget(widget.BUTTON, {
      ...DATE_MINUS,
      click_func: () => this.changeHistoryDate(-1),
    })
    this.state.ui.datePlus = createWidget(widget.BUTTON, {
      ...DATE_PLUS,
      click_func: () => this.changeHistoryDate(1),
    })
    this.state.ui.dateNext = createWidget(widget.BUTTON, {
      ...DATE_NEXT,
      click_func: () => this.openBodyPartPicker(),
    })
    this.state.ui.dateCancel = createWidget(widget.BUTTON, {
      ...DATE_CANCEL,
      click_func: () => this.cancelManualHistoryAdd(),
    })

    this.state.ui.bodyPartTitle = createWidget(widget.TEXT, BODY_PART_TITLE)
    this.state.ui.bodyPartButtons = BODY_PARTS.map((bodyPart, index) => {
      const style = index === BODY_PARTS.length - 1
        ? BODY_PART_OTHER
        : {
          ...BODY_PART_BUTTON,
          x: index % 2 === 0 ? 18 : 202,
          y: BODY_PART_BUTTON.y + Math.floor(index / 2) * 64,
        }
      return createWidget(widget.BUTTON, {
        ...style,
        text: bodyPart,
        click_func: () => this.selectBodyPart(bodyPart),
      })
    })
    this.state.ui.bodyPartBack = createWidget(widget.BUTTON, {
      ...BODY_PART_BACK,
      click_func: () => this.backFromBodyPartPicker(),
    })

    this.render()
    if (this.state.alertOnBuild) {
      this.startRestReminder()
      this.state.alertOnBuild = false
    }
    this.state.intervalId = setInterval(() => this.onSecond(), 1000)
  },

  syncLicense() {
    const app = getApp()
    const kpay = app.globalData && app.globalData.kpay
    const update = kpay && kpay.isLicensed()
      ? { status: 'licensed' }
      : app.globalData && app.globalData.kpayStatus
    const next = update
      ? applyLicenseStatus(this.state.license, update)
      : this.state.license
    const changed = next.status !== this.state.license.status ||
      next.paymentCode !== this.state.license.paymentCode
    this.state.license = next

    if (!canUseApp(next)) {
      this.state.settingsOpen = false
      this.state.historyOpen = false
      this.state.historyEditOpen = false
      this.state.datePickerOpen = false
      if (this.state.pendingHistoryMode !== 'completion') {
        this.state.bodyPartOpen = false
      }
    }

    const now = Date.now()
    const hasReceivedStatus = Boolean(app.globalData && app.globalData.kpayStatus)
    if (kpay && shouldRequestLicenseSync(hasReceivedStatus, this.state.lastPurchaseRequestAt, now)) {
      kpay.startPurchase()
      this.state.lastPurchaseRequestAt = now
    }
    return changed
  },

  onSecond() {
    const licenseChanged = this.syncLicense()
    if (!canUseApp(this.state.license)) {
      if (licenseChanged) this.render()
      return
    }

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
    const completedAt = Date.now()
    this.state.workout = completeSet(current, completedAt)
    if (this.state.workout.phase === 'complete') {
      this.state.pendingHistoryDate = completedAt
      this.state.pendingHistoryMode = 'completion'
      this.state.bodyPartOpen = true
    }
    this.saveWorkout()
    vibrator.start({ mode: VIBRATOR_SCENE_SHORT_STRONG })
    this.render()
  },

  reset() {
    this.stopRestReminder()
    this.state.workout = resetWorkout(this.state.workout)
    this.state.bodyPartOpen = false
    this.state.pendingHistoryDate = null
    this.state.pendingHistoryMode = null
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
    this.state.historyEditOpen = false
    this.state.datePickerOpen = false
    this.state.historyPage = 0
    this.state.historyOpen = true
    this.render()
  },

  closeHistory() {
    this.state.historyOpen = false
    this.render()
  },

  openHistoryEditor() {
    this.state.historyOpen = false
    this.state.historyEditOpen = true
    this.render()
  },

  closeHistoryEditor() {
    this.state.historyEditOpen = false
    this.state.historyOpen = true
    this.render()
  },

  changeHistoryPage(delta) {
    const page = paginateWorkoutHistory(
      this.state.history,
      this.state.historyPage + delta,
    )
    this.state.historyPage = page.page
    this.render()
  },

  removeHistoryAt(index) {
    const absoluteIndex = this.state.historyPage * 5 + index
    const entry = this.state.history[absoluteIndex]
    if (!entry) return
    this.state.history = removeWorkoutHistory(this.state.history, entry.completedAt)
    this.state.historyPage = paginateWorkoutHistory(
      this.state.history,
      this.state.historyPage,
    ).page
    this.saveWorkout()
    this.render()
  },

  startManualHistoryAdd() {
    this.state.historyEditOpen = false
    this.state.datePickerOpen = true
    this.state.pendingHistoryDate = Date.now()
    this.state.pendingHistoryMode = 'manual'
    this.render()
  },

  changeHistoryDate(days) {
    if (!this.state.pendingHistoryDate) return
    this.state.pendingHistoryDate = shiftHistoryDate(
      this.state.pendingHistoryDate,
      days,
      Date.now(),
    )
    this.render()
  },

  openBodyPartPicker() {
    if (!this.state.pendingHistoryDate) return
    this.state.datePickerOpen = false
    this.state.bodyPartOpen = true
    this.render()
  },

  backFromBodyPartPicker() {
    if (this.state.pendingHistoryMode !== 'manual') return
    this.state.bodyPartOpen = false
    this.state.datePickerOpen = true
    this.render()
  },

  cancelManualHistoryAdd() {
    this.state.datePickerOpen = false
    this.state.historyEditOpen = true
    this.state.pendingHistoryDate = null
    this.state.pendingHistoryMode = null
    this.render()
  },

  selectBodyPart(bodyPart) {
    if (!this.state.pendingHistoryDate || !BODY_PARTS.includes(bodyPart)) return
    const mode = this.state.pendingHistoryMode
    this.state.history = addWorkoutHistory(
      this.state.history,
      this.state.workout,
      bodyPart,
      this.state.pendingHistoryDate,
    )
    if (mode === 'completion') {
      this.state.workout = resetWorkout(this.state.workout)
    }
    this.state.bodyPartOpen = false
    this.state.historyEditOpen = mode === 'manual'
    if (mode === 'manual') this.state.historyPage = 0
    this.state.pendingHistoryDate = null
    this.state.pendingHistoryMode = null
    this.saveWorkout()
    vibrator.start({ mode: VIBRATOR_SCENE_SHORT_STRONG })
    this.render()
  },

  launchMusicControls() {
    launchApp(createMusicLaunchRequest(SYSTEM_APP_MUSIC))
  },

  formatHistoryEntry(entry) {
    const date = new Date(entry.completedAt)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${month}/${day}/${year}  ${entry.bodyPart}`
  },

  formatHistoryDate(timestamp) {
    const date = new Date(timestamp)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${date.getFullYear()}`
  },

  changeTargetSets(delta) {
    this.state.workout = setTargetSets(
      this.state.workout,
      this.state.workout.targetSets + delta,
    )
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
      vibrator.start({ mode: VIBRATOR_SCENE_STRONG_REMINDER })
      pulseIndex += 1

      if (pulseIndex >= pulsePlan.length) {
        if (this.state.reminderIntervalId !== null) {
          clearInterval(this.state.reminderIntervalId)
          this.state.reminderIntervalId = null
        }
        this.state.reminderStopTimeoutId = setTimeout(() => {
          vibrator.stop()
          this.state.reminderStopTimeoutId = null
        }, 1000)
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
      pendingCompletionAt: this.state.pendingHistoryMode === 'completion'
        ? this.state.pendingHistoryDate
        : null,
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
    const licensed = canUseApp(this.state.license)
    const isResting = state.phase === 'rest'
    const isComplete = state.phase === 'complete'
    const showMain = licensed && !this.state.settingsOpen &&
      !this.state.historyOpen &&
      !this.state.historyEditOpen &&
      !this.state.datePickerOpen &&
      !this.state.bodyPartOpen
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
    this.state.ui.settingsSetsValue.setProperty(prop.TEXT, `SETS ${state.targetSets}`)
    this.state.ui.settingsValue.setProperty(prop.TEXT, `REST ${formatSeconds(state.restSeconds)}`)

    const licenseTitle = this.state.license.status === 'unlicensed'
      ? 'PAYMENT REQUIRED'
      : 'VERIFYING LICENSE'
    const licenseMessage = this.state.license.status === 'unlicensed'
      ? 'COMPLETE THE $2.99 PURCHASE ON YOUR PHONE'
      : 'KEEP YOUR PHONE NEARBY AND OPEN THE ZEPP APP'
    this.state.ui.licenseTitle.setProperty(prop.TEXT, licenseTitle)
    this.state.ui.licenseMessage.setProperty(prop.TEXT, licenseMessage)
    this.setVisible(this.state.ui.licenseTitle, !licensed)
    this.setVisible(this.state.ui.licenseMessage, !licensed)

    this.setVisible(this.state.ui.title, showMain)
    this.setVisible(this.state.ui.sets, showMain)
    this.setVisible(this.state.ui.status, showMain)
    this.setVisible(this.state.ui.timer, showMain)
    this.setVisible(this.state.ui.reset, showMain)
    this.setVisible(this.state.ui.history, showMain)
    this.setVisible(this.state.ui.music, showMain)
    this.setVisible(this.state.ui.settings, showMain)
    this.setVisible(this.state.ui.done, showMain && !isResting && !isComplete)

    this.setVisible(this.state.ui.settingsSetsValue, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsSetsMinus, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsSetsPlus, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsValue, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsMinus, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsPlus, this.state.settingsOpen)
    this.setVisible(this.state.ui.settingsSave, this.state.settingsOpen)

    const historyPage = paginateWorkoutHistory(
      this.state.history,
      this.state.historyPage,
    )
    this.state.historyPage = historyPage.page
    this.state.ui.historyTitle.setProperty(
      prop.TEXT,
      `HISTORY ${historyPage.page + 1}/${historyPage.pageCount}`,
    )
    this.setVisible(this.state.ui.historyTitle, this.state.historyOpen)
    this.setVisible(
      this.state.ui.historyPrev,
      this.state.historyOpen && historyPage.page > 0,
    )
    this.setVisible(
      this.state.ui.historyNext,
      this.state.historyOpen && historyPage.page < historyPage.pageCount - 1,
    )
    this.setVisible(this.state.ui.historyEdit, this.state.historyOpen)
    this.setVisible(this.state.ui.historyBack, this.state.historyOpen)
    this.state.ui.historyRows.forEach((row, index) => {
      const entry = historyPage.entries[index]
      const text = entry
        ? this.formatHistoryEntry(entry)
        : index === 0 ? 'NO COMPLETED WORKOUTS' : ''
      row.setProperty(prop.TEXT, text)
      this.setVisible(row, this.state.historyOpen && text.length > 0)
    })

    this.state.ui.historyEditTitle.setProperty(
      prop.TEXT,
      `EDIT ${historyPage.page + 1}/${historyPage.pageCount}`,
    )
    this.setVisible(this.state.ui.historyEditTitle, this.state.historyEditOpen)
    this.setVisible(
      this.state.ui.historyEditPrev,
      this.state.historyEditOpen && historyPage.page > 0,
    )
    this.setVisible(
      this.state.ui.historyEditNext,
      this.state.historyEditOpen && historyPage.page < historyPage.pageCount - 1,
    )
    this.setVisible(this.state.ui.historyAdd, this.state.historyEditOpen)
    this.setVisible(this.state.ui.historyEditBack, this.state.historyEditOpen)
    this.state.ui.historyEditRows.forEach((row, index) => {
      const entry = historyPage.entries[index]
      const text = entry
        ? this.formatHistoryEntry(entry)
        : index === 0 ? 'NO HISTORY' : ''
      row.setProperty(prop.TEXT, text)
      this.setVisible(row, this.state.historyEditOpen && text.length > 0)
      this.setVisible(
        this.state.ui.historyDeleteButtons[index],
        this.state.historyEditOpen && Boolean(entry),
      )
    })

    const selectedDate = this.state.pendingHistoryDate || Date.now()
    this.state.ui.dateValue.setProperty(prop.TEXT, this.formatHistoryDate(selectedDate))
    this.setVisible(this.state.ui.dateTitle, this.state.datePickerOpen)
    this.setVisible(this.state.ui.dateValue, this.state.datePickerOpen)
    this.setVisible(this.state.ui.dateMinus, this.state.datePickerOpen)
    this.setVisible(this.state.ui.datePlus, this.state.datePickerOpen)
    this.setVisible(this.state.ui.dateNext, this.state.datePickerOpen)
    this.setVisible(this.state.ui.dateCancel, this.state.datePickerOpen)

    this.state.ui.bodyPartTitle.setProperty(
      prop.TEXT,
      this.state.pendingHistoryMode === 'completion' ? 'WHAT DID YOU TRAIN?' : 'BODY PART',
    )
    this.setVisible(this.state.ui.bodyPartTitle, licensed && this.state.bodyPartOpen)
    this.state.ui.bodyPartButtons.forEach((button) => {
      this.setVisible(button, licensed && this.state.bodyPartOpen)
    })
    this.setVisible(
      this.state.ui.bodyPartBack,
      licensed && this.state.bodyPartOpen && this.state.pendingHistoryMode === 'manual',
    )
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
