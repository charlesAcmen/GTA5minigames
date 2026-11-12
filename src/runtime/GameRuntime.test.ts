import { describe, expect, it, vi } from 'vitest'
import type { GameAudioSession } from '../audio/AudioProvider'
import { GameRuntimeSession } from './GameRuntime'

function createAudioFixture() {
  const stopAll = vi.fn()
  const audio: GameAudioSession = { play: vi.fn(), stopAll }
  return {
    stopAll,
    factory: { createSession: () => audio },
  }
}

describe('GameRuntimeSession lifecycle', () => {
  it('aborts registered resources and stops audio exactly once', () => {
    const { factory, stopAll } = createAudioFixture()
    const session = new GameRuntimeSession(factory, vi.fn())
    const abortListener = vi.fn()
    session.runtime.signal.addEventListener('abort', abortListener)

    session.dispose()
    session.dispose()

    expect(session.runtime.signal.aborted).toBe(true)
    expect(abortListener).toHaveBeenCalledTimes(1)
    expect(stopAll).toHaveBeenCalledTimes(1)
  })

  it('disposes before reporting an exit result', () => {
    const { factory, stopAll } = createAudioFixture()
    const onExit = vi.fn(() => {
      expect(stopAll).toHaveBeenCalledTimes(1)
    })
    const session = new GameRuntimeSession(factory, onExit)

    session.runtime.exit({ outcome: 'success', score: 8 })

    expect(onExit).toHaveBeenCalledWith({ outcome: 'success', score: 8 })
    expect(session.runtime.signal.aborted).toBe(true)
  })
})
