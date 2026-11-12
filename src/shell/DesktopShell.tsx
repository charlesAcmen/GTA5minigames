import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import desktopWallpaper from '../assets/desktop/windows.jpg'
import { findProgram } from '../games/registry'
import type { GameResult } from '../runtime/GameRuntime'
import { GameHost } from './GameHost'
import { ShellWorkspace } from './ShellWorkspace'
import { initialShellState, shellReducer } from './shellState'
import styles from './DesktopShell.module.css'

const STAGE_WIDTH = 1280
const STAGE_HEIGHT = 720

export function DesktopShell() {
  const [state, dispatch] = useReducer(shellReducer, initialShellState)
  const [scale, setScale] = useState(() => Math.min(
    window.innerWidth / STAGE_WIDTH,
    window.innerHeight / STAGE_HEIGHT,
  ))
  const stateRef = useRef(state)
  stateRef.current = state

  const exitGame = useCallback((_result: GameResult) => {
    dispatch({ type: 'back' })
  }, [])

  useEffect(() => {
    const updateScale = () => setScale(Math.min(
      window.innerWidth / STAGE_WIDTH,
      window.innerHeight / STAGE_HEIGHT,
    ))
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentState = stateRef.current
      if (currentState.view === 'game') return
      if (event.key === 'Escape') {
        event.preventDefault()
        dispatch({ type: 'back' })
        return
      }

      if (currentState.view === 'desktop') {
        if (event.key.startsWith('Arrow')) {
          event.preventDefault()
          dispatch({ type: 'select-desktop' })
        } else if (event.key === 'Enter' && currentState.desktopSelected) {
          event.preventDefault()
          dispatch({ type: 'open-computer' })
        }
        return
      }

      if (currentState.view === 'computer') {
        if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
          event.preventDefault()
          dispatch({ type: 'move-computer', direction: -1 })
        } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
          event.preventDefault()
          dispatch({ type: 'move-computer', direction: 1 })
        } else if (event.key === 'Enter' && currentState.computerSelected === 'external') {
          event.preventDefault()
          dispatch({ type: 'open-external' })
        }
        return
      }

      if (currentState.view === 'external') {
        if (event.key.startsWith('Arrow')) {
          event.preventDefault()
          const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1
          dispatch({ type: 'move-program', direction })
        } else if (event.key === 'Enter') {
          const program = findProgram(currentState.programSelected)
          if (!program?.component) return
          event.preventDefault()
          dispatch({ type: 'open-program', programId: program.id })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const activeProgram = findProgram(state.activeProgramId)

  return (
    <main className={styles.viewport}>
      <div
        className={styles.stage}
        style={{
          backgroundImage: `url(${desktopWallpaper})`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dispatch({ type: 'clear-selection' })
        }}
      >
        <ShellWorkspace state={state} dispatch={dispatch} />
        {state.view === 'game' && activeProgram ? (
          <GameHost key={activeProgram.id} program={activeProgram} onExit={exitGame} />
        ) : null}
      </div>
    </main>
  )
}
