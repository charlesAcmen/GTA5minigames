export const VIEWBOX = { width: 1920, height: 1080 } as const

export const GRID_X = [585, 644, 704, 763, 822, 881, 940, 1000, 1059, 1118, 1178, 1237, 1297] as const
export const GRID_Y = [306, 365, 423, 482, 540, 598, 656, 715, 773] as const
export const SOURCE_ROWS = [0, 4, 8] as const
export const TARGET_ROWS = [0, 4, 8] as const

export const COLORS = {
  background: '#030405',
  gridMinor: '#101617',
  gridMajor: '#1b2022',
  gridNode: '#16191a',
  frame: '#858b89',
  inactive: '#b9bdbb',
  text: '#e4e7e6',
  ledWhite: '#eaf0ed',
  ledRed: '#e06460',
  ledGreen: '#58d19c',
  overTarget: '#ed6861',
  orange: '#eea51e',
  red: '#a9291c',
  blue: '#19238c',
  brandBlue: '#2299d2',
} as const

export const SOURCE_COLORS = [COLORS.orange, COLORS.red, COLORS.blue] as const

export const TIMING = {
  batteryMs: 120_000,
  invalidSumPenaltyMs: 5_000,
  exitHoldMs: 1_000,
  introMs: 1_800,
  matchedHoldMs: 800,
  transitionMs: 600,
} as const

export const STROKES = {
  circuit: 3,
  wire: 4,
  wireNode: 18,
} as const

