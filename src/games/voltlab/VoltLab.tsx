import { useEffect, useReducer, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useGameLoop } from '../../runtime/gameHooks'
import type { GameProps } from '../types'
import { CircuitBoard } from './CircuitBoard'
import { GRID_X, GRID_Y, SOURCE_ROWS, TARGET_ROWS, TIMING } from './designTokens'
import {
  SAMPLE_PUZZLE,
  connectionSignature,
  createInitialState,
  expandPath,
  voltLabReducer,
} from './logic'
import type { Connection, GridPoint, Phase, VoltLabState } from './logic'
import styles from './VoltLab.module.css'
import { IntroScreen, TerminalScreen } from './Transitions'

const directions = {
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right',
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
} as const

const route26 = [
  { source: 1, target: 0, points: [{ col: 0, row: 4 }, { col: 5, row: 4 }, { col: 5, row: 2 }, { col: 8, row: 2 }, { col: 8, row: 0 }, { col: 12, row: 0 }] },
  { source: 2, target: 2, points: [{ col: 0, row: 8 }, { col: 12, row: 8 }] },
  { source: 0, target: 1, points: [{ col: 0, row: 0 }, { col: 6, row: 0 }, { col: 6, row: 4 }, { col: 12, row: 4 }] },
] as const

const route29 = [
  { source: 0, target: 1, points: [{ col: 0, row: 0 }, { col: 6, row: 0 }, { col: 6, row: 4 }, { col: 12, row: 4 }] },
  { source: 1, target: 2, points: [{ col: 0, row: 4 }, { col: 4, row: 4 }, { col: 4, row: 8 }, { col: 12, row: 8 }] },
  { source: 2, target: 0, points: [{ col: 0, row: 8 }, { col: 7, row: 8 }, { col: 7, row: 6 }, { col: 10, row: 6 }, { col: 10, row: 0 }, { col: 12, row: 0 }] },
] as const

function connectionsFor(routes: readonly { source: number; target: number; points: readonly GridPoint[] }[]) {
  return routes.map((route, order): Connection => ({
    source: route.source,
    target: route.target,
    path: expandPath(route.points),
    order,
  }))
}

function developmentScene() {
  if (!import.meta.env.DEV) return null
  return new URLSearchParams(window.location.search).get('voltlabScene')
}

function createSceneState(scene: string | null): VoltLabState {
  if (!scene) return createInitialState()
  const aliases: Record<string, string> = {
    startup: 'intro', board: 'idle', '12': 'red12', '21': 'blue21', '26': 'orange26',
    reconnect: 'reroute', '29': 'green29', green: 'green29', failed: 'failure',
  }
  const name = aliases[scene] ?? scene
  const base = createInitialState(SAMPLE_PUZZLE, 'playing')
  const wrong = connectionsFor(route26)
  const solved = connectionsFor(route29)
  const withConnections = (connections: Connection[], phase: Phase = 'playing'): VoltLabState => ({
    ...base,
    phase,
    connections,
    selectedSource: connections.length < 3 ? connections.length : 0,
    nextOrder: connections.length,
  })
  switch (name) {
    case 'intro': return { ...base, phase: 'intro', phaseMs: TIMING.introMs * 0.62 }
    case 'red12': return withConnections(wrong.slice(0, 1))
    case 'blue21': return withConnections(wrong.slice(0, 2))
    case 'orange26': return {
      ...withConnections(wrong), remainingMs: TIMING.batteryMs - TIMING.invalidSumPenaltyMs,
      penalizedSignature: connectionSignature(wrong),
    }
    case 'reroute': return {
      ...withConnections(solved.slice(0, 2)),
      editing: { source: 2, path: solved[2].path.slice(0, -2) },
      selectedSource: 2,
    }
    case 'green29': return withConnections(solved, 'matched')
    case 'success': return withConnections(solved, 'success')
    case 'failure': return { ...base, phase: 'failure', remainingMs: 0 }
    default: return base
  }
}

function nearestIndex(values: readonly number[], value: number) {
  return values.reduce((best, candidate, index) => (
    Math.abs(candidate - value) < Math.abs(values[best] - value) ? index : best
  ), 0)
}

export function VoltLab({ runtime }: GameProps) {
  const sceneRef = useRef(developmentScene())
  const frozen = sceneRef.current !== null
  const [state, dispatch] = useReducer(voltLabReducer, sceneRef.current, createSceneState)
  const stateRef = useRef(state)
  stateRef.current = state
  const svgRef = useRef<SVGSVGElement>(null)
  const tickRef = useRef(0)
  const escapeStartRef = useRef<number | null>(null)
  const exitedRef = useRef(false)
  const [exitProgress, setExitProgress] = useState(0)

  const resetExitHold = () => {
    escapeStartRef.current = null
    setExitProgress(0)
  }

  useGameLoop(runtime, (elapsedMs) => {
    if (!frozen && stateRef.current.phase !== 'success' && stateRef.current.phase !== 'failure') {
      tickRef.current += elapsedMs
      if (tickRef.current >= 32) {
        dispatch({ type: 'advance', elapsedMs: tickRef.current })
        tickRef.current = 0
      }
    }
    if (escapeStartRef.current !== null) {
      const progress = Math.min(1, (performance.now() - escapeStartRef.current) / TIMING.exitHoldMs)
      setExitProgress(progress)
      if (progress >= 1 && !exitedRef.current) {
        exitedRef.current = true
        runtime.exit({ outcome: 'quit' })
      }
    }
  })

  useEffect(() => {
    const moveSource = (delta: number) => {
      const current = stateRef.current
      for (let step = 1; step <= 3; step++) {
        const source = (current.selectedSource + delta * step + 6) % 3
        if (!current.connections.some((connection) => connection.source === source)) {
          dispatch({ type: 'select-source', source })
          return
        }
      }
    }
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!event.repeat && escapeStartRef.current === null) escapeStartRef.current = performance.now()
        return
      }
      const current = stateRef.current
      if (current.phase === 'success' || current.phase === 'failure') {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
          event.preventDefault()
          if (!exitedRef.current) {
            exitedRef.current = true
            runtime.exit({ outcome: current.phase === 'success' ? 'success' : 'failure' })
          }
        }
        return
      }
      const direction = directions[event.key.toLowerCase() as keyof typeof directions]
      if (direction) {
        event.preventDefault()
        if (current.editing) dispatch({ type: 'move', direction })
        else moveSource(direction === 'left' || direction === 'up' ? -1 : 1)
      } else if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
        event.preventDefault()
        dispatch({ type: 'commit' })
      } else if (event.key === 'Backspace' && !event.repeat) {
        event.preventDefault()
        dispatch({ type: 'back' })
      }
    }
    const keyUp = (event: KeyboardEvent) => {
      if (event.key === 'Escape') resetExitHold()
    }
    const visibility = () => {
      if (document.hidden) resetExitHold()
    }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', resetExitHold)
    document.addEventListener('visibilitychange', visibility)
    const stop = () => resetExitHold()
    runtime.signal.addEventListener('abort', stop, { once: true })
    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', resetExitHold)
      document.removeEventListener('visibilitychange', visibility)
      runtime.signal.removeEventListener('abort', stop)
      resetExitHold()
    }
  }, [runtime])

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    const current = stateRef.current
    if (!svg || !matrix || current.phase !== 'playing') return
    event.preventDefault()
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())

    if (!current.editing) {
      const source = nearestIndex(SOURCE_ROWS.map((row) => GRID_Y[row]), point.y)
      if (point.x >= 430 && point.x <= 610 && Math.abs(point.y - GRID_Y[SOURCE_ROWS[source]]) <= 72) {
        dispatch({ type: 'select-source', source })
        dispatch({ type: 'begin' })
      }
      return
    }

    const last = current.editing.path.at(-1)!
    const target = TARGET_ROWS.findIndex((row) => row === last.row)
    if (last.col === 12 && target >= 0 && point.x >= 1265
      && Math.abs(point.y - GRID_Y[TARGET_ROWS[target]]) <= 72) {
      dispatch({ type: 'commit' })
      return
    }

    const col = nearestIndex(GRID_X, point.x)
    const row = nearestIndex(GRID_Y, point.y)
    if (Math.hypot(point.x - GRID_X[col], point.y - GRID_Y[row]) <= 34) {
      dispatch({ type: 'move-to', point: { col, row } })
    }
  }

  const transitionProgress = state.phase === 'transition' ? state.phaseMs / TIMING.transitionMs : 0
  return <section className={styles.screen} data-voltlab-scene={sceneRef.current ?? undefined}>
    {state.phase === 'intro' ? <IntroScreen phaseMs={state.phaseMs} /> : null}
    {state.phase === 'playing' || state.phase === 'matched' || state.phase === 'transition' ? (
      <CircuitBoard state={state} exitProgress={exitProgress} transitionProgress={transitionProgress}
        svgRef={svgRef} onPointerDown={handlePointerDown} />
    ) : null}
    {state.phase === 'success' ? <TerminalScreen outcome="success" /> : null}
    {state.phase === 'failure' ? <TerminalScreen outcome="failure" /> : null}
    <div className={styles.scan} aria-hidden="true" />
  </section>
}

