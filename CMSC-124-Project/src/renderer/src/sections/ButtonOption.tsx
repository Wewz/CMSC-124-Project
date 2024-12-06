import React from 'react'
import handleFileUpload from '@renderer/utils/ui-helpers/fileUpload'
import syntaxAnalyzer from '@renderer/utils/analyzers/syntaxAnalyzer'
import lexemeAnalyzer from '@renderer/utils/analyzers/lexemeAnalyzer'
import { Button, buttonVariants } from '../components/index'
import { Play } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@renderer/store/store'
import { setTerminalMessage, setClearTerminal } from '@renderer/store/slices/terminalMessageSlice'
import { setShowErrors, setClearErrors } from '@renderer/store/slices/errorSlice'

const ButtonOption: React.FC = () => {
  const dispatch: AppDispatch = useDispatch()
  const content = useSelector((state: RootState) => state.content.text)

  return (
    <>
      <div className="flex justify-between">
        <div className="flex gap-4">
          <Button
            variant={'outline'}
            className="font-bold mb-[5px]"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            Open File
          </Button>
          <input
            id="fileInput"
            className={buttonVariants({ variant: 'outline' })}
            type="file"
            onChange={(e) => handleFileUpload(e, dispatch)}
            style={{ display: 'none' }}
          />

          <Button className="font-bold" variant={'outline'}>
            Save File
          </Button>
        </div>

        <div>
          <Button
            className="font-bold"
            variant={'outline'}
            onClick={() => {
              dispatch(setClearErrors())
              dispatch(setClearTerminal(true))
              dispatch(setTerminalMessage({ message: 'Running LOLCODE', color: 'green' }))

              lexemeAnalyzer(content, dispatch)
              syntaxAnalyzer(content, dispatch)

              dispatch(setShowErrors(true))
            }}
          >
            <Play />
            Run Code
          </Button>
        </div>
      </div>
    </>
  )
}

export default ButtonOption
