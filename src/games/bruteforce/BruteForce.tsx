import { useCallback, useReducer, useRef } from 'react'
import { useGameAudio } from '../../audio/useGameAudio'
import { useGameKeyDown, useGameLoop } from '../../runtime/gameHooks'
import type { GameProps } from '../types'
import wordmark from './assets/wordmark.webp'
import styles from './BruteForce.module.css'
import {
  COLUMN_COUNT,
  INITIAL_LIVES,
  bruteForceReducer,
  createInitialState,
  formatCountdown,
  getLetterTop,
} from './logic'

export function BruteForce({ runtime }: GameProps) {
  const [state, dispatch] = useReducer(bruteForceReducer, undefined, createInitialState)
  const stateRef = useRef(state)
  stateRef.current = state

  useGameAudio(runtime, {
    phase: state.phase,
    moveToken: state.selectedColumn,
    hitVersion: state.lockVersion,
    wrongVersion: state.flashVersion,
  })

  useGameLoop(runtime, (elapsed) => {
    if (stateRef.current.phase === 'playing') {
      dispatch({ type: 'advance', elapsedMs: elapsed })
    }
  })

  useGameKeyDown(runtime, (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      runtime.exit({ outcome: 'quit' })
      return
    }
    if (stateRef.current.phase === 'failure') {
      event.preventDefault()
      dispatch({ type: 'restart' })
      return
    }
    if (stateRef.current.phase === 'success') {
      event.preventDefault()
      runtime.exit({ outcome: 'success' })
      return
    }

    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      event.preventDefault()
      dispatch({ type: 'move-column', direction: -1 })
    } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
      event.preventDefault()
      dispatch({ type: 'move-column', direction: 1 })
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      dispatch({ type: 'submit' })
    }
  })

  const selectColumn = useCallback((column: number) => {
    dispatch({ type: 'select-column', column })
  }, [])

  const submitColumn = useCallback((column: number) => {
    dispatch({ type: 'submit', column })
  }, [])

  const outcomeMessage = state.phase === 'success'
    ? 'Successfully acquired the password.'
    : 'Failed to acquire the password.'

  return (
    <section className={styles.window} aria-label="BruteForce.exe">
      <div className={styles.screen}>
        <header className={styles.header}>
          <img className={styles.wordmark} src={wordmark} alt="BruteForce" />
          <div className={styles.signal} aria-label={`${state.lives} attempts remaining`}>
            {Array.from({ length: INITIAL_LIVES }, (_, index) => (
              <span
                className={index < state.lives ? styles.signalActive : styles.signalEmpty}
                key={index}
              />
            ))}
          </div>
        </header>

        <div className={styles.timer}>{formatCountdown(state.remainingMs)}</div>

        {state.phase === 'playing' ? (
          <div className={styles.grid} aria-label={`Password roulette, ${COLUMN_COUNT} columns`}>
            <div className={styles.rowLineOne} />
            <div className={styles.rowLineTwo} />
            <div className={styles.hitBand} />
            {state.columns.map((column, columnIndex) => (
              <button
                className={`${styles.column} ${state.selectedColumn === columnIndex ? styles.columnSelected : ''} ${column.locked ? styles.columnLocked : ''}`}
                style={{ left: `${columnIndex * 58}px` }}
                key={columnIndex}
                type="button"
                disabled={column.locked}
                aria-label={`Column ${columnIndex + 1}${column.locked ? ', locked' : ''}`}
                onPointerEnter={() => selectColumn(columnIndex)}
                onClick={() => submitColumn(columnIndex)}
              >
                {column.letters.map((letter, letterIndex) => (
                  <span
                    className={`${styles.letter} ${letterIndex === column.targetIndex ? styles.targetLetter : ''}`}
                    style={{ transform: `translate3d(0, ${getLetterTop(column, letterIndex)}px, 0)` }}
                    key={letterIndex}
                  >
                    {letter}
                  </span>
                ))}
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.outcome}>
            <div>{outcomeMessage}</div>
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
