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
import { ipcRenderer } from 'electron'
import { buttonVariants } from '@/components/ui/button'

function App(): JSX.Element {
  const [text, setText] = useState('')
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [lexemes, setLexemes] = useState<
    { lexeme: string; classification: string; position: number }[]
  >([])
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
        processFileContent(content)
      }
      reader.readAsText(file)
    }
  }

  const keywordClassifications: { [key: string]: string } = {
    HAI: 'Code Delimiter',
    KTHXBYE: 'Code Delimiter',
    BUHBYE: 'Code Delimiter',
    'I HAS A': 'Variable Declaration',
    ITZ: 'Variable Assignment',
    R: 'Variable Assignment',
    VISIBLE: 'Output',
    GIMMEH: 'Input',
    'O RLY?': 'Conditional Statement',
    'YA RLY': 'Conditional Statement',
    MEBBE: 'Conditional Statement',
    'NO WAI': 'Conditional Statement',
    OIC: 'Conditional Statement',
    'WTF?': 'Switch Case',
    OMG: 'Switch Case',
    OMGWTF: 'Switch Case',
    'IM IN YR': 'Loop',
    UPPIN: 'Increment',
    NERFIN: 'Decrement',
    YR: 'Loop Delimiter',
    'IM OUTTA YR': 'Loop Delimiter',
    'FOUND YR': 'Loop Delimiter',
    TIL: 'Loop Delimiter',
    WILE: 'Loop Delimiter',
    'SUM OF': 'Arithmetic Operator',
    'DIFF OF': 'Arithmetic Operator',
    'PRODUKT OF': 'Arithmetic Operator',
    'QUOSHUNT OF': 'Arithmetic Operator',
    'MOD OF': 'Arithmetic Operator',
    'BIGGR OF': 'Logical Operator',
    'SMALLR OF': 'Logical Operator',
    'BOTH OF': 'Logical Operator',
    'EITHER OF': 'Logical Operator',
    'WON OF': 'Logical Operator',
    NOT: 'Logical Operator',
    'ANY OF': 'Logical Operator',
    'ALL OF': 'Logical Operator',
    'BOTH SAEM': 'Logical Operator',
    DIFFRINT: 'Logical Operator',
    SMOOSH: 'Logical Operator',
    MAEK: 'Logical Operator',
    A: 'Logical Operator',
    'IS NOW A': 'Logical Operator',
    MKAY: 'Logical Operator',
    'IF U SAY SO': 'Exit',
    GTFO: 'Exit',
    'I IZ': 'Function Declaration',
    'HOW IZ I': 'Function Call'
  }

  // Process file content to extract lexemes and classify them
  const processFileContent = (content: string) => {
    const lexemeData: {
      lexeme: string
      classification: string
      position: number
    }[] = []
    const initialSymbolTable: Record<string, string> = {} // Create separate symbol table since we do not want duplicates and will be updating the values later
    const keywordPositions = new Set<number>() // Track positions occupied by keywords
    const literalPositions = new Set<number>() // Track positions occupied by literals (numbers and strings)
    const keywords =
      /\b(?:AN|VISIBLE|HAI|KTHXBYE|WAZZUP|BUHBYE|BTW|OBTW|TLDR|I HAS A|ITZ|R|SUM OF|DIFF OF|PRODUKT OF|QUOSHUNT OF|MOD OF|BIGGR OF|SMALLR OF|BOTH OF|EITHER OF|WON OF|NOT|ANY OF|ALL OF|BOTH SAEM|DIFFRINT|SMOOSH|MAEK|A|IS NOW A|VISIBLE|GIMMEH|O RLY|YA RLY|MEBBE|NO WAI|OIC|WTF|OMG|OMGWTF|IM IN YR|UPPIN|NERFIN|YR|TIL|WILE|IM OUTTA YR|HOW IZ I|IF U SAY SO|GTFO|FOUND YR|I IZ|MKAY)\b\??/g
    const identifierPattern = /\b[A-Za-z][A-Za-z0-9_]*\b/g
    const stringPattern = /(["'])(.*?)(\1)/g
    const numberPattern = /\b\d+(\.\d+)?\b/g // Matches integers and decimal numbers

    let match

    // Find keywords
    while ((match = keywords.exec(content)) !== null) {
      const classification = keywordClassifications[match[0]] || 'Keyword'
      lexemeData.push({
        lexeme: match[0],
        classification,
        position: match.index
      })
      // Track positions of each character in the keyword to prevent identifier overlap
      for (let i = match.index; i < match.index + match[0].length; i++) {
        keywordPositions.add(i)
      }
    }

    // Find string literals and separate quotes from content
    while ((match = stringPattern.exec(content)) !== null) {
      const openingQuote = match[1]
      const stringContent = match[2]
      const closingQuote = match[3]

      lexemeData.push({
        lexeme: openingQuote,
        classification: 'Opening Quote',
        position: match.index
      })
      lexemeData.push({
        lexeme: stringContent,
        classification: 'Literal',
        position: match.index + openingQuote.length
      })
      lexemeData.push({
        lexeme: closingQuote,
        classification: 'Closing Quote',
        position: match.index + openingQuote.length + stringContent.length
      })

      // Track positions of the entire string (including quotes) to prevent identifier overlap
      for (let i = match.index; i < match.index + match[0].length; i++) {
        literalPositions.add(i)
      }
    }

    // Find number literals
    while ((match = numberPattern.exec(content)) !== null) {
      lexemeData.push({
        lexeme: match[0],
        classification: 'Literal',
        position: match.index
      })
      // Track positions of each character in the number to prevent identifier overlap
      for (let i = match.index; i < match.index + match[0].length; i++) {
        literalPositions.add(i)
      }
    }

    // Find identifiers and their initial values, excluding those that overlap with keywords or literals
    while ((match = identifierPattern.exec(content)) !== null) {
      const identifierRange = [...Array(match[0].length).keys()].map((i) => match.index + i)
      const overlapsWithKeywordOrLiteral = identifierRange.some(
        (pos) => keywordPositions.has(pos) || literalPositions.has(pos)
      )

      if (!overlapsWithKeywordOrLiteral) {
        lexemeData.push({
          lexeme: match[0],
          classification: 'Identifier',
          position: match.index
        })

        const context = content.slice(0, match.index).split(/\s+/).slice(-4).join(' ') // Create context so that we would know what the identifier is used for
        if (context.includes('I HAS A')) {
          // If the preceding context of the identifier is 'I HAS A', then the identifier is a variable
          initialSymbolTable[match[0]] = 'NOOB'
        } else if (context.includes('HOW IZ I')) {
          // So on and so forth...
          initialSymbolTable[match[0]] = 'function'
        } else if (context.includes('IM IN YR')) {
          initialSymbolTable[match[0]] = 'loop'
        }
      }
    }

    // Sort lexemes by position in the content
    lexemeData.sort((a, b) => a.position - b.position)

    // Update the symbol table with actual values by looping through the content again
    const assignmentPattern = /\bI HAS A ([A-Za-z][A-Za-z0-9_]*) ITZ (.*)/g // Matches variable declarations with assignments
    while ((match = assignmentPattern.exec(content)) !== null) {
      const identifier = match[1]
      const value = match[2].trim()
      if (initialSymbolTable[identifier] !== undefined) {
        initialSymbolTable[identifier] = value
      }
    }

    setLexemes(lexemeData)
    setSymbolTable(initialSymbolTable)
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
