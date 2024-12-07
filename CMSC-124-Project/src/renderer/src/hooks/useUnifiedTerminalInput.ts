import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@renderer/store/store'
import { provideUserInput } from '@renderer/store/slices/userInputSlice'
import { printColoredMessage, prompt } from '@renderer/utils/ui-helpers/terminalFunctions'

interface UseUnifiedTerminalInputParams {
  terminalInstanceRef: React.RefObject<any> // Replace with your terminal instance type
  inputBufferRef: React.MutableRefObject<string>
}

const useUnifiedTerminalInput = ({
  terminalInstanceRef,
  inputBufferRef
}: UseUnifiedTerminalInputParams) => {
  const dispatch = useDispatch<AppDispatch>()
  const userInputState = useSelector((state: RootState) => state.userInput)

  useEffect(() => {
    if (!terminalInstanceRef.current) return

    const handleKeyInput = ({ key, domEvent }: { key: string; domEvent: KeyboardEvent }) => {
      const inputBuffer = inputBufferRef.current

      if (domEvent.key === 'Enter') {
        const trimmedInput = inputBuffer.trim()
        if (trimmedInput) {
          dispatch(provideUserInput(trimmedInput)) // Dispatch input to Redux
          inputBufferRef.current = '' // Clear buffer
          terminalInstanceRef.current?.writeln('') // New line
          prompt(terminalInstanceRef.current) // Show prompt
        } else {
          terminalInstanceRef.current.writeln('\x1b[31mError: Input cannot be empty\x1b[0m')
          printColoredMessage(
            terminalInstanceRef.current,
            `Please provide a value for ${userInputState.variable}: `,
            'white'
          )
        }
      } else if (domEvent.key === 'Backspace') {
        if (inputBuffer.length > 0) {
          terminalInstanceRef.current.write('\b \b')
          inputBufferRef.current = inputBuffer.slice(0, -1)
        }
      } else {
        terminalInstanceRef.current.write(key)
        inputBufferRef.current += key
      }
    }

    const disposable = terminalInstanceRef.current.onKey(handleKeyInput)

    return () => {
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose()
      }
    }
  }, [userInputState, terminalInstanceRef, dispatch])
}

export default useUnifiedTerminalInput
