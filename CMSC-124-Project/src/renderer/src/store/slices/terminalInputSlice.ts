import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface TerminalInputState {
  input: string | null
}

const initialState: TerminalInputState = {
  input: null
}

const termianlInputSlice = createSlice({
  name: 'terminalInput',
  initialState,
  reducers: {
    getUserInput: (state, action: PayloadAction<string>) => {
      state.input = action.payload
    },
    clearInput: (state) => {
      state.input = null
    }
  }
})

export type { TerminalInputState }
export const { getUserInput, clearInput } = termianlInputSlice.actions
export default termianlInputSlice.reducer
