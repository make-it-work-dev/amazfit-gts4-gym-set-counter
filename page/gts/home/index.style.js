import { align, text_style } from '@zos/ui'

export const COLORS = {
  background: 0x000000,
  primary: 0x74e6a7,
  primaryPressed: 0x4ebf7e,
  text: 0xffffff,
  muted: 0x9aa0a6,
  panel: 0x202124,
  panelPressed: 0x34363a,
}

const CENTERED = {
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
}

export const TITLE = {
  x: 24,
  y: 18,
  w: 342,
  h: 38,
  text: 'GYM SETS',
  color: COLORS.muted,
  text_size: 24,
  ...CENTERED,
}

export const SETS = {
  x: 20,
  y: 54,
  w: 350,
  h: 92,
  text: '0 / 4',
  color: COLORS.text,
  text_size: 72,
  ...CENTERED,
}

export const STATUS = {
  x: 24,
  y: 143,
  w: 342,
  h: 42,
  text: 'READY FOR SET 1',
  color: COLORS.primary,
  text_size: 25,
  text_style: text_style.WRAP,
  ...CENTERED,
}

export const TIMER = {
  x: 24,
  y: 184,
  w: 342,
  h: 72,
  text: '01:00',
  color: COLORS.text,
  text_size: 58,
  ...CENTERED,
}

export const DONE_BUTTON = {
  x: 34,
  y: 274,
  w: 322,
  h: 72,
  text: 'SET DONE',
  text_size: 30,
  color: COLORS.background,
  normal_color: COLORS.primary,
  press_color: COLORS.primaryPressed,
  radius: 24,
}

export const RESET_BUTTON = {
  x: 34,
  y: 372,
  w: 150,
  h: 52,
  text: 'RESET',
  text_size: 19,
  color: COLORS.muted,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const SETTINGS_BUTTON = {
  x: 206,
  y: 372,
  w: 150,
  h: 52,
  text: 'SETTINGS',
  text_size: 19,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const SETTINGS_TITLE = {
  x: 24,
  y: 35,
  w: 342,
  h: 48,
  text: 'REST SETTINGS',
  color: COLORS.primary,
  text_size: 30,
  ...CENTERED,
}

export const SETTINGS_LABEL = {
  x: 24,
  y: 100,
  w: 342,
  h: 40,
  text: 'DEFAULT REST TIME',
  color: COLORS.muted,
  text_size: 21,
  ...CENTERED,
}

export const SETTINGS_VALUE = {
  x: 24,
  y: 145,
  w: 342,
  h: 82,
  text: '01:00',
  color: COLORS.text,
  text_size: 62,
  ...CENTERED,
}

export const SETTINGS_MINUS = {
  x: 40,
  y: 248,
  w: 140,
  h: 62,
  text: '-15 SEC',
  text_size: 22,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 20,
}

export const SETTINGS_PLUS = {
  x: 210,
  y: 248,
  w: 140,
  h: 62,
  text: '+15 SEC',
  text_size: 22,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 20,
}

export const SETTINGS_SAVE = {
  x: 50,
  y: 350,
  w: 290,
  h: 68,
  text: 'DONE',
  text_size: 27,
  color: COLORS.background,
  normal_color: COLORS.primary,
  press_color: COLORS.primaryPressed,
  radius: 22,
}
