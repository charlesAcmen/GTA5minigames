import type { ComponentType, LazyExoticComponent } from 'react'

export type GameProps = {
  onExit: () => void
}

export type GameComponent =
  | ComponentType<GameProps>
  | LazyExoticComponent<ComponentType<GameProps>>

export type ProgramDefinition = {
  id: string
  name: string
  displayLines: readonly [string, string]
  icon: string
  component?: GameComponent
}
