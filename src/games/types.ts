import type { ComponentType, LazyExoticComponent } from 'react'
import type { GameRuntime } from '../runtime/GameRuntime'

export type GameProps = {
  runtime: GameRuntime
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
