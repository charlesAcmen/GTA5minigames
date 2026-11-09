import { useCallback, useEffect, useReducer, useState } from 'react'
import desktopWallpaper from '../assets/desktop/windows.jpg'
import { findProgram, programs } from '../games/registry'
import { DeviceIcon, DriveIcon, NetworkIcon } from './SystemIcons'
import styles from './DesktopShell.module.css'

const STAGE_WIDTH = 1280
const STAGE_HEIGHT = 720

type View = 'desktop' | 'computer' | 'external' | 'game'
type ComputerItem = 'local' | 'network' | 'external'

type ShellState = {
  view: View
  desktopSelected: boolean
  computerSelected: ComputerItem | null
  programSelected: string | null
  activeProgramId: string | null
}

type ShellAction =
  | { type: 'select-desktop' }
  | { type: 'open-computer' }
  | { type: 'select-computer'; item: ComputerItem }
  | { type: 'move-computer'; direction: 1 | -1 }
  | { type: 'open-external' }
  | { type: 'select-program'; programId: string }
  | { type: 'open-program'; programId: string }
  | { type: 'back' }
  | { type: 'clear-selection' }

const computerItems: readonly ComputerItem[] = ['local', 'network', 'external']

const initialShellState: ShellState = {
  view: 'desktop',
  desktopSelected: false,
  computerSelected: null,
  programSelected: null,
  activeProgramId: null,
}

function shellReducer(state: ShellState, action: ShellAction): ShellState {
  switch (action.type) {
    case 'select-desktop':
      return { ...state, desktopSelected: true }
    case 'open-computer':
      return { ...state, view: 'computer', desktopSelected: true, computerSelected: null }
    case 'select-computer':
      return { ...state, computerSelected: action.item }
    case 'move-computer': {
      if (state.computerSelected === null) {
        const first = action.direction === 1 ? computerItems[0] : computerItems.at(-1) ?? computerItems[0]
        return { ...state, computerSelected: first }
      }
      const current = computerItems.indexOf(state.computerSelected)
      const next = (current + action.direction + computerItems.length) % computerItems.length
      return { ...state, computerSelected: computerItems[next] }
    }
    case 'open-external':
      return { ...state, view: 'external', computerSelected: 'external', programSelected: null }
    case 'select-program':
      return { ...state, programSelected: action.programId }
    case 'open-program':
      return {
        ...state,
        view: 'game',
        programSelected: action.programId,
        activeProgramId: action.programId,
      }
    case 'back':
      if (state.view === 'game') return { ...state, view: 'external', activeProgramId: null }
      if (state.view === 'external') return { ...state, view: 'computer', programSelected: null }
      if (state.view === 'computer') return { ...initialShellState, desktopSelected: true }
      return state
    case 'clear-selection':
      if (state.view === 'desktop') return { ...state, desktopSelected: false }
      if (state.view === 'computer') return { ...state, computerSelected: null }
      if (state.view === 'external') return { ...state, programSelected: null }
      return state
  }
}

function useStageScale() {
  const [scale, setScale] = useState(() => Math.min(
    window.innerWidth / STAGE_WIDTH,
    window.innerHeight / STAGE_HEIGHT,
  ))

  useEffect(() => {
    const updateScale = () => setScale(Math.min(
      window.innerWidth / STAGE_WIDTH,
      window.innerHeight / STAGE_HEIGHT,
    ))
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return scale
}

export function DesktopShell() {
  const [state, dispatch] = useReducer(shellReducer, initialShellState)
  const scale = useStageScale()
  const exitGame = useCallback(() => dispatch({ type: 'back' }), [])

  useEffect(() => {
    if (state.view === 'game') return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dispatch({ type: 'back' })
        return
      }

      if (state.view === 'desktop') {
        if (event.key.startsWith('Arrow')) {
          event.preventDefault()
          dispatch({ type: 'select-desktop' })
        } else if (event.key === 'Enter' && state.desktopSelected) {
          event.preventDefault()
          dispatch({ type: 'open-computer' })
        }
        return
      }

      if (state.view === 'computer') {
        if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
          event.preventDefault()
          dispatch({ type: 'move-computer', direction: -1 })
        } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
          event.preventDefault()
          dispatch({ type: 'move-computer', direction: 1 })
        } else if (event.key === 'Enter' && state.computerSelected === 'external') {
          event.preventDefault()
          dispatch({ type: 'open-external' })
        }
        return
      }

      if (state.view === 'external') {
        if (event.key.startsWith('Arrow')) {
          event.preventDefault()
          const firstLaunchable = programs.find((program) => program.component)
          if (firstLaunchable) {
            dispatch({ type: 'select-program', programId: firstLaunchable.id })
          }
        } else if (event.key === 'Enter') {
          const program = findProgram(state.programSelected)
          if (!program?.component) return
          event.preventDefault()
          dispatch({ type: 'open-program', programId: program.id })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state])

  const showComputer = state.view === 'computer' || state.view === 'external'
  const activeProgram = findProgram(state.activeProgramId)
  const ActiveGame = activeProgram?.component

  return (
    <main className={styles.viewport}>
      <div
        className={styles.stage}
        style={{
          backgroundImage: `url(${desktopWallpaper})`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dispatch({ type: 'clear-selection' })
        }}
      >
        <button
          className={`${styles.desktopIcon} ${state.desktopSelected ? styles.selected : ''}`}
          type="button"
          aria-label="My Computer"
          onClick={() => dispatch({ type: 'open-computer' })}
        >
          <DriveIcon className={styles.desktopDrive} />
          <span>My<br />Computer</span>
        </button>

        {showComputer ? (
          <section className={styles.computerWindow} aria-label="My Computer window">
            <div className={styles.computerContent}>
              <ComputerEntry
                id="local"
                label="Local (C:)"
                selected={state.computerSelected === 'local'}
                icon={<DriveIcon className={styles.driveIcon} />}
              />
              <div className={`${styles.divider} ${styles.dividerOne}`} />
              <ComputerEntry
                id="network"
                label={<>Global<br />Network</>}
                selected={state.computerSelected === 'network'}
                icon={<NetworkIcon className={styles.networkIcon} />}
              />
              <div className={`${styles.divider} ${styles.dividerTwo}`} />
              <ComputerEntry
                id="external"
                label={<>External<br />Device (J:)</>}
                selected={state.computerSelected === 'external'}
                onSelect={() => dispatch({ type: 'open-external' })}
                icon={<DeviceIcon className={styles.deviceIcon} />}
              />
            </div>
          </section>
        ) : null}

        {state.view === 'external' ? (
          <section className={styles.externalWindow} aria-label="External Device programs">
            <div className={styles.programGrid}>
              {programs.map((program) => {
                const launchable = Boolean(program.component)
                return (
                  <button
                    className={`${styles.programIcon} ${state.programSelected === program.id ? styles.programSelected : ''}`}
                    key={program.id}
                    type="button"
                    disabled={!launchable}
                    tabIndex={launchable ? 0 : -1}
                    aria-label={program.name}
                    aria-disabled={!launchable}
                    onClick={() => {
                      if (launchable) dispatch({ type: 'open-program', programId: program.id })
                    }}
                  >
                    <span className={styles.programIconFrame}>
                      <img src={program.icon} alt="" />
                    </span>
                    <span className={styles.programLabel}>
                      {program.displayLines[0]}<br />{program.displayLines[1]}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}

        {state.view === 'game' && ActiveGame ? <ActiveGame onExit={exitGame} /> : null}
      </div>
    </main>
  )
}

type ComputerEntryProps = {
  id: ComputerItem
  label: React.ReactNode
  icon: React.ReactNode
  selected: boolean
  onSelect?: () => void
}

function ComputerEntry({ id, label, icon, selected, onSelect }: ComputerEntryProps) {
  return (
    <button
      className={`${styles.computerEntry} ${styles[id]} ${selected ? styles.entrySelected : ''}`}
      type="button"
      onClick={onSelect}
    >
      <span className={styles.computerIconFrame}>{icon}</span>
      <span className={styles.computerLabel}>{label}</span>
    </button>
  )
}
