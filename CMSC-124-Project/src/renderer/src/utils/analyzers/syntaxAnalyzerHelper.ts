import { SymbolTableEntry } from '@renderer/interfaces/interfaces'
import { isLiteralOrIdentifier, evaluateExpression } from './expressionEvaluationHelper'
import { requestUserInput, clearUserInput } from '@renderer/store/slices/userInputSlice'
import store, { AppDispatch } from '@renderer/store/store'

const handleVariableDeclaration = (
  trimmedLine: string,
  lineNumber: number,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[],
  insideWazzup: boolean
) => {
  if (!insideWazzup) {
    errors.push({
      error: `Variable declaration outside of WAZZUP block: "${trimmedLine}"`,
      line: lineNumber + 1
    })
    return
  }

  const match = trimmedLine.match(/^I HAS A ([A-Za-z][A-Za-z0-9_]*)(?: ITZ (.+))?$/)
  if (match) {
    const variable = match[1]
    const value = match[2]

    if (localSymbolTable[variable]) {
      errors.push({
        error: `Duplicate variable declaration: "${variable}"`,
        line: lineNumber + 1
      })
    } else {
      if (value) {
        const evalResult = evaluateExpression(value, localSymbolTable, lineNumber + 1, errors)
        localSymbolTable[variable] = {
          type: evalResult.type,
          value: evalResult.value,
          existingProperty: null
        }
      } else {
        localSymbolTable[variable] = { type: 'NOOB', value: 'NOOB', existingProperty: null }
      }
    }
  } else {
    errors.push({
      error: `Invalid variable declaration: "${trimmedLine}"`,
      line: lineNumber + 1
    })
  }
}

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

    console.log('Expression: ', match)

    for (const part of parts) {
      try {
        if (/^".*"$/.test(part)) {
          outputResult += part.slice(1, -1)
        } else {
          const evalResult = evaluateExpression(part, localSymbolTable, lineNumber + 1, errors)
          outputResult += evalResult.value.toString()

          console.log(`Expression evaluation result: ${part} = ${outputResult}`)
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

const handleInputStatements = async (
  trimmedLine: string,
  lineNumber: number,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[],
  dispatch: AppDispatch
) => {
  const match = trimmedLine.match(/^GIMMEH ([A-Za-z][A-Za-z0-9_]*)$/)
  if (match) {
    const variable = match[1]

    if (!localSymbolTable[variable]) {
      errors.push({
        error: `Undeclared variable used in input: "${variable}"`,
        line: lineNumber + 1
      })
      return
    }

    // Dispatch the action to request user input
    dispatch(requestUserInput(variable))

    // Pause execution and wait for user input
    const userInput = await new Promise<string>((resolve, reject) => {
      const unsubscribe = store.subscribe(() => {
        const state = store.getState()
        if (state.userInput.ready && state.userInput.variable === variable) {
          if (state.userInput.value !== null) {
            resolve(state.userInput.value)
            unsubscribe()
          } else {
            reject(new Error('Input not received in time'))
          }
        }
      })
    })
    dispatch(clearUserInput())

    // Create a new object to avoid directly modifying the state
    const updatedSymbolTable = {
      ...localSymbolTable,
      [variable]: { type: 'YARN', value: userInput, existingProperty: null }
    }

    // Return the updated symbol table
    return updatedSymbolTable
  }
}

const handleConditionalStatements = (
  trimmedLine: string,
  lineNumber: number,
  insideConditional: boolean,
  errors: { error: string; line: number }[]
) => {
  if (/^O RLY\?$/.test(trimmedLine)) {
    insideConditional = true
    return insideConditional
  }
  if (/^(YA RLY|MEBBE .+|NO WAI)$/.test(trimmedLine)) {
    if (!insideConditional) {
      errors.push({
        error: `'${trimmedLine}' found outside of a conditional block`,
        line: lineNumber + 1
      })
    }
    return insideConditional
  }
  if (/^OIC$/.test(trimmedLine)) {
    if (!insideConditional) {
      errors.push({
        error: `'OIC' found outside of a conditional block`,
        line: lineNumber + 1
      })
    } else {
      insideConditional = false
    }
    return insideConditional
  }
  return insideConditional
}

const handleLoops = (
  trimmedLine: string,
  lineNumber: number,
  insideLoop: boolean,
  errors: { error: string; line: number }[]
) => {
  if (/^IM IN YR /.test(trimmedLine)) {
    insideLoop = true
    return insideLoop
  }
  if (/^IM OUTTA YR /.test(trimmedLine)) {
    if (!insideLoop) {
      errors.push({
        error: `'IM OUTTA YR' found outside of a loop`,
        line: lineNumber + 1
      })
    } else {
      insideLoop = false
    }
    return insideLoop
  }
  return insideLoop
}

const handleFunctionDeclarations = (
  trimmedLine: string,
  lineNumber: number,
  insideFunction: boolean,
  errors: { error: string; line: number }[]
) => {
  if (/^HOW IZ I /.test(trimmedLine)) {
    insideFunction = true
    return insideFunction
  }
  if (/^IF U SAY SO$/.test(trimmedLine)) {
    if (!insideFunction) {
      errors.push({
        error: `'IF U SAY SO' found outside of a function block`,
        line: lineNumber + 1
      })
    } else {
      insideFunction = false
    }
    return insideFunction
  }
  return insideFunction
}

const handleFunctionCalls = (
  trimmedLine: string,
  lineNumber: number,
  errors: { error: string; line: number }[]
) => {
  const match = trimmedLine.match(/^I IZ ([A-Za-z][A-Za-z0-9_]*)(?: YR .+)? MKAY$/)
  if (!match) {
    errors.push({
      error: `Invalid function call syntax: "${trimmedLine}"`,
      line: lineNumber + 1
    })
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
  handleVariableDeclaration,
  handleVariableAssignment,
  handleOutputStatements,
  handleInputStatements,
  handleConditionalStatements,
  handleLoops,
  handleFunctionDeclarations,
  handleFunctionCalls,
  handleTypeCasting
}
