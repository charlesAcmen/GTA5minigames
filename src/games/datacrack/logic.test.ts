import { describe, expect, it } from 'vitest'
import {
  COLUMN_COUNT,
  COLUMN_PHASE_STEP,
  HIT_TOLERANCE_PX,
  MOTION_AMPLITUDE_PX,
  createInitialState,
  dataCrackReducer,
  getColumnGapOffsetPx,
  getColumnPhase,
  getPeriodMs,
} from './logic'

function alignedState(lockedCount: number) {
  return {
    ...createInitialState(),
    lockedCount,
    sharedPhase: ((-lockedCount * COLUMN_PHASE_STEP) % 1 + 1) % 1,
  }
}

function phaseForOffset(columnIndex: number, offsetPx: number) {
  const angle = Math.asin(offsetPx / MOTION_AMPLITUDE_PX)
  return ((angle / (Math.PI * 2) - columnIndex * COLUMN_PHASE_STEP) % 1 + 1) % 1
}

describe('Data Crack motion', () => {
  it('keeps an equal phase interval between all eight columns', () => {
    const state = createInitialState()
    for (let index = 1; index < COLUMN_COUNT; index += 1) {
      const previous = getColumnPhase(state.sharedPhase, index - 1)
      const current = getColumnPhase(state.sharedPhase, index)
      expect((current - previous + 1) % 1).toBeCloseTo(COLUMN_PHASE_STEP)
    }
  })

  it('advances one shared phase and speeds up after each lock', () => {
    const initial = createInitialState()
    const advanced = dataCrackReducer(initial, { type: 'advance', elapsedMs: 100 })
    expect(advanced.sharedPhase).toBeCloseTo(
      initial.sharedPhase + 100 / getPeriodMs(0),
    )
    expect(getPeriodMs(1)).toBeLessThan(getPeriodMs(0))
    expect(getPeriodMs(7)).toBeGreaterThan(1_300)
    expect(getPeriodMs(7)).toBeLessThan(1_350)
  })
})

describe('Data Crack submissions', () => {
  it('accepts the tolerance edge, preserves shared phase, and snaps the lock', () => {
    const state = {
      ...createInitialState(),
      sharedPhase: phaseForOffset(0, HIT_TOLERANCE_PX),
    }
    const next = dataCrackReducer(state, { type: 'submit' })
    expect(next.lockedCount).toBe(1)
    expect(next.sharedPhase).toBe(state.sharedPhase)
    expect(getColumnGapOffsetPx(next, 0)).toBe(0)
  })

  it('rejects positions outside the tolerance', () => {
    const state = {
      ...createInitialState(),
      sharedPhase: phaseForOffset(0, HIT_TOLERANCE_PX + 0.1),
    }
    const next = dataCrackReducer(state, { type: 'submit' })
    expect(next.lockedCount).toBe(0)
    expect(next.wrongVersion).toBe(1)
  })

  it('unlocks the previous column after a miss', () => {
    const state = {
      ...createInitialState(),
      lockedCount: 3,
      sharedPhase: 0.25,
    }
    const next = dataCrackReducer(state, { type: 'submit' })
    expect(next.lockedCount).toBe(2)
    expect(next.wrongVersion).toBe(1)
  })

  it('keeps the first column active after an initial miss', () => {
    const next = dataCrackReducer(createInitialState(), { type: 'submit' })
    expect(next.lockedCount).toBe(0)
    expect(next.wrongVersion).toBe(1)
  })

  it('holds the final aligned frame before showing success', () => {
    const hit = dataCrackReducer(alignedState(COLUMN_COUNT - 1), { type: 'submit' })
    expect(hit.phase).toBe('success-hold')
    expect(hit.lockedCount).toBe(COLUMN_COUNT)
    expect(Array.from({ length: COLUMN_COUNT }, (_, index) => (
      getColumnGapOffsetPx(hit, index)
    ))).toEqual(Array(COLUMN_COUNT).fill(0))

    const holding = dataCrackReducer(hit, { type: 'advance', elapsedMs: 649 })
    expect(holding.phase).toBe('success-hold')
    const completed = dataCrackReducer(holding, { type: 'advance', elapsedMs: 1 })
    expect(completed.phase).toBe('success')
  })
})
