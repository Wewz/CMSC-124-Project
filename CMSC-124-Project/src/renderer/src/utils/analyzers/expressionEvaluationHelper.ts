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

const escapeRegex = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Helper function to parse YARN as a number
const parseYarnToNumber = (value: string) => {
  if (/^-?\d+$/.test(value)) return { type: 'NUMBR', value: parseInt(value, 10) }
  if (/^-?\d+\.\d+$/.test(value)) return { type: 'NUMBAR', value: parseFloat(value) }
  return null
}

const typecastValue = (value: any, type: string, context: string) => {
  if (context === 'comparison') return { type, value }

  if (type === 'NOOB') {
    return context === 'arithmetic' ? { type: 'NUMBR', value: 0 } : { type: 'TROOF', value: false } // NOOB becomes FAIL/false for boolean/comparison
  }

  console.log('Values to be typecast', value, type, context)

  if (type === 'TROOF') {
    console.log('Return Value', value === true || value === 'WIN' ? 1 : 0, context === 'arithmetic')
    return context === 'arithmetic'
      ? { type: 'NUMBR', value: value === true || value === 'WIN' ? 1 : 0 }
      : { type: 'TROOF', value: value === true || value === 'WIN' }
  }

  if (type === 'YARN') {
    const parsed = parseYarnToNumber(value)
    if (parsed) {
      return typecastValue(parsed.value, parsed.type, context)
    }
    const isFalsy = value === '' // Empty strings are FAIL/false
    return {
      type: context === 'arithmetic' ? 'NUMBR' : 'TROOF',
      value: context === 'arithmetic' ? 0 : !isFalsy
    }
  }

  if (type === 'NUMBR' || type === 'NUMBAR') {
    if (context === 'boolean') {
      const isFalsy = value === 0 || value === '0'
      return { type: 'TROOF', value: !isFalsy } // Non-zero is WIN/true
    }
    return { type, value }
  }

  return { type, value } // Return as-is if no special rules apply
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
  if (/^".*"$/.test(expression)) {
    const strippedValue = expression.slice(1, -1)
    const parsed = parseYarnToNumber(strippedValue)
    if (parsed) return parsed // Convert YARN to NUMBR or NUMBAR if possible
    return { type: 'YARN', value: strippedValue }
  }

  // Check for valid variable
  if (symbolTable[expression]) {
    const variable = symbolTable[expression]
    if (variable.type === 'YARN') {
      const parsed = parseYarnToNumber(variable.value)
      if (parsed) return parsed
    }
    return { type: variable.type, value: variable.value }
  }

  let currentExpression = expression
  let matched = false

  // Arithmetic patterns for various operations
  const arithmeticPatterns = [
    { pattern: /PRODUKT OF ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a * b, type: 'NUMBR' },
    { pattern: /QUOSHUNT OF ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a / b, type: 'NUMBR' },
    { pattern: /MOD OF ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a % b, type: 'NUMBR' },
    { pattern: /SUM OF ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a + b, type: 'NUMBR' },
    { pattern: /DIFF OF ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a - b, type: 'NUMBR' },
    {
      pattern: /BIGGR OF ([^\s]+)\s+AN\s+([^\s]+)/,
      operation: (a, b) => Math.max(a, b),
      type: 'NUMBR'
    },
    {
      pattern: /SMALLR OF ([^\s]+)\s+AN\s+([^\s]+)/,
      operation: (a, b) => Math.min(a, b),
      type: 'NUMBR'
    }
  ]

  // Logical patterns
  const logicalPatterns = [
    { pattern: /BOTH OF ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a && b },
    { pattern: /EITHER OF ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a || b },
    { pattern: /WON OF ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a !== b },
    { pattern: /NOT ([^\s]+)/, operation: (a, b) => !a },
    { pattern: /ALL OF ([^\s]+)\s+AN\s+([^\s]+) (.+) MKAY/, operation: (a, b) => a && b },
    { pattern: /ANY OF ([^\s]+)\s+AN\s+([^\s]+) (.+) MKAY/, operation: (a, b) => a || b }
  ]

  // Comparison patterns
  const comparisonPatterns = [
    { pattern: /BOTH SAEM ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a === b },
    { pattern: /DIFFRINT ([^\s]+)\s+AN\s+([^\s]+)/, operation: (a, b) => a !== b }
  ]

  const arithmeticKeywords = [/SUM/, /DIFF/, /PRODUKT/, /QUOSHUNT/, /MOD/, /BIGGR/, /SMALLR/]
  const logicalKeywords = [/BOTH/, /EITHER/, /WON/, /NOT/, /ALL/, /ANY/, /DIFFRINT/]
  const comparisonKeywords = [/BOTH/, /DIFFRINT/]

  // Recursive evaluation for arithmetic, logical, and comparison operations
  const recursiveEvaluation = (
    patterns: any[],
    patternsKeywords: any[],
    operation_type: string
  ) => {
    do {
      matched = false

      for (const { pattern, operation } of patterns) {
        const match = currentExpression.match(pattern)
        if (match) {
          matched = true

          console.log('Matched Expression', match)

          // Check if the left operand contains unresolved arithmetic keywords
          if (patternsKeywords.some((keyword) => keyword.test(match[1]))) {
            matched = false
            continue
          }

          // Check if the right operand contains unresolved arithmetic keywords
          if (match[2] && patternsKeywords.some((keyword) => keyword.test(match[2]))) {
            const compoundExpression = match[0].match(/(.+)\s+(\w+)/)
            const tempExpression = expression

            if (!compoundExpression || !compoundExpression[1]) return

            const escapedCompoundExpression = escapeRegex(compoundExpression[1])
            let subExpression = tempExpression.match(
              new RegExp(`${escapedCompoundExpression}\\s+(.+)`)
            )

            if (!subExpression) {
              subExpression = currentExpression.match(
                new RegExp(`${escapedCompoundExpression}\\s+(.+)`)
              )
            }

            if (!subExpression || !subExpression[1]) return

            const subExpressionResult = evaluateExpression(
              subExpression[1].trim(),
              symbolTable,
              lineNumber,
              errors
            )

            currentExpression = currentExpression.replace(
              subExpression[0],
              subExpressionResult.value.toString()
            )

            matched = false
            continue
          }

          const left = typecastValue(
            evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors).value,
            evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors).type,
            operation_type
          )

          const right = match[2]
            ? typecastValue(
                evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors).value,
                evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors).type,
                operation_type
              )
            : null

          // Type validation
          if (
            (patterns === arithmeticPatterns &&
              (left.type === 'NUMBR' || left.type === 'NUMBAR') &&
              right &&
              (right.type === 'NUMBR' || right.type === 'NUMBAR')) ||
            (patterns === logicalPatterns &&
              left.type === 'TROOF' &&
              (!right || right.type === 'TROOF')) ||
            (patterns === comparisonPatterns && right && left.type === right.type)
          ) {
            const result = operation(left.value, right ? right.value : undefined)
            currentExpression = currentExpression.replace(match[0], result.toString())
            // console.log(`${right?.value} ${operation_type} ${left.value} = ${result}`)
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
  recursiveEvaluation(arithmeticPatterns, arithmeticKeywords, 'arithmetic')
  recursiveEvaluation(logicalPatterns, logicalKeywords, 'boolean')
  recursiveEvaluation(comparisonPatterns, comparisonKeywords, 'comparison')

  // If no valid expression resolved
  if (currentExpression !== expression) {
    return evaluateExpression(currentExpression, symbolTable, lineNumber, errors)
  }

  if (currentExpression.match(/(.+) MKAY$/)) {
    return { type: '', value: currentExpression }
  }

  // Invalid expression
  errors.push({ error: `Invalid expression: "${expression}"`, line: lineNumber })
  return { type: 'ERROR', value: null }
}

export { isLiteralOrIdentifier, extractConditionalBlock, evaluateExpression, typecastValue }
