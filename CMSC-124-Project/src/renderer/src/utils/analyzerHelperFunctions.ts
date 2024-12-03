import { SymbolTableEntry } from '@renderer/interfaces/interfaces'

/*** Helper Functions ***/

// Check if a value is a literal or a valid identifier
const isLiteralOrIdentifier = (value: string, declaredVariables: Set<string>): boolean => {
  // Check if the value is a number literal
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return true
  }

  // Check if the value is a string literal
  if (/^".*?"$/.test(value)) {
    return true
  }

  // Check if the value is a TROOF literal (WIN or FAIL)
  if (/^(WIN|FAIL)$/.test(value)) {
    return true
  }

  // Check if the value is a valid identifier (declared variable)
  if (declaredVariables.has(value)) {
    return true
  }

  // Check if the value is a complex expression
  const match = value.match(
    /^(SUM OF|PRODUKT OF|DIFF OF|BIGGR OF|SMALLR OF|QUOSHUNT OF|MOD OF|EITHER OF|BOTH OF|WON OF|NOT)\s+(.+)$/
  )
  if (match) {
    const operator = match[1]
    const operandsStr = match[2].trim()

    // Split operands for operators with "AN" as a separator
    const splitOperands = (expression: string): string[] => {
      const operands = []
      let currentOperand = ''
      let depth = 0

      for (let i = 0; i < expression.length; i++) {
        const char = expression[i]

        // Detect nested expressions and adjust depth
        if (
          expression
            .slice(i)
            .match(
              /^(SUM OF|PRODUKT OF|DIFF OF|BIGGR OF|SMALLR OF|QUOSHUNT OF|MOD OF|EITHER OF|BOTH OF|WON OF|NOT)/
            )
        ) {
          depth++
        }

        // Split operands at " AN " when depth is 0 (not inside a nested expression)
        if (char === ' ' && depth === 0 && expression.slice(i, i + 4) === ' AN ') {
          operands.push(currentOperand.trim())
          currentOperand = ''
          i += 3 // Skip " AN "
        } else {
          currentOperand += char
        }

        // Adjust depth when closing a nested expression
        if (depth > 0 && expression.slice(i, i + 3) === ' AN') {
          depth--
        }
      }

      if (currentOperand.trim()) operands.push(currentOperand.trim())
      return operands
    }

    const operands = splitOperands(operandsStr)

    // Recursively validate each operand
    return operands.every((operand) => isLiteralOrIdentifier(operand, declaredVariables))
  }

  // If none of the conditions match, it's an invalid literal or identifier
  return false
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
  // Check for valid variable
  if (symbolTable[expression]) {
    const variable = symbolTable[expression]
    return { type: variable.type, value: variable.value }
  }

  // Check for literals
  if (/^-?\d+$/.test(expression)) return { type: 'NUMBR', value: parseInt(expression, 10) }
  if (/^-?\d+\.\d+$/.test(expression)) return { type: 'NUMBAR', value: parseFloat(expression) }
  if (/^".*"$/.test(expression)) return { type: 'YARN', value: expression.slice(1, -1) }
  if (/^(WIN)$/.test(expression)) return { type: 'TROOF', value: 'WIN' }
  if (/^(FAIL)$/.test(expression)) return { type: 'TROOF', value: 'FAIL' }

  // Handle arithmetic expressions
  if (/^SUM OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^SUM OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'NUMBR' && right.type === 'NUMBR') {
        return { type: 'NUMBR', value: left.value + right.value }
      } else {
        errors.push({
          error: `Invalid operands for SUM OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  // Add support for other operations (e.g., DIFF OF, PRODUKT OF, etc.)
  if (/^DIFF OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^DIFF OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'NUMBR' && right.type === 'NUMBR') {
        return { type: 'NUMBR', value: left.value - right.value }
      } else {
        errors.push({
          error: `Invalid operands for DIFF OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  if (/^PRODUKT OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^PRODUKT OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'NUMBR' && right.type === 'NUMBR') {
        return { type: 'NUMBR', value: left.value * right.value }
      } else {
        errors.push({
          error: `Invalid operands for PRODUKT OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  if (/^QUOSHUNT OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^QUOSHUNT OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'NUMBR' && right.type === 'NUMBR') {
        if (right.value === 0) {
          errors.push({
            error: `Division by zero in QUOSHUNT OF`,
            line: lineNumber
          })
          return { type: 'ERROR', value: null }
        }
        return { type: 'NUMBR', value: Math.floor(left.value / right.value) }
      } else {
        errors.push({
          error: `Invalid operands for QUOSHUNT OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  if (/^MOD OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^MOD OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'NUMBR' && right.type === 'NUMBR') {
        return { type: 'NUMBR', value: left.value % right.value }
      } else {
        errors.push({
          error: `Invalid operands for MOD OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  if (/^BIGGR OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^BIGGR OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'NUMBR' && right.type === 'NUMBR') {
        return { type: 'NUMBR', value: Math.max(left.value, right.value) }
      } else {
        errors.push({
          error: `Invalid operands for BIGGR OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  if (/^SMALLR OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^SMALLR OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'NUMBR' && right.type === 'NUMBR') {
        return { type: 'NUMBR', value: Math.min(left.value, right.value) }
      } else {
        errors.push({
          error: `Invalid operands for SMALLR OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  // Logical operators
  if (/^BOTH OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^BOTH OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'TROOF' && right.type === 'TROOF') {
        return { type: 'TROOF', value: left.value && right.value }
      } else {
        errors.push({
          error: `Invalid operands for BOTH OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  if (/^EITHER OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^EITHER OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'TROOF' && right.type === 'TROOF') {
        return { type: 'TROOF', value: left.value || right.value }
      } else {
        errors.push({
          error: `Invalid operands for EITHER OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  if (/^WON OF .+ AN .+$/.test(expression)) {
    const match = expression.match(/^WON OF (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === 'TROOF' && right.type === 'TROOF') {
        return { type: 'TROOF', value: left.value !== right.value }
      } else {
        errors.push({
          error: `Invalid operands for WON OF: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  if (/^NOT OF .+$/.test(expression)) {
    const match = expression.match(/^NOT OF (.+)$/)
    if (match) {
      const operand = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)

      if (operand.type === 'TROOF') {
        return { type: 'TROOF', value: !operand.value }
      } else {
        errors.push({
          error: `Invalid operand for NOT OF: "${operand.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  // Comparison operators
  if (/^BOTH SAEM .+ AN .+$/.test(expression)) {
    const match = expression.match(/^BOTH SAEM (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === right.type) {
        return { type: 'TROOF', value: left.value === right.value }
      } else {
        errors.push({
          error: `Invalid operands for BOTH SAEM: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  if (/^DIFFRINT .+ AN .+$/.test(expression)) {
    const match = expression.match(/^DIFFRINT (.+) AN (.+)$/)
    if (match) {
      const left = evaluateExpression(match[1].trim(), symbolTable, lineNumber, errors)
      const right = evaluateExpression(match[2].trim(), symbolTable, lineNumber, errors)

      if (left.type === right.type) {
        return { type: 'TROOF', value: left.value !== right.value }
      } else {
        errors.push({
          error: `Invalid operands for DIFFRINT: "${left.type}" and "${right.type}"`,
          line: lineNumber
        })
        return { type: 'ERROR', value: null }
      }
    }
  }

  // Invalid expression
  errors.push({ error: `Invalid expression: "${expression}"`, line: lineNumber })
  return { type: 'ERROR', value: null }
}

export { isLiteralOrIdentifier, extractConditionalBlock, evaluateExpression }
