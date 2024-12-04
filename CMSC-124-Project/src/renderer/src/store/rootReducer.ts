import { combineReducers } from 'redux'
import contentReducer from './slices/contentSlice'
import lexemeReducer from './slices/lexemeSlice'
import symbolTableReducer from './slices/symbolTableSlice'
import termialMessageReducer from './slices/terminalMessageSlice'

// Add all reducers of different slices of states here
const rootReducer = combineReducers({
  content: contentReducer,
  lexemes: lexemeReducer,
  symbolTable: symbolTableReducer,
  terminalMessage: termialMessageReducer
})

export default rootReducer
