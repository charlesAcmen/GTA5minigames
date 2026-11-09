import { bruteForceProgram } from './bruteforce'
import { dataCrackProgram } from './datacrack'
import { hackConnectProgram } from './hackconnect'
import type { ProgramDefinition } from './types'

export const programs: readonly ProgramDefinition[] = [
  hackConnectProgram,
  bruteForceProgram,
  dataCrackProgram,
]

export function findProgram(programId: string | null) {
  return programs.find((program) => program.id === programId)
}
