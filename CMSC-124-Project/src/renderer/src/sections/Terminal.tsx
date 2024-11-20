import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

interface TerminalProps {
  terminalMsg: string
  setTerminalMsg: React.Dispatch<React.SetStateAction<any>>
}

const colors = {
  info: '32', // Green
  warning: '33', // Yellow
  error: '31', // Red
  blue: '34'
}

const printColoredMessage = (terminal, message, type) => {
  const color = colors[type] || '37' // Default to white if unknown type
  terminal.write(`\x1b[${color}m${message}\x1b[0m`)
}

const TerminalBox: React.FC<TerminalProps> = ({ terminalMsg, setTerminalMsg }) => {
  const terminalRef = useRef(null)
  const inputBufferRef = useRef('') // Tracks user input

  useEffect(() => {
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
    terminal.reset()

    if (!terminalRef.current) return

    terminal.open(terminalRef.current)
    fitAddon.fit()

    printColoredMessage(terminal, 'Information message', 'info')
    printColoredMessage(terminal, 'Warning message', 'warning')
    printColoredMessage(terminal, 'Error message', 'error')

    const prompt = () => {
      printColoredMessage(terminal, '\r\n$ ', 'blue')
      inputBufferRef.current = '' // Clear input buffer after prompt
    }

    prompt()

    terminal.onKey(({ key, domEvent }) => {
      const inputBuffer = inputBufferRef.current

      if (domEvent.key === 'Enter') {
        // Handle commands on Enter
        terminal.writeln('')
        handleCommand(inputBuffer, terminal)
        inputBufferRef.current = ''
        prompt()
      } else if (domEvent.key === 'Backspace') {
        if (inputBuffer.length > 0) {
          terminal.write('\b \b') // Remove the last character visually
          inputBufferRef.current = inputBuffer.slice(0, -1) // Update the input buffer
        }
      } else {
        terminal.write(key) // Echo the character
        inputBufferRef.current += key // Add to input buffer
      }
    })

    return () => terminal.dispose() // Cleanup on unmount
  }, [])

  // Handle commands
  const handleCommand = (input, terminal) => {
    const trimmedInput = input.trim()

    if (trimmedInput === 'clear') {
      inputBufferRef.current = ''
      input = ''
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

  return (
    <div className="flex flex-col px-[20px]">
      <div className="w-full font-bold py-[10px] pl-[20px] text-[14px] bg-background-dark rounded-t-md border-x border-t border-border">
        Terminal
      </div>

      <div className="max-w-4xl h-[230px] pl-[10px] pr-[5px] pt-[10px] border border-border rounded-b-md bg-background-dark">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  )
}

export default TerminalBox
