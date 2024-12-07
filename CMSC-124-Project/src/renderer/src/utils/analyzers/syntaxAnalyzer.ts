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
  handleTypeCasting
} from './syntaxAnalyzerHelper'

const syntaxAnalyzer = async (content: string, dispatch: AppDispatch) => {
  const errors: { error: string; line: number }[] = []
  const lines = content.split('\n')
  const localSymbolTable: Record<string, SymbolTableEntry> = {}

  let insideConditional = false
  let insideLoop = false
  let insideFunction = false
  let insideWazzup = false
  let foundHai = false
  let foundWazzup = false

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber]
    const trimmedLine = line
      .replace(/"([^"]*)"|BTW.*/g, (match, string) => {
        if (string !== undefined) return `"${string}"`
        return ''
      })
      .trim()

    if (!trimmedLine) continue

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

    // Handle variable declarations
    if (/^I HAS A /.test(trimmedLine)) {
      handleVariableDeclaration(trimmedLine, lineNumber, localSymbolTable, errors, insideWazzup)
      continue
    }

    // Handle variable assignments
    if (/^[A-Za-z][A-Za-z0-9_]* R /.test(trimmedLine)) {
      handleVariableAssignment(trimmedLine, lineNumber, localSymbolTable, errors)
      continue
    }

    // Handle output statements
    if (/^VISIBLE /.test(trimmedLine)) {
      handleOutputStatements(trimmedLine, lineNumber, localSymbolTable, errors)
      continue
    }

    // Handle input statements
    if (/^GIMMEH /.test(trimmedLine)) {
      await handleInputStatements(trimmedLine, lineNumber, localSymbolTable, errors, dispatch)
      console.log('Updated Variables: ', localSymbolTable)
      continue
    }

    // Handle conditional statements
    insideConditional = handleConditionalStatements(
      trimmedLine,
      lineNumber,
      insideConditional,
      errors
    )

    // Handle loops
    insideLoop = handleLoops(trimmedLine, lineNumber, insideLoop, errors)

    // Handle function declarations
    insideFunction = handleFunctionDeclarations(trimmedLine, lineNumber, insideFunction, errors)

    // Handle function calls
    if (/^I IZ /.test(trimmedLine)) {
      handleFunctionCalls(trimmedLine, lineNumber, errors)
      continue
    }

    // Handle type casting
    if (/^MAEK /.test(trimmedLine)) {
      handleTypeCasting(trimmedLine, lineNumber, localSymbolTable, errors)
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

  console.log('Syntax Errors', errors)

  dispatch(setErrors(errors))
  dispatch(setSymbolTable(localSymbolTable))
}

export default syntaxAnalyzer
