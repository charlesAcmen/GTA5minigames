import { lazy } from 'react'
import icon from './assets/icon.webp'
import type { ProgramDefinition } from '../types'

const HackConnect = lazy(() => import('./HackConnect').then((module) => ({
  default: module.HackConnect,
})))

export const hackConnectProgram = {
  id: 'hackconnect',
  name: 'HackConnect.exe',
  displayLines: ['HackConnec', 't.exe'],
  icon,
  component: HackConnect,
} satisfies ProgramDefinition
