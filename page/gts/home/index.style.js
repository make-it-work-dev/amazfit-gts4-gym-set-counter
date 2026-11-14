import { align, text_style } from '@zos/ui'

export const COLORS = {
  background: 0x000000,
  primary: 0x74e6a7,
  primaryPressed: 0x4ebf7e,
  text: 0xffffff,
  muted: 0x9aa0a6,
  panel: 0x202124,
  panelPressed: 0x34363a,
  danger: 0xff6b6b,
}

export const TITLE = {
  x: 24,
  y: 18,
  w: 342,
  h: 38,
  text: 'GYM SETS',
  color: COLORS.muted,
  text_size: 24,
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
}

export const SETS = {
  x: 20,
  y: 54,
  w: 350,
  h: 92,
  text: '0 / 4',
  color: COLORS.text,
  text_size: 72,
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
}

export const STATUS = {
  x: 24,
  y: 143,
  w: 342,
  h: 42,
  text: 'READY FOR SET 1',
  color: COLORS.primary,
  text_size: 25,
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
  text_style: text_style.WRAP,
}

export const TIMER = {
  x: 24,
  y: 184,
  w: 342,
  h: 72,
  text: '01:30',
  color: COLORS.text,
  text_size: 58,
  align_h: align.CENTER_H,
  align_v: align.CENTER_V,
}

export const MINUS_BUTTON = {
  x: 40,
  y: 264,
  w: 140,
  h: 54,
  text: '-15 SEC',
  text_size: 21,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const PLUS_BUTTON = {
  x: 210,
  y: 264,
  w: 140,
  h: 54,
  text: '+15 SEC',
  text_size: 21,
  color: COLORS.text,
  normal_color: COLORS.panel,
  press_color: COLORS.panelPressed,
  radius: 18,
}

export const DONE_BUTTON = {
  x: 34,
  y: 330,
  w: 322,
  h: 68,
  text: 'SET DONE',
  text_size: 30,
  color: COLORS.background,
  normal_color: COLORS.primary,
  press_color: COLORS.primaryPressed,
  radius: 24,
}

export const RESET_BUTTON = {
  x: 120,
  y: 406,
  w: 150,
  h: 36,
  text: 'RESET',
  text_size: 18,
  color: COLORS.muted,
  normal_color: COLORS.background,
  press_color: COLORS.panel,
  radius: 12,
}
