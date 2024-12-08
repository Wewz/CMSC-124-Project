import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface codeRunningProps {
  status: boolean
  success: boolean
}

const initialState: codeRunningProps = {
  status: false,
  success: false
}

const codeRunningSlice = createSlice({
  name: 'code',
  initialState,
  reducers: {
    setRun(state) {
      state.status = true
    },
    setSuccess(state) {
      state.success = true
    },
    clearSuccess(state) {
      state.success = false
    },
    stopRun(state) {
      state.status = false
    }
  }
})

export type { codeRunningProps }
export const { setRun, stopRun, setSuccess, clearSuccess } = codeRunningSlice.actions
export default codeRunningSlice.reducer
