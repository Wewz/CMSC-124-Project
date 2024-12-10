import { SymbolTableEntry } from '@renderer/interfaces/interfaces'
import { AppDispatch } from '@renderer/store/store'
import { setSymbolTable } from '@renderer/store/slices/symbolTableSlice'
import { setErrors } from '@renderer/store/slices/errorSlice'
import {
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
} from './syntaxAnalyzerHelper'
import { evaluateExpression } from './expressionEvaluationHelper'
import { validExpressionRegex } from './constants'
import { functionList, functionState } from '@renderer/interfaces/interfaces'

const syntaxAnalyzer = async (content: string, dispatch: AppDispatch) => {
  let localSymbolTable: Record<string, SymbolTableEntry> = {
    IT: { existingProperty: null, type: 'NOOB', value: 'NOOB' }
  }
  const errors: { error: string; line: number }[] = []

  let insideConditional = false
  let conditionMet = false
  let insideLoop = false
  let branchFound = false
  let insideWazzup = false
  let foundHai = false
  let foundWazzup = false

  // switch
  let insideSwitch = false
  let satisfyCondition = false
  let swtichBlock = false
  let swtichGTFO = false
  let loopConditionMet = false
  let loopLabel = ''
  let loopStart = -1

  // functions declaration
  let insideFunction = false
  let functionEnd = false
  let functionBlock = false

  // function call
  let functionRunning = false

  const functionList: functionList = {
    functions: []
  }

  const functionState: functionState = {
    func_name: '',
    parameters: [],
    bodyLine: []
  }

  const sanitizedContent = content.replace(/OBTW[\s\S]*?TLDR/g, '')
  const lines = sanitizedContent.split('\n')

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    // const terminal = new Terminal()
    const line = lines[lineNumber]
    const trimmedLine = line

      // Remove single-line comments while preserving strings
      .replace(/"([^"]*)"|BTW.*/g, (match, string) => {
        if (string !== undefined) return `"${string}"` // Preserve strings
        return '' // Remove single-line comments
      })
      .trim()

    if (!trimmedLine) continue

    console.log('Trimmed Line: ', trimmedLine)

    // Handle different line patterns
    if (/^HAI$/.test(trimmedLine)) {
      foundHai = true
      continue
    }
    if (/^KTHXBYE$/.test(trimmedLine)) break

    if (/^WAZZUP$/.test(trimmedLine)) {
      insideWazzup = true
      if (!foundHai || foundWazzup) {
        errors.push({
          error: `'WAZZUP' must be immediately after 'HAI' and only once`,
          line: lineNumber + 1
        })
        break
      } else {
        foundWazzup = true
      }
      continue
    }

    // Handle errors immediately
    if (/^BUHBYE$/.test(trimmedLine)) {
      if (!insideWazzup) {
        errors.push({
          error: `'BUHBYE' found outside of a WAZZUP block`,
          line: lineNumber + 1
        })
        break
      } else {
        insideWazzup = false
      }
      continue
    }

    if (/^GTFO$/.test(trimmedLine) && functionRunning) {
      localSymbolTable['IT'].type = ''
      localSymbolTable['IT'].value = 'NOOB'
      functionRunning = false
      continue
    }

    if (/^FOUND YR /.test(trimmedLine) && functionRunning) {
      const match = trimmedLine.match(/^FOUND YR (.+)$/)

      if (match && match[1]) {
        const result = evaluateExpression(match[1], localSymbolTable, lineNumber, errors)

        if (result.type !== 'ERROR') {
          localSymbolTable['IT'].type = result.type
          localSymbolTable['IT'].value = result.value
        }
      }
      console.log('RETURRRRRRRRRRRRRRRRRNNNNNNNNNNN', match)

      functionRunning = false
      continue
    }

    // Handle variable declarations
    if (/^I HAS A /.test(trimmedLine)) {
      handleVariableDeclaration(trimmedLine, lineNumber, localSymbolTable, errors, insideWazzup)
      continue
    }

    // Handle function declarations
    const functionResult = handleFunctionDeclarations(
      trimmedLine,
      lineNumber,
      insideFunction,
      functionEnd,
      functionBlock,
      functionList,
      functionState,
      errors
    )

    console.log(functionList)

    functionBlock = functionResult.funtionBlock
    insideFunction = functionResult.insideFunction

    if (functionBlock) {
      functionBlock = false
      continue
    }

    if (insideFunction) continue

    // Handle conditionals
    const status = handleConditionalStatements(
      trimmedLine,
      lineNumber,
      insideConditional,
      insideSwitch,
      conditionMet,
      branchFound,
      localSymbolTable,
      errors
    )

    insideConditional = status.insideConditional
    conditionMet = status.conditionMet
    branchFound = status.branchFound

    console.log('Is inside IF-ELSE?', insideConditional)

    if (branchFound) {
      branchFound = false
      continue
    }

    if (insideConditional && !conditionMet) {
      console.log(`Ignoring line ${lineNumber + 1} due to inactive branch`)
      continue
    }

    // Handle switch statements
    const switchResult = handleSwitch(
      trimmedLine,
      lineNumber,
      insideSwitch,
      insideConditional,
      satisfyCondition,
      swtichBlock,
      swtichGTFO,
      localSymbolTable,
      errors
    )

    insideSwitch = switchResult.insideSwitch
    satisfyCondition = switchResult.satisfyCondition
    swtichBlock = switchResult.switchBlock
    swtichGTFO = switchResult.swtichGTFO

    console.log('Is inside SWITCH?', insideSwitch)

    if (swtichBlock) {
      swtichBlock = false
      continue
    }

    if (insideSwitch && !satisfyCondition) {
      console.log(`Ignoring line ${lineNumber + 1} due to inactive branch`)
      continue
    }

    console.log('Current Line: ', trimmedLine)
    //concatenante string
    // if(insideFunction == true){
    //   functionState.bodyLine.push(trimmedLine)
    //   continue
    // }

    // Handle variable assignments
    if (/^[A-Za-z][A-Za-z0-9_]* R /.test(trimmedLine)) {
      handleVariableAssignment(trimmedLine, lineNumber, localSymbolTable, errors)
      continue
    }

    // Handle output statements
    if (/^VISIBLE /.test(trimmedLine)) {
      handleOutputStatements(trimmedLine, lineNumber, localSymbolTable, dispatch, errors)
      continue
    }

    // Handle input statements
    if (/^GIMMEH /.test(trimmedLine)) {
      const updated = await handleInputStatements(
        trimmedLine,
        lineNumber,
        localSymbolTable,
        errors,
        dispatch
      )
      if (updated) {
        localSymbolTable = updated
      }
      console.log('Updated Variables: ', localSymbolTable)
      continue
    }

    // Handle expression statements without assignment operation
    if (validExpressionRegex.test(trimmedLine)) {
      const result = evaluateExpression(trimmedLine, localSymbolTable, lineNumber, errors)

      if (result.type !== 'ERROR') {
        localSymbolTable['IT'].value = result.value
        localSymbolTable['IT'].type = result.type
      }

      console.log('Updated Variables: ', localSymbolTable)
      continue
    } else if (localSymbolTable.hasOwnProperty(trimmedLine)) {
      localSymbolTable['IT'].value = localSymbolTable[trimmedLine].value
      localSymbolTable['IT'].type = localSymbolTable[trimmedLine].type
    }

    // Handle loop statements
    const loopStatus = handleLoops(
      trimmedLine,
      lineNumber,
      insideLoop,
      loopConditionMet,
      loopLabel,
      loopStart,
      localSymbolTable,
      errors
    )

    // Update loop state after handling
    insideLoop = loopStatus.insideLoop
    loopConditionMet = loopStatus.loopConditionMet
    loopLabel = loopStatus.loopLabel
    loopStart = loopStatus.loopStart

    if (loopStatus.handled) {
      lineNumber = loopStatus.newLineNumber // Continue from loop start
      continue
    }

    // Skip lines in loop if condition is not met
    if (insideLoop && !loopConditionMet) {
      console.log(`Ignoring line ${lineNumber + 1} due to inactive loop condition`)
      continue
    }

    // Handle function calls
    if (/^I IZ /.test(trimmedLine)) {
      const result = handleFunctionCalls(
        trimmedLine,
        lineNumber,
        functionList,
        functionRunning,
        localSymbolTable,
        errors
      )

      functionRunning = result.functionRunning
      let func: functionState

      if (functionRunning && result.func) {
        func = result.func

        for (const funcLine of func.bodyLine) {
          lines.splice(lineNumber + 1, 0, funcLine)
        }
      }

      continue
    }

    // Handle type casting
    if (/^MAEK /.test(trimmedLine) || /([^\s]+)\s+IS NOW A /.test(trimmedLine)) {
      console.log('Current Expression In MAEK', trimmedLine)
      handleTypeCasting(trimmedLine, lineNumber, 'IT', localSymbolTable, errors)
      continue
    }

    // Unrecognized syntax
    errors.push({
      error: `Unrecognized syntax: "${trimmedLine}"`,
      line: lineNumber + 1
    })
  }

  if (insideConditional) {
    errors.push({ error: "Unterminated conditional block (missing 'OIC')", line: lines.length })
  }
  if (insideLoop) {
    errors.push({ error: "Unterminated loop block (missing 'IM OUTTA YR')", line: lines.length })
  }
  if (insideFunction) {
    errors.push({
      error: "Unterminated function block (missing 'IF U SAY SO')",
      line: lines.length
    })
  }
  if (insideLoop) {
    errors.push({ error: "Unterminated loop block (missing 'IM OUTTA YR')", line: lines.length })
  }

  console.log('Syntax Errors', errors)

  dispatch(setErrors(errors))
  dispatch(setSymbolTable(localSymbolTable))
}

export default syntaxAnalyzer
