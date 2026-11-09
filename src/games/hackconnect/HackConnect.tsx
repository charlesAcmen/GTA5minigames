import { memo, useCallback, useEffect, useReducer, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useGameAudio } from '../../audio/useGameAudio'
import wordmark from './assets/wordmark.webp'
import styles from './HackConnect.module.css'
import {
  GRID_COLUMNS,
  GRID_ROWS,
  TARGET_LENGTH,
  TIMER_UPDATE_INTERVAL_MS,
  createInitialState,
  formatCountdown,
  hackConnectReducer,
  isSelected,
} from './logic'

type HackConnectProps = {
  onExit: () => void
}

function SecurityGlobeIcon() {
  return (
    <svg className={styles.securityIcon} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id="security-ocean" cx="30%" cy="22%" r="78%">
          <stop offset="0" stopColor="#b8e9ff" />
          <stop offset=".46" stopColor="#4ea8ed" />
          <stop offset="1" stopColor="#1765bc" />
        </radialGradient>
        <clipPath id="security-globe-clip">
          <circle cx="24" cy="24" r="20.5" />
        </clipPath>
      </defs>
      <circle cx="24" cy="24" r="21.5" fill="#d7f5ff" opacity=".9" />
      <circle cx="24" cy="24" r="20.5" fill="url(#security-ocean)" />
      <g clipPath="url(#security-globe-clip)" fill="#d9f3ff" opacity=".78">
        <path d="M4 18 12 9l8-4 4 5-5 4-1 5-8 3Z" />
        <path d="m30 5 10 5 5 9-7 1-5-4-7-2Z" />
        <path d="m5 30 8-5 7 3 3 7-5 11-9-7Z" />
        <path d="m34 27 11 1-3 13-9 5-4-9Z" />
      </g>
      <g fill="none" stroke="#e6f8ff" strokeOpacity=".48" strokeWidth=".8">
        <ellipse cx="24" cy="24" rx="11" ry="20" />
        <path d="M4 24h40M7 15h34M7 33h34" />
      </g>
      <g transform="translate(15 15)">
        <path d="M4 8V5.8C4 2.6 6.2.5 9 .5s5 2.1 5 5.3V8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <rect x="1.5" y="7" width="15" height="15" rx="1.5" fill="#fff" />
        <circle cx="9" cy="13" r="2" fill="#6aaee0" />
        <path d="M8.2 14.5h1.6l.7 4H7.5Z" fill="#6aaee0" />
      </g>
    </svg>
  )
}

type NumberGridProps = {
  values: string[]
  selectionStart: number
  onPointerSelect: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerLeave: () => void
  onCellClick: (index: number, highlighted: boolean) => void
}

const NumberGrid = memo(function NumberGrid({
  values,
  selectionStart,
  onPointerSelect,
  onPointerLeave,
  onCellClick,
}: NumberGridProps) {
  return (
    <div
      className={styles.grid}
      role="grid"
      aria-label="IP address grid"
      onPointerEnter={onPointerSelect}
      onPointerMove={onPointerSelect}
      onPointerLeave={onPointerLeave}
    >
      {values.map((value, index) => {
        const highlighted = isSelected(index, selectionStart)
        return (
          <button
            className={`${styles.number} ${highlighted ? styles.numberSelected : ''}`}
            key={index}
            onClick={() => onCellClick(index, highlighted)}
            type="button"
            role="gridcell"
            aria-label={`${value}${highlighted ? ', selected' : ''}`}
          >
            {value}
          </button>
        )
      })}
    </div>
  )
})

export function HackConnect({ onExit }: HackConnectProps) {
  const [state, dispatch] = useReducer(hackConnectReducer, undefined, createInitialState)
  const stateRef = useRef(state)
  const pointerRef = useRef({ x: 0, y: 0, deltaX: 0, deltaY: 0, ready: false })
  const gridBoundsRef = useRef<DOMRect | null>(null)

  stateRef.current = state
  useGameAudio({
    phase: state.phase,
    moveToken: `${state.selectionStart}:${state.shiftVersion}`,
    hitVersion: state.phase === 'success' ? 1 : 0,
    wrongVersion: state.flashVersion,
  })

  useEffect(() => {
    let frameId = 0
    let lastTime = performance.now()
    let pendingElapsed = 0

    const animate = (now: number) => {
      const elapsed = Math.max(0, now - lastTime)
      lastTime = now

      if (stateRef.current.phase === 'playing') {
        pendingElapsed += elapsed
        if (pendingElapsed >= TIMER_UPDATE_INTERVAL_MS) {
          dispatch({ type: 'advance', elapsedMs: pendingElapsed })
          pendingElapsed = 0
        }
      } else {
        pendingElapsed = 0
      }

      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer.ready) {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.ready = true
      return
    }

    pointer.deltaX += event.clientX - pointer.x
    pointer.deltaY += event.clientY - pointer.y
    pointer.x = event.clientX
    pointer.y = event.clientY

    const horizontal = Math.abs(pointer.deltaX)
    const vertical = Math.abs(pointer.deltaY)
    if (Math.max(horizontal, vertical) < 14 || stateRef.current.phase !== 'playing') return

    if (horizontal > vertical) {
      dispatch({ type: 'move', delta: pointer.deltaX > 0 ? 1 : -1 })
    } else {
      dispatch({ type: 'move', delta: pointer.deltaY > 0 ? GRID_COLUMNS : -GRID_COLUMNS })
    }

    pointer.deltaX = 0
    pointer.deltaY = 0
  }, [])

  const resetPointer = useCallback(() => {
    pointerRef.current.ready = false
    pointerRef.current.deltaX = 0
    pointerRef.current.deltaY = 0
    gridBoundsRef.current = null
  }, [])

  const selectFromGridPointer = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (stateRef.current.phase !== 'playing') return

    const bounds = gridBoundsRef.current ?? event.currentTarget.getBoundingClientRect()
    gridBoundsRef.current = bounds
    const columnPosition = Math.min(
      GRID_COLUMNS,
      Math.max(0, ((event.clientX - bounds.left) / bounds.width) * GRID_COLUMNS),
    )
    const row = Math.min(
      GRID_ROWS - 1,
      Math.max(0, Math.floor(((event.clientY - bounds.top) / bounds.height) * GRID_ROWS)),
    )
    const index = Math.round(
      row * GRID_COLUMNS + columnPosition - TARGET_LENGTH / 2,
    )

    if (stateRef.current.selectionStart !== index) {
      dispatch({ type: 'select', index })
    }
    pointerRef.current.ready = false
    pointerRef.current.deltaX = 0
    pointerRef.current.deltaY = 0
  }, [])

  const handleCellClick = useCallback((index: number, highlighted: boolean) => {
    if (highlighted) dispatch({ type: 'submit' })
    else dispatch({ type: 'select', index })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onExit()
        return
      }

      if (stateRef.current.phase === 'failure') {
        event.preventDefault()
        dispatch({ type: 'restart' })
        return
      }

      if (stateRef.current.phase === 'success') {
        event.preventDefault()
        onExit()
        return
      }

      const moves: Partial<Record<string, number>> = {
        ArrowUp: -GRID_COLUMNS,
        w: -GRID_COLUMNS,
        W: -GRID_COLUMNS,
        ArrowDown: GRID_COLUMNS,
        s: GRID_COLUMNS,
        S: GRID_COLUMNS,
        ArrowLeft: -1,
        a: -1,
        A: -1,
        ArrowRight: 1,
        d: 1,
        D: 1,
      }
      const delta = moves[event.key]

      if (delta !== undefined) {
        event.preventDefault()
        dispatch({ type: 'move', delta })
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        dispatch({ type: 'submit' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onExit])

  const phaseMessage = state.phase === 'success'
    ? 'Successfully connected to the host.'
    : 'Failed to connect to the host.'

  return (
    <section className={styles.window} aria-label="HackConnect.exe">
      <div
        className={styles.screen}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
      >
        <header className={styles.header}>
          <div className={styles.brand}>
            <SecurityGlobeIcon />
            <img className={styles.wordmark} src={wordmark} alt="Connecting to the host" />
          </div>
          <div className={styles.signal} aria-label={`${state.lives} attempts remaining`}>
            {Array.from({ length: 4 }, (_, index) => (
              <span
                className={index < state.lives ? styles.signalActive : styles.signalEmpty}
                key={index}
              />
            ))}
          </div>
        </header>

        <div className={`${styles.target} ${state.phase === 'success' ? styles.targetSuccess : ''}`}>
          {state.target.join('.')}
        </div>
        <div className={styles.timer}>{formatCountdown(state.remainingMs)}</div>

        {state.phase === 'playing' ? (
          <NumberGrid
            values={state.values}
            selectionStart={state.selectionStart}
            onPointerSelect={selectFromGridPointer}
            onPointerLeave={resetPointer}
            onCellClick={handleCellClick}
          />
        ) : (
          <div className={styles.outcome}>
            <div>{phaseMessage}</div>
            <div>Press any key to continue.</div>
          </div>
        )}
        {state.flashVersion > 0 ? (
          <div className={styles.errorFlash} key={state.flashVersion} aria-hidden="true" />
        ) : null}
      </div>
    </section>
  )
}
