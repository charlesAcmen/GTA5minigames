import { useEffect, useRef } from 'react'
import type { GameRuntime } from '../runtime/GameRuntime'

type GamePhase = 'playing' | 'success' | 'failure'

type GameAudioState = {
  phase: GamePhase
  moveToken: number | string
  hitVersion: number
  wrongVersion: number
}

export function useGameAudio(runtime: GameRuntime, state: GameAudioState) {
  const previousRef = useRef(state)

  useEffect(() => {
    const previous = previousRef.current
    const hitChanged = state.hitVersion !== previous.hitVersion
    const wrongChanged = state.wrongVersion !== previous.wrongVersion

    if (hitChanged) runtime.audio.play('hit')
    if (wrongChanged) runtime.audio.play('wrong')
    if (previous.phase === 'playing' && state.phase === 'success') {
      runtime.audio.play('success')
    }
    if (previous.phase === 'playing' && state.phase === 'failure') {
      runtime.audio.play('failure')
    }
    if (
      state.moveToken !== previous.moveToken
      && !hitChanged
      && !wrongChanged
      && state.phase === 'playing'
    ) {
      runtime.audio.play('move')
    }

    previousRef.current = state
  }, [runtime, state.hitVersion, state.moveToken, state.phase, state.wrongVersion])
}
