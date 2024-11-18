import React from 'react'
import { Button, buttonVariants } from '../components/index'
import handleFileUpload from '@renderer/utils/fileUpload'
import processFileContent from '@renderer/utils/lexemeAnalyzer'
import { Play } from 'lucide-react'

interface ButtonOptionProps {
  text: string
  setText: React.Dispatch<React.SetStateAction<any>>
  setFileContent: React.Dispatch<React.SetStateAction<any>>
  setLexemes: React.Dispatch<React.SetStateAction<any>>
  setSymbolTable: React.Dispatch<React.SetStateAction<any>>
}

const ButtonOption: React.FC<ButtonOptionProps> = ({
  text,
  setText,
  setFileContent,
  setLexemes,
  setSymbolTable
}) => {
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
            onChange={(e) => handleFileUpload(e, setText, setFileContent)}
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
              processFileContent(text, setLexemes, setSymbolTable)
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
