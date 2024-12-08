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
import { evaluateExpression } from './expressionEvaluationHelper'

let localSymbolTable: Record<string, SymbolTableEntry> = {}
const errors: { error: string; line: number }[] = []

const syntaxAnalyzer = async (content: string, dispatch: AppDispatch) => {
  const lines = content.split('\n')

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

    // Handle conditional statements
    if (/^(BOTH SAEM|DIFFRINT)/.test(trimmedLine)) {
      const result = evaluateExpression(trimmedLine, localSymbolTable, lineNumber, errors)
      let conditionMet = result.value === true // Boolean for branching
      let conditionProcessed = false // Track if any condition was executed

      // Check for O RLY? block
      if (/^O RLY\?$/.test(lines[lineNumber + 1]?.trim())) {
        lineNumber++ // Move to O RLY?
        let insideORLY = true

        while (insideORLY && lineNumber < lines.length - 1) {
          lineNumber++
          const nextLine = lines[lineNumber].trim()

          // Enter YA RLY block
          if (/^YA RLY$/.test(nextLine)) {
            if (!conditionProcessed && conditionMet) {
              conditionProcessed = true
              while (lineNumber < lines.length - 1) {
                lineNumber++
                const innerLine = lines[lineNumber].trim()

                if (/^NO WAI$/.test(innerLine) || /^OIC$/.test(innerLine)) break

                // Process YA RLY block
                await syntaxAnalyzer(innerLine, dispatch) // Process nested lines
              }
            } else {
              // Skip YA RLY block
              while (lineNumber < lines.length - 1) {
                lineNumber++
                if (
                  /^NO WAI$/.test(lines[lineNumber].trim()) ||
                  /^OIC$/.test(lines[lineNumber].trim())
                )
                  break
              }
            }
            continue
          }

          // Enter MEBBE block
          if (/^MEBBE$/.test(nextLine)) {
            if (!conditionProcessed) {
              const mebbeResult = evaluateExpression(nextLine, localSymbolTable, lineNumber, errors)
              if (mebbeResult.value === true) {
                conditionProcessed = true
                while (lineNumber < lines.length - 1) {
                  lineNumber++
                  const innerLine = lines[lineNumber].trim()

                  if (/^NO WAI$/.test(innerLine) || /^OIC$/.test(innerLine)) break

                  // Process MEBBE block
                  await syntaxAnalyzer(innerLine, dispatch) // Process nested lines
                }
              } else {
                // Skip MEBBE block
                while (lineNumber < lines.length - 1) {
                  lineNumber++
                  if (
                    /^NO WAI$/.test(lines[lineNumber].trim()) ||
                    /^OIC$/.test(lines[lineNumber].trim())
                  )
                    break
                }
              }
            }
            continue
          }

          // Enter NO WAI block
          if (/^NO WAI$/.test(nextLine)) {
            if (!conditionProcessed) {
              conditionProcessed = true
              while (lineNumber < lines.length - 1) {
                lineNumber++
                const innerLine = lines[lineNumber].trim()

                if (/^OIC$/.test(innerLine)) break

                // Process NO WAI block
                await syntaxAnalyzer(innerLine, dispatch) // Process nested lines
              }
            } else {
              // Skip NO WAI block
              while (lineNumber < lines.length - 1) {
                lineNumber++
                if (/^OIC$/.test(lines[lineNumber].trim())) break
              }
            }
            continue
          }

          // End O RLY block
          if (/^OIC$/.test(nextLine)) {
            insideORLY = false
          }
        }
      } else {
        errors.push({
          error: `Conditional missing 'O RLY?' after: "${trimmedLine}"`,
          line: lineNumber + 1
        })
      }
    }

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
