import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducer'

const store = configureStore({
  reducer: rootReducer
})

// Since we are working with typescript, we need to export the following:
export type AppDispatch = typeof store.dispatch // Type of dispatch function in store. Useful for asynchronous actions
export type RootState = ReturnType<typeof store.getState> // The return type -> typescipt helper utility of the type of store.get state

export default store
