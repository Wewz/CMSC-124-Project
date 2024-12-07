import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '../store/store'
import { getUserInput } from '@renderer/store/slices/terminalInputSlice'
import { printColoredMessage, prompt } from '@renderer/utils/ui-helpers/terminalFunctions'
import 'xterm/css/xterm.css'

const useTerminal = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null)
  const inputBufferRef = useRef('') // Tracks user input
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!terminalRef.current) return

    const container = terminalRef.current
    if (!container.offsetWidth || !container.offsetHeight) {
      console.warn('Terminal container is not fully sized.')
      return
    }

    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#101010',
        foreground: '#ffffff'
      },
      fontFamily: 'Cascadia code, monospace',
      fontSize: 13,
      letterSpacing: 1
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminal.open(container)

    try {
      fitAddon.fit()
    } catch (error) {
      console.error('Failed to fit terminal:', error)
    }

    terminalInstanceRef.current = terminal

    // Display initial message and prompt
    printColoredMessage(
      terminal,
      'LOLCODE Interpreter by Centino, Viloria, and Santos\x1b\n',
      'yellow'
    )
    prompt(terminal, inputBufferRef)

    terminal.onKey(({ key, domEvent }) => {
      const inputBuffer = inputBufferRef.current

      if (domEvent.key === 'Enter') {
        const trimmedInput = inputBuffer.trim()

        if (trimmedInput) {
          dispatch(getUserInput(trimmedInput)) // Update Redux state with the input
          inputBufferRef.current = '' // Clear buffer
          terminalInstanceRef.current?.writeln('') // New line
        }
      } else if (domEvent.key === 'Backspace') {
        if (inputBuffer.length > 0) {
          terminal.write('\b \b')
          inputBufferRef.current = inputBuffer.slice(0, -1)
        }
      } else {
        terminal.write(key)
        inputBufferRef.current += key
      }
    })

    // Adjust terminal size dynamically
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit()
      } catch (error) {
        console.warn('Fit failed during resize:', error)
      }
    })
    resizeObserver.observe(container)

    return () => {
      terminal.dispose()
      resizeObserver.disconnect()
    }
  }, [dispatch, prompt])

  return { terminalRef, inputBufferRef, terminalInstanceRef }
}

export default useTerminal
