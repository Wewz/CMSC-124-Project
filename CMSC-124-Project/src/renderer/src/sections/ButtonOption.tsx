import React from 'react'
import { Button, buttonVariants } from '../components/index'
import handleFileUpload from '@renderer/utils/fileUpload'
import syntaxAnalyzer from '@renderer/utils/syntaxAnalyzer'
import lexemeAnalyzer from '@renderer/utils/lexemeAnalyzer'
import semanticAnalyzer from '@renderer/utils/semanticAnalyzer'
import { Lexeme, SymbolTableEntry } from '@renderer/interfaces/interfaces'
import { Play } from 'lucide-react'
import SymbolTable from './SymbolTable'

interface ButtonOptionProps {
  text: string
  lexemes: Lexeme[]
  symbolTable: Record<string, SymbolTableEntry>
  setText: React.Dispatch<React.SetStateAction<any>>
  setLexemes: React.Dispatch<React.SetStateAction<any>>
  setSymbolTable: React.Dispatch<React.SetStateAction<any>>
  setTerminalMsg: React.Dispatch<React.SetStateAction<any>>
  SetLexemeErrors: React.Dispatch<React.SetStateAction<any>>
  SetSyntaxErrors: React.Dispatch<React.SetStateAction<any>>
  SetSemanticsErrors: React.Dispatch<React.SetStateAction<any>>
  setClear: React.Dispatch<React.SetStateAction<any>>
}

const ButtonOption: React.FC<ButtonOptionProps> = ({
  text,
  lexemes,
  symbolTable,
  setText,
  setLexemes,
  setSymbolTable,
  setTerminalMsg,
  SetLexemeErrors,
  SetSyntaxErrors,
  SetSemanticsErrors,
  setClear
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
            onChange={(e) => handleFileUpload(e, setText)}
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
              setClear(true)
              lexemeAnalyzer(text, setLexemes, SetLexemeErrors)
              syntaxAnalyzer(text, SetSyntaxErrors, setSymbolTable)
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
