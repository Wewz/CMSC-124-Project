import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { printColoredMessage, prompt, handleCommand } from '@renderer/utils/terminalFunctions'
import 'xterm/css/xterm.css'

export const useTerminal = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null)
  const inputBufferRef = useRef('') // Tracks user input
  const terminalInstanceRef = useRef<Terminal | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

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

    terminal.open(terminalRef.current)
    fitAddon.fit()
    terminalInstanceRef.current = terminal

    printColoredMessage(
      terminal,
      'LOLCODE Interpreter by Centino, Viloria, and Santos\x1b\n',
      'yellow'
    )
    prompt(terminal, inputBufferRef)

    terminal.onKey(({ key, domEvent }) => {
      const inputBuffer = inputBufferRef.current

      if (domEvent.key === 'Enter') {
        terminal.writeln('')
        handleCommand(inputBuffer, inputBufferRef, terminal)
        inputBufferRef.current = ''
        prompt(terminal, inputBufferRef)
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

    const resizeObserver = new ResizeObserver(() => fitAddon.fit())
    resizeObserver.observe(terminalRef.current)

    return () => {
      terminal.dispose()
      resizeObserver.disconnect()
    }
  }, [])

  return { terminalRef, inputBufferRef, terminalInstanceRef }
}
