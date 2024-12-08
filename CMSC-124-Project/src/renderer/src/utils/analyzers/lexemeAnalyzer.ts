import { keywordClassifications } from './constants'
import { Lexeme } from '@renderer/interfaces/interfaces'
import { AppDispatch } from '@renderer/store/store'
import { setLexeme } from '@renderer/store/slices/lexemeSlice'
import { setErrors } from '@renderer/store/slices/errorSlice'
import {
  matchKeywords,
  matchStringLiterals,
  matchNumbers,
  matchOperators,
  matchIdentifiers,
  handleVisibleStatements
} from './lexemeAnalyzerHelper'

const lexemeAnalyzer = (content: string, dispatch: AppDispatch) => {
  const lexemeData: Lexeme[] = []
  const keywordPositions = new Set<number>()
  const literalPositions = new Set<number>()
  const errors: { error: string; line: number }[] = []

  const keywords =
    /\b(?:AN|VISIBLE|HAI|KTHXBYE|WAZZUP|BUHBYE|BTW|OBTW|TLDR|I HAS A|ITZ|R|SUM OF|DIFF OF|PRODUKT OF|QUOSHUNT OF|MOD OF|BIGGR OF|SMALLR OF|BOTH OF|EITHER OF|WON OF|NOT|ANY OF|ALL OF|BOTH SAEM|DIFFRINT|SMOOSH|MAEK|A|IS NOW A|VISIBLE|GIMMEH|O RLY|YA RLY|MEBBE|NO WAI|OIC|WTF|OMG|OMGWTF|IM IN YR|UPPIN|NERFIN|YR|TIL|WILE|IM OUTTA YR|HOW IZ I|IF U SAY SO|GTFO|FOUND YR|I IZ|MKAY|FAIL|WIN)\b\??/g

  const identifierPattern = /\b[A-Za-z][A-Za-z0-9_]*\b/g
  const stringPattern = /(["'])(.*?)(\1)/g
  const numberPattern = /\b\d+\.\d+|\b\d+\b/g
  const operatorPattern = /[\+\-*/%]/g
  const visiblePattern = /VISIBLE\s+(.+)/g

  // Sanitize comments from content before lexeme analysis
  const sanitizedContent = content
    .replace(/OBTW[\s\S]*?TLDR/g, '') // Handle multi-line comments (OBTW ... TLDR)
    .replace(/BTW.*/g, '') // Remove inline comments (BTW and everything after it on the same line)
    .replace(/^\s*$(?:\r\n?|\n)/gm, '') // Remove any empty lines or lines with only whitespace

  const seenLexemes = new Set<string>()

  matchKeywords(sanitizedContent, keywords, seenLexemes, lexemeData, keywordPositions)
  matchStringLiterals(sanitizedContent, stringPattern, seenLexemes, lexemeData, literalPositions)
  matchNumbers(sanitizedContent, numberPattern, seenLexemes, lexemeData, literalPositions)
  matchOperators(sanitizedContent, operatorPattern, seenLexemes, lexemeData)
  matchIdentifiers(
    sanitizedContent,
    identifierPattern,
    seenLexemes,
    lexemeData,
    keywordPositions,
    literalPositions
  )
  handleVisibleStatements(
    sanitizedContent,
    visiblePattern,
    keywords,
    stringPattern,
    identifierPattern,
    numberPattern,
    operatorPattern,
    seenLexemes,
    lexemeData,
    errors
  )

  // Add errors for unrecognized tokens
  const tokenPattern =
    /(?:\b(?:VISIBLE|AN|HAI|KTHXBYE|WAZZUP|BUHBYE|BTW|OBTW|TLDR|I HAS A|ITZ|R|SUM OF|DIFF OF|PRODUKT OF|QUOSHUNT OF|MOD OF|BIGGR OF|SMALLR OF|BOTH OF|EITHER OF|WON OF|NOT|ANY OF|ALL OF|BOTH SAEM|DIFFRINT|SMOOSH|MAEK|A|IS NOW A|VISIBLE|GIMMEH|O RLY|YA RLY|MEBBE|NO WAI|OIC|WTF|OMG|OMGWTF|IM IN YR|UPPIN|NERFIN|YR|TIL|WILE|IM OUTTA YR|HOW IZ I|IF U SAY SO|GTFO|FOUND YR|I IZ|MKAY|FAIL|WIN)\b\??)|(?:[A-Za-z_][A-Za-z0-9_]*)|(?:\d+\.\d+|\d+)|(?:".*?")|(?:[+\-*\/=<>!%&|^~])|(?:\s+)/g

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
