import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface functionProps {
  name: string
  body: string
}

interface semanticsProps {
  position: number
  inputMessage: {
    getInput: boolean
    prompt: string
    userInput: string
  }
  outputMessage: {
    showOutput: boolean
    message: string
  }
  functions: functionProps[]
}

const initialState: semanticsProps = {
  position: 0,
  inputMessage: {
    getInput: false,
    prompt: '',
    userInput: ''
  },
  outputMessage: {
    showOutput: false,
    message: ''
  },
  functions: []
}

const semanticsSlice = createSlice({
  name: 'semantics',
  initialState,
  reducers: {
    setGetInput(state, action: PayloadAction<{ getInput: boolean; prompt: string }>) {
      state.inputMessage.getInput = action.payload.getInput
      state.inputMessage.prompt = action.payload.prompt
    },
    setShowOutput(state, action: PayloadAction<{ showOutput: boolean; message: string }>) {
      state.outputMessage.showOutput = action.payload.showOutput
      state.outputMessage.message = action.payload.message
    },
    setDeclaredFunction(state, action: PayloadAction<functionProps>) {
      state.functions.push(action.payload)
    },
    setClearDelcaredFunctions(state) {
      state.functions = []
    },
    setUserInput(state, action: PayloadAction<string>) {
      state.inputMessage.userInput = action.payload
    }
  }
})

export type { semanticsProps }
export const {
  setGetInput,
  setShowOutput,
  setDeclaredFunction,
  setClearDelcaredFunctions,
  setUserInput
} = semanticsSlice.actions
export default semanticsSlice.reducer
