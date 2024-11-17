import { useState } from 'react'
import { Textarea } from './components/ui/textarea'
import { Button } from './components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import processFileContent from './utils/lexemeAnalyzer'
import { buttonVariants } from '@/components/ui/button'
import { Lexeme } from './interfaces/interfaces'

function App(): JSX.Element {
  const [text, setText] = useState('')
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [lexemes, setLexemes] = useState<Lexeme[]>([])
  const [symbolTable, setSymbolTable] = useState<Record<string, string>>({})

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  // Handle file upload and process content
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setText(content)
        setFileContent(content)
        processFileContent(content, setLexemes, setSymbolTable)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="flex gap-3 h-full p-[20px]">
      <div className="w-[60%] h-[500px] flex-col gap-3">
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
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <Button className="font-bold" variant={'outline'}>
            Run Code
          </Button>
        </div>
        <Textarea
          placeholder="Type your LolCode Here"
          value={text}
          onChange={handleChange}
          className="whitespace-pre w-full"
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault()
              const start = e.currentTarget.selectionStart
              const end = e.currentTarget.selectionEnd
              setText(text.substring(0, start) + '\t' + text.substring(end))
              setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 1
              }, 0)
            }
          }}
        />
      </div>
      <div className="flex gap-3 w-[60%] h-full">
        <div className="py-[10px] border border-inherit w-[100%] rounded-md">
          <div className="w-full text-primary-foreground font-bold text-center pb-2 text-md">
            Lexemes
          </div>
          <ScrollArea className="h-[760px] w-full border-y">
            <Table className="text-center">
              <TableHeader className="">
                <TableRow className="">
                  <TableHead className="sticky top-0 font-bold text-primary-foreground text-center">
                    Lexeme
                  </TableHead>
                  <TableHead className="sticky top-0 font-bold text-primary-foreground text-center ">
                    Classification
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lexemes.map(({ lexeme, classification }, index) => (
                  <TableRow className="text-primary-foreground text-xs" key={index}>
                    <TableCell>{lexeme}</TableCell>
                    <TableCell>{classification}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <div className="py-[10px] border border-inherit w-[100%] rounded-md">
          <div className="w-full text-primary-foreground font-bold text-center pb-2 text-md">
            Symbol Table
          </div>
          <ScrollArea className="h-[760px] w-full border-y">
            <Table className="text-center">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-primary-foreground text-center">
                    Identifier
                  </TableHead>
                  <TableHead className="font-bold text-primary-foreground text-center">
                    Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(symbolTable).map(([identifier, value]) => (
                  <TableRow className="text-primary-foreground text-xs" key={identifier}>
                    <TableCell>{identifier}</TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

export default App
