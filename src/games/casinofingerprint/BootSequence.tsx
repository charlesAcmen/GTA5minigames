import type { CSSProperties } from 'react'
import closed from './assets/lester-closed.png'
import open from './assets/lester-open.png'
import { BootDesktop } from './BootDesktop'
import { BOOT_CUES as cues, bootTimeline } from './bootTimeline'
import styles from './CasinoFingerprint.module.css'

/** Reference seconds, scaled independently of the slowed source video's rate. */
export function BootSequence({ elapsedMs }: { elapsedMs: number }) {
  const { t, burst, progress } = bootTimeline(elapsedMs)
  const frame = Math.floor(t * 12)
  return <div className={styles.bootSequence} role="status" aria-label="Initializing fingerprint scanner">
    {t < cues.windows && <div className={styles.bootBlack} />}
    {t >= cues.emblem && t < cues.black && <div className={styles.bootEmblem} style={{ opacity: t > cues.fade ? .35 : 1 }}>
      <div className={styles.lesterFrames} data-mouth={Math.floor((t - cues.emblem) / .7) % 2 === 0 ? 'closed' : 'open'}><img src={closed} alt="" /><img src={open} alt="" /></div>
      {t >= cues.box && t < cues.erase && <div className={styles.bootProgress}>
        <span style={{ visibility: t < cues.label ? 'hidden' : 'visible' }}>INITIALIZING{'.'.repeat(1 + Math.floor(t * 2) % 3)}</span>
        <div className={styles.progress}><i style={{ width: `${progress * 100}%` }} /></div>
      </div>}
    </div>}
    {t >= cues.windows && t < cues.board && <BootDesktop time={(t - cues.windows) / (cues.board - cues.windows) * 13} />}
    {burst && <div className={styles.bootTear} data-kind={burst} style={{ '--shift': `${frame % 3 * 13}px` } as CSSProperties} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => <i key={i} style={{ top: `${(frame * 17 + i * 21) % 90}%`, height: `${i === 0 ? 28 : 4 + (frame + i) % 14}%`, background: burst === 'erase' ? '#073c0a' : ['#1600dc', '#7850ec', '#dfed16', '#c6adea', '#100994'][(frame + i) % 5] }} />)}
    </div>}
  </div>
}


