import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface messageProps {
  message: string
  color: string
}

interface terminalMessageProps {
  terminalMessage: messageProps[]
  clear: boolean
}

const initialState: terminalMessageProps = {
  terminalMessage: [],
  clear: false
}

const terminalMessageSlice = createSlice({
  name: 'terminalMessage',
  initialState,
  reducers: {
    setClearTerminal(state, action: PayloadAction<boolean>) {
      state.clear = action.payload
    },
    setTerminalMessage(state, action: PayloadAction<{ message: string; color: string }>) {
      state.terminalMessage.push(action.payload)
    },
    setClearTerminalMessage(state) {
      state.terminalMessage = []
    }
  }
})

export type { terminalMessageProps, messageProps }
export const { setClearTerminal, setTerminalMessage, setClearTerminalMessage } =
  terminalMessageSlice.actions
export default terminalMessageSlice.reducer
