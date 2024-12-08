import { keywordClassifications } from './constants'
import { Lexeme } from '@renderer/interfaces/interfaces'
import { separateVisibleStatement } from './analyzerHelper'

const matchKeywords = (
  content: string,
  keywords: RegExp,
  seenLexemes: Set<string>,
  lexemeData: Lexeme[],
  keywordPositions: Set<number>
) => {
  let match
  while ((match = keywords.exec(content)) !== null) {
    if (!seenLexemes.has(match[0])) {
      lexemeData.push({
        lexeme: match[0],
        classification: keywordClassifications[match[0]] || 'Keyword',
        position: match.index
      })
      seenLexemes.add(match[0])
    }
    for (let i = match.index; i < match.index + match[0].length; i++) {
      keywordPositions.add(i)
    }
  }
}

const matchStringLiterals = (
  content: string,
  stringPattern: RegExp,
  seenLexemes: Set<string>,
  lexemeData: Lexeme[],
  literalPositions: Set<number>
) => {
  let match
  while ((match = stringPattern.exec(content)) !== null) {
    if (!seenLexemes.has(match[0])) {
      lexemeData.push(
        { lexeme: match[1], classification: 'Opening Quote', position: match.index },
        { lexeme: match[2], classification: 'Literal', position: match.index + match[1].length },
        {
          lexeme: match[3],
          classification: 'Closing Quote',
          position: match.index + match[0].length - 1
        }
      )
      seenLexemes.add(match[0])
    }
    for (let i = match.index; i < match.index + match[0].length; i++) {
      literalPositions.add(i)
    }
  }
}

const matchNumbers = (
  content: string,
  numberPattern: RegExp,
  seenLexemes: Set<string>,
  lexemeData: Lexeme[],
  literalPositions: Set<number>
) => {
  let match
  while ((match = numberPattern.exec(content)) !== null) {
    if (!seenLexemes.has(match[0])) {
      lexemeData.push({ lexeme: match[0], classification: 'Literal', position: match.index })
      seenLexemes.add(match[0])
    }
    for (let i = match.index; i < match.index + match[0].length; i++) {
      literalPositions.add(i)
    }
  }
}

const matchOperators = (
  content: string,
  operatorPattern: RegExp,
  seenLexemes: Set<string>,
  lexemeData: Lexeme[]
) => {
  let match
  while ((match = operatorPattern.exec(content)) !== null) {
    if (!seenLexemes.has(match[0])) {
      lexemeData.push({ lexeme: match[0], classification: 'Operator', position: match.index })
      seenLexemes.add(match[0])
    }
  }
}

const matchIdentifiers = (
  content: string,
  identifierPattern: RegExp,
  seenLexemes: Set<string>,
  lexemeData: Lexeme[],
  keywordPositions: Set<number>,
  literalPositions: Set<number>
) => {
  let match
  while ((match = identifierPattern.exec(content)) !== null) {
    const identifierRange = Array.from({ length: match[0].length }, (_, i) => match.index + i)
    const overlaps = identifierRange.some(
      (pos) => keywordPositions.has(pos) || literalPositions.has(pos)
    )

    if (!overlaps && !seenLexemes.has(match[0])) {
      lexemeData.push({ lexeme: match[0], classification: 'Identifier', position: match.index })
      seenLexemes.add(match[0])
    }
  }
}

const handleVisibleStatements = (
  content: string,
  visiblePattern: RegExp,
  keywords: RegExp,
  stringPattern: RegExp,
  identifierPattern: RegExp,
  numberPattern: RegExp,
  operatorPattern: RegExp,
  seenLexemes: Set<string>,
  lexemeData: Lexeme[],
  errors: { error: string; line: number }[]
) => {
  let match
  while ((match = visiblePattern.exec(content)) !== null) {
    // Split concatenated expression by '+' or whitespace
    const parts = separateVisibleStatement(match[1].trim())

    parts.forEach((part) => {
      if (keywords.test(part)) {
        const keywordMatch = keywords.exec(part)
        if (keywordMatch && !seenLexemes.has(keywordMatch[0])) {
          lexemeData.push({
            lexeme: keywordMatch[0],
            classification: keywordClassifications[keywordMatch[0]] || 'Keyword',
            position: keywordMatch.index
          })
          seenLexemes.add(keywordMatch[0])
        }
      } else if (part.match(stringPattern)) {
        const stringMatch = stringPattern.exec(part)
        if (stringMatch && !seenLexemes.has(stringMatch[0])) {
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
          seenLexemes.add(stringMatch[0])
        }
      } else if (part.match(identifierPattern)) {
        if (!seenLexemes.has(part.trim())) {
          lexemeData.push({
            lexeme: part.trim(),
            classification: 'Identifier',
            position: match.index
          })
          seenLexemes.add(part.trim())
        }
      } else if (part.match(numberPattern)) {
        if (!seenLexemes.has(part.trim())) {
          lexemeData.push({
            lexeme: part.trim(),
            classification: 'Literal',
            position: match.index
          })
          seenLexemes.add(part.trim())
        }
      } else if (part.match(operatorPattern)) {
        if (!seenLexemes.has(part.trim())) {
          lexemeData.push({
            lexeme: part.trim(),
            classification: 'Operator',
            position: match.index
          })
          seenLexemes.add(part.trim())
        }
      } else {
        errors.push({
          error: `Unrecognized token in VISIBLE statement: "${part}"`,
          line: match.index
        })
      }
    })
  }
}

export {
  matchKeywords,
  matchStringLiterals,
  matchNumbers,
  matchOperators,
  matchIdentifiers,
  handleVisibleStatements
}
