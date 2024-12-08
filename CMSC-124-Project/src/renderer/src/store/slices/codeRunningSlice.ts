import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface codeRunningProps {
  status: boolean
}

const initialState: codeRunningProps = {
  status: false
}

const codeRunningSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setRun(state) {
      state.status = true
    },
    stopRun(state) {
      state.status = false
    }
  }
})

export type { codeRunningProps }
export const { setRun, stopRun } = codeRunningSlice.actions
export default codeRunningSlice.reducer
