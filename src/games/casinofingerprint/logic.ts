import { SUCCESS_EXIT_MS } from './successTimeline'

export const CONNECTION_MS = 240_000
// Provisional training value; the reference clip never reaches a scramble.
export const SCRAMBLE_MS = 90_000
export const ATTEMPTS = 6
export const ROUND_COUNT = 2
export const BOOT_MS = 3210
export const PROCESS_MS = 1600
export const FEEDBACK_MS = 1100

export type Piece = { id: string; print: number; part: number }
export type Phase = 'boot' | 'playing' | 'processing' | 'match' | 'wrong' | 'scrambling' | 'success' | 'failure'
export type State = {
  phase: Phase
  phaseMs: number
  remainingMs: number
  scrambleMs: number
  attempts: number
  sequence: number[]
  round: number
  pieces: Piece[]
  selected: string[]
  cursor: number
  correct: boolean
  seed: number
  moveVersion: number
  hitVersion: number
  wrongVersion: number
}
export type Action =
  | { type: 'advance'; elapsedMs: number }
  | { type: 'move'; direction: 'left' | 'right' | 'up' | 'down' }
  | { type: 'select'; index: number }
  | { type: 'submit' }

// Keep randomization in the state so React reducer replays produce the same board.
function shuffle<T>(items: readonly T[], seed: number): { items: T[]; seed: number } {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const j = Math.floor((seed / 0x100000000) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return { items: result, seed }
}

export function createBoard(print: number, seed: number) {
  // The 16 memorized answer tiles never act as another print's decoys.
  const answers = Array.from({ length: 4 }, (_, part) => ({ id: `${print}-${part}`, print, part }))
  const decoys = Array.from({ length: 4 }, (_, part) => ({ id: `decoy-${part}`, print: -1, part }))
  const board = shuffle([...answers, ...decoys], seed)
  return { pieces: board.items, seed: board.seed }
}

export function createInitialState(seed = Math.floor(Math.random() * 0x100000000)): State {
  const sequence = shuffle([0, 1, 2, 3], seed)
  return {
    phase: 'boot', phaseMs: 0, remainingMs: CONNECTION_MS, scrambleMs: SCRAMBLE_MS,
    attempts: ATTEMPTS, sequence: sequence.items.slice(0, ROUND_COUNT), round: 0,
    ...createBoard(sequence.items[0], sequence.seed), selected: [], cursor: 0,
    correct: false, moveVersion: 0, hitVersion: 0, wrongVersion: 0,
  }
}

export function isMatch(state: State) {
  return state.selected.length === 4 && state.selected.every((id) =>
    state.pieces.some((piece) => piece.id === id && piece.print === state.sequence[state.round]))
}

function finishPhase(state: State): State {
  switch (state.phase) {
    case 'boot': return { ...state, phase: 'playing', phaseMs: 0 }
    case 'processing': return {
      ...state, phase: state.correct ? 'match' : 'wrong', phaseMs: 0,
      attempts: state.attempts - (state.correct ? 0 : 1),
      hitVersion: state.hitVersion + (state.correct ? 1 : 0),
      wrongVersion: state.wrongVersion + (state.correct ? 0 : 1),
    }
    case 'match': {
      if (state.round + 1 === state.sequence.length) return { ...state, phase: 'success', phaseMs: 0 }
      const round = state.round + 1
      return {
        ...state, ...createBoard(state.sequence[round], state.seed), round,
        phase: 'playing', phaseMs: 0, scrambleMs: SCRAMBLE_MS, selected: [], cursor: 0,
      }
    }
    case 'wrong': return {
      ...state, phase: state.attempts === 0 ? 'failure' : 'playing', phaseMs: 0, selected: [],
    }
    case 'scrambling': {
      const shuffled = shuffle(state.pieces, state.seed)
      return { ...state, pieces: shuffled.items, seed: shuffled.seed, phase: 'playing', phaseMs: 0 }
    }
    default: return state
  }
}

const durations: Partial<Record<Phase, number>> = {
  boot: BOOT_MS, processing: PROCESS_MS, match: FEEDBACK_MS, wrong: FEEDBACK_MS, scrambling: 600,
}

function advance(state: State, elapsedMs: number): State {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return state
  let next = state
  let remaining = elapsedMs
  // Consume time across phase boundaries, including suspended/background frames.
  while (remaining > 0 && next.phase !== 'success' && next.phase !== 'failure') {
    const phaseDuration = durations[next.phase] ?? Infinity
    const step = Math.min(remaining, phaseDuration - next.phaseMs,
      next.phase === 'boot' ? Infinity : next.remainingMs,
      next.phase === 'playing' ? next.scrambleMs : Infinity)
    next = {
      ...next, phaseMs: next.phaseMs + step,
      remainingMs: next.remainingMs - (next.phase === 'boot' ? 0 : step),
      scrambleMs: next.scrambleMs - (next.phase === 'playing' ? step : 0),
    }
    remaining -= step
    if (next.remainingMs <= 0) return { ...next, phase: 'failure', remainingMs: 0, phaseMs: 0 }
    if (next.phase === 'playing' && next.scrambleMs <= 0) {
      next = { ...next, phase: 'scrambling', phaseMs: 0, scrambleMs: SCRAMBLE_MS, selected: [] }
    } else if (next.phaseMs >= phaseDuration) next = finishPhase(next)
  }
  if (next.phase === 'success' && remaining > 0) {
    return { ...next, phaseMs: Math.min(SUCCESS_EXIT_MS, next.phaseMs + remaining) }
  }
  return next
}

export function fingerprintReducer(state: State, action: Action): State {
  if (action.type === 'advance') return advance(state, action.elapsedMs)
  if (state.phase !== 'playing') return state
  switch (action.type) {
    case 'move': {
      const row = Math.floor(state.cursor / 2)
      const column = state.cursor % 2
      const cursor = action.direction === 'left' || action.direction === 'right'
        ? row * 2 + (1 - column)
        : ((row + (action.direction === 'up' ? 3 : 1)) % 4) * 2 + column
      return { ...state, cursor, moveVersion: state.moveVersion + 1 }
    }
    case 'select': {
      const piece = state.pieces[action.index]
      if (!piece) return state
      const selected = state.selected.includes(piece.id)
        ? state.selected.filter((id) => id !== piece.id)
        : state.selected.length < 4 ? [...state.selected, piece.id] : state.selected
      return { ...state, cursor: action.index, selected, moveVersion: state.moveVersion + 1 }
    }
    case 'submit':
      return state.selected.length === 4
        ? { ...state, phase: 'processing', phaseMs: 0, correct: isMatch(state) } : state
  }
}

export function formatTime(ms: number) {
  const hundredths = Math.ceil(Math.max(0, ms) / 10)
  return [Math.floor(hundredths / 6000), Math.floor(hundredths / 100) % 60, hundredths % 100]
    .map((part) => String(part).padStart(2, '0')).join(':')
}



