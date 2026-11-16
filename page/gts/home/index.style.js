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

export const LICENSE_TITLE = {
  x: 24,
  y: 120,
  w: 342,
  h: 54,
  text: 'VERIFYING LICENSE',
  color: COLORS.primary,
  text_size: 28,
  ...CENTERED,
}

export const LICENSE_MESSAGE = {
  x: 40,
  y: 190,
  w: 310,
  h: 110,
  text: 'KEEP YOUR PHONE NEARBY',
  color: COLORS.text,
  text_size: 22,
  text_style: text_style.WRAP,
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
  x: 10,
  y: 372,
  w: 82,
  h: 52,
  text: 'RESET',
  text_size: 15,
  color: COLORS.muted,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const HISTORY_BUTTON = {
  x: 106,
  y: 372,
  w: 82,
  h: 52,
  text: 'HISTORY',
  text_size: 16,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const MUSIC_BUTTON = {
  x: 202,
  y: 372,
  w: 82,
  h: 52,
  text: 'MUSIC',
  text_size: 15,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const SETTINGS_BUTTON = {
  x: 298,
  y: 372,
  w: 82,
  h: 52,
  text: 'SETTINGS',
  text_size: 14,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const SETTINGS_SETS_VALUE = {
  x: 24,
  y: 54,
  w: 342,
  h: 50,
  text: 'SETS 4',
  color: COLORS.text,
  text_size: 36,
  ...CENTERED,
}

export const SETTINGS_SETS_MINUS = {
  x: 40,
  y: 112,
  w: 140,
  h: 52,
  text: '-1 SET',
  text_size: 21,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const SETTINGS_SETS_PLUS = {
  ...SETTINGS_SETS_MINUS,
  x: 210,
  text: '+1 SET',
}

export const SETTINGS_VALUE = {
  x: 24,
  y: 192,
  w: 342,
  h: 50,
  text: 'REST 01:00',
  color: COLORS.text,
  text_size: 34,
  ...CENTERED,
}

export const SETTINGS_MINUS = {
  x: 40,
  y: 252,
  w: 140,
  h: 52,
  text: '-15 SEC',
  text_size: 21,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const SETTINGS_PLUS = {
  ...SETTINGS_MINUS,
  x: 210,
  text: '+15 SEC',
}

export const SETTINGS_SAVE = {
  x: 50,
  y: 352,
  w: 290,
  h: 66,
  text: 'DONE',
  text_size: 27,
  color: COLORS.background,
  normal_color: COLORS.primary,
  press_color: COLORS.primaryPressed,
  radius: 22,
}

export const HISTORY_TITLE = {
  x: 24,
  y: 58,
  w: 342,
  h: 46,
  text: 'HISTORY',
  color: COLORS.primary,
  text_size: 30,
  ...CENTERED,
}

export const HISTORY_ROW = {
  x: 24,
  y: 104,
  w: 342,
  h: 46,
  text: '',
  color: COLORS.text,
  text_size: 19,
  align_h: align.LEFT,
  align_v: align.CENTER_V,
}

export const HISTORY_PREV = {
  x: 10,
  y: 378,
  w: 82,
  h: 52,
  text: 'PREV',
  text_size: 16,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const HISTORY_NEXT = {
  ...HISTORY_PREV,
  x: 106,
  text: 'NEXT',
}

export const HISTORY_EDIT = {
  x: 202,
  y: 378,
  w: 82,
  h: 52,
  text: 'EDIT',
  text_size: 16,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const HISTORY_BACK = {
  x: 298,
  y: 378,
  w: 82,
  h: 52,
  text: 'BACK',
  text_size: 16,
  color: COLORS.background,
  normal_color: COLORS.primary,
  press_color: COLORS.primaryPressed,
  radius: 18,
}

export const HISTORY_EDIT_TITLE = {
  x: 24,
  y: 52,
  w: 342,
  h: 44,
  text: 'EDIT HISTORY',
  color: COLORS.primary,
  text_size: 29,
  ...CENTERED,
}

export const HISTORY_EDIT_ROW = {
  x: 20,
  y: 100,
  w: 278,
  h: 46,
  text: '',
  color: COLORS.text,
  text_size: 17,
  align_h: align.LEFT,
  align_v: align.CENTER_V,
}

export const HISTORY_DELETE = {
  x: 310,
  y: 104,
  w: 60,
  h: 38,
  text: 'X',
  text_size: 19,
  color: COLORS.text,
  normal_color: 0x6e2424,
  press_color: 0x9b3434,
  radius: 16,
}

export const HISTORY_ADD = {
  ...HISTORY_EDIT,
  text: 'ADD',
  color: COLORS.background,
  normal_color: COLORS.primary,
  press_color: COLORS.primaryPressed,
}

export const HISTORY_EDIT_BACK = {
  ...HISTORY_BACK,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
}

export const DATE_TITLE = {
  x: 24,
  y: 58,
  w: 342,
  h: 44,
  text: 'WORKOUT DATE',
  color: COLORS.primary,
  text_size: 29,
  ...CENTERED,
}

export const DATE_VALUE = {
  x: 24,
  y: 120,
  w: 342,
  h: 72,
  text: '',
  color: COLORS.text,
  text_size: 36,
  ...CENTERED,
}

export const DATE_MINUS = {
  x: 35,
  y: 220,
  w: 150,
  h: 60,
  text: '- DAY',
  text_size: 23,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 20,
}

export const DATE_PLUS = {
  x: 205,
  y: 220,
  w: 150,
  h: 60,
  text: '+ DAY',
  text_size: 23,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 20,
}

export const DATE_NEXT = {
  x: 35,
  y: 306,
  w: 320,
  h: 58,
  text: 'SELECT BODY PART',
  text_size: 23,
  color: COLORS.background,
  normal_color: COLORS.primary,
  press_color: COLORS.primaryPressed,
  radius: 20,
}

export const DATE_CANCEL = {
  x: 90,
  y: 380,
  w: 210,
  h: 48,
  text: 'CANCEL',
  text_size: 20,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const BODY_PART_TITLE = {
  x: 20,
  y: 48,
  w: 350,
  h: 46,
  text: 'BODY PART',
  color: COLORS.primary,
  text_size: 24,
  ...CENTERED,
}

export const BODY_PART_BUTTON = {
  x: 18,
  y: 102,
  w: 170,
  h: 56,
  text: '',
  text_size: 20,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 19,
}

export const BODY_PART_OTHER = {
  ...BODY_PART_BUTTON,
  x: 18,
  y: 294,
  w: 354,
  h: 56,
}

export const BODY_PART_BACK = {
  x: 90,
  y: 370,
  w: 210,
  h: 50,
  text: 'BACK',
  text_size: 20,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}