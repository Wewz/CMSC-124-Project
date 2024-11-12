import { useState } from 'react'
import { Textarea } from './components/ui/textarea'
import { Button } from './components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ipcRenderer } from 'electron'

function App(): JSX.Element {
  const [text, setText] = useState('')
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [lexemes, setLexemes] = useState<{ lexeme: string, classification: string, position: number }[]>([])

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

  // Process file content to extract lexemes and classify them
  const processFileContent = (content: string) => {
    const lexemeData: { lexeme: string, classification: string, position: number }[] = []
    const keywordPositions = new Set<number>() // Track positions occupied by keywords
    const literalPositions = new Set<number>()  // Track positions occupied by literals (numbers and strings)
    const keywords = /\b(VISIBLE|HAI|KTHXBYE|WAZZUP|BUHBYE|BTW|OBTW|TLDR|I HAS A|ITZ|R|SUM OF|DIFF OF|PRODUKT OF|QUOSHUNT OF|MOD OF|BIGGR OF|SMALLR OF|BOTH OF|EITHER OF|WON OF|NOT|ANY OF|ALL OF|BOTH SAEM|DIFFRINT|SMOOSH|MAEK|A|IS NOW A|VISIBLE|GIMMEH|O RLY\?|YA RLY|MEBBE|NO WAI|OIC|WTF\?|OMG|OMGWTF|IM IN YR|UPPIN|NERFIN|YR|TIL|WILE|IM OUTTA YR|HOW IZ I|IF U SAY SO|GTFO|FOUND YR|I IZ|MKAY|AN)\b/g
    const identifierPattern = /\b[A-Za-z][A-Za-z0-9_]*\b/g
    const stringPattern = /(["'])(.*?)(\1)/g
    const numberPattern = /\b\d+(\.\d+)?\b/g // Matches integers and decimal numbers

    let match

    // Find keywords
    while ((match = keywords.exec(content)) !== null) {
      lexemeData.push({ lexeme: match[0], classification: 'Keyword', position: match.index })
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

      lexemeData.push({ lexeme: openingQuote, classification: 'Opening Quote', position: match.index })
      lexemeData.push({ lexeme: stringContent, classification: 'Literal', position: match.index + openingQuote.length })
      lexemeData.push({ lexeme: closingQuote, classification: 'Closing Quote', position: match.index + openingQuote.length + stringContent.length })

      // Track positions of the entire string (including quotes) to prevent identifier overlap
      for (let i = match.index; i < match.index + match[0].length; i++) {
        literalPositions.add(i)
      }
    }

    // Find number literals
    while ((match = numberPattern.exec(content)) !== null) {
      lexemeData.push({ lexeme: match[0], classification: 'Literal', position: match.index })
      // Track positions of each character in the number to prevent identifier overlap
      for (let i = match.index; i < match.index + match[0].length; i++) {
        literalPositions.add(i)
      }
    }

    // Find identifiers, excluding those that overlap with keywords or literals
    while ((match = identifierPattern.exec(content)) !== null) {
      const identifierRange = [...Array(match[0].length).keys()].map(i => match.index + i)
      const overlapsWithKeywordOrLiteral = identifierRange.some(pos => keywordPositions.has(pos) || literalPositions.has(pos))

      if (!overlapsWithKeywordOrLiteral) {
        lexemeData.push({ lexeme: match[0], classification: 'Identifier', position: match.index })
      }
    }

    // Sort lexemes by position in the content
    lexemeData.sort((a, b) => a.position - b.position)

    setLexemes(lexemeData)
  }

  return (
    <div className="p-[10px] flex gap-3">
      <div>
        <input type="file" accept=".txt" onChange={handleFileUpload} />
      </div>
      <Textarea
        placeholder="Type your LolCode Here"
        value={text}
        onChange={handleChange}
        className="whitespace-pre"
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
      <div className="flex gap-3 w-[60%]">
        <div className="p-[10px] border border-inherit container rounded-md">
          <div className="w-full text-primary-foreground font-bold text-center border-b border-inherit pb-2">
            Lexemes
          </div>
          {/* Scrollable table for Lexemes */}
          <div className="overflow-y-auto max-h-64">
            <Table className="text-center">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-primary-foreground text-center">
                    Lexeme
                  </TableHead>
                  <TableHead className="font-bold text-primary-foreground text-center">
                    Classification
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lexemes.map((lexeme, index) => (
                  <TableRow className="text-primary-foreground" key={index}>
                    <TableCell>{lexeme.lexeme}</TableCell>
                    <TableCell>{lexeme.classification}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="p-[10px] border border-inherit container rounded-md">
          <div className="w-full text-primary-foreground font-bold text-center border-b border-inherit pb-2">
            Symbol Table
          </div>
          {/* Scrollable table for Symbol Table */}
          <div className="overflow-y-auto max-h-64">
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
                {lexemes
                  .filter((lexeme) => lexeme.classification === 'Identifier')
                  .map((identifier, index) => (
                    <TableRow className="text-primary-foreground" key={index}>
                      <TableCell>{identifier.lexeme}</TableCell>
                      <TableCell>{identifier.lexeme}</TableCell> {/* Placeholder for value */}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
