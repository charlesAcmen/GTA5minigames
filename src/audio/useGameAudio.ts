import { useEffect, useRef } from 'react'
import failureSound from '../assets/audio/failure.wav'
import hitSound from '../assets/audio/hit.wav'
import moveSound from '../assets/audio/move.wav'
import successSound from '../assets/audio/success.wav'
import wrongSound from '../assets/audio/wrong.wav'

type GamePhase = 'playing' | 'success' | 'failure'

type GameAudioState = {
  phase: GamePhase
  moveToken: number | string
  hitVersion: number
  wrongVersion: number
}

type SoundName = 'move' | 'hit' | 'wrong' | 'success' | 'failure'
type SoundBank = Record<SoundName, HTMLAudioElement>

const soundSources: Record<SoundName, string> = {
  move: moveSound,
  hit: hitSound,
  wrong: wrongSound,
  success: successSound,
  failure: failureSound,
}

const soundVolumes: Record<SoundName, number> = {
  move: 0.24,
  hit: 0.42,
  wrong: 0.42,
  success: 0.48,
  failure: 0.46,
}

function createSoundBank() {
  return Object.fromEntries(
    Object.entries(soundSources).map(([name, source]) => {
      const audio = new Audio(source)
      audio.preload = 'auto'
      return [name, audio]
    }),
  ) as SoundBank
}

function playSound(bank: SoundBank, name: SoundName) {
  const audio = bank[name]
  audio.pause()
  audio.currentTime = 0
  audio.volume = soundVolumes[name]
  void audio.play().catch(() => {
    // Browsers may reject audio until the first user interaction.
  })
}

export function useGameAudio(state: GameAudioState) {
  const bankRef = useRef<SoundBank | null>(null)
  const previousRef = useRef(state)

  useEffect(() => {
    const bank = createSoundBank()
    bankRef.current = bank
    return () => {
      Object.values(bank).forEach((audio) => {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      })
      bankRef.current = null
    }
  }, [])

  useEffect(() => {
    const previous = previousRef.current
    const bank = bankRef.current

    if (bank) {
      const hitChanged = state.hitVersion !== previous.hitVersion
      const wrongChanged = state.wrongVersion !== previous.wrongVersion

      if (hitChanged) playSound(bank, 'hit')
      if (wrongChanged) playSound(bank, 'wrong')
      if (previous.phase === 'playing' && state.phase === 'success') {
        playSound(bank, 'success')
      }
      if (previous.phase === 'playing' && state.phase === 'failure') {
        playSound(bank, 'failure')
      }
      if (
        state.moveToken !== previous.moveToken
        && !hitChanged
        && !wrongChanged
        && state.phase === 'playing'
      ) {
        playSound(bank, 'move')
      }
    }

    previousRef.current = state
  }, [state.hitVersion, state.moveToken, state.phase, state.wrongVersion])
}
