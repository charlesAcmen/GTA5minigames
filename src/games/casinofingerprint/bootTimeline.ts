import { BOOT_MS } from './logic'

// Source timestamps from CASINO_FINGERPRINT_BOOT_REFERENCE.md, not wall time.
export const BOOT_CUES = {
  end: 16.5, entry: .35, emblem: 2.35, box: 3, label: 3.4,
  fill: 4.7, full: 7.5, erase: 9.3, eraseEnd: 9.9, fade: 9.8,
  black: 10.5, windows: 12.7, secondWindow: 13.7, terminals: 14.5,
  tear: 15.65, tearEnd: 16.15, board: 16.2, content: 16.38,
} as const

export function bootTimeline(elapsedMs: number) {
  // Omit the slowed reference's black hold. Preserve the speed of both sides
  // instead of redistributing the removed wait across the remaining animation.
  const omittedHold = BOOT_CUES.windows - BOOT_CUES.black
  const playbackEnd = BOOT_CUES.end - omittedHold
  const playback = Math.max(0, Math.min(playbackEnd, elapsedMs / BOOT_MS * playbackEnd))
  const t = playback < BOOT_CUES.black ? playback : playback + omittedHold
  const c = BOOT_CUES
  return {
    t,
    stage: t < c.terminals ? 'hidden' : t < c.board ? 'terminal' : t < c.content ? 'frame' : 'content',
    burst: t >= c.entry && t < c.emblem ? 'entry' : t >= c.erase && t < c.eraseEnd ? 'erase' : t >= c.tear && t < c.tearEnd ? 'reveal' : '',
    progress: Math.max(0, Math.min(1, (t - c.fill) / (c.full - c.fill))),
  }
}

