import { describe, expect, it } from 'vitest'
import { programs } from '../games/registry'
import { initialShellState, shellReducer } from './shellState'

describe('shell navigation', () => {
  it('moves through the desktop, device, game, and back stack', () => {
    const computer = shellReducer(initialShellState, { type: 'open-computer' })
    expect(computer.view).toBe('computer')

    const external = shellReducer(computer, { type: 'open-external' })
    expect(external.view).toBe('external')

    const game = shellReducer(external, {
      type: 'open-program',
      programId: programs[0].id,
    })
    expect(game.view).toBe('game')
    expect(game.activeProgramId).toBe(programs[0].id)

    const returned = shellReducer(game, { type: 'back' })
    expect(returned.view).toBe('external')
    expect(returned.activeProgramId).toBeNull()
  })

  it('wraps computer and program keyboard selections', () => {
    const computer = shellReducer(initialShellState, { type: 'open-computer' })
    const lastComputerItem = shellReducer(computer, {
      type: 'move-computer',
      direction: -1,
    })
    expect(lastComputerItem.computerSelected).toBe('external')

    const external = shellReducer(computer, { type: 'open-external' })
    const lastProgram = shellReducer(external, { type: 'move-program', direction: -1 })
    expect(lastProgram.programSelected).toBe(programs.at(-1)?.id)
  })
})

describe('program registry', () => {
  it('contains unique, launchable program ids', () => {
    const ids = programs.map((program) => program.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(programs.every((program) => Boolean(program.component))).toBe(true)
  })
})
