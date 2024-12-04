import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ErrorType } from '@renderer/interfaces/interfaces'

interface terminalMessageProps {
  errors: ErrorType[]
  userInput: {
    getInput: boolean
    prompt: string
    input: string
  }
  clear: boolean
}

const initialState: terminalMessageProps = {
  errors: [],
  userInput: {
    getInput: false,
    prompt: '',
    input: ''
  },
  clear: false
}

const terminalMessageSlice = createSlice({
  name: 'terminalMessage',
  initialState,
  reducers: {
    setTerminalErrors(state, action: PayloadAction<ErrorType[]>) {
      state.errors = action.payload
    },
    setGetInput(state, action: PayloadAction<{ getInput: boolean; prompt: string }>) {
      state.userInput.getInput = action.payload.getInput
      state.userInput.prompt = action.payload.prompt
    },
    setUserInput(state, action: PayloadAction<string>) {
      state.userInput.input = action.payload
    },
    setClearTerminal(state, action: PayloadAction<boolean>) {
      state.clear = action.payload
    }
  }
})

export type { terminalMessageProps }
export const { setTerminalErrors, setGetInput, setUserInput, setClearTerminal } =
  terminalMessageSlice.actions
export default terminalMessageSlice.reducer
