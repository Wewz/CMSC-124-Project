import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../store/store' // Update with your Redux store paths
import {
  printColoredMessage,
  prompt,
  handleCommand
} from '@renderer/utils/ui-helpers/terminalFunctions'
import { provideUserInput } from '@renderer/store/slices/userInputSlice'
import { clearInput } from '@renderer/store/slices/terminalInputSlice'

interface UseTerminalInputParams {
  terminalInstanceRef: React.RefObject<any> // Replace with your terminal instance type
  inputBufferRef: React.MutableRefObject<string>
}

const useTerminalInput = ({ terminalInstanceRef, inputBufferRef }: UseTerminalInputParams) => {
  const dispatch = useDispatch<AppDispatch>()
  const userInputState = useSelector((state: RootState) => state.userInput)
  const terminalInput = useSelector((state: RootState) => state.terminalInput)

  useEffect(() => {
    if (!terminalInstanceRef.current) {
      return
    }

    if (userInputState.get && !terminalInput.input) {
      // Prompt the user for input
      printColoredMessage(terminalInstanceRef.current, `Please provide a value: `, 'white')
    } else if (userInputState.get && terminalInput.input) {
      console.log('User Input', terminalInput)

      dispatch(provideUserInput(terminalInput.input))
      dispatch(clearInput())
      prompt(terminalInstanceRef.current, inputBufferRef)
    } else if (terminalInput.input) {
      handleCommand(terminalInput.input, inputBufferRef, terminalInstanceRef.current)
      prompt(terminalInstanceRef.current, inputBufferRef)
    }
  }, [userInputState, terminalInstanceRef, dispatch, prompt, terminalInput])
}

export default useTerminalInput
