import icon from './assets/icon.webp'
import { HackConnect } from './HackConnect'
import type { ProgramDefinition } from '../types'

export const hackConnectProgram = {
  id: 'hackconnect',
  name: 'HackConnect.exe',
  displayLines: ['HackConnec', 't.exe'],
  icon,
  component: HackConnect,
} satisfies ProgramDefinition
