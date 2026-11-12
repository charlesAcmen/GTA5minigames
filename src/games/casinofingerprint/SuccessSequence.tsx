import type { CSSProperties } from 'react'
import { successTimeline } from './successTimeline'
import styles from './SuccessSequence.module.css'

export function SuccessSequence({ elapsedMs }: { elapsedMs: number }) {
  const frame = successTimeline(elapsedMs)
  return <div className={styles.sequence} data-stage={frame.stage} role="status" aria-label="Hack success. Returning to desktop.">
    <div className={styles.ghosts} aria-hidden="true" style={{ '--shift': `${frame.shift}px` } as CSSProperties}>
      {[0, 1, 2].map(i => <div key={i} className={styles.window}>
        <header>CONNECTION TIMEOUT <span>CLONE TARGET</span></header>
        <div className={styles.components}><b>COMPONENTS</b>{Array.from({ length: 8 }, (_, j) => <i key={j} />)}</div>
        <div className={styles.target} /><footer>DECYPHERED SIGNALS</footer>
      </div>)}
    </div>
    <div className={styles.bands} aria-hidden="true">
      {frame.bands.map(([top, height, color], i) => <i key={i} style={{
        top: `${top}%`, height: `${height}%`, background: color,
        '--cut': `${12 + (frame.index * 13 + i * 19) % 65}%`,
        transform: `translateX(${i % 2 ? -frame.shift : frame.shift}px)`,
      } as CSSProperties} />)}
    </div>
    <strong className={styles.message} data-text={frame.text} style={{ color: frame.textColor }}>HACK SUCCESS</strong>
    <span className={styles.reducedMessage}>HACK SUCCESS</span>
  </div>
}
