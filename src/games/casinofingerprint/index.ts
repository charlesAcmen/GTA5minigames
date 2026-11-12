import { lazy } from 'react'
import icon from './assets/icon.svg'
import type { ProgramDefinition } from '../types'

const CasinoFingerprint = lazy(() => import('./CasinoFingerprint').then((module) => ({ default: module.CasinoFingerprint })))

export const casinoFingerprintProgram = {
  id: 'casinofingerprint', name: 'CasinoFingerprint.exe',
  displayLines: ['CasinoPrint.', 'exe'], icon, component: CasinoFingerprint,
} satisfies ProgramDefinition
