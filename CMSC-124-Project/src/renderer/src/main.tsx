import './index.css'
import { TerminalContextProvider } from 'react-terminal'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <TerminalContextProvider>
      <App />
    </TerminalContextProvider>
  </React.StrictMode>
)
