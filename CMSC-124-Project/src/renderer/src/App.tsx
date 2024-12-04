import TextEditor from './sections/TextEditor'
import ButtonOption from './sections/ButtonOption'
import LexemeTable from './sections/LexemeTable'
import SymbolTable from './sections/SymbolTable'
import TerminalBox from './sections/Terminal'

function App(): JSX.Element {
  return (
    <div className="flex h-full">
      <div className="w-[60%] h-full flex-col gap-3">
        <div className="p-[20px]">
          {/* Button options above */}
          <ButtonOption />

          {/* Text Editor */}
          <div className="mt-[10px]">
            <TextEditor />
          </div>
        </div>

        {/* Terminal */}
        <TerminalBox />
      </div>

      <div className="flex-col gap-3 w-[40%] h-[860px] border-l border-inherit">
        {/* Lexeme Table */}
        <LexemeTable />

        {/* Symbol Table */}
        <SymbolTable />
      </div>
    </div>
  )
}

export default App
