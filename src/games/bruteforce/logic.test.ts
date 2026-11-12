import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../test/seededRandom'
import {
  GAME_DURATION_MS,
  HIT_CENTER_Y,
  LETTER_LINE_HEIGHT_PX,
  LOCKED_TARGET_TOP,
  ROW_STEP_PX,
  createInitialState,
  bruteForceReducer,
  getLetterTop,
} from './logic'

describe('BruteForce initialization', () => {
  it('is reproducible with a seeded random source', () => {
    const first = createInitialState(createSeededRandom(123))
    const second = createInitialState(createSeededRandom(123))
    expect(first).toEqual(second)
    expect(first.columns).toHaveLength(first.password.length)
  })
})

describe('BruteForce submissions', () => {
  it('locks a target centered in the hit area', () => {
    const initial = createInitialState(createSeededRandom(3))
    const targetIndex = initial.columns[0].targetIndex
    const alignedOffset = LOCKED_TARGET_TOP + ROW_STEP_PX - targetIndex * ROW_STEP_PX
    const state = {
      ...initial,
      columns: initial.columns.map((column, index) => index === 0
        ? { ...column, offsetPx: alignedOffset }
        : column),
    }

    expect(getLetterTop(state.columns[0], targetIndex) + LETTER_LINE_HEIGHT_PX / 2)
      .toBe(HIT_CENTER_Y)
    const next = bruteForceReducer(state, { type: 'submit', column: 0 })
    expect(next.columns[0].locked).toBe(true)
    expect(next.lockVersion).toBe(1)
  })

  it('spends a life and regenerates columns after a miss', () => {
    const initial = createInitialState(createSeededRandom(4))
    const missed = {
      ...initial,
      columns: initial.columns.map((column, index) => index === 0
        ? { ...column, offsetPx: 0, targetIndex: 0 }
        : column),
    }
    const next = bruteForceReducer(missed, { type: 'submit', column: 0 })
    expect(next.lives).toBe(initial.lives - 1)
    expect(next.flashVersion).toBe(1)
  })

  it('fails when the countdown expires', () => {
    const initial = createInitialState(createSeededRandom(5))
    const next = bruteForceReducer(initial, {
      type: 'advance',
      elapsedMs: GAME_DURATION_MS,
    })
    expect(next.remainingMs).toBe(0)
    expect(next.phase).toBe('failure')
  })
})
