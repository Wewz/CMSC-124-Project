import { keywordClassifications } from './constants'
import { Lexeme } from '@renderer/interfaces/interfaces'

// Process file content to extract lexemes and classify them
const processFileContent = (
  content: string,
  setLexemes: React.Dispatch<React.SetStateAction<any>>,
  setSymbolTable: React.Dispatch<React.SetStateAction<any>>,
  setTerminalMsg: React.Dispatch<React.SetStateAction<any>>
) => {
  setTerminalMsg('Terminal Message Testing')

  const lexemeData: Lexeme[] = []
  const initialSymbolTable: Record<string, string> = {}
  const keywordPositions = new Set<number>()
  const literalPositions = new Set<number>()
  const errorPositions = new Set<number>() // Track positions occupied by errors
  const keywords =
    /\b(?:AN|VISIBLE|HAI|KTHXBYE|WAZZUP|BUHBYE|BTW|OBTW|TLDR|I HAS A|ITZ|R|SUM OF|DIFF OF|PRODUKT OF|QUOSHUNT OF|MOD OF|BIGGR OF|SMALLR OF|BOTH OF|EITHER OF|WON OF|NOT|ANY OF|ALL OF|BOTH SAEM|DIFFRINT|SMOOSH|MAEK|A|IS NOW A|VISIBLE|GIMMEH|O RLY|YA RLY|MEBBE|NO WAI|OIC|WTF|OMG|OMGWTF|IM IN YR|UPPIN|NERFIN|YR|TIL|WILE|IM OUTTA YR|HOW IZ I|IF U SAY SO|GTFO|FOUND YR|I IZ|MKAY)\b\??/g
  const identifierPattern = /\b[A-Za-z][A-Za-z0-9_]*\b/g
  const stringPattern = /(["'])(.*?)(\1)/g
  const numberPattern = /\b\d+(\.\d+)?\b/g

  const errors: { error: string; line: number }[] = []

  let match

  // Find keywords
  while ((match = keywords.exec(content)) !== null) {
    const classification = keywordClassifications[match[0]] || 'Keyword'
    lexemeData.push({
      lexeme: match[0],
      classification,
      position: match.index
    })
    for (let i = match.index; i < match.index + match[0].length; i++) {
      keywordPositions.add(i)
    }
  }

  // Find string literals
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
    for (let i = match.index; i < match.index + match[0].length; i++) {
      literalPositions.add(i)
    }
  }

  // Detect invalid tokens
  const validSyntaxPatterns: RegExp[] = [
    /^HAI$/, // Program start
    /^WAZZUP$/, // Program start
    /^I HAS A [A-Za-z][A-Za-z0-9_]*$/, // Variable declaration
    /^I HAS A [A-Za-z][A-Za-z0-9_]* ITZ (".*?"|-?\d+(\.\d+)?|WIN|FAIL|.+)$/, // Variable declaration with initialization
    /^VISIBLE .+$/, // Output statement
    /^[A-Za-z][A-Za-z0-9_]* R .+$/, // Assignment
    /^BTW.*$/, // Single-line comment
    /^OBTW[\s\S]*?TLDR$/, // Multi-line comment
    /^SUM OF .+$/, // Arithmetic operations
    /^DIFF OF .+$/, // Arithmetic operations
    /^PRODUKT OF .+$/, // Arithmetic operations
    /^QUOSHUNT OF .+$/, // Arithmetic operations
    /^MOD OF .+$/, // Arithmetic operations
    /^BIGGR OF .+$/, // Arithmetic operations
    /^SMALLR OF .+$/, // Arithmetic operations
    /^BOTH OF .+$/, // Logical operations
    /^EITHER OF .+$/, // Logical operations
    /^WON OF .+$/, // Logical operations
    /^NOT .+$/, // Logical operations
    /^ANY OF .+$/, // Logical operations
    /^ALL OF .+$/, // Logical operations
    /^BOTH SAEM .+$/, // Comparison operations
    /^DIFFRINT .+$/, // Comparison operations
    /^SMOOSH .+$/, // String concatenation
    /^MAEK .+ A .+$/, // Type conversion
    /^IS NOW A .+$/, // Type conversion
    /^GIMMEH [A-Za-z][A-Za-z0-9_]*$/, // Input statement
    /^O RLY\?$/, // Conditional statement
    /^YA RLY$/, // Conditional branch
    /^MEBBE .+$/, // Conditional branch
    /^NO WAI$/, // Conditional branch
    /^OIC$/, // End of conditional statement
    /^WTF\?$/, // Switch statement
    /^OMG .+$/, // Switch case
    /^OMGWTF$/, // Default case
    /^IM IN YR .+$/, // Loop statement
    /^UPPIN .+$/, // Increment statement
    /^NERFIN .+$/, // Decrement statement
    /^YR .+ TIL .+$/, // Loop condition
    /^WILE .+$/, // Loop condition
    /^IM OUTTA YR .+$/, // Exit loop statement
    /^HOW IZ I .+$/, // Function declaration
    /^IF U SAY SO$/, // End of function declaration
    /^GTFO$/, // Return statement
    /^FOUND YR .+$/, // Return statement
    /^I IZ .+$/, // Function call
    /^MKAY$/, // End of function call
    /^BUHBYE$/, // Program end
    /^KTHXBYE$/ // Program end
  ]

  content.split('\n').forEach((line, lineNumber) => {
    const trimmedLine = line.trim()

    // Skip empty lines
    if (!trimmedLine) return

    // Skip valid comments
    if (/^BTW/.test(trimmedLine) || /^OBTW[\s\S]*?TLDR$/.test(trimmedLine)) return

    // Check against valid syntax patterns
    const isValid = validSyntaxPatterns.some((pattern) => pattern.test(trimmedLine))

    // If the line doesn't match any valid syntax, log an error
    if (!isValid) {
      errors.push({
        error: `Invalid syntax: "${trimmedLine}"`,
        line: lineNumber + 1 // Adjusting for 0-based index
      })
    }
  })

  for (const { error, line } of errors) {
    console.log(error, line)
  }

  // Find identifiers, ensuring they don't overlap with errors, keywords, or literals
  while ((match = identifierPattern.exec(content)) !== null) {
    const identifierRange = [...Array(match[0].length).keys()].map((i) => match.index + i)
    const overlapsWithKeywordLiteralOrError = identifierRange.some(
      (pos) => keywordPositions.has(pos) || literalPositions.has(pos) || errorPositions.has(pos)
    )

    if (!overlapsWithKeywordLiteralOrError) {
      lexemeData.push({
        lexeme: match[0],
        classification: 'Identifier',
        position: match.index
      })
    }
  }

  // Sort lexemes by position
  lexemeData.sort((a, b) => a.position - b.position)

  // Populate symbol table
  const assignmentPattern = /\bI HAS A ([A-Za-z][A-Za-z0-9_]*) ITZ (-?\d+(\.\d+)?|".*?")/g
  while ((match = assignmentPattern.exec(content)) !== null) {
    const identifier = match[1]
    const value = match[2].trim()
    initialSymbolTable[identifier] = value
  }

  // Remove duplicate lexemes
  const uniqueLexemeData = lexemeData.filter(
    (lexeme, index, self) => index === self.findIndex((t) => t.lexeme === lexeme.lexeme)
  )

  setLexemes(uniqueLexemeData)
  setSymbolTable(initialSymbolTable)
}

export default processFileContent
