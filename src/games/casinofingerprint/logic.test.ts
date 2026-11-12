import { describe, expect, it } from 'vitest'
import { ATTEMPTS, BOOT_MS, CONNECTION_MS, FEEDBACK_MS, PROCESS_MS, SCRAMBLE_MS,
  createBoard, createInitialState, fingerprintReducer as reduce, formatTime } from './logic'
import type { State } from './logic'
import { SUCCESS_EXIT_MS, successTimeline } from './successTimeline'

function playing(seed = 123) { return reduce(createInitialState(seed), { type: 'advance', elapsedMs: BOOT_MS }) }
function selectAnswer(state: State, correct = true) {
  const pieces = state.pieces.filter((p) => correct ? p.print === state.sequence[state.round] : p.print !== state.sequence[state.round])
  return pieces.reduce((s, p) => reduce(s, { type: 'select', index: s.pieces.indexOf(p) }), state)
}
function check(state: State) {
  return reduce(reduce(state, { type: 'submit' }), { type: 'advance', elapsedMs: PROCESS_MS + FEEDBACK_MS })
}

describe('casino fingerprint puzzles', () => {
  it('finishes success playback without spending time or accepting puzzle input', () => {
    const success = check(selectAnswer(check(selectAnswer(playing()))))
    expect(success.phase).toBe('success')
    const next = reduce(success, { type: 'advance', elapsedMs: SUCCESS_EXIT_MS + 1000 })
    expect(next.phaseMs).toBe(SUCCESS_EXIT_MS)
    expect(next.remainingMs).toBe(success.remainingMs)
    expect(next.scrambleMs).toBe(success.scrambleMs)
    expect(reduce(next, { type: 'select', index: 0 })).toBe(next)
    expect(successTimeline(0).stage).toBe('black')
    expect(successTimeline(SUCCESS_EXIT_MS).stage).toBe('black')
  })
  it('always offers exactly four correct and four distinct decoys for every print', () => {
    for (let seed = 0; seed < 100; seed++) for (let print = 0; print < 4; print++) {
      const { pieces } = createBoard(print, seed)
      expect(pieces).toHaveLength(8)
      expect(new Set(pieces.map((p) => p.id)).size).toBe(8)
      expect(pieces.filter((p) => p.print === print)).toHaveLength(4)
      expect(pieces.filter((p) => p.print !== print).map((p) => p.print)).toEqual([-1, -1, -1, -1])
    }
  })
  it('caps selection at four, allows deselection and requires four before checking', () => {
    let state = playing()
    expect(reduce(state, { type: 'submit' })).toBe(state)
    for (let i = 0; i < 5; i++) state = reduce(state, { type: 'select', index: i })
    expect(state.selected).toHaveLength(4)
    state = reduce(state, { type: 'select', index: 1 })
    expect(state.selected).toHaveLength(3)
    expect(reduce(state, { type: 'submit' })).toBe(state)
  })
  it('requires both rounds and preserves the shared connection clock and attempts', () => {
    let state = playing()
    expect(state.remainingMs).toBe(CONNECTION_MS)
    expect(new Set(state.sequence).size).toBe(2)
    state = check(selectAnswer(state))
    expect(state.phase).toBe('playing')
    expect(state.round).toBe(1)
    expect(state.selected).toHaveLength(0)
    expect(state.remainingMs).toBe(CONNECTION_MS - PROCESS_MS - FEEDBACK_MS)
    state = check(selectAnswer(state))
    expect(state.phase).toBe('success')
    expect(state.attempts).toBe(ATTEMPTS)
    expect(reduce(state, { type: 'advance', elapsedMs: CONNECTION_MS })).toEqual({ ...state, phaseMs: SUCCESS_EXIT_MS })
  })
  it('deducts one attempt per wrong submission and fails at zero', () => {
    let state = playing()
    for (let i = 0; i < ATTEMPTS; i++) {
      state = check(selectAnswer(state, false))
      expect(state.attempts).toBe(ATTEMPTS - i - 1)
      expect(state.selected).toHaveLength(0)
    }
    expect(state.phase).toBe('failure')
    expect(state.round).toBe(0)
  })
  it('locks input during processing and does not charge repeated submissions', () => {
    const state = reduce(selectAnswer(playing()), { type: 'submit' })
    expect(reduce(state, { type: 'submit' })).toBe(state)
    expect(reduce(state, { type: 'select', index: 0 })).toBe(state)
    expect(reduce(state, { type: 'move', direction: 'down' })).toBe(state)
  })
  it('scrambles after inactivity without changing the puzzle or costing an attempt', () => {
    const state = selectAnswer(playing())
    const next = reduce(state, { type: 'advance', elapsedMs: SCRAMBLE_MS + 600 })
    expect(next.phase).toBe('playing')
    expect(next.selected).toHaveLength(0)
    expect(next.pieces.map((p) => p.id).sort()).toEqual(state.pieces.map((p) => p.id).sort())
    expect(next.pieces).not.toEqual(state.pieces)
    expect(next.attempts).toBe(ATTEMPTS)
    expect(next.scrambleMs).toBe(SCRAMBLE_MS)
  })
  it('consumes long frames across boot and scramble boundaries, failing at timeout', () => {
    const next = reduce(createInitialState(3), { type: 'advance', elapsedMs: BOOT_MS + CONNECTION_MS + 500 })
    expect(next.phase).toBe('failure')
    expect(next.remainingMs).toBe(0)
    const processing = reduce(selectAnswer(playing()), { type: 'submit' })
    expect(reduce({ ...processing, remainingMs: 50 }, { type: 'advance', elapsedMs: 100 }).phase).toBe('failure')
  })
  it('wraps keyboard navigation on the two-column grid and formats centiseconds', () => {
    let state = playing()
    state = reduce(state, { type: 'move', direction: 'up' })
    expect(state.cursor).toBe(6)
    state = reduce(state, { type: 'move', direction: 'left' })
    expect(state.cursor).toBe(7)
    expect(formatTime(240000)).toBe('04:00:00')
    expect(formatTime(59991)).toBe('01:00:00')
    expect(formatTime(-50)).toBe('00:00:00')
  })
})

