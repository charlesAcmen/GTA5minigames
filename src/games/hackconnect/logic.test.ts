import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../test/seededRandom'
import {
  GAME_DURATION_MS,
  GRID_SIZE,
  INITIAL_LIVES,
  SUBMISSION_TOLERANCE_CELLS,
  createInitialState,
  hackConnectReducer,
  isSubmissionAccepted,
} from './logic'

describe('HackConnect initialization', () => {
  it('is reproducible with a seeded random source', () => {
    const first = createInitialState(createSeededRandom(42))
    const second = createInitialState(createSeededRandom(42))
    expect(first).toEqual(second)
    expect(first.values).toHaveLength(GRID_SIZE)
    expect(first.lives).toBe(INITIAL_LIVES)
  })
})

describe('HackConnect submissions', () => {
  it('accepts the target and one neighboring cell on either side', () => {
    expect(SUBMISSION_TOLERANCE_CELLS).toBe(1)
    expect(isSubmissionAccepted(20, 20)).toBe(true)
    expect(isSubmissionAccepted(19, 20)).toBe(true)
    expect(isSubmissionAccepted(21, 20)).toBe(true)
    expect(isSubmissionAccepted(18, 20)).toBe(false)
    expect(isSubmissionAccepted(0, GRID_SIZE - 1)).toBe(true)
  })

  it('wins inside the tolerance and spends a life outside it', () => {
    const initial = { ...createInitialState(createSeededRandom(7)), targetStart: 20 }
    const success = hackConnectReducer(
      { ...initial, selectionStart: 21 },
      { type: 'submit' },
    )
    expect(success.phase).toBe('success')

    const miss = hackConnectReducer(
      { ...initial, selectionStart: 22 },
      { type: 'submit' },
    )
    expect(miss.lives).toBe(INITIAL_LIVES - 1)
    expect(miss.flashVersion).toBe(1)
  })

  it('fails when the countdown reaches zero', () => {
    const initial = createInitialState(createSeededRandom(9))
    const next = hackConnectReducer(initial, {
      type: 'advance',
      elapsedMs: GAME_DURATION_MS,
    })
    expect(next.remainingMs).toBe(0)
    expect(next.phase).toBe('failure')
  })
})
