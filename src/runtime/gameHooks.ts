import { useEffect, useRef } from 'react'
import type { GameRuntime } from './GameRuntime'

const DEFAULT_MAX_DELTA_MS = Number.POSITIVE_INFINITY

export function useGameLoop(
  runtime: GameRuntime,
  onFrame: (deltaMs: number) => void,
  active = true,
  maxDeltaMs = DEFAULT_MAX_DELTA_MS,
) {
  const callbackRef = useRef(onFrame)
  callbackRef.current = onFrame

  useEffect(() => {
    if (!active || runtime.signal.aborted) return

    let frameId = 0
    let lastTime = performance.now()

    const stop = () => cancelAnimationFrame(frameId)
    const animate = (now: number) => {
      if (runtime.signal.aborted) return
      const elapsed = Math.min(maxDeltaMs, Math.max(0, now - lastTime))
      lastTime = now
      callbackRef.current(elapsed)
      frameId = requestAnimationFrame(animate)
    }

    runtime.signal.addEventListener('abort', stop, { once: true })
    frameId = requestAnimationFrame(animate)

    return () => {
      runtime.signal.removeEventListener('abort', stop)
      stop()
    }
  }, [active, maxDeltaMs, runtime])
}

export function useGameKeyDown(
  runtime: GameRuntime,
  onKeyDown: (event: KeyboardEvent) => void,
) {
  const callbackRef = useRef(onKeyDown)
  callbackRef.current = onKeyDown

  useEffect(() => {
    if (runtime.signal.aborted) return

    const handleKeyDown = (event: KeyboardEvent) => callbackRef.current(event)
    window.addEventListener('keydown', handleKeyDown)
    const stop = () => window.removeEventListener('keydown', handleKeyDown)
    runtime.signal.addEventListener('abort', stop, { once: true })

    return () => {
      runtime.signal.removeEventListener('abort', stop)
      stop()
    }
  }, [runtime])
}
