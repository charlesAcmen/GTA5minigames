import { lazy } from 'react'
import type { ProgramDefinition } from '../types'
import icon from './assets/icon.svg'

const VoltLab = lazy(() => import('./VoltLab').then((module) => ({ default: module.VoltLab })))

export const voltLabProgram = {
  id: 'voltlab',
  name: 'VOLTlab.exe',
  displayLines: ['VOLTlab.', 'exe'],
  icon,
  component: VoltLab,
} satisfies ProgramDefinition

