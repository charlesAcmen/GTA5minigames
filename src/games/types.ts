import type { ComponentType } from 'react'

export type GameProps = {
  onExit: () => void
}

export type ProgramDefinition = {
  id: string
  name: string
  displayLines: readonly [string, string]
  icon: string
  component?: ComponentType<GameProps>
}
