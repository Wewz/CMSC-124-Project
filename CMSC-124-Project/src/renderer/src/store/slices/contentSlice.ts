import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface contentProps {
  text: string
}

const initialState: contentProps = {
  text: ''
}

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setContent(state, action: PayloadAction<string>) {
      state.text = action.payload
    }
  }
})

export type { contentProps }
export const { setContent } = contentSlice.actions
export default contentSlice.reducer
