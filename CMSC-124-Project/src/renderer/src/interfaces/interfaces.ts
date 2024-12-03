import { ReactNode } from 'react'

interface Lexeme {
  lexeme: string
  classification: string
  position: number
}

interface SymbolTableEntry {
  existingProperty: ReactNode
  type: string // e.g., NUMBR, NUMBAR, YARN, TROOF
  value: any // Variable value (e.g., number, string, boolean, etc.)
  args?: string[] // Function arguments
}

interface ErrorType {
  error: string
  line: number
}

export type { Lexeme, SymbolTableEntry, ErrorType }
