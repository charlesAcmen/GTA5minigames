import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import failureSound from '../assets/audio/failure.wav'
import hitSound from '../assets/audio/hit.wav'
import moveSound from '../assets/audio/move.wav'
import successSound from '../assets/audio/success.wav'
import wrongSound from '../assets/audio/wrong.wav'

export type GameSound = 'move' | 'hit' | 'wrong' | 'success' | 'failure'

export type GameAudioSession = {
  play: (sound: GameSound) => void
  stopAll: () => void
}

const soundSources: Record<GameSound, string> = {
  move: moveSound,
  hit: hitSound,
  wrong: wrongSound,
  success: successSound,
  failure: failureSound,
}

const soundVolumes: Record<GameSound, number> = {
  move: 0.24,
  hit: 0.42,
  wrong: 0.42,
  success: 0.48,
  failure: 0.46,
}

export class AudioEngine {
  private readonly bank = new Map<GameSound, HTMLAudioElement>()
  private readonly sessions = new Set<GameAudioSession>()

  private getAudio(sound: GameSound) {
    const cached = this.bank.get(sound)
    if (cached) return cached

    const audio = new Audio(soundSources[sound])
    audio.preload = 'auto'
    audio.volume = soundVolumes[sound]
    this.bank.set(sound, audio)
    return audio
  }

  createSession(): GameAudioSession {
    const used = new Set<HTMLAudioElement>()
    let disposed = false

    const session: GameAudioSession = {
      play: (sound) => {
        if (disposed) return
        const audio = this.getAudio(sound)
        used.add(audio)
        audio.pause()
        audio.currentTime = 0
        void audio.play().catch(() => {
          // Browsers may reject audio until the first user interaction.
        })
      },
      stopAll: () => {
        if (disposed) return
        disposed = true
        used.forEach((audio) => {
          audio.pause()
          audio.currentTime = 0
        })
        used.clear()
        this.sessions.delete(session)
      },
    }

    this.sessions.add(session)
    return session
  }

  dispose() {
    Array.from(this.sessions).forEach((session) => session.stopAll())
    this.bank.forEach((audio) => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    })
    this.bank.clear()
  }
}

const AudioEngineContext = createContext<AudioEngine | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [engine] = useState(() => new AudioEngine())

  useEffect(() => () => engine.dispose(), [engine])

  return (
    <AudioEngineContext.Provider value={engine}>
      {children}
    </AudioEngineContext.Provider>
  )
}

export function useAudioEngine() {
  const engine = useContext(AudioEngineContext)
  if (!engine) throw new Error('useAudioEngine must be used inside AudioProvider')
  return engine
}
