import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Lexeme } from '@renderer/interfaces/interfaces'

interface lexemeProps {
  lexemes: Lexeme[]
}

const initialState: lexemeProps = {
  lexemes: []
}

const lexemeSlice = createSlice({
  name: 'lexemes',
  initialState,
  reducers: {
    setLexeme(state, action: PayloadAction<Lexeme[]>) {
      state.lexemes = action.payload
    }
  }
})

export type { lexemeProps }
export const { setLexeme } = lexemeSlice.actions
export default lexemeSlice.reducer
