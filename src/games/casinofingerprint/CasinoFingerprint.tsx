import { useEffect, useReducer, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useGameAudio } from '../../audio/useGameAudio'
import { useGameKeyDown, useGameLoop } from '../../runtime/gameHooks'
import type { GameProps } from '../types'
import { pieceImage, prints } from './assets'
import decoyReference from './assets/decoy-reference.png'
import { BootSequence } from './BootSequence'
import { bootTimeline } from './bootTimeline'
import { TerminalBackdrop } from './TerminalBackdrop'
import { SuccessSequence } from './SuccessSequence'
import { SUCCESS_EXIT_MS, successTimeline } from './successTimeline'
import { ATTEMPTS, PROCESS_MS, SCRAMBLE_MS, createInitialState, fingerprintReducer, formatTime } from './logic'
import styles from './CasinoFingerprint.module.css'

function StatusLights({ count = 3 }: { count?: number }) {
  return <span className={styles.statusLights} aria-hidden="true">{Array.from({ length: count }, (_, i) => <i key={i} style={{ '--lamp': i } as CSSProperties} />)}</span>
}
function BarTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.barTitle}><span>{children}</span></h2>
}

const segments = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg']
const paths = [
  'M3 1H17L15 3H5Z', 'M17 2V14L15 12V4Z', 'M17 16V28L15 26V18Z',
  'M3 29H17L15 27H5Z', 'M1 16V28L3 26V18Z', 'M1 2V14L3 12V4Z', 'M3 15L5 13H14L16 15L14 17H5Z',
]
const directions: Record<string, 'left' | 'right' | 'up' | 'down' | undefined> = {
  arrowleft: 'left', arrowright: 'right', arrowup: 'up', arrowdown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
}
function DigitalClock({ value }: { value: string }) {
  return <svg className={styles.clock} viewBox="0 0 138 31" role="img" aria-label={`Connection timeout ${value}`}>
    {value.split('').map((character, i) => {
      const x = i * 18 - (i > 2 ? 7 : 0) - (i > 5 ? 7 : 0)
      return character === ':' ? <g key={i} transform={`translate(${x},0)`}><rect x="1" y="8" width="3" height="3" /><rect x="1" y="22" width="3" height="3" /></g>
        : <g key={i} transform={`translate(${x},0)`}>{paths.map((path, j) => <path key={j} d={path} opacity={segments[Number(character)].includes('abcdefg'[j]) ? 1 : 0.055} />)}</g>
    })}
  </svg>
}

export function CasinoFingerprint({ runtime }: GameProps) {
  const [state, dispatch] = useReducer(fingerprintReducer, undefined, () => createInitialState())
  const tickRef = useRef(0)
  useGameLoop(runtime, (elapsedMs) => {
    tickRef.current += elapsedMs
    if (tickRef.current >= 32) {
      dispatch({ type: 'advance', elapsedMs: tickRef.current })
      tickRef.current = 0
    }
  }, state.phase !== 'failure' && !(state.phase === 'success' && state.phaseMs >= SUCCESS_EXIT_MS))
  useEffect(() => {
    if (state.phase === 'success' && state.phaseMs >= SUCCESS_EXIT_MS && !runtime.signal.aborted) {
      runtime.exit({ outcome: 'success' })
    }
  }, [runtime, state.phase, state.phaseMs])
  const finished = state.phase === 'success' || state.phase === 'failure'
  const outcome = state.phase === 'success' ? 'success' : 'failure'
  useGameAudio(runtime, {
    phase: finished ? outcome : 'playing', moveToken: state.moveVersion,
    hitVersion: state.hitVersion, wrongVersion: state.wrongVersion,
  })
  useGameKeyDown(runtime, (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      runtime.exit({ outcome: finished ? outcome : 'quit' })
      return
    }
    if (finished) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (!event.repeat) runtime.exit({ outcome })
      }
      return
    }
    const direction = directions[event.key.toLowerCase()]
    if (direction) {
      event.preventDefault()
      dispatch({ type: 'move', direction })
    } else if (event.key === 'Tab') {
      event.preventDefault()
      if (!event.repeat) dispatch({ type: 'submit' })
    } else if (event.key === 'Enter' || event.key === ' ') {
      // Game controls stay consistent even after clicking Run Check focuses it.
      event.preventDefault()
      if (!event.repeat) dispatch({ type: 'select', index: state.cursor })
    }
  })

  const scanning = state.phase === 'processing' || state.phase === 'match'
  const activePrint = state.sequence[state.round]
  return <section data-success={state.phase === 'success' ? successTimeline(state.phaseMs).stage : undefined} data-boot={state.phase === 'boot' ? bootTimeline(state.phaseMs).stage : undefined} className={`${styles.screen} ${state.phase === 'failure' ? styles.finished : ''}`} aria-label="Casino fingerprint scanner">
    <TerminalBackdrop runtime={runtime} />
    <div className={styles.board}>
      <div className={styles.rail} aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <span key={i}><i /><b /><i /></span>)}</div>
      <div className={`${styles.rail} ${styles.rightRail}`} aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <span key={i}><i /><b /><i /></span>)}</div>
      <section className={styles.timeout}>
        <BarTitle>CONNECTION TIMEOUT</BarTitle><small className={styles.micro}>CTP-44<br />□ 0</small>
        <DigitalClock value={formatTime(state.remainingMs)} />
      </section>
      <section className={styles.components} aria-label="Fingerprint components">
        <BarTitle>COMPONENTS</BarTitle><small className={styles.micro}>CFP-13<br />▣ ▫</small>
        <div className={`${styles.pieceGrid} ${state.phase === 'scrambling' ? styles.scrambling : ''}`}>
          {state.pieces.map((piece, index) => <button type="button" key={piece.id}
            tabIndex={-1} disabled={state.phase !== 'playing'}
            className={`${styles.piece} ${state.selected.includes(piece.id) ? styles.selected : ''} ${state.cursor === index ? styles.cursor : ''}`}
            aria-label={`Component ${index + 1}`} aria-pressed={state.selected.includes(piece.id)}
            onClick={() => dispatch({ type: 'select', index })}>
            {piece.print === -1 ? <svg className={styles.decoyTile} viewBox={`${[254, 334, 254, 254][piece.part]} ${[130, 209, 280, 350][piece.part]} 66 66`} aria-hidden="true"><image href={decoyReference} width="1034" height="536" /></svg> : <img src={pieceImage(piece.print, piece.part)} alt="" draggable={false} />}
          </button>)}
        </div>
        <div className={styles.scramble}>
          <h3><span>SCRAMBLE COUNTDOWN</span></h3>
          <div className={styles.ticks} role="meter" aria-label="Time until components reshuffle" aria-valuenow={Math.ceil(state.scrambleMs / 1000)} aria-valuemin={0} aria-valuemax={SCRAMBLE_MS / 1000}>
            {Array.from({ length: 32 }, (_, i) => <i key={i} className={i / 32 < state.scrambleMs / SCRAMBLE_MS ? styles.lit : ''} />)}
          </div>
        </div>
      </section>
      <section className={styles.targetPanel}>
        <BarTitle>CLONE TARGET</BarTitle><small className={styles.micro}>CFP-234</small>
        <div className={`${styles.targetImage} ${scanning ? styles.scanning : ''}`}>
          <img src={prints[activePrint]} alt="Target fingerprint: select its four matching components" draggable={false} />
          {scanning && <div className={styles.scanBlocks} aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--i': i, left: `${(i * 37) % 96}%`, top: `${(i * 23) % 94}%` } as CSSProperties} />)}</div>}
        </div>
        <div className={styles.attempts} role="meter" aria-label="Access attempts remaining" aria-valuenow={state.attempts} aria-valuemin={0} aria-valuemax={ATTEMPTS}>
          <h3>ACCESS<br />ATTEMPTS</h3><small><StatusLights /></small>
          {Array.from({ length: ATTEMPTS }, (_, i) => <i className={i < state.attempts ? styles.lit : ''} key={i} />)}
        </div>
        <div className={styles.spinner} aria-hidden="true"><i /><i /><i /></div>
        <div className={`${styles.targetTicks} ${scanning ? styles.verifyingTicks : ''}`} aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <span key={i}>−</span>)}</div>
      </section>
      <section className={styles.signals}>
        <BarTitle>DECYPHERED SIGNALS</BarTitle><small className={styles.micro}><StatusLights /></small>
        <div className={styles.signalGrid}>{Array.from({ length: 4 }, (_, i) => <div key={i}
          className={`${styles.signal} ${i === state.round ? styles.currentSignal : ''} ${i < state.round || (finished && outcome === 'success') ? styles.decoded : ''} ${i >= state.sequence.length ? styles.unused : ''}`}>
          {i < state.sequence.length ? <img src={prints[state.sequence[i]]} alt={i < state.round ? 'Fingerprint decoded' : 'Fingerprint pending'} /> : null}
        </div>)}</div><span className={styles.footerMicro} aria-hidden="true"><StatusLights count={7} /></span>
      </section>
    </div>
    {(state.phase === 'processing' || state.phase === 'match' || state.phase === 'wrong' || state.phase === 'scrambling') &&
      <div className={`${styles.dialog} ${state.phase === 'match' || state.phase === 'wrong' ? styles.feedback : ''}`} role="status">
        {state.phase === 'processing' || state.phase === 'scrambling' ? <>
          <span>{state.phase === 'processing' ? 'PROCESSING' : 'SCRAMBLING'}</span>
          <div className={styles.progress}><i style={{ width: `${state.phaseMs / (state.phase === 'processing' ? PROCESS_MS : 600) * 100}%` }} /></div>
        </> : <><b>{state.phase === 'match' ? '✓' : '×'}</b><div>{state.phase === 'match' ? 'SIGNAL MATCH' : 'SIGNAL MISMATCH'}<small>{state.phase === 'match' ? '(DC :: 4F)' : 'ACCESS DENIED — RETRY'}</small></div></>}
      </div>}
    {state.phase === 'boot' && <BootSequence elapsedMs={state.phaseMs} />}
    {state.phase === 'success' && <SuccessSequence elapsedMs={state.phaseMs} />}
    {state.phase === 'failure' && <div className={`${styles.result} ${styles.failure}`} role="status">
      <div className={styles.glitchBands} aria-hidden="true"><i /><i /><i /><i /></div>
      <strong>CONNECTION LOST</strong>
      <span>{state.attempts === 0 ? 'ACCESS ATTEMPTS EXHAUSTED' : 'CONNECTION TIMED OUT'}</span>
      <button data-control type="button" onClick={() => runtime.exit({ outcome })}>Return to desktop <kbd>Enter</kbd></button>
    </div>}
    {!finished && <footer className={styles.controls}>
      <span>Move Selector <span className={styles.arrowKeys} aria-label="Arrow keys"><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></span></span>
      <button data-control type="button" onClick={() => dispatch({ type: 'select', index: state.cursor })} disabled={state.phase !== 'playing'}>Select <kbd>Enter</kbd></button>
      <button data-control type="button" onClick={() => dispatch({ type: 'submit' })} disabled={state.selected.length !== 4 || state.phase !== 'playing'}>Run Check <kbd>Tab</kbd></button>
      <button data-control type="button" onClick={() => runtime.exit({ outcome: 'quit' })}>Abort Hack <kbd>Esc</kbd></button>
    </footer>}
    <div className={styles.crt} aria-hidden="true" />
  </section>
}



