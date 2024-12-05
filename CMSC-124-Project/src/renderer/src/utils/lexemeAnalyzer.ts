import { keywordClassifications } from './constants'
import { Lexeme } from '@renderer/interfaces/interfaces'
import { AppDispatch } from '@renderer/store/store'
import { setLexeme } from '@renderer/store/slices/lexemeSlice'
import { setErrors } from '@renderer/store/slices/errorSlice'

const lexemeAnalyzer = (content: string, dispatch: AppDispatch) => {
  const lexemeData: Lexeme[] = []
  const keywordPositions = new Set<number>()
  const literalPositions = new Set<number>()
  const errors: { error: string; line: number }[] = []

  // Add FAIL and WIN to keywords if they are constants or predefined keywords
  const keywords =
    /\b(?:AN|VISIBLE|HAI|KTHXBYE|WAZZUP|BUHBYE|BTW|OBTW|TLDR|I HAS A|ITZ|R|SUM OF|DIFF OF|PRODUKT OF|QUOSHUNT OF|MOD OF|BIGGR OF|SMALLR OF|BOTH OF|EITHER OF|WON OF|NOT|ANY OF|ALL OF|BOTH SAEM|DIFFRINT|SMOOSH|MAEK|A|IS NOW A|VISIBLE|GIMMEH|O RLY|YA RLY|MEBBE|NO WAI|OIC|WTF|OMG|OMGWTF|IM IN YR|UPPIN|NERFIN|YR|TIL|WILE|IM OUTTA YR|HOW IZ I|IF U SAY SO|GTFO|FOUND YR|I IZ|MKAY|FAIL|WIN)\b\??/g

  const identifierPattern = /\b[A-Za-z][A-Za-z0-9_]*\b/g
  const stringPattern = /(["'])(.*?)(\1)/g
  const numberPattern = /\b\d+\.\d+|\b\d+\b/g
  const operatorPattern = /[\+\-*/%]/g

  // Sanitize comments from content before lexeme analysis
  const sanitizedContent = content
    // Handle multi-line comments (OBTW ... TLDR)
    .replace(/OBTW[\s\S]*?TLDR/g, '')
    // Remove inline comments (BTW and everything after it on the same line)
    .replace(/BTW.*/g, '')
    // Remove any empty lines or lines with only whitespace
    .replace(/^\s*$(?:\r\n?|\n)/gm, '')

  let match
  const seenLexemes = new Set<string>()

  // Match keywords
  while ((match = keywords.exec(sanitizedContent)) !== null) {
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

  // Match string literals
  while ((match = stringPattern.exec(sanitizedContent)) !== null) {
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

  // Match numbers correctly, ensuring we don't split them
  while ((match = numberPattern.exec(sanitizedContent)) !== null) {
    console.log('Found number:', match[0]) // Debugging
    if (!seenLexemes.has(match[0])) {
      lexemeData.push({ lexeme: match[0], classification: 'Literal', position: match.index })
      seenLexemes.add(match[0])
    }
    for (let i = match.index; i < match.index + match[0].length; i++) {
      literalPositions.add(i)
    }
  }

  // Match operators
  while ((match = operatorPattern.exec(sanitizedContent)) !== null) {
    if (!seenLexemes.has(match[0])) {
      lexemeData.push({ lexeme: match[0], classification: 'Operator', position: match.index })
      seenLexemes.add(match[0])
    }
  }

  // Match identifiers
  while ((match = identifierPattern.exec(sanitizedContent)) !== null) {
    const identifierRange = Array.from({ length: match[0].length }, (_, i) => match.index + i)
    const overlaps = identifierRange.some(
      (pos) => keywordPositions.has(pos) || literalPositions.has(pos)
    )

    if (!overlaps && !seenLexemes.has(match[0])) {
      lexemeData.push({ lexeme: match[0], classification: 'Identifier', position: match.index })
      seenLexemes.add(match[0])
    }
  }

  // Modify VISIBLE processing to handle the "+" operator properly
  // Modify VISIBLE processing to handle the "+" operator properly
  const visiblePattern = /VISIBLE\s+(.+)/g
  while ((match = visiblePattern.exec(sanitizedContent)) !== null) {
    const expression = match[1].trim()

    const parts = expression.split(/\s+/g)

    parts.forEach((part) => {
      if (part === '+') {
        if (!seenLexemes.has(part)) {
          // Check for "+"
          lexemeData.push({
            lexeme: part,
            classification: 'Operator',
            position: match.index + expression.indexOf(part)
          })
          seenLexemes.add(part)
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
            position: match.index + expression.indexOf(part)
          })
          seenLexemes.add(part.trim())
        }
      } else if (part.match(numberPattern)) {
        if (!seenLexemes.has(part.trim())) {
          lexemeData.push({
            lexeme: part.trim(),
            classification: 'Literal',
            position: match.index + expression.indexOf(part)
          })
          seenLexemes.add(part.trim())
        }
      }
    })
  }

  // Add errors for unrecognized tokens
  const tokenPattern =
    /(?:\b(?:VISIBLE|AN|HAI|KTHXBYE|WAZZUP|BUHBYE|BTW|OBTW|TLDR|I HAS A|ITZ|R|SUM OF|DIFF OF|PRODUKT OF|QUOSHUNT OF|MOD OF|BIGGR OF|SMALLR OF|BOTH OF|EITHER OF|WON OF|NOT|ANY OF|ALL OF|BOTH SAEM|DIFFRINT|SMOOSH|MAEK|A|IS NOW A|VISIBLE|GIMMEH|O RLY|YA RLY|MEBBE|NO WAI|OIC|WTF|OMG|OMGWTF|IM IN YR|UPPIN|NERFIN|YR|TIL|WILE|IM OUTTA YR|HOW IZ I|IF U SAY SO|GTFO|FOUND YR|I IZ|MKAY|FAIL|WIN)\b\??)|(?:[A-Za-z_][A-Za-z0-9_]*)|(?:\d+\.\d+|\d+)|(?:".*?")|(?:[+\-*\/=<>!%&|^~])|(?:\s+)/g

  // Split content into tokens while preserving operators
  const tokens = sanitizedContent.split(tokenPattern)

  tokens.forEach((token, index) => {
    if (!token || token.trim() === '') {
      return
    }

    if (seenLexemes.has(token)) {
      return
    }

    if (keywords.test(token)) {
      // Keyword
      lexemeData.push({
        lexeme: token,
        classification: keywordClassifications[token] || 'Keyword',
        position: index + 1
      })
    } else if (identifierPattern.test(token)) {
      // Identifier
      lexemeData.push({
        lexeme: token,
        classification: 'Identifier',
        position: index + 1
      })
    } else if (stringPattern.test(token)) {
      // String literal
      lexemeData.push({
        lexeme: token,
        classification: 'String Literal',
        position: index + 1
      })
    } else if (numberPattern.test(token)) {
      // Number literal
      lexemeData.push({
        lexeme: token,
        classification: 'Number Literal',
        position: index + 1
      })
    } else if (operatorPattern.test(token)) {
      // Operator
      lexemeData.push({
        lexeme: token,
        classification: 'Operator',
        position: index + 1
      })
    } else {
      // Unrecognized token
      errors.push({ error: `Unrecognized token: "${token}"`, line: index + 1 })
    }
  })
  console.log('Lexeme Errors', errors)

  lexemeData.sort((a, b) => a.position - b.position)
  dispatch(setErrors(errors))
  dispatch(setLexeme(lexemeData))
}

export default lexemeAnalyzer
