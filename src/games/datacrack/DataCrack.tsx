import { useCallback, useReducer, useRef } from 'react'
import { useGameAudio } from '../../audio/useGameAudio'
import { useGameKeyDown, useGameLoop } from '../../runtime/gameHooks'
import type { GameProps } from '../types'
import wordmark from './assets/wordmark.webp'
import styles from './DataCrack.module.css'
import {
  COLUMN_COUNT,
  createInitialState,
  dataCrackReducer,
  getColumnGapOffsetPx,
} from './logic'

export function DataCrack({ runtime }: GameProps) {
  const [state, dispatch] = useReducer(dataCrackReducer, undefined, createInitialState)
  const stateRef = useRef(state)
  stateRef.current = state

  useGameAudio(runtime, {
    phase: state.phase === 'playing' ? 'playing' : 'success',
    moveToken: 0,
    hitVersion: state.lockVersion,
    wrongVersion: state.wrongVersion,
  })

  useGameLoop(runtime, (elapsedMs) => {
    if (stateRef.current.phase !== 'success') {
      dispatch({ type: 'advance', elapsedMs })
    }
  })

  const submitOrContinue = useCallback(() => {
    if (stateRef.current.phase === 'playing') {
      dispatch({ type: 'submit' })
    } else if (stateRef.current.phase === 'success') {
      runtime.exit({ outcome: 'success' })
    }
  }, [runtime])

  useGameKeyDown(runtime, (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      runtime.exit({ outcome: 'quit' })
      return
    }

    if (stateRef.current.phase === 'success') {
      event.preventDefault()
      runtime.exit({ outcome: 'success' })
      return
    }

    if (
      stateRef.current.phase === 'playing'
      && (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault()
      dispatch({ type: 'submit' })
    }
  })

  return (
    <section className={styles.window} aria-label="DataCrack.exe">
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.yellowRule} />
          <div className={styles.orangeRule} />
          <img className={styles.wordmark} src={wordmark} alt="Data Crack, selling your secrets since 1996" />
        </header>

        <div
          className={styles.board}
          role="button"
          tabIndex={0}
          aria-label={state.phase === 'success'
            ? 'Hack complete. Activate to continue.'
            : `Data Crack board. ${state.lockedCount} of ${COLUMN_COUNT} blocks locked.`}
          onClick={submitOrContinue}
        >
          {state.phase === 'success' ? (
            <div className={styles.outcome} aria-live="polite">
              <strong>HACK COMPLETE</strong>
              <span>Press any key to continue.</span>
            </div>
          ) : (
            <>
              <div className={styles.targetLine} aria-hidden="true" />
              {Array.from({ length: COLUMN_COUNT }, (_, index) => {
                const locked = index < state.lockedCount
                const active = state.phase === 'playing' && index === state.lockedCount
                const offset = getColumnGapOffsetPx(state, index)
                return (
                  <div
                    className={`${styles.column} ${active ? styles.active : ''} ${locked ? styles.locked : ''}`}
                    style={{
                      left: `${35 + index * 63}px`,
                      transform: `translate3d(0, ${offset - 108}px, 0)`,
                    }}
                    key={index}
                    aria-hidden="true"
                  >
                    <span className={`${styles.block} ${styles.topBlock}`} />
                    <span className={`${styles.block} ${styles.bottomBlock}`} />
                  </div>
                )
              })}
            </>
          )}
        </div>

        {state.wrongVersion > 0 ? (
          <div className={styles.errorFlash} key={state.wrongVersion} aria-hidden="true" />
        ) : null}
      </div>
    </section>
  )
}
