import { bruteForceProgram } from './bruteforce'
import { hackConnectProgram } from './hackconnect'
import type { ProgramDefinition } from './types'

export const programs: readonly ProgramDefinition[] = [
  hackConnectProgram,
  bruteForceProgram,
]

export function findProgram(programId: string | null) {
  return programs.find((program) => program.id === programId)
}
