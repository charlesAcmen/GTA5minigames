import { programs } from '../games/registry'

export type ShellView = 'desktop' | 'computer' | 'external' | 'game'
export type ComputerItem = 'local' | 'network' | 'external'

export type ShellState = {
  view: ShellView
  desktopSelected: boolean
  computerSelected: ComputerItem | null
  programSelected: string | null
  activeProgramId: string | null
}

export type ShellAction =
  | { type: 'select-desktop' }
  | { type: 'open-computer' }
  | { type: 'select-computer'; item: ComputerItem }
  | { type: 'move-computer'; direction: 1 | -1 }
  | { type: 'open-external' }
  | { type: 'select-program'; programId: string }
  | { type: 'move-program'; direction: 1 | -1 }
  | { type: 'open-program'; programId: string }
  | { type: 'back' }
  | { type: 'clear-selection' }

export const computerItems: readonly ComputerItem[] = ['local', 'network', 'external']

export const initialShellState: ShellState = {
  view: 'desktop',
  desktopSelected: false,
  computerSelected: null,
  programSelected: null,
  activeProgramId: null,
}

export function shellReducer(state: ShellState, action: ShellAction): ShellState {
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
    case 'move-program': {
      const available = programs.filter((program) => program.component)
      if (available.length === 0) return state
      if (state.programSelected === null) {
        const first = action.direction === 1 ? available[0] : available.at(-1) ?? available[0]
        return { ...state, programSelected: first.id }
      }
      const current = Math.max(0, available.findIndex((program) => program.id === state.programSelected))
      const next = (current + action.direction + available.length) % available.length
      return { ...state, programSelected: available[next].id }
    }
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
