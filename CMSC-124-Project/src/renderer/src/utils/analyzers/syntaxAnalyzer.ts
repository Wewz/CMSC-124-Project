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

const syntaxAnalyzer = (content: string, dispatch: AppDispatch) => {
  const errors: { error: string; line: number }[] = []
  const lines = content.split('\n')
  const localSymbolTable: Record<string, SymbolTableEntry> = {}

  let insideConditional = false
  let insideLoop = false
  let insideFunction = false
  let insideWazzup = false
  let foundHai = false
  let foundWazzup = false

  lines.forEach((line, lineNumber) => {
    const trimmedLine = line
      .replace(/"([^"]*)"|BTW.*/g, (match, string) => {
        if (string !== undefined) return `"${string}"`
        return ''
      })
      .trim()

    if (!trimmedLine) return

    if (/^HAI$/.test(trimmedLine)) {
      foundHai = true
      return
    }
    if (/^KTHXBYE$/.test(trimmedLine)) return

    if (/^WAZZUP$/.test(trimmedLine)) {
      insideWazzup = true
      if (!foundHai || foundWazzup) {
        errors.push({
          error: `'WAZZUP' must be immediately after 'HAI' and only once`,
          line: lineNumber + 1
        })
      } else {
        foundWazzup = true
      }
      return
    }
    if (/^BUHBYE$/.test(trimmedLine)) {
      if (!insideWazzup) {
        errors.push({
          error: `'BUHBYE' found outside of a WAZZUP block`,
          line: lineNumber + 1
        })
      } else {
        insideWazzup = false
      }
      return
    }

    if (/^I HAS A /.test(trimmedLine)) {
      handleVariableDeclaration(trimmedLine, lineNumber, localSymbolTable, errors, insideWazzup)
      return
    }

    if (/^[A-Za-z][A-Za-z0-9_]* R /.test(trimmedLine)) {
      handleVariableAssignment(trimmedLine, lineNumber, localSymbolTable, errors)
      return
    }

    if (/^VISIBLE /.test(trimmedLine)) {
      handleOutputStatements(trimmedLine, lineNumber, localSymbolTable, errors)
      return
    }

    if (/^GIMMEH /.test(trimmedLine)) {
      handleInputStatements(trimmedLine, lineNumber, localSymbolTable, errors)
      return
    }

    insideConditional = handleConditionalStatements(
      trimmedLine,
      lineNumber,
      insideConditional,
      errors
    )

    insideLoop = handleLoops(trimmedLine, lineNumber, insideLoop, errors)

    insideFunction = handleFunctionDeclarations(trimmedLine, lineNumber, insideFunction, errors)

    if (/^I IZ /.test(trimmedLine)) {
      handleFunctionCalls(trimmedLine, lineNumber, errors)
      return
    }

    if (/^MAEK /.test(trimmedLine)) {
      handleTypeCasting(trimmedLine, lineNumber, localSymbolTable, errors)
      return
    }

    if (/^WTF\?$/.test(trimmedLine)) return
    if (/^OMG .+$/.test(trimmedLine)) return
    if (/^OMGWTF$/.test(trimmedLine)) return
    if (/^OIC$/.test(trimmedLine)) return

    errors.push({
      error: `Unrecognized syntax: "${trimmedLine}"`,
      line: lineNumber + 1
    })
  })

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

  dispatch(setErrors(errors))
  dispatch(setSymbolTable(localSymbolTable))
}

export default syntaxAnalyzer
