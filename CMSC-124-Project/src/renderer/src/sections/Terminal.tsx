import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { ErrorType } from '@renderer/interfaces/interfaces'

interface TerminalProps {
  terminalMsg: ErrorType[]
  setTerminalMsg: React.Dispatch<React.SetStateAction<any>>
  clear: boolean
  setClear: React.Dispatch<React.SetStateAction<any>>
}

const colors = {
  info: '32', // Green
  warning: '33', // Yellow
  error: '31', // Red
  blue: '34' // Blue
}

const printColoredMessage = (terminal: Terminal, message: string, type: keyof typeof colors) => {
  const color = colors[type] || '37' // Default to white if unknown type
  terminal.write(`\x1b[${color}m${message}\x1b[0m`)
}

const prompt = (terminal: Terminal, inputBufferRef: React.MutableRefObject<string>) => {
  printColoredMessage(terminal, '\r\n$ ', 'blue')
  inputBufferRef.current = '' // Clear input buffer after prompt
}

const printError = (
  inputBufferRef: React.MutableRefObject<string>,
  terminal: Terminal,
  message: string
) => {
  printColoredMessage(terminal, message, 'error')
}

const handleCommand = (
  input: string,
  inputBufferRef: React.MutableRefObject<string>,
  terminal: Terminal
) => {
  const trimmedInput = input.trim()

  if (trimmedInput === 'clear') {
    inputBufferRef.current = ''
    terminal.write('\x1b[H')
    terminal.write('\x1b[2K\r')
    terminal.clear()
  } else if (trimmedInput === 'help') {
    terminal.writeln('Available commands:')
    terminal.writeln('clear - Clear the terminal')
    terminal.writeln('help - Show this help message')
  } else if (trimmedInput) {
    terminal.writeln(`Unknown command: ${trimmedInput}`)
  }
}

const TerminalBox: React.FC<TerminalProps> = ({ terminalMsg, setTerminalMsg, clear, setClear }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null)
  const inputBufferRef = useRef('') // Tracks user input
  const terminalInstanceRef = useRef<Terminal | null>(null)

  useEffect(() => {
    if (terminalInstanceRef.current && terminalMsg.length > 0) {
      terminalMsg.forEach(
        ({ error, line }) =>
          printError(
            inputBufferRef,
            terminalInstanceRef.current!,
            `\r\nError in Line ${line}: ${error}`
          ),
        (inputBufferRef.current = '')
      )
      prompt(terminalInstanceRef.current!, inputBufferRef)
      setTerminalMsg([]) // Clear messages after printing
    }
  }, [terminalMsg])

  useEffect(() => {
    if (terminalInstanceRef.current && clear) {
      inputBufferRef.current = 'clear'
      handleCommand(inputBufferRef.current, inputBufferRef, terminalInstanceRef.current)
      setClear(false)
    }
  }, [clear])

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

    printColoredMessage(terminal, 'LOLCODE Interpreter\n', 'blue')
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

  return (
    <div className="flex flex-col px-[20px]">
      <div className="w-full font-bold py-[10px] pl-[20px] text-[14px] bg-background-dark rounded-t-md border-x border-t border-border">
        Terminal
      </div>

      <div className="max-w-4xl h-[225px] pl-[10px] pr-[5px] pt-[10px] border border-border rounded-b-md bg-background-dark">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  )
}

export default TerminalBox
