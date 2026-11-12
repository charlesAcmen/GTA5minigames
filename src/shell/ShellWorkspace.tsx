import type { Dispatch, ReactNode } from 'react'
import { programs } from '../games/registry'
import { DeviceIcon, DriveIcon, NetworkIcon } from './SystemIcons'
import type { ComputerItem, ShellAction, ShellState } from './shellState'
import styles from './DesktopShell.module.css'

type ShellWorkspaceProps = {
  state: ShellState
  dispatch: Dispatch<ShellAction>
}

export function ShellWorkspace({ state, dispatch }: ShellWorkspaceProps) {
  const showComputer = state.view === 'computer' || state.view === 'external'

  return (
    <>
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
              onSelect={() => dispatch({ type: 'select-computer', item: 'local' })}
              icon={<DriveIcon className={styles.driveIcon} />}
            />
            <div className={`${styles.divider} ${styles.dividerOne}`} />
            <ComputerEntry
              id="network"
              label={<>Global<br />Network</>}
              selected={state.computerSelected === 'network'}
              onSelect={() => dispatch({ type: 'select-computer', item: 'network' })}
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
    </>
  )
}

type ComputerEntryProps = {
  id: ComputerItem
  label: ReactNode
  icon: ReactNode
  selected: boolean
  onSelect: () => void
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
