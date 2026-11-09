import { lazy } from 'react'
import icon from './assets/icon.webp'
import type { ProgramDefinition } from '../types'

const BruteForce = lazy(() => import('./BruteForce').then((module) => ({
  default: module.BruteForce,
})))

export const bruteForceProgram = {
  id: 'bruteforce',
  name: 'BruteForce.exe',
  displayLines: ['BruteForce.e', 'xe'],
  icon,
  component: BruteForce,
} satisfies ProgramDefinition
