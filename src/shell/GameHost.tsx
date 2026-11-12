import { Component, Suspense, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useAudioEngine } from '../audio/AudioProvider'
import type { ProgramDefinition } from '../games/types'
import { GameRuntimeSession } from '../runtime/GameRuntime'
import type { GameResult } from '../runtime/GameRuntime'
import styles from './DesktopShell.module.css'

type GameHostProps = {
  program: ProgramDefinition
  onExit: (result: GameResult) => void
}

export function GameHost({ program, onExit }: GameHostProps) {
  const audioEngine = useAudioEngine()
  const [session, setSession] = useState<GameRuntimeSession | null>(null)
  const ActiveGame = program.component

  useEffect(() => {
    const nextSession = new GameRuntimeSession(audioEngine, onExit)
    setSession(nextSession)
    return () => nextSession.dispose()
  }, [audioEngine, onExit, program.id])

  if (!ActiveGame) return null

  if (!session || session.runtime.signal.aborted) {
    return <GameStatus message={`Loading ${program.name}...`} />
  }

  return (
    <GameErrorBoundary
      key={program.id}
      onError={() => session.dispose()}
      fallback={<GameStatus message={`${program.name} failed to start.`} onExit={onExit} />}
    >
      <Suspense fallback={<GameStatus message={`Loading ${program.name}...`} />}>
        <ActiveGame runtime={session.runtime} />
      </Suspense>
    </GameErrorBoundary>
  )
}

function GameStatus({ message, onExit }: { message: string; onExit?: (result: GameResult) => void }) {
  return (
    <section className={styles.gameStatus} role="status">
      <span>{message}</span>
      {onExit ? (
        <button type="button" onClick={() => onExit({ outcome: 'failure' })}>
          Return to desktop
        </button>
      ) : null}
    </section>
  )
}

type GameErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
  onError: () => void
}

class GameErrorBoundary extends Component<GameErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError()
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
