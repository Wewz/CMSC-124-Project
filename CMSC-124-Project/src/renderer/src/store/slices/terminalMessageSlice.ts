import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface messageProps {
  message: string
  color: string
  messageShown: boolean
}

interface terminalMessagesProps {
  messages: messageProps[]
  clear: boolean
}

const initialState: terminalMessagesProps = {
  messages: [],
  clear: false
}

const terminalMessageSlice = createSlice({
  name: 'terminalMessage',
  initialState,
  reducers: {
    setClearTerminal(state, action: PayloadAction<boolean>) {
      state.clear = action.payload
    },
    addTerminalMessage(state, action: PayloadAction<messageProps>) {
      state.messages = [...state.messages, action.payload]
    },
    setClearTerminalMessage(state) {
      state.messages = []
    },
    setShownMessages(state, action: PayloadAction<number>) {
      state.messages[action.payload].messageShown = true
    }
  }
})

export type { terminalMessagesProps, messageProps }
export const { setClearTerminal, addTerminalMessage, setClearTerminalMessage, setShownMessages } =
  terminalMessageSlice.actions
export default terminalMessageSlice.reducer
