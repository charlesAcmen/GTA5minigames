import { SOURCE_ROWS, TARGET_ROWS, TIMING } from './designTokens'

export type Multiplier = 1 | 2 | 10
export type GridPoint = { col: number; row: number }
export type Puzzle = {
  inputs: readonly [number, number, number]
  multipliers: readonly [Multiplier, Multiplier, Multiplier]
  target: number
  solution: readonly [number, number, number]
}
export type Connection = {
  source: number
  target: number
  path: GridPoint[]
  order: number
}
export type EditingConnection = {
  source: number
  path: GridPoint[]
}
export type Phase = 'intro' | 'playing' | 'matched' | 'transition' | 'success' | 'failure'
export type VoltLabState = {
  phase: Phase
  phaseMs: number
  puzzle: Puzzle
  connections: Connection[]
  editing: EditingConnection | null
  selectedSource: number
  remainingMs: number
  penalizedSignature: string | null
  nextOrder: number
}
export type Direction = 'left' | 'right' | 'up' | 'down'
export type VoltLabAction =
  | { type: 'advance'; elapsedMs: number }
  | { type: 'select-source'; source: number }
  | { type: 'begin' }
  | { type: 'move'; direction: Direction }
  | { type: 'move-to'; point: GridPoint }
  | { type: 'commit' }
  | { type: 'back' }

export const SAMPLE_PUZZLE: Puzzle = {
  inputs: [5, 6, 9],
  multipliers: [2, 1, 1],
  target: 29,
  solution: [1, 2, 0],
}

const multiplierPool = [1, 2, 10] as const

function randomIndex(length: number, random: () => number) {
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)))
}

function shuffle<T>(values: readonly T[], random: () => number) {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const other = randomIndex(index + 1, random)
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

export function generatePuzzle(random: () => number = Math.random): Puzzle {
  const inputs = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random).slice(0, 3) as [number, number, number]
  const multipliers: [Multiplier, Multiplier, Multiplier] = [
    multiplierPool[randomIndex(3, random)],
    multiplierPool[randomIndex(3, random)],
    multiplierPool[randomIndex(3, random)],
  ]
  if (multipliers.every((value) => value === multipliers[0])) {
    const current = multiplierPool.indexOf(multipliers[2])
    multipliers[2] = multiplierPool[(current + 1 + randomIndex(2, random)) % multiplierPool.length]
  }
  const solution = shuffle([0, 1, 2], random) as [number, number, number]
  const target = inputs.reduce((sum, value, source) => sum + value * multipliers[solution[source]], 0)
  return { inputs, multipliers, target, solution }
}

export function createInitialState(puzzle = generatePuzzle(), phase: Phase = 'intro'): VoltLabState {
  return {
    phase,
    phaseMs: 0,
    puzzle,
    connections: [],
    editing: null,
    selectedSource: 0,
    remainingMs: TIMING.batteryMs,
    penalizedSignature: null,
    nextOrder: 0,
  }
}

export function resultFor(puzzle: Puzzle, connections: readonly Connection[]) {
  return connections.reduce((sum, connection) => (
    sum + puzzle.inputs[connection.source] * puzzle.multipliers[connection.target]
  ), 0)
}

export function connectionSignature(connections: readonly Connection[]) {
  return [...connections]
    .sort((a, b) => a.source - b.source)
    .map(({ source, target }) => `${source}:${target}`)
    .join('|')
}

export function isSolved(puzzle: Puzzle, connections: readonly Connection[]) {
  return connections.length === 3 && resultFor(puzzle, connections) === puzzle.target
}

export function pathTarget(path: readonly GridPoint[]) {
  const point = path.at(-1)
  if (!point || point.col !== 12) return -1
  return TARGET_ROWS.findIndex((row) => row === point.row)
}

function samePoint(a: GridPoint, b: GridPoint) {
  return a.col === b.col && a.row === b.row
}

function adjacent(a: GridPoint, b: GridPoint) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1
}

function moveEditing(state: VoltLabState, point: GridPoint): VoltLabState {
  const editing = state.editing
  if (!editing || point.col < 0 || point.col > 12 || point.row < 0 || point.row > 8) return state
  const current = editing.path.at(-1)
  if (!current || !adjacent(current, point)) return state
  const priorIndex = editing.path.findIndex((pathPoint) => samePoint(pathPoint, point))
  const path = priorIndex >= 0 ? editing.path.slice(0, priorIndex + 1) : [...editing.path, point]
  return { ...state, editing: { ...editing, path } }
}

function begin(state: VoltLabState): VoltLabState {
  if (state.editing || state.connections.some(({ source }) => source === state.selectedSource)) return state
  return {
    ...state,
    editing: {
      source: state.selectedSource,
      path: [{ col: 0, row: SOURCE_ROWS[state.selectedSource] }],
    },
  }
}

function commit(state: VoltLabState): VoltLabState {
  const editing = state.editing
  if (!editing) return begin(state)
  const target = pathTarget(editing.path)
  if (target < 0 || state.connections.some((connection) => connection.target === target)) return state
  if (state.connections.some((connection) => connection.source === editing.source)) return state

  const connections = [...state.connections, {
    source: editing.source,
    target,
    path: editing.path,
    order: state.nextOrder,
  }]
  const nextSource = [0, 1, 2].find((source) => !connections.some((connection) => connection.source === source))
    ?? editing.source
  const base: VoltLabState = {
    ...state,
    connections,
    editing: null,
    selectedSource: nextSource,
    nextOrder: state.nextOrder + 1,
  }
  if (connections.length < 3) return base
  if (isSolved(state.puzzle, connections)) return { ...base, phase: 'matched', phaseMs: 0 }

  const signature = connectionSignature(connections)
  if (signature === state.penalizedSignature) return base
  const remainingMs = Math.max(0, state.remainingMs - TIMING.invalidSumPenaltyMs)
  return {
    ...base,
    remainingMs,
    penalizedSignature: signature,
    phase: remainingMs === 0 ? 'failure' : 'playing',
  }
}

function back(state: VoltLabState): VoltLabState {
  if (state.editing) {
    if (state.editing.path.length === 1) return { ...state, editing: null }
    return { ...state, editing: { ...state.editing, path: state.editing.path.slice(0, -1) } }
  }
  const latest = state.connections.reduce<Connection | null>((found, connection) => (
    !found || connection.order > found.order ? connection : found
  ), null)
  if (!latest) return state
  return {
    ...state,
    connections: state.connections.filter((connection) => connection !== latest),
    editing: { source: latest.source, path: latest.path },
    selectedSource: latest.source,
  }
}

function advance(state: VoltLabState, elapsedMs: number): VoltLabState {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || state.phase === 'success' || state.phase === 'failure') return state
  let next = state
  let remaining = elapsedMs
  while (remaining > 0) {
    if (next.phase === 'intro') {
      const step = Math.min(remaining, TIMING.introMs - next.phaseMs)
      next = { ...next, phaseMs: next.phaseMs + step }
      remaining -= step
      if (next.phaseMs >= TIMING.introMs) next = { ...next, phase: 'playing', phaseMs: 0 }
    } else if (next.phase === 'playing') {
      const step = Math.min(remaining, next.remainingMs)
      next = { ...next, remainingMs: next.remainingMs - step }
      remaining -= step
      if (next.remainingMs === 0) return { ...next, phase: 'failure', phaseMs: 0 }
    } else if (next.phase === 'matched') {
      const step = Math.min(remaining, TIMING.matchedHoldMs - next.phaseMs)
      next = { ...next, phaseMs: next.phaseMs + step }
      remaining -= step
      if (next.phaseMs >= TIMING.matchedHoldMs) next = { ...next, phase: 'transition', phaseMs: 0 }
    } else if (next.phase === 'transition') {
      const step = Math.min(remaining, TIMING.transitionMs - next.phaseMs)
      next = { ...next, phaseMs: next.phaseMs + step }
      remaining -= step
      if (next.phaseMs >= TIMING.transitionMs) return { ...next, phase: 'success', phaseMs: 0 }
    }
  }
  return next
}

export function voltLabReducer(state: VoltLabState, action: VoltLabAction): VoltLabState {
  if (action.type === 'advance') return advance(state, action.elapsedMs)
  if (state.phase !== 'playing') return state
  switch (action.type) {
    case 'select-source':
      return action.source >= 0 && action.source < 3 && !state.editing
        ? { ...state, selectedSource: action.source }
        : state
    case 'begin': return begin(state)
    case 'move': {
      const point = state.editing?.path.at(-1)
      if (!point) return state
      const delta = {
        left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1],
      }[action.direction]
      return moveEditing(state, { col: point.col + delta[0], row: point.row + delta[1] })
    }
    case 'move-to': return moveEditing(state, action.point)
    case 'commit': return commit(state)
    case 'back': return back(state)
  }
}

export function expandPath(points: readonly GridPoint[]) {
  if (points.length < 2) return [...points]
  const result: GridPoint[] = [{ ...points[0] }]
  for (let index = 1; index < points.length; index++) {
    const target = points[index]
    let current = result.at(-1)!
    if (current.col !== target.col && current.row !== target.row) throw new Error('VOLTlab path segments must be orthogonal')
    while (!samePoint(current, target)) {
      current = {
        col: current.col + Math.sign(target.col - current.col),
        row: current.row + Math.sign(target.row - current.row),
      }
      result.push(current)
    }
  }
  return result
}

