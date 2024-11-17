import React from 'react'
import { Button, buttonVariants } from '../components/index'
import handleFileUpload from '@renderer/utils/fileUpload'

interface ButtonOptionProps {
  setText: React.Dispatch<React.SetStateAction<any>>
  setFileContent: React.Dispatch<React.SetStateAction<any>>
  setLexemes: React.Dispatch<React.SetStateAction<any>>
  setSymbolTable: React.Dispatch<React.SetStateAction<any>>
}

const ButtonOption: React.FC<ButtonOptionProps> = ({
  setText,
  setFileContent,
  setLexemes,
  setSymbolTable
}) => {
  return (
    <>
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
          onChange={(e) => handleFileUpload(e, setText, setFileContent, setLexemes, setSymbolTable)}
          style={{ display: 'none' }}
        />

        <Button className="font-bold" variant={'outline'}>
          Run Code
        </Button>
      </div>
    </>
  )
}

export default ButtonOption
