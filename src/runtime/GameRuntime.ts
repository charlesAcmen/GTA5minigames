import type { GameAudioSession } from '../audio/AudioProvider'

export type GameOutcome = 'success' | 'failure' | 'quit'

export type GameResult = {
  outcome: GameOutcome
  score?: number
}

export type GameRuntime = {
  readonly signal: AbortSignal
  readonly audio: GameAudioSession
  exit: (result?: GameResult) => void
}

type AudioSessionFactory = {
  createSession: () => GameAudioSession
}

export class GameRuntimeSession {
  readonly runtime: GameRuntime

  private readonly controller = new AbortController()
  private readonly audioSession: GameAudioSession
  private disposed = false

  constructor(audioEngine: AudioSessionFactory, onExit: (result: GameResult) => void) {
    this.audioSession = audioEngine.createSession()
    this.runtime = {
      signal: this.controller.signal,
      audio: this.audioSession,
      exit: (result = { outcome: 'quit' }) => {
        this.dispose()
        onExit(result)
      },
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.controller.abort()
    this.audioSession.stopAll()
  }
}
