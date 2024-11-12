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
  const [symbolTable, setSymbolTable] = useState<Record<string, string>>({})

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setText(content)
        setFileContent(content) // Store the file content in a variable
        processFileContent(content) // Process the file content to generate the symbol table
      }
      reader.readAsText(file)
    }
  }

  const processFileContent = (data: string) => {
    let regex =
      /\b(?:AN|VISIBLE|HAI|KTHXBYE|WAZZUP|BUHBYE|BTW|OBTW|TLDR|I HAS A|ITZ|R|SUM OF|DIFF OF|PRODUKT OF|QUOSHUNT OF|MOD OF|BIGGR OF|SMALLR OF|BOTH OF|EITHER OF|WON OF|NOT|ANY OF|ALL OF|BOTH SAEM|DIFFRINT|SMOOSH|MAEK|A|IS NOW A|VISIBLE|GIMMEH|O RLY|YA RLY|MEBBE|NO WAI|OIC|WTF|OMG|OMGWTF|IM IN YR|UPPIN|NERFIN|YR|TIL|WILE|IM OUTTA YR|HOW IZ I|IF U SAY SO|GTFO|FOUND YR|I IZ|MKAY)\b\??/g
    let match

    let symbolTable: Record<string, string> = {}
    const keywords = [
      'AN',
      'VISIBLE',
      'HAI',
      'KTHXBYE',
      'WAZZUP',
      'BUHBYE',
      'BTW',
      'OBTW',
      'TLDR',
      'I HAS A',
      'ITZ',
      'R',
      'SUM OF',
      'DIFF OF',
      'PRODUKT OF',
      'QUOSHUNT OF',
      'MOD OF',
      'BIGGR OF',
      'SMALLR OF',
      'BOTH OF',
      'EITHER OF',
      'WON OF',
      'NOT',
      'ANY OF',
      'ALL OF',
      'BOTH SAEM',
      'DIFFRINT',
      'SMOOSH',
      'MAEK',
      'A',
      'IS NOW A',
      'VISIBLE',
      'GIMMEH',
      'O RLY',
      'YA RLY',
      'MEBBE',
      'NO WAI',
      'OIC',
      'WTF',
      'OMG',
      'OMGWTF',
      'IM IN YR',
      'UPPIN',
      'NERFIN',
      'YR',
      'TIL',
      'WILE',
      'IM OUTTA YR',
      'HOW IZ I',
      'IF U SAY SO',
      'GTFO',
      'FOUND YR',
      'I IZ',
      'MKAY',
      '"'
    ]

    while ((match = regex.exec(data)) !== null) {
      if (match[0] == 'HAI' || match[0] == 'KTHXBYE' || match[0] == 'BUHBYE') {
        symbolTable[match[0]] = 'Code Delimiter'
      } else if (match[0] == 'I HAS A') {
        symbolTable[match[0]] = 'Variable Declaration'
      } else if (match[0] == 'ITZ') {
        symbolTable[match[0]] = 'Variable Assignment'
      } else if (match[0] == 'R') {
        symbolTable[match[0]] = 'Variable Assignment'
      } else if (match[0] == 'VISIBLE') {
        symbolTable[match[0]] = 'Output'
      } else if (match[0] == 'GIMMEH') {
        symbolTable[match[0]] = 'Input'
      } else if (
        match[0] == 'O RLY?' ||
        match[0] == 'YA RLY' ||
        match[0] == 'MEBBE' ||
        match[0] == 'NO WAI' ||
        match[0] == 'OIC'
      ) {
        symbolTable[match[0]] = 'Conditional Statement'
      } else if (match[0] == 'WTF?' || match[0] == 'OMG' || match[0] == 'OMGWTF') {
        symbolTable[match[0]] = 'Switch Case'
      } else if (match[0] == 'IM IN YR') {
        symbolTable[match[0]] = 'Loop'
      } else if (match[0] == 'UPPIN') {
        symbolTable[match[0]] = 'Increment'
      } else if (match[0] == 'NERFIN') {
        symbolTable[match[0]] = 'Decrement'
      } else if (
        match[0] == 'YR' ||
        match[0] == 'IM OUTTA YR' ||
        match[0] == 'FOUND YR' ||
        match[0] == 'TIL' ||
        match[0] == 'WILE'
      ) {
        symbolTable[match[0]] = 'Loop Delimiter'
      } else if (
        match[0] == 'SUM OF' ||
        match[0] == 'DIFF OF' ||
        match[0] == 'PRODUKT OF' ||
        match[0] == 'QUOSHUNT OF' ||
        match[0] == 'MOD OF'
      ) {
        symbolTable[match[0]] = 'Arithmetic Operator'
      } else if (
        match[0] == 'BIGGR OF' ||
        match[0] == 'SMALLR OF' ||
        match[0] == 'BOTH OF' ||
        match[0] == 'EITHER OF' ||
        match[0] == 'WON OF' ||
        match[0] == 'NOT' ||
        match[0] == 'ANY OF' ||
        match[0] == 'ALL OF' ||
        match[0] == 'BOTH SAEM' ||
        match[0] == 'DIFFRINT' ||
        match[0] == 'SMOOSH' ||
        match[0] == 'MAEK' ||
        match[0] == 'A' ||
        match[0] == 'IS NOW A' ||
        match[0] == 'MKAY' ||
        match[0] == 'AN'
      ) {
        symbolTable[match[0]] = 'Logical Operator'
      } else if (match[0] == 'IF U SAY SO' || match[0] == 'GTFO') {
        symbolTable[match[0]] = 'Exit'
      } else if (match[0] == 'I IZ') {
        symbolTable[match[0]] = 'Function Declaration'
      } else if (match[0] == 'HOW IZ I') {
        symbolTable[match[0]] = 'Function Call'
      }
    }

    regex = /"([^"]*)"/g
    while ((match = regex.exec(data)) !== null) {
      symbolTable['"'] = 'String Delimiter'
      symbolTable[match[0]] = 'String Literal'
    }

    regex = /-?\b\d+\b/g
    while ((match = regex.exec(data)) !== null) {
      symbolTable[match[0]] = 'NUMBR Literal'
    }

    regex = /-?\b\d+\.\d+\b/g
    while ((match = regex.exec(data)) !== null) {
      symbolTable[match[0]] = 'NUMBAR Literal'
    }

    regex = /\b[^\s]([a-zA-Z][a-zA-Z0-9_]*)\b/g
    while ((match = regex.exec(data)) !== null) {
      if (!(match[0] in keywords)) {
        symbolTable[match[0]] = 'Identifier'
      }
    }
    setSymbolTable(symbolTable)
  }

  return (
    <div className="p-[10px] flex gap-3">
      <div>
        <input type="file" onChange={handleFileUpload} />
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
              {Object.entries(symbolTable).map(([identifier, value]) => (
                <TableRow className="text-primary-foreground" key={identifier}>
                  <TableCell>{identifier}</TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-[10px] border border-inherit container rounded-md">
          <div className="w-full text-primary-foreground font-bold text-center border-b border-inherit pb-2">
            Symbol Table
          </div>
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
                <TableRow className="text-primary-foreground" key={identifier}>
                  <TableCell>{identifier}</TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default App
