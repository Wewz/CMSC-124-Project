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
        // Handle type casting
        if (/^MAEK /.test(value) || /([^\s]+)\s+IS NOW A /.test(value)) {
          console.log('Current Expression In MAEK', value)
          handleTypeCasting(value, lineNumber, variable, localSymbolTable, errors)
          return
        }

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
      // Handle type casting
      if (/^MAEK /.test(value) || /([^\s]+)\s+IS NOW A /.test(value)) {
        console.log('Current Expression In MAEK', value)
        handleTypeCasting(value, lineNumber, variable, localSymbolTable, errors)
        return
      }

      const evalResult = evaluateExpression(value, localSymbolTable, lineNumber + 1, errors)

      if (evalResult.type !== 'ERROR') {
        localSymbolTable[variable].value = evalResult.value
        localSymbolTable[variable].type = evalResult.type
      }

      // if (
      //   currentType !== 'UNDEFINED' &&
      //   currentType !== 'NOOB' &&
      //   evalResult.type !== currentType
      // ) {
      //   errors.push({
      //     error: `Type mismatch in assignment to "${variable}". Expected: ${currentType}, Got: ${evalResult.type}`,
      //     line: lineNumber + 1
      //   })
      // } else {
      //   localSymbolTable[variable].value = evalResult.value
      //   localSymbolTable[variable].type = evalResult.type
      // }
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
  console.log('here !!!!!!!!!!!!')
  const match = trimmedLine.match(/^VISIBLE (.+)$/)
  if (match) {
    const parts = separateVisibleStatement(match[1].trim())
    let outputResult = ''

    // console.log('Expression in VISIVLE: ', parts)

    for (const part of parts) {
      try {
        if (/^".*"$/.test(part)) {
          outputResult += part.slice(1, -1) // Handle string literals
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
    if (!insideConditional && !insideSwitch) {
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
if (!insideSwitch && !insideConditional) {
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
  loopConditionMet: boolean,
  loopLabel: string,
  loopStart: number,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[],
  loopDeclaration?: string // Added to store loop declaration
) => {
  let handled = false
  let newLineNumber = lineNumber

  if (/^IM IN YR/.test(trimmedLine)) {
    // Nested loop check
    if (insideLoop) {
      errors.push({
        error: `Nested loops are not supported`,
        line: lineNumber + 1
      })
      return {
        handled: true,
        newLineNumber,
        insideLoop,
        loopConditionMet,
        loopLabel,
        loopStart
      }
    }

    // Parsing the loop declaration
    const match = /^IM IN YR (\w+)(?: (UPPIN|NERFIN) YR (\w+))? (WILE|TIL) (.+)$/.exec(trimmedLine)
    if (match) {
      loopLabel = match[1]
      loopStart = lineNumber
      insideLoop = true
      loopDeclaration = trimmedLine // Store loop declaration

      const condition = match[5]
      const incrementType = match[2]
      const loopVariable = match[3]

      // Initially evaluate the loop condition
      const conditionResult = evaluateExpression(condition, localSymbolTable, lineNumber, errors)
      if (conditionResult.type === 'ERROR') {
        errors.push({
          error: `Invalid loop condition`,
          line: lineNumber + 1
        })
        loopConditionMet = false
      } else {
        loopConditionMet = conditionResult.value
      }

      handled = true
    }
  }

  if (/^IM OUTTA YR/.test(trimmedLine)) {
    const outtaLabel = trimmedLine.split(' ')[3]

    // Check for mismatched or extraneous 'IM OUTTA YR'
    if (!insideLoop || loopLabel !== outtaLabel) {
      errors.push({
        error: `Mismatched or extraneous 'IM OUTTA YR'`,
        line: lineNumber + 1
      })
    } else {
      insideLoop = false // Exit loop
    }

    handled = true
  }

  // If inside loop, evaluate loop condition and execute loop body
  if (insideLoop) {
    if (loopConditionMet) {
      if (loopDeclaration) {
        const match = /^IM IN YR (\w+)(?: (UPPIN|NERFIN) YR (\w+))? (WILE|TIL) (.+)$/.exec(
          loopDeclaration
        )
        if (match) {
          const incrementType = match[2]
          const loopVariable = match[3]
          const condition = match[5]

          // Update loop variable (UPPIN/NERFIN)
          if (incrementType && loopVariable && localSymbolTable[loopVariable]) {
            if (incrementType === 'UPPIN') {
              localSymbolTable[loopVariable].value++
            } else if (incrementType === 'NERFIN') {
              localSymbolTable[loopVariable].value--
            }
          }

          // Re-evaluate the loop condition
          const conditionResult = evaluateExpression(
            condition,
            localSymbolTable,
            lineNumber,
            errors
          )
          if (conditionResult.type !== 'ERROR') {
            loopConditionMet = conditionResult.value
          } else {
            loopConditionMet = false
            errors.push({
              error: `Invalid loop condition during execution`,
              line: lineNumber + 1
            })
          }
        }
      }

      // If condition is met, continue looping
      newLineNumber = loopStart // Jump back to the start of the loop
    } else {
      insideLoop = false // Exit loop if condition is not met
    }
  }

  return {
    handled,
    newLineNumber,
    insideLoop,
    loopConditionMet,
    loopLabel,
    loopStart,
    loopDeclaration // Return updated loopDeclaration
  }
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

function isLiteral(value: string): boolean {
  return /^".*"$|^[0-9]+(\.[0-9]+)?$|^(WIN|FAIL)$/.test(value) // Matches strings, numbers, and TROOF literals
}

const handleTypeCasting = (
  trimmedLine: string,
  lineNumber: number,
  varToUpdate: string,
  localSymbolTable: Record<string, SymbolTableEntry>,
  errors: { error: string; line: number }[]
) => {
  let match = trimmedLine.match(/^MAEK ([^\s]+) A (NOOB|NUMBR|NUMBAR|YARN|TROOF)$/)

  if (!match) {
    match = trimmedLine.match(/^([^\s]+) IS NOW A ([^\s]+)$/)
  }

  console.log('MAEK Matched Expression', match)

  if (match) {
    const value = match[1]
    const targetType = match[2]
    // Check if the value is a literal or a valid identifier in the symbol table
    if (!isLiteralOrIdentifier(value, new Set(Object.keys(localSymbolTable)))) {
      errors.push({
        error: `Invalid value for type casting: "${value}"`,
        line: lineNumber + 1
      })
      return
    }

    console.log('MAEK Processing Expression', value, targetType)

    // Retrieve the value from the symbol table or treat it as a literal
    const resolvedValue = evaluateExpression(value, localSymbolTable, lineNumber, errors)

    console.log('MAEK Processing Expression', resolvedValue.value, resolvedValue.type)

    if (resolvedValue.type === 'ERROR') return

    // Perform typecasting based on the target type
    let castedValue
    switch (targetType) {
      case 'NOOB':
        castedValue = 'NOOB' // NOOB represents an uninitialized state
        break
      case 'NUMBR':
        if (resolvedValue.type === 'NOOB') {
          // NOOB to NUMBR: Default to zero
          castedValue = 0
        } else if (resolvedValue.type === 'TROOF') {
          // TROOF to NUMBR: WIN = 1, FAIL = 0
          castedValue = resolvedValue.value === true || resolvedValue.value === 'WIN' ? 1 : 0
        } else if (resolvedValue.type === 'NUMBAR') {
          // NUMBAR to NUMBR: Truncate decimal
          castedValue = Math.floor(resolvedValue.value)
        } else if (resolvedValue.type === 'YARN') {
          // YARN to NUMBR: Parse as integer, invalid becomes zero
          castedValue = parseInt(resolvedValue.value, 10)
          if (isNaN(castedValue)) {
            castedValue = 0 // Default invalid to 0
          }
        } else {
          // Default case: Attempt to parse, fallback to 0
          castedValue = parseInt(resolvedValue.value, 10) || 0
        }
        break
      case 'NUMBAR':
        if (resolvedValue.type === 'NOOB') {
          // NOOB to NUMBAR: Default to zero
          castedValue = 0.0
        } else if (resolvedValue.type === 'TROOF') {
          // TROOF to NUMBAR: WIN = 1.0, FAIL = 0.0
          castedValue = resolvedValue.value === true || resolvedValue.value === 'WIN' ? 1.0 : 0.0
        } else if (resolvedValue.type === 'NUMBR') {
          // NUMBR to NUMBAR: Convert to floating point
          castedValue = parseFloat(resolvedValue.value)
        } else if (resolvedValue.type === 'YARN') {
          // YARN to NUMBAR: Parse as float, invalid becomes zero
          castedValue = parseFloat(resolvedValue.value)
          if (isNaN(castedValue)) {
            castedValue = 0.0 // Default invalid to 0.0
          }
        } else {
          // Default case: Attempt to parse, fallback to 0.0
          castedValue = parseFloat(resolvedValue.value) || 0.0
        }
        break
      case 'YARN':
        if (resolvedValue.type === 'NOOB') {
          // NOOB to YARN: Empty string
          castedValue = ''
        } else if (resolvedValue.type === 'TROOF') {
          // TROOF to YARN: WIN -> "WIN", FAIL -> "FAIL"
          castedValue =
            resolvedValue.value === true || resolvedValue.value === 'WIN' ? 'WIN' : 'FAIL'
        } else if (resolvedValue.type === 'NUMBR' || resolvedValue.type === 'NUMBAR') {
          // NUMBR/NUMBAR to YARN: Convert to string
          castedValue = resolvedValue.value.toString()
        } else {
          // Default case: Maintain as string
          castedValue = resolvedValue.value
        }
        break
      case 'TROOF':
        if (resolvedValue.type === 'NOOB') {
          // NOOB to TROOF: Always FAIL
          castedValue = false
        } else if (
          resolvedValue.type === 'YARN' ||
          resolvedValue.type === 'NUMBR' ||
          resolvedValue.type === 'NUMBAR'
        ) {
          // TROOF casting rules: Empty string, 0, or 0.0 = FAIL; others = WIN
          const numericValue = parseFloat(resolvedValue.value)
          castedValue = resolvedValue.value === '' || numericValue === 0 ? false : true
        } else {
          // Default case: Maintain as TROOF
          castedValue = resolvedValue.value === 'WIN' || resolvedValue.value === true
        }
        break
      default:
        errors.push({
          error: `Invalid target type for type casting: "${targetType}"`,
          line: lineNumber + 1
        })
        return
    }

    // Update the symbol table with the casted value
    localSymbolTable[varToUpdate] = {
      value: castedValue,
      type: targetType,
      existingProperty: null
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
