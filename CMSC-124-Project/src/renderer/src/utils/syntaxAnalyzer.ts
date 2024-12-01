import { Lexeme, SymbolTableEntry } from '@renderer/interfaces/interfaces'
import { isLiteralOrIdentifier, evaluateExpression } from './analyzerHelperFunctions'

const syntaxAnalyzer = (
  content: string,
  setErrors: React.Dispatch<React.SetStateAction<any>>,
  setSymbolTable: React.Dispatch<React.SetStateAction<any>>
) => {
  const errors: { error: string; line: number }[] = []
  const lines = content.split('\n')
  const localSymbolTable: Record<string, SymbolTableEntry> = {}

  let insideConditional = false
  let insideLoop = false
  let insideFunction = false

  lines.forEach((line, lineNumber) => {
    const trimmedLine = line.trim()

    // Skip empty lines and comments
    if (!trimmedLine || /^BTW/.test(trimmedLine) || /^OBTW[\s\S]*?TLDR$/.test(trimmedLine)) return

    /*** PROGRAM STRUCTURE ***/
    // Program Start
    if (/^HAI$/.test(trimmedLine)) return
    // Program End
    if (/^KTHXBYE$/.test(trimmedLine)) return

    /*** VARIABLE DECLARATIONS ***/
    if (/^I HAS A /.test(trimmedLine)) {
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
          let type: string = 'UNDEFINED'
          let resolvedValue: any = null

          if (value) {
            const evalResult = evaluateExpression(value, localSymbolTable, lineNumber + 1, errors)
            type = evalResult.type
            resolvedValue = evalResult.value
          }

          localSymbolTable[variable] = { type, value: resolvedValue, existingProperty: null }
        }
      } else {
        errors.push({
          error: `Invalid variable declaration: "${trimmedLine}"`,
          line: lineNumber + 1
        })
      }
      return
    }

    /*** VARIABLE ASSIGNMENT WITH VALUE EVALUATION ***/
    if (/^[A-Za-z][A-Za-z0-9_]* R /.test(trimmedLine)) {
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
          const expectedType = localSymbolTable[variable].type

          if (expectedType !== 'UNDEFINED' && evalResult.type !== expectedType) {
            errors.push({
              error: `Type mismatch in assignment to "${variable}". Expected: ${expectedType}, Got: ${evalResult.type}`,
              line: lineNumber + 1
            })
          } else {
            localSymbolTable[variable].value = evalResult.value
            localSymbolTable[variable].type = evalResult.type
          }
        }
      }
      return
    }

    /*** OUTPUT STATEMENTS ***/
    if (/^VISIBLE /.test(trimmedLine)) {
      const match = trimmedLine.match(/^VISIBLE (.+)$/)
      if (match) {
        const outputExpr = match[1].trim()
        if (!isLiteralOrIdentifier(outputExpr, new Set(Object.keys(localSymbolTable)))) {
          errors.push({
            error: `Invalid output expression: "${outputExpr}"`,
            line: lineNumber + 1
          })
        }
      }
      return
    }

    /*** INPUT STATEMENTS ***/
    if (/^GIMMEH /.test(trimmedLine)) {
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
      return
    }

    /*** CONDITIONAL STATEMENTS ***/
    if (/^O RLY\?$/.test(trimmedLine)) {
      insideConditional = true
      return
    }
    if (/^YA RLY$/.test(trimmedLine)) {
      if (!insideConditional) {
        errors.push({
          error: `'YA RLY' found outside of a conditional block`,
          line: lineNumber + 1
        })
      }
      return
    }
    if (/^MEBBE .+$/.test(trimmedLine)) {
      if (!insideConditional) {
        errors.push({
          error: `'MEBBE' found outside of a conditional block`,
          line: lineNumber + 1
        })
      }
      return
    }
    if (/^NO WAI$/.test(trimmedLine)) {
      if (!insideConditional) {
        errors.push({
          error: `'NO WAI' found outside of a conditional block`,
          line: lineNumber + 1
        })
      }
      return
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
      return
    }

    /*** LOOPS ***/
    if (/^IM IN YR /.test(trimmedLine)) {
      insideLoop = true
      return
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
      return
    }

    /*** FUNCTION DECLARATIONS ***/
    if (/^HOW IZ I /.test(trimmedLine)) {
      insideFunction = true
      return
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
      return
    }

    /*** FUNCTION CALLS ***/
    if (/^I IZ /.test(trimmedLine)) {
      const match = trimmedLine.match(/^I IZ ([A-Za-z][A-Za-z0-9_]*)(?: YR .+)? MKAY$/)
      if (!match) {
        errors.push({
          error: `Invalid function call syntax: "${trimmedLine}"`,
          line: lineNumber + 1
        })
      }
      return
    }

    /*** SWITCH CASES ***/
    if (/^WTF\?$/.test(trimmedLine)) {
      return
    }
    if (/^OMG .+$/.test(trimmedLine)) {
      return
    }
    if (/^OMGWTF$/.test(trimmedLine)) {
      return
    }
    if (/^OIC$/.test(trimmedLine)) {
      return
    }

    // Unrecognized Syntax
    errors.push({
      error: `Unrecognized syntax: "${trimmedLine}"`,
      line: lineNumber + 1
    })
  })

  // Check for unterminated blocks
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

  // Update symbol table state
  setSymbolTable(localSymbolTable)

  // Push errors to the state
  setErrors((prevErrors) => [...prevErrors, ...errors])
}

export default syntaxAnalyzer
