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

  let match

  // Match keywords
  while ((match = keywords.exec(content)) !== null) {
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
  while ((match = stringPattern.exec(content)) !== null) {
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
  while ((match = numberPattern.exec(content)) !== null) {
    lexemeData.push({ lexeme: match[0], classification: 'Literal', position: match.index })
    for (let i = match.index; i < match.index + match[0].length; i++) {
      literalPositions.add(i)
    }
  }

  // Match identifiers
  while ((match = identifierPattern.exec(content)) !== null) {
    const identifierRange = Array.from({ length: match[0].length }, (_, i) => match.index + i)
    const overlaps = identifierRange.some(
      (pos) => keywordPositions.has(pos) || literalPositions.has(pos)
    )

    if (!overlaps) {
      lexemeData.push({ lexeme: match[0], classification: 'Identifier', position: match.index })
    }
  }

  // Add errors for unrecognized tokens
  content.split(/\s+/).forEach((word, index) => {
    if (
      !keywords.test(word) &&
      !identifierPattern.test(word) &&
      !stringPattern.test(word) &&
      !numberPattern.test(word)
    ) {
      errors.push({ error: `Unrecognized token: "${word}"`, line: index + 1 })
    }
  })

  console.log('Lexeme Errors', errors)

  lexemeData.sort((a, b) => a.position - b.position)
  setLexemes(lexemeData)
  setErrors(errors)
}

export default lexemeAnalyzer
