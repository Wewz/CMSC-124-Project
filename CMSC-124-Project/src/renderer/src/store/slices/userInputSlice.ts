import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserInputState {
  variable: string | null
  value: string | null
  ready: boolean
  get: boolean
}

const initialState: UserInputState = {
  variable: null,
  value: null,
  ready: false,
  get: false
}

const userInputSlice = createSlice({
  name: 'userInput',
  initialState,
  reducers: {
    requestUserInput: (state, action: PayloadAction<string>) => {
      state.variable = action.payload
      state.ready = false
      state.value = null
      state.get = true
    },
    provideUserInput: (state, action: PayloadAction<string>) => {
      state.value = action.payload
      state.ready = true
      state.get = false
    },
    clearUserInput: (state) => {
      state = initialState
    }
  }
})

export type { UserInputState }
export const { requestUserInput, provideUserInput, clearUserInput } = userInputSlice.actions
export default userInputSlice.reducer
