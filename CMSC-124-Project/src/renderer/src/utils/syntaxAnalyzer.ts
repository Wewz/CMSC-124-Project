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

  const evaluateComplexExpression = (expression, lineNumber) => {
    const operators = {
      'SUM OF': (args) => args.reduce((a, b) => a + b, 0),
      'PRODUKT OF': (args) => args.reduce((a, b) => a * b, 1),
      'BIGGR OF': (args) => Math.max(...args),
      'DIFF OF': (args) => args[0] - args[1],
      'QUOSHUNT OF': (args) => {
        if (args[1] === 0) {
          errors.push({
            error: `Division by zero in expression: "${expression}"`,
            line: lineNumber + 1
          })
          return NaN
        }
        return args[0] / args[1]
      }
    }

    const match = expression.match(/^(SUM OF|PRODUKT OF|BIGGR OF|DIFF OF|QUOSHUNT OF)\s*(.+)$/i)

    if (match) {
      const operator = match[1]
      const operandsStr = match[2].trim()

      // Split operands while preserving nested structures
      const splitOperands = (expression) => {
        const operands = []
        let currentOperand = ''
        let depth = 0

        for (let i = 0; i < expression.length; i++) {
          const char = expression[i]

          if (expression.slice(i).match(/^(SUM OF|PRODUKT OF|BIGGR OF|DIFF OF|QUOSHUNT OF)/)) {
            depth++
          }

          if (char === ' ' && depth === 0 && expression.slice(i, i + 4) === ' AN ') {
            operands.push(currentOperand.trim())
            currentOperand = ''
            i += 3 // Skip " AN "
          } else {
            currentOperand += char
          }

          if (depth > 0 && expression.slice(i, i + 3) === ' AN') {
            depth--
          }
        }

        if (currentOperand.trim()) operands.push(currentOperand.trim())
        return operands
      }

      const operands = splitOperands(operandsStr)

      const handleOperand = (operand) => {
        if (/^"[^"]*"$/.test(operand)) {
          return operand.slice(1, -1) // Return string literal without quotes
        }

        if (/^(SUM OF|PRODUKT OF|BIGGR OF|DIFF OF|QUOSHUNT OF)/.test(operand)) {
          return evaluateComplexExpression(operand, lineNumber) // Recursively evaluate
        }

        const num = parseFloat(operand)
        if (!isNaN(num)) return num

        if (localSymbolTable.hasOwnProperty(operand)) {
          return localSymbolTable[operand]?.value
        }

        errors.push({
          error: `Undefined variable or invalid operand: "${operand}"`,
          line: lineNumber + 1
        })
        return null
      }

      const evaluatedOperands = operands
        .map((operand) => handleOperand(operand))
        .filter((op) => op !== null)

      if (evaluatedOperands.length === operands.length) {
        return operators[operator](evaluatedOperands)
      } else {
        errors.push({
          error: `Invalid operands in expression: "${expression}"`,
          line: lineNumber + 1
        })
        return null
      }
    } else {
      // Handle simple literals or identifiers
      if (/^"[^"]*"$/.test(expression)) {
        return expression.slice(1, -1) // Return string literal without quotes
      }

      const num = parseFloat(expression)
      if (!isNaN(num)) return num

      if (localSymbolTable.hasOwnProperty(expression)) {
        return localSymbolTable[expression]?.value
      }

      errors.push({
        error: `Invalid expression: "${expression}"`,
        line: lineNumber + 1
      })
      return null
    }
  }

  lines.forEach((line, lineNumber) => {
    // ** Remove inline comments and skip lines that are full comments **
    const sanitizedLine = line
      .replace(/"([^"]*)"|BTW.*/g, (match, string) => {
        // Ignore inline comments after `BTW` but preserve the strings before it
        if (string !== undefined) return `"${string}"` // Preserve string literals
        return '' // Remove the comment part
      })
      .trim()

    // Skip empty or fully commented lines
    if (!sanitizedLine) return

    /*** PROGRAM STRUCTURE ***/
    // Program Start
    if (/^HAI$/.test(sanitizedLine)) return

    // WAZZUP
    if (/^WAZZUP/.test(sanitizedLine)) return

    // BUHBYE
    if (/^BUHBYE$/.test(sanitizedLine)) return

    // Program End
    if (/^KTHXBYE$/.test(sanitizedLine)) return

    /*** VARIABLE DECLARATIONS ***/
    if (/^I HAS A /.test(sanitizedLine)) {
      const match = sanitizedLine.match(/^I HAS A ([A-Za-z][A-Za-z0-9_]*)(?: ITZ (.+))?$/)
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
          error: `Invalid variable declaration: "${sanitizedLine}"`,
          line: lineNumber + 1
        })
      }
      return
    }

    /*** VARIABLE ASSIGNMENT WITH VALUE EVALUATION ***/
    if (/^[A-Za-z][A-Za-z0-9_]* R /.test(sanitizedLine)) {
      const match = sanitizedLine.match(/^([A-Za-z][A-Za-z0-9_]*) R (.+)$/)
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
    /*** OUTPUT STATEMENTS ***/
    if (/^VISIBLE /.test(sanitizedLine)) {
      const match = sanitizedLine.match(/^VISIBLE (.+)$/)
      if (match) {
        const outputExpr = match[1].trim()

        // Split the concatenation expression by '+' while preserving string literals
        const splitConcatenation = (expr) => {
          const result = []
          let current = ''
          let insideString = false

          for (let i = 0; i < expr.length; i++) {
            const char = expr[i]

            if (char === '"' && (i === 0 || expr[i - 1] !== '\\')) {
              insideString = !insideString
            }

            if (char === '+' && !insideString) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }

          if (current.trim()) result.push(current.trim())
          return result
        }

        // Evaluate individual concatenation parts
        const parts = splitConcatenation(outputExpr)
        const evaluatedParts = parts.map((part) => {
          if (/^".*"$/.test(part)) {
            return part.slice(1, -1) // String literal, remove quotes
          }

          if (/^(SUM OF|PRODUKT OF|BIGGR OF|DIFF OF|QUOSHUNT OF)/.test(part)) {
            return evaluateComplexExpression(part, lineNumber + 1) // Evaluate nested expression
          }

          if (localSymbolTable.hasOwnProperty(part)) {
            return localSymbolTable[part]?.value // Variable lookup
          }

          const num = parseFloat(part)
          if (!isNaN(num)) return num // Numeric literal

          errors.push({
            error: `Invalid or undefined expression in VISIBLE: "${part}"`,
            line: lineNumber + 1
          })
          return ''
        })

        // Concatenate and print the result
        const finalOutput = evaluatedParts.join('')
        if (finalOutput !== '') {
          console.log(finalOutput)
        } else {
          errors.push({
            error: `Invalid or incomplete output expression: "${outputExpr}"`,
            line: lineNumber + 1
          })
        }
      }
      return
    }

    /*** INPUT STATEMENTS ***/
    if (/^GIMMEH /.test(sanitizedLine)) {
      const match = sanitizedLine.match(/^GIMMEH ([A-Za-z][A-Za-z0-9_]*)$/)
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
    if (/^O RLY\?$/.test(sanitizedLine)) {
      insideConditional = true
      return
    }
    if (/^YA RLY$/.test(sanitizedLine)) {
      if (!insideConditional) {
        errors.push({
          error: `'YA RLY' found outside of a conditional block`,
          line: lineNumber + 1
        })
      }
      return
    }
    if (/^MEBBE .+$/.test(sanitizedLine)) {
      if (!insideConditional) {
        errors.push({
          error: `'MEBBE' found outside of a conditional block`,
          line: lineNumber + 1
        })
      }
      return
    }
    if (/^NO WAI$/.test(sanitizedLine)) {
      if (!insideConditional) {
        errors.push({
          error: `'NO WAI' found outside of a conditional block`,
          line: lineNumber + 1
        })
      }
      return
    }
    if (/^OIC$/.test(sanitizedLine)) {
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
    if (/^IM IN YR /.test(sanitizedLine)) {
      insideLoop = true
      return
    }
    if (/^IM OUTTA YR /.test(sanitizedLine)) {
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
    if (/^HOW IZ I /.test(sanitizedLine)) {
      insideFunction = true
      return
    }
    if (/^IF U SAY SO$/.test(sanitizedLine)) {
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
    if (/^I IZ /.test(sanitizedLine)) {
      const match = sanitizedLine.match(/^I IZ ([A-Za-z][A-Za-z0-9_]*)(?: YR .+)? MKAY$/)
      if (!match) {
        errors.push({
          error: `Invalid function call syntax: "${sanitizedLine}"`,
          line: lineNumber + 1
        })
      }
      return
    }

    /*** SWITCH CASES ***/
    if (/^WTF\?$/.test(sanitizedLine)) {
      return
    }
    if (/^OMG .+$/.test(sanitizedLine)) {
      return
    }
    if (/^OMGWTF$/.test(sanitizedLine)) {
      return
    }
    if (/^OIC$/.test(sanitizedLine)) {
      return
    }

    // Unrecognized Syntax
    errors.push({
      error: `Unrecognized syntax: "${sanitizedLine}"`,
      line: lineNumber + 1
    })
  })

  // outputLog.forEach((output) => console.log(output))

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
