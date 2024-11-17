import { useState } from 'react'
import { Lexeme } from './interfaces/interfaces'
import TextEditor from './sections/TextEditor'
import ButtonOption from './sections/ButtonOption'
import LexemeTable from './sections/LexemeTable'
import SymbolTable from './sections/SymbolTable'

function App(): JSX.Element {
  const [text, setText] = useState('')
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [lexemes, setLexemes] = useState<Lexeme[]>([])
  const [symbolTable, setSymbolTable] = useState<Record<string, string>>({})

  return (
    <>
      <div className="text-center py-2 font-bold text-[30px]"> LOLCODE Interpreter</div>
      <div className="flex gap-3 h-full p-[20px]">
        <div className="w-[60%] h-[500px] flex-col gap-3">
          {/* Button options above */}
          <ButtonOption
            setText={setText}
            setFileContent={setFileContent}
            setLexemes={setLexemes}
            setSymbolTable={setSymbolTable}
          />

          {/* Text Editor */}
          <TextEditor text={text} setText={setText} />
        </div>
        <div className="flex-col gap-3 w-[40%] h-full border border-inherit rounded-md">
          {/* Lexeme Table */}
          <LexemeTable lexemes={lexemes} />

          {/* Symbol Table */}
          <SymbolTable symbolTable={symbolTable} />
        </div>
      </div>
    </>
  )
}

export default App
