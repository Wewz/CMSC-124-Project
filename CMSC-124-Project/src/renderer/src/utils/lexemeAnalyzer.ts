import { keywordClassifications } from './constants'
import { Lexeme } from '@renderer/interfaces/interfaces'

const lexemeAnalyzer = (
  content: string,
  setLexemes: React.Dispatch<React.SetStateAction<any>>,
  setErrors: React.Dispatch<React.SetStateAction<any>>
) => {
  const lexemeData: Lexeme[] = []
  const keywordPositions = new Set<number>()
  const literalPositions = new Set<number>()
  const errors: { error: string; line: number }[] = []

  const keywords =
    /\b(?:AN|VISIBLE|HAI|KTHXBYE|WAZZUP|BUHBYE|BTW|OBTW|TLDR|I HAS A|ITZ|R|SUM OF|DIFF OF|PRODUKT OF|QUOSHUNT OF|MOD OF|BIGGR OF|SMALLR OF|BOTH OF|EITHER OF|WON OF|NOT|ANY OF|ALL OF|BOTH SAEM|DIFFRINT|SMOOSH|MAEK|A|IS NOW A|VISIBLE|GIMMEH|O RLY|YA RLY|MEBBE|NO WAI|OIC|WTF|OMG|OMGWTF|IM IN YR|UPPIN|NERFIN|YR|TIL|WILE|IM OUTTA YR|HOW IZ I|IF U SAY SO|GTFO|FOUND YR|I IZ|MKAY)\b\??/g

  const identifierPattern = /\b[A-Za-z][A-Za-z0-9_]*\b/g
  const stringPattern = /(["'])(.*?)(\1)/g
  const numberPattern = /\b\d+(\.\d+)?\b/g
  const operatorPattern = /[\+\-*/%]/g

  // Sanitize comments from content before lexeme analysis
  const sanitizedContent = content
    // Handle multi-line comments (OBTW ... TLDR)
    .replace(/OBTW[\s\S]*?TLDR/g, '')
    // Handle inline comments (BTW ...)
    .replace(/BTW.*/g, '')

  let match

  // Match keywords
  while ((match = keywords.exec(sanitizedContent)) !== null) {
    lexemeData.push({
      lexeme: match[0],
      classification: keywordClassifications[match[0]] || 'Keyword',
      position: match.index
    })
    for (let i = match.index; i < match.index + match[0].length; i++) {
      keywordPositions.add(i)
    }
  }

  // Match string literals
  while ((match = stringPattern.exec(sanitizedContent)) !== null) {
    lexemeData.push(
      { lexeme: match[1], classification: 'Opening Quote', position: match.index },
      { lexeme: match[2], classification: 'Literal', position: match.index + match[1].length },
      {
        lexeme: match[3],
        classification: 'Closing Quote',
        position: match.index + match[0].length - 1
      }
    )
    for (let i = match.index; i < match.index + match[0].length; i++) {
      literalPositions.add(i)
    }
  }

  // Match numbers
  while ((match = numberPattern.exec(sanitizedContent)) !== null) {
    lexemeData.push({ lexeme: match[0], classification: 'Literal', position: match.index })
    for (let i = match.index; i < match.index + match[0].length; i++) {
      literalPositions.add(i)
    }
  }

  // Match operators (+, -, *, /, etc.)
  while ((match = operatorPattern.exec(sanitizedContent)) !== null) {
    lexemeData.push({ lexeme: match[0], classification: 'Operator', position: match.index })
  }

  // Match identifiers
  while ((match = identifierPattern.exec(sanitizedContent)) !== null) {
    const identifierRange = Array.from({ length: match[0].length }, (_, i) => match.index + i)
    const overlaps = identifierRange.some(
      (pos) => keywordPositions.has(pos) || literalPositions.has(pos)
    )

    if (!overlaps) {
      lexemeData.push({ lexeme: match[0], classification: 'Identifier', position: match.index })
    }
  }

  // Handle concatenation within VISIBLE statements
  const visiblePattern = /VISIBLE\s+(.+)/g
  while ((match = visiblePattern.exec(sanitizedContent)) !== null) {
    const expression = match[1].trim()

    // Split concatenated expression by '+' or whitespace
    const parts = expression.split(/\s*\+\s*/g)
    parts.forEach((part) => {
      if (part.match(stringPattern)) {
        const stringMatch = stringPattern.exec(part)
        if (stringMatch) {
          lexemeData.push(
            {
              lexeme: stringMatch[1],
              classification: 'Opening Quote',
              position: stringMatch.index
            },
            {
              lexeme: stringMatch[2],
              classification: 'Literal',
              position: stringMatch.index + stringMatch[1].length
            },
            {
              lexeme: stringMatch[3],
              classification: 'Closing Quote',
              position: stringMatch.index + stringMatch[0].length - 1
            }
          )
        }
      } else if (part.match(identifierPattern)) {
        lexemeData.push({
          lexeme: part.trim(),
          classification: 'Identifier',
          position: match.index
        })
      } else if (part.match(numberPattern)) {
        lexemeData.push({
          lexeme: part.trim(),
          classification: 'Literal',
          position: match.index
        })
      }
    })
  }

  // Add errors for unrecognized tokens
  sanitizedContent.split(/\s+/).forEach((word, index) => {
    keywords.lastIndex = 0
    identifierPattern.lastIndex = 0
    stringPattern.lastIndex = 0
    numberPattern.lastIndex = 0

    if (
      !keywords.test(word) &&
      !identifierPattern.test(word) &&
      !stringPattern.test(word) &&
      !numberPattern.test(word)
    ) {
      errors.push({ error: `Unrecognized token: "${word}"`, line: index + 1 })
    }
  })

  lexemeData.sort((a, b) => a.position - b.position)
  setLexemes(lexemeData)
  setErrors(errors)
}

export default lexemeAnalyzer
