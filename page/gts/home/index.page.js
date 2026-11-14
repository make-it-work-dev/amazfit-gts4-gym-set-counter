import { createWidget, widget, prop } from '@zos/ui'
import {
  Vibrator,
  VIBRATOR_SCENE_SHORT_STRONG,
  VIBRATOR_SCENE_STRONG_REMINDER,
} from '@zos/sensor'

import {
  createWorkoutState,
  completeSet,
  tickRest,
  adjustRest,
  resetWorkout,
  formatSeconds,
} from '../../../shared/workout-state'
import {
  COLORS,
  TITLE,
  SETS,
  STATUS,
  TIMER,
  MINUS_BUTTON,
  PLUS_BUTTON,
  DONE_BUTTON,
  RESET_BUTTON,
} from './index.style'

const vibrator = new Vibrator()

Page({
  state: {
    workout: createWorkoutState(),
    intervalId: null,
    ui: {},
  },

  build() {
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

    this.state.ui.minus = createWidget(widget.BUTTON, {
      ...MINUS_BUTTON,
      click_func: () => this.changeRest(-15),
    })
    this.state.ui.plus = createWidget(widget.BUTTON, {
      ...PLUS_BUTTON,
      click_func: () => this.changeRest(15),
    })
    this.state.ui.done = createWidget(widget.BUTTON, {
      ...DONE_BUTTON,
      click_func: () => this.logSet(),
    })
    this.state.ui.reset = createWidget(widget.BUTTON, {
      ...RESET_BUTTON,
      click_func: () => this.reset(),
    })

    this.render()
    this.state.intervalId = setInterval(() => this.onSecond(), 1000)
  },

  onSecond() {
    const previous = this.state.workout
    const next = tickRest(previous)
    if (next === previous) return

    this.state.workout = next
    if (previous.phase === 'rest' && next.phase === 'ready') {
      vibrator.start({ mode: VIBRATOR_SCENE_STRONG_REMINDER })
    }
    this.render()
  },

  logSet() {
    if (this.state.workout.phase === 'rest' || this.state.workout.phase === 'complete') return

    this.state.workout = completeSet(this.state.workout)
    vibrator.start({ mode: VIBRATOR_SCENE_SHORT_STRONG })
    this.render()
  },

  changeRest(seconds) {
    this.state.workout = adjustRest(this.state.workout, seconds)
    if (this.state.workout.remainingSeconds === 0 && this.state.workout.phase === 'rest') {
      this.state.workout = tickRest({ ...this.state.workout, remainingSeconds: 1 })
      vibrator.start({ mode: VIBRATOR_SCENE_STRONG_REMINDER })
    }
    this.render()
  },

  reset() {
    this.state.workout = resetWorkout(this.state.workout)
    this.render()
  },

  render() {
    const state = this.state.workout
    const isResting = state.phase === 'rest'
    const isComplete = state.phase === 'complete'
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

    this.state.ui.minus.setProperty(prop.VISIBLE, isResting)
    this.state.ui.plus.setProperty(prop.VISIBLE, isResting)
    this.state.ui.done.setProperty(prop.VISIBLE, !isResting && !isComplete)
  },

  onDestroy() {
    if (this.state.intervalId !== null) clearInterval(this.state.intervalId)
  },
})
