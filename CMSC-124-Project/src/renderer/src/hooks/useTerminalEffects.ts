import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@renderer/store/store'
import {
  printColoredMessage,
  handleCommand,
  prompt
} from '@renderer/utils/ui-helpers/terminalFunctions'
import { setClearTerminal, setShownMessages } from '@renderer/store/slices/terminalMessageSlice'
import { setShowErrors } from '@renderer/store/slices/errorSlice'

const useTerminalEffects = (
  terminalInstanceRef: React.RefObject<any>,
  inputBufferRef: React.MutableRefObject<string>
) => {
  const dispatch: AppDispatch = useDispatch()

  // Errors in lexeme and syntax analyzer
  const errors = useSelector((state: RootState) => state.error.errors)
  const isShowErrors = useSelector((state: RootState) => state.error.showErrors)

  // Clear terminal
  const clear = useSelector((state: RootState) => state.terminalMessage.clear)

  // Messages to print in terminal
  const messages = useSelector((state: RootState) => state.terminalMessage)

  // clears the terminal
  useEffect(() => {
    if (!terminalInstanceRef.current) {
      return // Skip if terminalInstance is undefined
    }

    if (clear) {
      handleCommand('clear', inputBufferRef, terminalInstanceRef.current)
      prompt(terminalInstanceRef.current, inputBufferRef)
      dispatch(setClearTerminal(false))
    }
  }, [clear, terminalInstanceRef, inputBufferRef, dispatch])

  // printing messages in terminal
  useEffect(() => {
    if (!terminalInstanceRef.current) return // Skip if terminalInstance is undefined

    if (messages.messages.length > 0) {
      for (let i = 0; i < messages.messages.length; i++) {
        if (!messages.messages[i].messageShown) {
          printColoredMessage(
            terminalInstanceRef.current,
            messages.messages[i].message,
            messages.messages[i].color
          )
          // Mark the message as shown
          dispatch(setShownMessages(i))
        }
      }
    }
  }, [messages, terminalInstanceRef, dispatch])

  // printing errors in terminal
  useEffect(() => {
    if (!terminalInstanceRef.current) {
      return // Skip if terminalInstance is undefined
    }

    if (isShowErrors) {
      for (const { error, line } of errors) {
        printColoredMessage(terminalInstanceRef.current, `[ERROR] in line ${line}: ${error}`, 'red')
      }
      printColoredMessage(terminalInstanceRef.current, '', 'green')
      prompt(terminalInstanceRef.current, inputBufferRef)
      dispatch(setShowErrors(false))
    }
  }, [isShowErrors, errors, terminalInstanceRef, inputBufferRef, dispatch])
}

export default useTerminalEffects
