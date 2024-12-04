import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ErrorType } from '@renderer/interfaces/interfaces'

interface errorsProps {
  errors: ErrorType[]
  showErrors: boolean
}

const initialState: errorsProps = {
  errors: [],
  showErrors: false
}

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    setErrors(state, action: PayloadAction<ErrorType[]>) {
      state.errors = [...state.errors, ...action.payload] // Append new errors
    },
    setClearErrors(state) {
      state.errors = []
    },
    setShowErrors(state, action: PayloadAction<boolean>) {
      state.showErrors = action.payload
    }
  }
})

export type { errorsProps }
export const { setErrors, setClearErrors, setShowErrors } = errorSlice.actions
export default errorSlice.reducer
