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
  let insideWazzup = false
  let foundHai = false
  let foundWazzup = false

  lines.forEach((line, lineNumber) => {
    const trimmedLine = line
      .replace(/"([^"]*)"|BTW.*/g, (match, string) => {
        // Ignore inline comments after `BTW` but preserve the strings before it
        if (string !== undefined) return `"${string}"` // Preserve string literals
        return '' // Remove the comment part
      })
      .trim()

    // Skip empty lines and comments
    // if (!trimmedLine || /^BTW/.test(trimmedLine) || /^OBTW[\s\S]*?TLDR$/.test(trimmedLine)) return
    if (!trimmedLine) return

    /*** PROGRAM STRUCTURE ***/
    // Program Start
    if (/^HAI$/.test(trimmedLine)) {
      foundHai = true
      return
    }
    // Program End
    if (/^KTHXBYE$/.test(trimmedLine)) return

    /*** WAZZUP BLOCK ***/
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

    /*** VARIABLE DECLARATIONS ***/
    if (/^I HAS A /.test(trimmedLine)) {
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
            let type: string = 'UNDEFINED'
            let resolvedValue: any = null

            const evalResult = evaluateExpression(value, localSymbolTable, lineNumber + 1, errors)
            type = evalResult.type
            resolvedValue = evalResult.value

            localSymbolTable[variable] = { type, value: resolvedValue, existingProperty: null }
          } else {
            // Handle case where no initial value is provided
            localSymbolTable[variable] = { type: 'NOOB', value: 'NOOB', existingProperty: null }
          }
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

        // Check if the variable is declared
        if (!localSymbolTable[variable]) {
          errors.push({
            error: `Undeclared variable used in assignment: "${variable}"`,
            line: lineNumber + 1
          })
        } else {
          // Evaluate the value
          const evalResult = evaluateExpression(value, localSymbolTable, lineNumber + 1, errors)
          const expectedType = localSymbolTable[variable].type

          // Check for type mismatch
          if (expectedType !== 'UNDEFINED' && evalResult.type !== expectedType) {
            errors.push({
              error: `Type mismatch in assignment to "${variable}". Expected: ${expectedType}, Got: ${evalResult.type}`,
              line: lineNumber + 1
            })
          } else {
            // Update the variable's value and type
            localSymbolTable[variable].value = evalResult.value
            localSymbolTable[variable].type = evalResult.type

            console.log('Updated Variable', evalResult)
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
        const parts = outputExpr.split(/(?<!\\)\+/).map((part) => part.trim()) // Split by unescaped plus signs

        let outputResult = ''

        for (const part of parts) {
          try {
            // Check if the part is a literal string
            if (/^".*"$/.test(part)) {
              outputResult += part.slice(1, -1) // Remove the surrounding quotes
            } else {
              const evalResult = evaluateExpression(part, localSymbolTable, lineNumber + 1, errors)
              outputResult += evalResult.value.toString() // Cast to YARN
            }
          } catch (error) {
            errors.push({
              error: `Invalid output expression: "${part}"`,
              line: lineNumber + 1
            })
            return
          }
        }

        console.log('Output the evaluated result', outputResult + '\n') // Output the evaluated result with a new line
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
    if (/^(YA RLY|MEBBE .+|NO WAI)$/.test(trimmedLine)) {
      if (!insideConditional) {
        errors.push({
          error: `'${trimmedLine}' found outside of a conditional block`,
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

    /*** TYPE CASTING WITH MAEK ***/
    if (/^MAEK /.test(trimmedLine)) {
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

  console.log('Syntax and Semantic Errors', errors)

  // Update symbol table state
  setSymbolTable(localSymbolTable)

  // Push errors to the state
  setErrors((prevErrors) => [...prevErrors, ...errors])
}

export default syntaxAnalyzer
