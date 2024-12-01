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
  // Check for literals
  if (/^-?\d+$/.test(expression)) return { type: 'NUMBR', value: parseInt(expression, 10) }
  if (/^-?\d+\.\d+$/.test(expression)) return { type: 'NUMBAR', value: parseFloat(expression) }
  if (/^".*"$/.test(expression)) return { type: 'YARN', value: expression.slice(1, -1) }
  if (/^(WIN|FAIL)$/.test(expression)) return { type: 'TROOF', value: expression === 'WIN' }

  // Check for valid variable
  if (symbolTable[expression]) {
    const variable = symbolTable[expression]
    return { type: variable.type, value: variable.value }
  }

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
