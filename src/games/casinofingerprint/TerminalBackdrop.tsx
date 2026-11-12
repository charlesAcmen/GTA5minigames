import { memo, useEffect, useRef } from 'react'
import type { GameRuntime } from '../../runtime/GameRuntime'
import styles from './CasinoFingerprint.module.css'

const code = [
  'using LibIAA.Runtime;', 'using LibIAA.Cryptography;', 'using LibIAA.Communications;', '',
  'namespace All.Secure.Bootstrapper {', '', '   internal class Bootstrapper : IDisplayBootstrapper {',
  '       private static readonly GpsTracker _tracker;', '       private static readonly GpsDisplay _display;', '',
  '       public Bootstrapper() {', '', '          _tracker = new GpsTracker(',
  '              36.42459433,    224.00258113,', '              58.91471012,    224.42613103,',
  '              162.91923023,   7400.52673491,', '             -1715.4634334,    2702.00258113);',
  '       }', '   }', '}',
]

// Independent canvas: hundreds of tiny terminal marks do not become React nodes
// or randomize whenever the game clock updates. Redraw at 10 Hz, stop on exit.
export const TerminalBackdrop = memo(function TerminalBackdrop({ runtime }: { runtime: GameRuntime }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || runtime.signal.aborted) return
    let frame = 0
    let last = -Infinity
    const start = performance.now()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const line = (x: number, y: number, w: number, h: number, color = '#626663') => {
      ctx.strokeStyle = color
      ctx.strokeRect(x + 0.5, y + 0.5, w, h)
    }
    const terminal = (x: number, y: number, w: number, h: number, cyan: boolean, tick: number, fixed = false) => {
      ctx.fillStyle = '#030504'
      ctx.fillRect(x, y, w, h)
      line(x, y, w, h)
      if (!fixed) line(x + 4, y + 4, w - 8, h - 8, '#202b29')
      ctx.fillStyle = cyan ? '#73c8c0' : '#a4a8a1'
      ctx.font = '7px Consolas, monospace'
      const lineHeight = fixed ? 11 : 10
      const lines = fixed ? code.length : Math.floor((h - 22) / lineHeight)
      const offset = fixed ? 0 : Math.floor(tick / 24)
      ctx.save()
      ctx.beginPath()
      ctx.rect(x + 6, y + 6, w - 12, h - 12)
      ctx.clip()
      for (let i = 0; i < lines; i++) ctx.fillText(code[(i + offset) % code.length], x + 9, y + 15 + i * lineHeight)
      ctx.restore()
      if (fixed) return
      ctx.fillStyle = cyan ? '#9adbd4' : '#686b62'
      ctx.fillText(`0x${(0x1fba37 + Math.floor(tick / 3) * 97).toString(16)}  ::  STREAM_OPEN`, x + 9, y + h - 12)
      if (tick % 10 < 5) ctx.fillRect(x + 242, y + h - 17, 4, 6)
    }
    const draw = (now: number) => {
      if (runtime.signal.aborted) return
      if (!reducedMotion) frame = requestAnimationFrame(draw)
      if (now - last < 100) return
      last = now
      const tick = Math.floor((now - start) / 100)
      ctx.fillStyle = '#030504'
      ctx.fillRect(0, 0, 1280, 720)
      ctx.lineWidth = 1
      line(8, 8, 1264, 692, '#303c37')
      line(10, 10, 1260, 27)
      ctx.font = '9px monospace'
      ctx.fillStyle = '#565d57'
      const navSlots = [
        { label: 'MODE', x: 16, width: 100 },
        { label: 'CONNECTOR', x: 119, width: 100 },
        { label: 'RESET', x: 222, width: 46 },
        { label: 'SIGNAL', x: 281, width: 66 },
      ]
      for (const slot of navSlots) {
        ctx.fillText(slot.label, slot.x + 12, 27)
        line(slot.x, 10, slot.width, 27, '#4e574f')
      }
      for (let i = 0; i < 36; i++) {
        ctx.fillStyle = i < 30 + Math.sin(tick / 11) * 4 ? '#777b71' : '#1d2520'
        ctx.fillRect(376 + i * 6, 15, 3, 17)
      }
      ctx.fillStyle = '#9aa49a'
      for (let i = 0; i < 4; i++) ctx.fillRect(1185 + i * 5, 29 - (i + 1) * 4, 3, (i + 1) * 4)
      ctx.strokeStyle = '#9aa49a'
      ctx.strokeRect(1211.5, 16.5, 36, 13)
      ctx.fillRect(1248, 20, 3, 6)
      ctx.fillStyle = '#9aa49a'
      ctx.fillRect(1214, 19, 19, 8)
      terminal(16, 110, 475, 290, false, tick, true)
      terminal(702, 94, 554, 291, false, tick + 10)

      // Partly occluded explorer, deliberately visible down the left edge.
      ctx.fillStyle = '#030504'
      ctx.fillRect(26, 302, 505, 365)
      line(26, 302, 505, 365)
      line(31, 307, 495, 355, '#38403b')
      ctx.font = '8px monospace'
      ctx.fillStyle = '#91938b'
      ctx.fillText('Expander', 36, 319)
      ctx.fillText('Device       Fastboot       AV Mode', 36, 341)
      line(32, 325, 491, 25)
      ctx.fillText('Quick access           ▼', 36, 369)
      for (const [i, label] of ['Devices', 'Recent', 'Shared', 'Offline', 'Storage'].entries()) ctx.fillText(label, 36, 395 + i * 23)
      ctx.fillStyle = '#979a8c'
      ctx.fillRect(32, 636, 491, 14)
      ctx.fillStyle = '#20261d'
      ctx.fillText('Total space: 500.5 GB', 373, 647)
      terminal(1025, 286, 240, 365, true, tick + 30)
      ctx.font = '7px monospace'
      ctx.fillStyle = '#559f96'
      ctx.fillText('bash -3.1>> fetch SCP -NVC', 1040, 301)
      ctx.fillStyle = '#3d6c65'
      ctx.font = '6px monospace'
      for (let i = 0; i < 3; i++) {
        ctx.fillText(`${String(i * 8).padStart(3, '0')} : ${(tick * 31 + i * 4703).toString(16).padStart(8, '0')}`, 1052, 666 + i * 9)
      }
    }
    const stop = () => cancelAnimationFrame(frame)
    frame = requestAnimationFrame(draw)
    runtime.signal.addEventListener('abort', stop, { once: true })
    return () => { stop(); runtime.signal.removeEventListener('abort', stop) }
  }, [runtime])
  return <canvas ref={ref} width={1280} height={720} className={styles.backdrop} aria-hidden="true" />
})
