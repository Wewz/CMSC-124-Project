import { keywordClassifications } from './constants'
import { Lexeme } from '@renderer/interfaces/interfaces'

// Process file content to extract lexemes and classify them
const processFileContent = (
  content: string,
  setLexemes: React.Dispatch<React.SetStateAction<any>>,
  setSymbolTable: React.Dispatch<React.SetStateAction<any>>
) => {
  const lexemeData: Lexeme[] = []

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
    }
  }

  // Sort lexemes by position in the content
  lexemeData.sort((a, b) => a.position - b.position)

  // Update the symbol table with actual values by looping through the content again
  const assignmentPattern = /\bI HAS A ([A-Za-z][A-Za-z0-9_]*) ITZ (-?\d+(\.\d+)?|".*?")/g // Matches variable declarations with assignments
  while ((match = assignmentPattern.exec(content)) !== null) {
    const identifier = match[1]
    const value = match[2].trim()
    initialSymbolTable[identifier] = value
  }

  setLexemes(lexemeData)
  setSymbolTable(initialSymbolTable)
}

export default processFileContent
