import { lazy } from 'react'
import icon from './assets/icon.webp'
import type { ProgramDefinition } from '../types'

const DataCrack = lazy(() => import('./DataCrack').then((module) => ({
  default: module.DataCrack,
})))

export const dataCrackProgram = {
  id: 'datacrack',
  name: 'DataCrack.exe',
  displayLines: ['DataCrack.e', 'xe'],
  icon,
  component: DataCrack,
} satisfies ProgramDefinition
