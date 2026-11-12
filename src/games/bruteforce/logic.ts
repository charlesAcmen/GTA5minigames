export const COLUMN_COUNT = 8
export const BUFFERED_ROW_COUNT = 8
export const VISIBLE_ROW_COUNT = 7
export const ROW_STEP_PX = 34
export const CYCLE_HEIGHT_PX = BUFFERED_ROW_COUNT * ROW_STEP_PX
export const GAME_DURATION_MS = 60_000
export const TIMER_DISPLAY_STEP_MS = 50
export const INITIAL_LIVES = 4
export const HIT_CENTER_Y = 122
export const HIT_TOLERANCE_PX = 10
export const LETTER_LINE_HEIGHT_PX = 46
export const LOCKED_TARGET_TOP = HIT_CENTER_Y - LETTER_LINE_HEIGHT_PX / 2

export const GTA_PASSWORDS = [
  'DEADLOCK',
  'BACKDOOR',
  'BLUEBOOK',
  'CREAMPIE',
  'DECIPHER',
  'DYNAMITE',
  'JUNKYARD',
  'MORPHEUS',
  'SENTINEL',
  'WORMSIGN',
] as const

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const MIN_COLUMN_SPEED = 75
const MAX_COLUMN_SPEED = 285
const MAX_ADJACENT_SPEED_DELTA = 60
const SPEED_JITTER = 22

export type BruteForcePhase = 'playing' | 'success' | 'failure'

export type BruteForceColumn = {
  letters: string[]
  targetIndex: number
  offsetPx: number
  speedPxPerSecond: number
  locked: boolean
}

export type BruteForceState = {
  password: string
  columns: BruteForceColumn[]
  selectedColumn: number
  lives: number
  remainingMs: number
  phase: BruteForcePhase
  flashVersion: number
  lockVersion: number
}

export type BruteForceAction =
  | { type: 'advance'; elapsedMs: number }
  | { type: 'move-column'; direction: 1 | -1 }
  | { type: 'select-column'; column: number }
  | { type: 'submit'; column?: number }
  | { type: 'restart' }

function wrap(value: number, size: number) {
  return ((value % size) + size) % size
}

function randomLetter(exclude: string, random: () => number) {
  let letter = exclude
  while (letter === exclude) {
    letter = ALPHABET[Math.floor(random() * ALPHABET.length)]
  }
  return letter
}

function createColumn(
  targetLetter: string,
  speedPxPerSecond: number,
  random: () => number,
): BruteForceColumn {
  const targetIndex = Math.floor(random() * BUFFERED_ROW_COUNT)
  const letters = Array.from(
    { length: BUFFERED_ROW_COUNT },
    () => randomLetter(targetLetter, random),
  )
  letters[targetIndex] = targetLetter

  return {
    letters,
    targetIndex,
    offsetPx: random() * CYCLE_HEIGHT_PX,
    speedPxPerSecond,
    locked: false,
  }
}

function createColumnSpeeds(count: number, random: () => number) {
  const ascending = random() >= 0.5
  const start = ascending ? MIN_COLUMN_SPEED : MAX_COLUMN_SPEED
  const end = ascending ? MAX_COLUMN_SPEED : MIN_COLUMN_SPEED
  const speeds = [start]

  for (let index = 1; index < count - 1; index += 1) {
    const progress = index / (count - 1)
    const baseline = start + (end - start) * progress
    const jitter = (random() * 2 - 1) * SPEED_JITTER
    const previous = speeds[index - 1]
    speeds.push(Math.max(
      previous - MAX_ADJACENT_SPEED_DELTA,
      Math.min(previous + MAX_ADJACENT_SPEED_DELTA, baseline + jitter),
    ))
  }

  speeds.push(end)
  return speeds
}

function createColumns(password: string, random: () => number = Math.random) {
  const speeds = createColumnSpeeds(password.length, random)
  return password.split('').map((letter, index) => createColumn(letter, speeds[index], random))
}

export function createInitialState(random: () => number = Math.random): BruteForceState {
  const password = GTA_PASSWORDS[Math.floor(random() * GTA_PASSWORDS.length)]
  return {
    password,
    columns: createColumns(password, random),
    selectedColumn: 0,
    lives: INITIAL_LIVES,
    remainingMs: GAME_DURATION_MS,
    phase: 'playing',
    flashVersion: 0,
    lockVersion: 0,
  }
}

export function getLetterTop(column: BruteForceColumn, letterIndex: number) {
  return wrap(letterIndex * ROW_STEP_PX + column.offsetPx, CYCLE_HEIGHT_PX) - ROW_STEP_PX
}

function targetIsInHitArea(column: BruteForceColumn) {
  const targetCenter = getLetterTop(column, column.targetIndex) + LETTER_LINE_HEIGHT_PX / 2
  return Math.abs(targetCenter - HIT_CENTER_Y) <= HIT_TOLERANCE_PX
}

function findNextUnlocked(columns: BruteForceColumn[], start: number, direction: 1 | -1) {
  for (let distance = 1; distance <= columns.length; distance += 1) {
    const candidate = wrap(start + distance * direction, columns.length)
    if (!columns[candidate].locked) return candidate
  }
  return start
}

function submitColumn(state: BruteForceState, requestedColumn?: number): BruteForceState {
  const columnIndex = requestedColumn ?? state.selectedColumn
  const column = state.columns[columnIndex]
  if (!column || column.locked) return state

  if (!targetIsInHitArea(column)) {
    const lives = state.lives - 1
    return {
      ...state,
      columns: lives > 0 ? createColumns(state.password) : state.columns,
      selectedColumn: 0,
      lives,
      phase: lives === 0 ? 'failure' : 'playing',
      flashVersion: state.flashVersion + 1,
    }
  }

  const columns = state.columns.map((item, index) => {
    if (index !== columnIndex) return item
    return {
      ...item,
      locked: true,
      offsetPx: wrap(
        LOCKED_TARGET_TOP + ROW_STEP_PX - item.targetIndex * ROW_STEP_PX,
        CYCLE_HEIGHT_PX,
      ),
    }
  })
  const won = columns.every((item) => item.locked)

  return {
    ...state,
    columns,
    selectedColumn: won ? columnIndex : findNextUnlocked(columns, columnIndex, 1),
    phase: won ? 'success' : 'playing',
    lockVersion: state.lockVersion + 1,
  }
}

export function bruteForceReducer(
  state: BruteForceState,
  action: BruteForceAction,
): BruteForceState {
  if (action.type === 'restart') return createInitialState()
  if (state.phase !== 'playing') return state

  switch (action.type) {
    case 'advance': {
      const activeElapsed = Math.min(state.remainingMs, Math.max(0, action.elapsedMs))
      const remainingMs = Math.max(0, state.remainingMs - activeElapsed)
      return {
        ...state,
        columns: state.columns.map((column) => column.locked ? column : {
          ...column,
          offsetPx: wrap(
            column.offsetPx + column.speedPxPerSecond * activeElapsed / 1_000,
            CYCLE_HEIGHT_PX,
          ),
        }),
        remainingMs,
        phase: remainingMs === 0 ? 'failure' : state.phase,
      }
    }
    case 'move-column':
      return {
        ...state,
        selectedColumn: findNextUnlocked(state.columns, state.selectedColumn, action.direction),
      }
    case 'select-column':
      return state.columns[action.column]?.locked
        ? state
        : { ...state, selectedColumn: action.column }
    case 'submit':
      return submitColumn(state, action.column)
  }
}

export function formatCountdown(milliseconds: number) {
  const clamped = Math.max(
    0,
    Math.ceil(milliseconds / TIMER_DISPLAY_STEP_MS) * TIMER_DISPLAY_STEP_MS,
  )
  const minutes = Math.floor(clamped / 60_000)
  const seconds = Math.floor((clamped % 60_000) / 1_000)
  const millis = clamped % 1_000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(millis).padStart(3, '0')}`
}
