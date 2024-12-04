import { Terminal } from 'xterm'

const colors = {
  green: '32',
  yellow: '33',
  red: '31',
  blue: '34'
}

// Function to print colored messages
const printColoredMessage = (terminal: Terminal, message: string, type: string) => {
  console.log(`Printing to terminal: ${message} with color: ${type}`)
  const color = colors[type] || '37' // Default to white if unknown type
  terminal.writeln(`\x1b[${color}m${message}\x1b[0m`) // Print message
}

// Function to print the prompt
const prompt = (terminal: Terminal, inputBufferRef: React.MutableRefObject<string>) => {
  terminal.write(`\x1b[${colors.blue}m\rLOLCODE$> \x1b[0m`)
  inputBufferRef.current = '' // Clear input buffer before prompt
}

// Function to print error messages
const printError = (terminal: Terminal, message: string) => {
  terminal.writeln(`\x1b[${colors.red}m${message}\x1b[0m`) // Print error in red
}

const handleCommand = (
  input: string,
  inputBufferRef: React.MutableRefObject<string>,
  terminal: Terminal
) => {
  const trimmedInput = input.trim()

  if (trimmedInput === 'clear') {
    clearTerminalContent(terminal) // Call a separate function to clear content
    prompt(terminal, inputBufferRef) // Reprompt after clearing
  } else if (trimmedInput === 'help') {
    // ... existing logic for help
  } else if (trimmedInput === 'test') {
    terminal.write('\x1b[2K\r') // Only clear the current line
  } else if (trimmedInput) {
    terminal.writeln(`Unknown command: ${trimmedInput}\n`)
  }
}

const clearTerminalContent = (terminal: Terminal) => {
  // Move the clearing logic here, excluding the prompt and LOLCODE message
  terminal.write('\x1b[2J\x1b[H') // Clear from cursor to end & move cursor to home
  printColoredMessage(
    terminal,
    'LOLCODE Interpreter by Centino, Viloria, and Santos\x1b\n',
    'yellow'
  )
}

export { printColoredMessage, prompt, printError, handleCommand }
