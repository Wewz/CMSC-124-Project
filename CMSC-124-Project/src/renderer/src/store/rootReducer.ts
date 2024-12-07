import { combineReducers } from 'redux'
import contentReducer from './slices/contentSlice'
import lexemeReducer from './slices/lexemeSlice'
import symbolTableReducer from './slices/symbolTableSlice'
import errorReducer from './slices/errorSlice'
import semanticsReducer from './slices/semanticSlice'
import termialMessageReducer from './slices/terminalMessageSlice'
import userInputReducer from './slices/userInputSlice'
import terminalInputReducer from './slices/terminalInputSlice'

// Add all reducers of different slices of states here
const rootReducer = combineReducers({
  content: contentReducer,
  lexemes: lexemeReducer,
  symbolTable: symbolTableReducer,
  error: errorReducer,
  semantics: semanticsReducer,
  terminalMessage: termialMessageReducer,
  userInput: userInputReducer,
  terminalInput: terminalInputReducer
})

export default rootReducer
