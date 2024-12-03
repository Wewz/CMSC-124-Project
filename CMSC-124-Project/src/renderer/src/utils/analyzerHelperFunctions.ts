import { SymbolTableEntry } from '@renderer/interfaces/interfaces'

/*** Helper Functions ***/

// Check if a value is a literal or a valid identifier
const isLiteralOrIdentifier = (value: string, declaredVariables: Set<string>) => {
  return (
    /^-?\d+(\.\d+)?$/.test(value) || // Number literal
    /^".*?"$/.test(value) || // String literal
    /^(WIN|FAIL)$/.test(value) || // TROOF literal
    declaredVariables.has(value) // Valid identifier
  )
}

// Extract a conditional block to validate its structure
const extractConditionalBlock = (lines: string[], startLine: number): { valid: boolean } => {
  let hasYaRly = false
  let hasOic = false

  for (let i = startLine; i < lines.length; i++) {
    const trimmedLine = lines[i].trim()
    if (/^YA RLY$/.test(trimmedLine)) hasYaRly = true
    if (/^OIC$/.test(trimmedLine)) {
      hasOic = true
      break
    }
  }

  return { valid: hasYaRly && hasOic }
}

const evaluateExpression = (
  expression: string,
  symbolTable: Record<string, SymbolTableEntry>,
  lineNumber: number,
  errors: { error: string; line: number }[]
): { type: string; value: any } => {
  console.log('Current Expression', expression)

  // Check for literals
  if (/^-?\d+$/.test(expression)) return { type: 'NUMBR', value: parseInt(expression, 10) }
  if (/^-?\d+\.\d+$/.test(expression)) return { type: 'NUMBAR', value: parseFloat(expression) }
  if (/^(WIN|FAIL)$/.test(expression)) return { type: 'TROOF', value: expression === 'WIN' }
  if (/^(true|false)$/.test(expression)) return { type: 'TROOF', value: expression === 'true' }
  if (/^".*"$/.test(expression)) return { type: 'YARN', value: expression.slice(1, -1) }

  // Check for valid variable
  if (symbolTable[expression]) {
    const variable = symbolTable[expression]
    return { type: variable.type, value: variable.value }
  }

  let currentExpression = expression
  let matched = false

  // Arithmetic patterns for various operations
  const arithmeticPatterns = [
    { pattern: /SUM OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => a + b, type: 'NUMBR' },
    { pattern: /DIFF OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => a - b, type: 'NUMBR' },
    { pattern: /PRODUKT OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => a * b, type: 'NUMBR' },
    { pattern: /QUOSHUNT OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => a / b, type: 'NUMBR' },
    { pattern: /MOD OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => a % b, type: 'NUMBR' },
    { pattern: /BIGGR OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => Math.max(a, b), type: 'NUMBR' },
    { pattern: /SMALLR OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => Math.min(a, b), type: 'NUMBR' }
  ]

  const patternsKeywords = [/BOTH/, /EITHER/, /WON/, /NOT/, /ALL/, /ANY/, /BOTH/, /DIFFRINT/]

  // Logical patterns
  const logicalPatterns = [
    { pattern: /BOTH OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => a && b },
    { pattern: /EITHER OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => a || b },
    { pattern: /WON OF (\w+)\s+AN\s+(\w+)/, operation: (a, b) => a !== b },
    { pattern: /NOT (\w+)/, operation: (a, b) => !a },
    { pattern: /^ALL OF (\w+)\s+AN\s+(\w+) (.+) MKAY/, operation: (a, b) => a && b },
    { pattern: /^ANY OF (\w+)\s+AN\s+(\w+) (.+) MKAY/, operation: (a, b) => a || b }
  ]

  // Comparison patterns
  const comparisonPatterns = [
    { pattern: /BOTH SAEM (\w+)\s+AN\s+(\w+)/, operation: (a, b) => a === b },
    { pattern: /DIFFRINT(\w+)\s+AN\s+(\w+)/, operation: (a, b) => a !== b }
  ]

  // Recursive evaluation for arithmetic, logical, and comparison operations
  const recursiveEvaluation = (patterns: any[], patternsKeywords: any[]) => {
    do {
      matched = false
      for (const { pattern, operation } of patterns) {
        const match = currentExpression.match(pattern)
        if (match) {
          matched = true

          console.log('Matched Expression', match)

          if (patternsKeywords.some((keyword) => match[1].includes(keyword.source))) {
            matched = false
            continue
          }

          if (patternsKeywords.some((keyword) => match[2]?.includes(keyword.source))) {
            matched = false
            continue
          }

          const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
          const right = match[2]
            ? evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)
            : null

          // Type validation
          if (
            (patterns === arithmeticPatterns &&
              left.type === 'NUMBR' &&
              right &&
              right.type === 'NUMBR') ||
            (patterns === logicalPatterns &&
              left.type === 'TROOF' &&
              (!right || right.type === 'TROOF')) ||
            (patterns === comparisonPatterns && right && left.type === right.type)
          ) {
            const result = operation(left.value, right ? right.value : undefined)
            currentExpression = currentExpression.replace(match[0], result.toString())
          } else {
            const patternName =
              patterns === logicalPatterns
                ? 'logical'
                : patterns === comparisonPatterns
                  ? 'comparison'
                  : 'arithmetic'
            errors.push({
              error: `Invalid operands for ${patternName} operation: "${match[0]}"`,
              line: lineNumber
            })
            console.log('Invalid operators', match)
            return { type: 'ERROR', value: null }
          }
        }
      }
    } while (matched)
  }

  // Perform recursive evaluation for each type of operation
  recursiveEvaluation(arithmeticPatterns, [])
  recursiveEvaluation(logicalPatterns, patternsKeywords)
  recursiveEvaluation(comparisonPatterns, patternsKeywords)

  // If no valid expression resolved
  if (currentExpression !== expression) {
    return evaluateExpression(currentExpression, symbolTable, lineNumber, errors)
  }

  // Invalid expression
  errors.push({ error: `Invalid expression: "${expression}"`, line: lineNumber })
  return { type: 'ERROR', value: null }
}

export { isLiteralOrIdentifier, extractConditionalBlock, evaluateExpression }
