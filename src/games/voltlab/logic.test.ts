import { describe, expect, it } from 'vitest'
import { TIMING } from './designTokens'
import {
  SAMPLE_PUZZLE,
  createInitialState,
  expandPath,
  generatePuzzle,
  isSolved,
  resultFor,
  voltLabReducer,
} from './logic'
import type { Connection, Direction, GridPoint, VoltLabState } from './logic'

function route(state: VoltLabState, source: number, points: readonly GridPoint[]) {
  let next = voltLabReducer(state, { type: 'select-source', source })
  next = voltLabReducer(next, { type: 'begin' })
  for (const point of expandPath(points).slice(1)) next = voltLabReducer(next, { type: 'move-to', point })
  return voltLabReducer(next, { type: 'commit' })
}

const redTop = [{ col: 0, row: 4 }, { col: 5, row: 4 }, { col: 5, row: 0 }, { col: 12, row: 0 }]
const blueBottom = [{ col: 0, row: 8 }, { col: 12, row: 8 }]
const orangeMiddle = [{ col: 0, row: 0 }, { col: 6, row: 0 }, { col: 6, row: 4 }, { col: 12, row: 4 }]

describe('VOLTlab routing and scoring', () => {
  it('counts only committed links through 000 → 012 → 021 → 026', () => {
    let state = createInitialState(SAMPLE_PUZZLE, 'playing')
    state = voltLabReducer(state, { type: 'select-source', source: 1 })
    state = voltLabReducer(state, { type: 'begin' })
    state = voltLabReducer(state, { type: 'move', direction: 'right' })
    expect(resultFor(state.puzzle, state.connections)).toBe(0)
    state = voltLabReducer(state, { type: 'back' })
    state = voltLabReducer(state, { type: 'back' })
    state = route(state, 1, redTop)
    expect(resultFor(state.puzzle, state.connections)).toBe(12)
    state = route(state, 2, blueBottom)
    expect(resultFor(state.puzzle, state.connections)).toBe(21)
    state = route(state, 0, orangeMiddle)
    expect(resultFor(state.puzzle, state.connections)).toBe(26)
    expect(state.phase).toBe('playing')
  })

  it('undoes the latest link for rerouting and reaches 029', () => {
    let state = createInitialState(SAMPLE_PUZZLE, 'playing')
    state = route(route(route(state, 1, redTop), 2, blueBottom), 0, orangeMiddle)
    state = voltLabReducer(state, { type: 'back' })
    expect(state.editing?.source).toBe(0)
    state = voltLabReducer(state, { type: 'back' })
    while (state.editing) state = voltLabReducer(state, { type: 'back' })
    state = voltLabReducer(state, { type: 'back' })
    while (state.editing) state = voltLabReducer(state, { type: 'back' })
    state = voltLabReducer(state, { type: 'back' })
    while (state.editing) state = voltLabReducer(state, { type: 'back' })
    state = route(state, 0, orangeMiddle)
    state = route(state, 1, [{ col: 0, row: 4 }, { col: 4, row: 4 }, { col: 4, row: 8 }, { col: 12, row: 8 }])
    state = route(state, 2, [{ col: 0, row: 8 }, { col: 7, row: 8 }, { col: 7, row: 6 }, { col: 10, row: 6 }, { col: 10, row: 0 }, { col: 12, row: 0 }])
    expect(resultFor(state.puzzle, state.connections)).toBe(29)
    expect(state.phase).toBe('matched')
  })

  it('rejects occupied targets and truncates a path when it revisits a node', () => {
    let state = route(createInitialState(SAMPLE_PUZZLE, 'playing'), 1, redTop)
    state = voltLabReducer(state, { type: 'select-source', source: 0 })
    state = voltLabReducer(state, { type: 'begin' })
    const moves: Direction[] = ['right', 'right', 'down', 'left', 'up']
    for (const direction of moves) state = voltLabReducer(state, { type: 'move', direction })
    expect(state.editing?.path).toEqual([{ col: 0, row: 0 }, { col: 1, row: 0 }])
    for (const point of expandPath([{ col: 1, row: 0 }, { col: 12, row: 0 }]).slice(1)) {
      state = voltLabReducer(state, { type: 'move-to', point })
    }
    state = voltLabReducer(state, { type: 'commit' })
    expect(state.connections).toHaveLength(1)
    expect(state.editing?.source).toBe(0)
  })

  it('penalizes each unchanged complete wrong assignment only once', () => {
    let state = createInitialState(SAMPLE_PUZZLE, 'playing')
    state = route(route(route(state, 1, redTop), 2, blueBottom), 0, orangeMiddle)
    expect(state.remainingMs).toBe(TIMING.batteryMs - TIMING.invalidSumPenaltyMs)
    const unchanged = voltLabReducer(state, { type: 'commit' })
    expect(unchanged.remainingMs).toBe(state.remainingMs)
  })

  it('fails on battery depletion and locks both terminal states', () => {
    let failure = createInitialState(SAMPLE_PUZZLE, 'playing')
    failure = voltLabReducer(failure, { type: 'advance', elapsedMs: TIMING.batteryMs })
    expect(failure.phase).toBe('failure')
    expect(voltLabReducer(failure, { type: 'begin' })).toEqual(failure)

    const solvedConnections: Connection[] = [
      { source: 0, target: 1, path: [], order: 0 },
      { source: 1, target: 2, path: [], order: 1 },
      { source: 2, target: 0, path: [], order: 2 },
    ]
    expect(isSolved(SAMPLE_PUZZLE, solvedConnections)).toBe(true)
    const matched = { ...createInitialState(SAMPLE_PUZZLE, 'matched'), connections: solvedConnections }
    const success = voltLabReducer(matched, {
      type: 'advance',
      elapsedMs: TIMING.matchedHoldMs + TIMING.transitionMs,
    })
    expect(success.phase).toBe('success')
    expect(voltLabReducer(success, { type: 'back' })).toEqual(success)
  })
})

describe('VOLTlab puzzle generation', () => {
  it('builds solvable seeded puzzles, including repeated multiplier layouts', () => {
    let seed = 0x51f15e
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 0x100000000
    }
    let sawRepeatedMultiplier = false
    for (let index = 0; index < 500; index++) {
      const puzzle = generatePuzzle(random)
      expect(new Set(puzzle.inputs).size).toBe(3)
      expect(puzzle.inputs.every((value) => value >= 1 && value <= 9)).toBe(true)
      expect(puzzle.multipliers.every((value) => value === 1 || value === 2 || value === 10)).toBe(true)
      expect(new Set(puzzle.multipliers).size).toBeGreaterThan(1)
      if (new Set(puzzle.multipliers).size === 2) sawRepeatedMultiplier = true
      const connections = puzzle.solution.map((target, source) => ({
        source, target, path: [], order: source,
      }))
      expect(isSolved(puzzle, connections)).toBe(true)
    }
    expect(sawRepeatedMultiplier).toBe(true)
  })

  it('accepts every assignment whose sum matches the target', () => {
    const alternatives: Connection[] = [
      { source: 0, target: 2, path: [], order: 0 },
      { source: 1, target: 1, path: [], order: 1 },
      { source: 2, target: 0, path: [], order: 2 },
    ]
    expect(resultFor(SAMPLE_PUZZLE, alternatives)).toBe(29)
    expect(isSolved(SAMPLE_PUZZLE, alternatives)).toBe(true)
  })
})
