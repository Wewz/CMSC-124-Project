import { useState } from 'react'
import { Lexeme } from './interfaces/interfaces'
import TextEditor from './sections/TextEditor'
import ButtonOption from './sections/ButtonOption'
import LexemeTable from './sections/LexemeTable'
import SymbolTable from './sections/SymbolTable'
import Terminal from './sections/Terminal'

function App(): JSX.Element {
  const [text, setText] = useState('')
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [lexemes, setLexemes] = useState<Lexeme[]>([])
  const [symbolTable, setSymbolTable] = useState<Record<string, string>>({})

  return (
    <div className="flex h-full">
      <div className="w-[60%] h-full flex-col gap-3">
        <div className="p-[20px]">
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

        <Terminal />
      </div>

      <div className="flex-col gap-3 w-[40%] h-[860px] border-l border-inherit">
        {/* Lexeme Table */}
        <LexemeTable lexemes={lexemes} />

        {/* Symbol Table */}
        <SymbolTable symbolTable={symbolTable} />
      </div>
    </div>
  )
}

export default App
