export const COLUMN_COUNT = 8
export const INITIAL_SHARED_PHASE = 0.25
export const COLUMN_PHASE_STEP = 1 / 16
export const INITIAL_PERIOD_MS = 2_200
export const PERIOD_MULTIPLIER = 0.93
export const MOTION_AMPLITUDE_PX = 85
export const HIT_TOLERANCE_PX = 17
export const COMPLETION_HOLD_MS = 650

export type DataCrackPhase = 'playing' | 'success-hold' | 'success'

export type DataCrackState = {
  phase: DataCrackPhase
  sharedPhase: number
  lockedCount: number
  completionHoldMs: number
  lockVersion: number
  wrongVersion: number
}

export type DataCrackAction =
  | { type: 'advance'; elapsedMs: number }
  | { type: 'submit' }

function wrapCycle(value: number) {
  return ((value % 1) + 1) % 1
}

export function getPeriodMs(lockedCount: number) {
  return INITIAL_PERIOD_MS * PERIOD_MULTIPLIER ** lockedCount
}

export function getColumnPhase(sharedPhase: number, columnIndex: number) {
  return wrapCycle(sharedPhase + columnIndex * COLUMN_PHASE_STEP)
}

export function getMovingGapOffsetPx(sharedPhase: number, columnIndex: number) {
  const phase = getColumnPhase(sharedPhase, columnIndex)
  return MOTION_AMPLITUDE_PX * Math.sin(phase * Math.PI * 2)
}

export function getColumnGapOffsetPx(state: DataCrackState, columnIndex: number) {
  if (columnIndex < state.lockedCount) return 0
  return getMovingGapOffsetPx(state.sharedPhase, columnIndex)
}

export function createInitialState(): DataCrackState {
  return {
    phase: 'playing',
    sharedPhase: INITIAL_SHARED_PHASE,
    lockedCount: 0,
    completionHoldMs: 0,
    lockVersion: 0,
    wrongVersion: 0,
  }
}

function submit(state: DataCrackState): DataCrackState {
  const activeColumn = state.lockedCount
  const gapOffset = getMovingGapOffsetPx(state.sharedPhase, activeColumn)

  if (Math.abs(gapOffset) > HIT_TOLERANCE_PX + 1e-9) {
    return {
      ...state,
      lockedCount: Math.max(0, state.lockedCount - 1),
      wrongVersion: state.wrongVersion + 1,
    }
  }

  const lockedCount = state.lockedCount + 1
  const completed = lockedCount === COLUMN_COUNT
  return {
    ...state,
    lockedCount,
    phase: completed ? 'success-hold' : 'playing',
    completionHoldMs: completed ? COMPLETION_HOLD_MS : 0,
    lockVersion: state.lockVersion + 1,
  }
}

export function dataCrackReducer(
  state: DataCrackState,
  action: DataCrackAction,
): DataCrackState {
  if (action.type === 'submit') {
    return state.phase === 'playing' ? submit(state) : state
  }

  const elapsedMs = Math.max(0, action.elapsedMs)
  if (state.phase === 'playing') {
    return {
      ...state,
      sharedPhase: wrapCycle(
        state.sharedPhase + elapsedMs / getPeriodMs(state.lockedCount),
      ),
    }
  }

  if (state.phase === 'success-hold') {
    const completionHoldMs = Math.max(0, state.completionHoldMs - elapsedMs)
    return {
      ...state,
      completionHoldMs,
      phase: completionHoldMs === 0 ? 'success' : 'success-hold',
    }
  }

  return state
}
