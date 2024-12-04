import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SymbolTableEntry } from '@renderer/interfaces/interfaces'

interface symbolTableProps {
  symbolTable: Record<string, SymbolTableEntry>
}

const initialState: symbolTableProps = {
  symbolTable: {}
}

const symbolTableSlice = createSlice({
  name: 'symbolTable',
  initialState,
  reducers: {
    setSymbolTable(state, action: PayloadAction<Record<string, SymbolTableEntry>>) {
      state.symbolTable = action.payload
    }
  }
})

export type { symbolTableProps }
export const { setSymbolTable } = symbolTableSlice.actions
export default symbolTableSlice.reducer
