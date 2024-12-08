import { SymbolTableEntry } from '@renderer/interfaces/interfaces'
import {
  isLiteralOrIdentifier,
  evaluateExpression,
  typecastValue
} from './expressionEvaluationHelper'
import { requestUserInput, clearUserInput } from '@renderer/store/slices/userInputSlice'
import store, { AppDispatch } from '@renderer/store/store'
import { separateVisibleStatement } from './analyzerHelper'
import { functionList, functionState } from '@renderer/interfaces/interfaces'
import { addTerminalMessage } from '@renderer/store/slices/terminalMessageSlice'

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

const handleOutputStatements = async (
  trimmedLine: string,
  lineNumber: number,
  localSymbolTable: Record<string, SymbolTableEntry>,
  dispatch: AppDispatch,
  errors: { error: string; line: number }[]
) => {
  const match = trimmedLine.match(/^VISIBLE (.+)$/)
  if (match) {
    const parts = separateVisibleStatement(match[1].trim())
    let outputResult = ''

    // console.log('Expression in VISIVLE: ', parts)

    for (const part of parts) {
      try {
        if (/^".*"$/.test(part)) {
          outputResult += part.slice(1, -1)
        } else {
          const evalResult = evaluateExpression(part, localSymbolTable, lineNumber + 1, errors)
          outputResult += evalResult.value.toString()

          localSymbolTable['IT'].type = evalResult.type
          localSymbolTable['IT'].value = evalResult.value

          console.log(`Expression evaluation result: ${part} = ${outputResult}`)
        }
      } catch (error) {
        errors.push({
          error: `Invalid output expression: "${part}"`,
          line: lineNumber + 1
        })
      }
    }
    dispatch(addTerminalMessage({ message: outputResult, color: 'green', messageShown: false }))

    // Dispatch the result to the terminal and wait for user acknowledgment
    await new Promise<void>((resolve) => {
      const unsubscribe = store.subscribe(() => {
        const state = store.getState()
        if (state.terminalMessage.messages) {
          resolve()
          unsubscribe()
        }
      })
    })

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
  insideSwitch: boolean,
  conditionMet: boolean,
  branchFound: boolean,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[]
) => {
  if (/^O RLY\?$/.test(trimmedLine)) {
    if (insideConditional || insideSwitch) {
      errors.push({
        error: `Cannot start a new conditional block while another conditional or switch block is active`,
        line: lineNumber + 1
      })
    }
    insideConditional = true
    conditionMet = false // Initially, no branch is active
    branchFound = true
    return { insideConditional, conditionMet, branchFound }
  }

  if (/^YA RLY$/.test(trimmedLine)) {
    if (!insideConditional) {
      errors.push({
        error: `'YA RLY' found outside of a conditional block`,
        line: lineNumber + 1
      })
    } else if (
      localSymbolTable['IT'] &&
      typecastValue(localSymbolTable['IT'].value, localSymbolTable['IT'].type, 'boolean').value
    ) {
      // Activate this branch if `IT` is truthy
      conditionMet = true
    }
    branchFound = true
    return { insideConditional, conditionMet, branchFound }
  }

  if (/^NO WAI$/.test(trimmedLine)) {
    if (!insideConditional) {
      errors.push({
        error: `'NO WAI' found outside of a conditional block`,
        line: lineNumber + 1
      })
    } else {
      // Activate this branch only if `YA RLY` did not match
      conditionMet = !conditionMet
    }
    branchFound = true
    return { insideConditional, conditionMet, branchFound }
  }

  if (/^OIC$/.test(trimmedLine)) {
    if (insideSwitch) {
      errors.push({
        error: `'OIC' found inside a switch block; it should only be used to end a conditional block`,
        line: lineNumber + 1
      })
    } else if (!insideConditional) {
      errors.push({
        error: `'OIC' found outside of a conditional block`,
        line: lineNumber + 1
      })
    } else {
      // End the conditional block
      insideConditional = false
      conditionMet = false
    }
    branchFound = true
    return { insideConditional, conditionMet, branchFound }
  }

  return { insideConditional, conditionMet, branchFound }
}

const handleSwitch = (
  trimmedLine: string,
  lineNumber: number,
  insideSwitch: boolean,
  insideConditional: boolean,
  satisfyCondition: boolean,
  switchBlock: boolean,
  swtichGTFO: boolean,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[]
) => {
  if (/^WTF\?$/.test(trimmedLine)) {
    if (insideConditional || insideSwitch) {
      errors.push({
        error: `Cannot start a new switch block while another conditional or switch block is active`,
        line: lineNumber + 1
      })
    }
    insideSwitch = true
    switchBlock = true
    satisfyCondition = false
    swtichGTFO = false
    return { insideSwitch, satisfyCondition, switchBlock, swtichGTFO }
  }

  // console.log(
  //   'Switch Blocked',
  //   trimmedLine,
  //   /^OMG /.test(trimmedLine.trim()),
  //   !satisfyCondition && !swtichGTFO
  // )

  if (/^OMG /.test(trimmedLine.trim())) {
    if (!insideSwitch) {
      errors.push({
        error: `'OMG' found outside of a switch block`,
        line: lineNumber + 1
      })
    } else if (!satisfyCondition && !swtichGTFO) {
      const match = trimmedLine.match(/^OMG (-?\d+(\.\d+)?)|OMG (".*?")|OMG (WIN|FAIL)$/)

      // console.log('Switch Matched Expression', match)

      if (match) {
        let value: any
        if (match[1]) {
          value = Number(match[1]) // Number case
        } else if (match[0]?.includes('"')) {
          value = match[0].slice(4).replace(/"/g, '') // String case
        } else if (match[3]) {
          value = match[3] === 'WIN' // Boolean case
        }

        // console.log('Switch Status', value, localSymbolTable['IT']?.value === value)

        // Compare IT value
        if (localSymbolTable['IT']?.value == value) {
          satisfyCondition = true
          switchBlock = true // Activate current block
        }
      }
    }
    return { insideSwitch, satisfyCondition, switchBlock, swtichGTFO }
  }

  if (/^OMGWTF$/.test(trimmedLine)) {
    if (!insideSwitch) {
      errors.push({
        error: `'OMGWTF' found outside of a switch block`,
        line: lineNumber + 1
      })
    } else if (!satisfyCondition && !swtichGTFO) {
      satisfyCondition = true // Default branch activates if no other cases matched
      switchBlock = true
    }
    return { insideSwitch, satisfyCondition, switchBlock, swtichGTFO }
  }

  if (/^GTFO$/.test(trimmedLine)) {
    if (!insideSwitch) {
      errors.push({
        error: `'GTFO' found outside of a switch block`,
        line: lineNumber + 1
      })
    } else if (satisfyCondition) {
      satisfyCondition = false // Exit the current case
      swtichGTFO = true
    }
    return { insideSwitch, satisfyCondition, switchBlock, swtichGTFO }
  }

  if (/^OIC$/.test(trimmedLine)) {
    if (insideConditional) {
      errors.push({
        error: `'OIC' found inside a conditional block; it should only be used to end a switch block`,
        line: lineNumber + 1
      })
    } else if (!insideSwitch) {
      errors.push({
        error: `'OIC' found outside of a switch block`,
        line: lineNumber + 1
      })
    } else {
      // End the switch block
      insideSwitch = false
      satisfyCondition = false
      swtichGTFO = false
    }
    return { insideSwitch, satisfyCondition, switchBlock, swtichGTFO }
  }

  return { insideSwitch, satisfyCondition, switchBlock, swtichGTFO }
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
  functionEnd: boolean,
  funtionBlock: boolean,
  functionList: functionList,
  functionState: functionState,
  errors: { error: string; line: number }[]
) => {
  if (/^HOW IZ I /.test(trimmedLine)) {
    const match = trimmedLine.match(/^HOW IZ I ([A-Za-z][A-Za-z0-9_]*) (.+)/)
    if (match) {
      functionState.func_name = match[1]
      if (match[2]) {
        const parameters = match[2].split('AN')
        for (const parameter of parameters) {
          const cleanedParameter = parameter.trim().match(/^YR ([A-Za-z][A-Za-z0-9_]*)$/)
          if (cleanedParameter && cleanedParameter[1]) {
            functionState.parameters.push(cleanedParameter[1])
          }
        }
      }
    }
    funtionBlock = true
    insideFunction = true
    functionEnd = false

    return {
      insideFunction,
      funtionBlock
    }
  }

  if (/^IF U SAY SO$/.test(trimmedLine)) {
    if (!insideFunction) {
      errors.push({
        error: `'IF U SAY SO' found outside of a function block`,
        line: lineNumber + 1
      })
    } else {
      if (
        !/^GTFO$/.test(functionState.bodyLine[functionState.bodyLine.length - 1]) &&
        !/^FOUND YR /.test(functionState.bodyLine[functionState.bodyLine.length - 1])
      ) {
        functionState.bodyLine.push('GTFO')
      }
      // Append to function list
      functionList.functions.push({ ...functionState })

      // Reset function state
      functionState.func_name = ''
      functionState.bodyLine = []
      functionState.parameters = []

      insideFunction = false
      funtionBlock = true
      console.log('UPDATED FUNCTION', functionList)
    }
    return {
      insideFunction,
      funtionBlock
    }
  }

  if (insideFunction) {
    functionState.bodyLine.push(trimmedLine)
  }

  return {
    insideFunction,
    funtionBlock
  }
}

const addNewVar = (expression: string, localSymbolTable: Record<string, SymbolTableEntry>) => {}

const handleFunctionCalls = (
  trimmedLine: string,
  lineNumber: number,
  functionList: functionList,
  functionRunning: boolean,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[]
) => {
  const match = trimmedLine.match(/^I IZ ([A-Za-z][A-Za-z0-9_]*) (.+)/)

  let func: functionState | undefined

  if (!match) {
    errors.push({
      error: `Invalid function call syntax: "${trimmedLine}"`,
      line: lineNumber + 1
    })
  } else {
    console.log('Function Declarations', match)

    for (const fun of functionList.functions) {
      if (match[1] && match[1].trim() === fun.func_name) {
        func = fun
        functionRunning = true
        break
      }
    }

    if (!func) return { functionRunning, func }

    if (match[2]) {
      let newVars = match[2].replace('MKAY', '').trim()

      if (func.parameters.length > 1) {
        for (const parameter of func.parameters) {
          let variable = newVars.match(/^YR (.+) AN YR/)

          if (!variable) {
            variable = newVars.match(/^YR (.+)$/)
          }

          if (variable && variable[1]) {
            const result = evaluateExpression(variable[1], localSymbolTable, lineNumber, errors)

            if (result.type === 'ERROR') return { functionRunning, func }

            localSymbolTable[parameter] = {
              type: result.type,
              value: result.value,
              existingProperty: null
            }

            newVars = newVars.replace('YR ' + variable[1], '').trim()

            if (/^AN /.test(newVars)) {
              newVars = newVars.replace('AN', '').trim()
            }
          }

          console.log('NEW VARIABLES', localSymbolTable, newVars)
        }
      }
    }
  }

  return { functionRunning, func }
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
  handleTypeCasting,
  handleSwitch
}
