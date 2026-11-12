export const GRID_COLUMNS = 10
export const GRID_ROWS = 8
export const GRID_SIZE = GRID_COLUMNS * GRID_ROWS
export const TARGET_LENGTH = 4
export const INITIAL_SELECTION = 33
export const INITIAL_LIVES = 4
export const GAME_DURATION_MS = 60_000
export const SHIFT_INTERVAL_MS = 1_600
export const TIMER_UPDATE_INTERVAL_MS = 50
export const SUBMISSION_TOLERANCE_CELLS = 1

export type GamePhase = 'playing' | 'success' | 'failure'

export type HackConnectState = {
  values: string[]
  target: string[]
  targetStart: number
  selectionStart: number
  lives: number
  remainingMs: number
  phase: GamePhase
  flashVersion: number
  shiftVersion: number
  shiftElapsedMs: number
}

export type HackConnectAction =
  | { type: 'move'; delta: number }
  | { type: 'select'; index: number }
  | { type: 'advance'; elapsedMs: number }
  | { type: 'submit' }
  | { type: 'restart' }

function randomOctet(random: () => number) {
  return Math.floor(random() * 99).toString().padStart(2, '0')
}

function wrap(index: number) {
  return ((index % GRID_SIZE) + GRID_SIZE) % GRID_SIZE
}

export function createInitialState(random: () => number = Math.random): HackConnectState {
  const values = Array.from({ length: GRID_SIZE }, () => randomOctet(random))
  const target = Array.from({ length: TARGET_LENGTH }, () => randomOctet(random))
  const targetStart = Math.floor(random() * GRID_SIZE)

  for (let offset = 0; offset < TARGET_LENGTH; offset += 1) {
    values[wrap(targetStart + offset)] = target[offset]
  }

  return {
    values,
    target,
    targetStart,
    selectionStart: INITIAL_SELECTION,
    lives: INITIAL_LIVES,
    remainingMs: GAME_DURATION_MS,
    phase: 'playing',
    flashVersion: 0,
    shiftVersion: 0,
    shiftElapsedMs: 0,
  }
}

export function selectedIndexes(start: number) {
  return Array.from({ length: TARGET_LENGTH }, (_, offset) => wrap(start + offset))
}

export function isSelected(index: number, start: number) {
  return wrap(index - start) < TARGET_LENGTH
}

export function isSubmissionAccepted(selectionStart: number, targetStart: number) {
  const forwardDistance = wrap(selectionStart - targetStart)
  const shortestDistance = Math.min(forwardDistance, GRID_SIZE - forwardDistance)
  return shortestDistance <= SUBMISSION_TOLERANCE_CELLS
}

function rotateLeft(values: string[], count: number) {
  const offset = count % values.length
  if (offset === 0) return values
  return [...values.slice(offset), ...values.slice(0, offset)]
}

export function hackConnectReducer(
  state: HackConnectState,
  action: HackConnectAction,
): HackConnectState {
  if (action.type === 'restart') {
    return createInitialState()
  }

  if (state.phase !== 'playing') {
    return state
  }

  switch (action.type) {
    case 'move':
      return {
        ...state,
        selectionStart: wrap(state.selectionStart + action.delta),
      }
    case 'select':
      return { ...state, selectionStart: wrap(action.index) }
    case 'advance': {
      const activeElapsed = Math.min(state.remainingMs, Math.max(0, action.elapsedMs))
      const remainingMs = Math.max(0, state.remainingMs - activeElapsed)
      const totalShiftElapsed = state.shiftElapsedMs + activeElapsed
      const shiftCount = Math.floor(totalShiftElapsed / SHIFT_INTERVAL_MS)
      return {
        ...state,
        values: shiftCount > 0 ? rotateLeft(state.values, shiftCount) : state.values,
        targetStart: wrap(state.targetStart - shiftCount),
        shiftVersion: state.shiftVersion + shiftCount,
        shiftElapsedMs: totalShiftElapsed % SHIFT_INTERVAL_MS,
        remainingMs,
        phase: remainingMs === 0 ? 'failure' : state.phase,
      }
    }
    case 'submit': {
      if (isSubmissionAccepted(state.selectionStart, state.targetStart)) {
        return { ...state, phase: 'success' }
      }

      const lives = state.lives - 1
      return {
        ...state,
        lives,
        phase: lives === 0 ? 'failure' : 'playing',
        flashVersion: state.flashVersion + 1,
      }
    }
  }
}

export function formatCountdown(milliseconds: number) {
  const clamped = Math.max(0, Math.floor(milliseconds))
  const minutes = Math.floor(clamped / 60_000)
  const seconds = Math.floor((clamped % 60_000) / 1_000)
  const millis = clamped % 1_000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(millis).padStart(3, '0')}`
}
