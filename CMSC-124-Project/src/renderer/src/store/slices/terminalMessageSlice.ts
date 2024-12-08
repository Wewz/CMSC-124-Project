import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface terminalMessageProps {
  message: string
  color: string
  showMessage: boolean
  messageShown: boolean
  clear: boolean
}

const initialState: terminalMessageProps = {
  message: '',
  color: '',
  showMessage: false,
  messageShown: false,
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
      state.message = action.payload.message
      state.color = action.payload.color
      state.showMessage = true
    },
    setClearTerminalMessage(state) {
      state.message = ''
      state.showMessage = false
      state.messageShown = true
    }
  }
})

export type { terminalMessageProps }
export const { setClearTerminal, setTerminalMessage, setClearTerminalMessage } =
  terminalMessageSlice.actions
export default terminalMessageSlice.reducer
