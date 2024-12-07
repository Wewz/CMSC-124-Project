import { SymbolTableEntry } from '@renderer/interfaces/interfaces'
import { evaluateExpression, isLiteralOrIdentifier } from './expressionEvaluationHelper'

const handleVariableAssignment = (
  trimmedLine: string,
  lineNumber: number,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[]
) => {
  const match = trimmedLine.match(/^([A-Za-z][A-Za-z0-9_]*) R (.+)$/)
  if (match) {
    const variable = match[1]
    const value = match[2]

    if (!localSymbolTable[variable]) {
      errors.push({
        error: `Undeclared variable used in assignment: "${variable}"`,
        line: lineNumber + 1
      })
    } else {
      const evalResult = evaluateExpression(value, localSymbolTable, lineNumber + 1, errors)
      const currentType = localSymbolTable[variable].type

      if (
        currentType !== 'UNDEFINED' &&
        currentType !== 'NOOB' &&
        evalResult.type !== currentType
      ) {
        errors.push({
          error: `Type mismatch in assignment to "${variable}". Expected: ${currentType}, Got: ${evalResult.type}`,
          line: lineNumber + 1
        })
      } else {
        localSymbolTable[variable].value = evalResult.value
        localSymbolTable[variable].type = evalResult.type
      }
    }
  }
}

const handleOutputStatements = (
  trimmedLine: string,
  lineNumber: number,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[]
) => {
  const match = trimmedLine.match(/^VISIBLE (.+)$/)
  if (match) {
    const outputExpr = match[1].trim()
    const parts = outputExpr.split(/(?<!\\)\+/).map((part) => part.trim())

    let outputResult = ''

    for (const part of parts) {
      try {
        if (/^".*"$/.test(part)) {
          outputResult += part.slice(1, -1)
        } else {
          const evalResult = evaluateExpression(part, localSymbolTable, lineNumber + 1, errors)
          outputResult += evalResult.value.toString()
        }
      } catch (error) {
        errors.push({
          error: `Invalid output expression: "${part}"`,
          line: lineNumber + 1
        })
        return
      }
    }

    console.log('Output the evaluated result', outputResult + '\n')
  }
}

const handleInputStatements = (
  trimmedLine: string,
  lineNumber: number,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[]
) => {
  const match = trimmedLine.match(/^GIMMEH ([A-Za-z][A-Za-z0-9_]*)$/)
  if (match) {
    const variable = match[1]
    if (!localSymbolTable[variable]) {
      errors.push({
        error: `Undeclared variable used in input: "${variable}"`,
        line: lineNumber + 1
      })
    }
  }
}

const handleTypeCasting = (
  trimmedLine: string,
  lineNumber: number,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[]
) => {
  const match = trimmedLine.match(/^MAEK (.+) A (NOOB|NUMBR|NUMBAR|YARN|TROOF)$/)
  if (match) {
    const value = match[1]
    const targetType = match[2]
    if (!isLiteralOrIdentifier(value, new Set(Object.keys(localSymbolTable)))) {
      errors.push({
        error: `Invalid value for type casting: "${value}"`,
        line: lineNumber + 1
      })
    } else {
      // Handle type casting logic here if needed
    }
  } else {
    errors.push({
      error: `Invalid type casting syntax: "${trimmedLine}"`,
      line: lineNumber + 1
    })
  }
}

export {
  handleVariableAssignment,
  handleOutputStatements,
  handleInputStatements,
  handleTypeCasting
}
