import { useEffect } from 'react'
import { useTerminal } from '@renderer/hooks/useTerminal'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@renderer/store/store'
import { printColoredMessage, handleCommand, prompt } from '@renderer/utils/terminalFunctions'
import {
  setClearTerminal,
  setClearTerminalMessage
} from '@renderer/store/slices/terminalMessageSlice'
import { setShowErrors } from '@renderer/store/slices/errorSlice'

const TerminalBox: React.FC = () => {
  const dispatch: AppDispatch = useDispatch()
  const { terminalRef, terminalInstanceRef, inputBufferRef } = useTerminal()

  // Errors in lexeme and syntax analyzer
  const errors = useSelector((state: RootState) => state.error.errors)
  const isShowErrors = useSelector((state: RootState) => state.error.showErrors)

  // Clear terminal
  const clear = useSelector((state: RootState) => state.terminalMessage.clear)

  // Messages to print in terminal
  const messages = useSelector((state: RootState) => state.terminalMessage.terminalMessage)

  // printing clears in terminal
  useEffect(() => {
    if (terminalInstanceRef.current && clear) {
      handleCommand('clear', inputBufferRef, terminalInstanceRef.current)
      prompt(terminalInstanceRef.current, inputBufferRef)
      dispatch(setClearTerminal(false))
    }
  }, [clear])

  // printing messages in terminal
  useEffect(() => {
    if (terminalInstanceRef.current && messages.length > 0) {
      for (const { message, color } of messages) {
        printColoredMessage(terminalInstanceRef.current, message, color)
      }
      dispatch(setClearTerminalMessage())
    }
  }, [messages])

  // printing errors in terminal
  useEffect(() => {
    console.log('TERMINAL', errors, isShowErrors)

    if (terminalInstanceRef.current && isShowErrors) {
      for (const { error, line } of errors) {
        printColoredMessage(terminalInstanceRef.current, `[ERROR] in line ${line}: ${error}`, 'red')
      }
      printColoredMessage(terminalInstanceRef.current, '', 'green')
      prompt(terminalInstanceRef.current, inputBufferRef)
      dispatch(setShowErrors(false))
    }
  }, [isShowErrors])

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
