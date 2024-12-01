import { Lexeme, SymbolTableEntry } from '@renderer/interfaces/interfaces'
import { isLiteralOrIdentifier, extractConditionalBlock } from './analyzerHelperFunctions'

const semanticAnalyzer = (
  content: string,
  lexemes: Lexeme[],
  symbolTable: Record<string, SymbolTableEntry>,
  setErrors: React.Dispatch<React.SetStateAction<any>>
) => {
  const errors: { error: string; line: number }[] = []
  const declaredVariables = new Set<string>()
  const declaredFunctions = new Set<string>()
  const lines = content.split('\n')

  lines.forEach((line, lineNumber) => {
    const trimmedLine = line.trim()

    // Skip empty lines or comments
    if (!trimmedLine || /^BTW/.test(trimmedLine) || /^OBTW[\s\S]*?TLDR$/.test(trimmedLine)) {
      return
    }

    /*** SEMANTIC CHECKS ***/

    // **1. Variable Declarations**
    if (/^I HAS A /.test(trimmedLine)) {
      const match = trimmedLine.match(/^I HAS A ([A-Za-z][A-Za-z0-9_]*)/)
      if (match) {
        const variable = match[1]
        if (declaredVariables.has(variable)) {
          errors.push({
            error: `Duplicate variable declaration: "${variable}"`,
            line: lineNumber + 1
          })
        } else {
          declaredVariables.add(variable)

          // Check if initialization is valid (optional ITZ clause)
          if (/ITZ/.test(trimmedLine)) {
            const initMatch = trimmedLine.match(/ITZ (.+)$/)
            if (initMatch) {
              const value = initMatch[1].trim()
              if (!isLiteralOrIdentifier(value, declaredVariables)) {
                errors.push({
                  error: `Invalid initialization for variable "${variable}": "${value}"`,
                  line: lineNumber + 1
                })
              }
            }
          }
        }
      }
    }

    // **2. Variable Usage**
    if (/^[A-Za-z][A-Za-z0-9_]* R /.test(trimmedLine)) {
      const variable = trimmedLine.split(' ')[0]
      if (!declaredVariables.has(variable)) {
        errors.push({
          error: `Undeclared variable used in assignment: "${variable}"`,
          line: lineNumber + 1
        })
      }
    }

    // **3. Output Validation**
    if (/^VISIBLE /.test(trimmedLine)) {
      const match = trimmedLine.match(/^VISIBLE (.+)$/)
      if (match) {
        const outputExpr = match[1].trim()
        if (!isLiteralOrIdentifier(outputExpr, declaredVariables)) {
          errors.push({
            error: `Invalid output expression: "${outputExpr}"`,
            line: lineNumber + 1
          })
        }
      }
    }

    // **4. Input Validation**
    if (/^GIMMEH /.test(trimmedLine)) {
      const match = trimmedLine.match(/^GIMMEH ([A-Za-z][A-Za-z0-9_]*)$/)
      if (match) {
        const variable = match[1]
        if (!declaredVariables.has(variable)) {
          errors.push({
            error: `Undeclared variable used in input: "${variable}"`,
            line: lineNumber + 1
          })
        }
      }
    }

    // **5. Function Declarations**
    if (/^HOW IZ I /.test(trimmedLine)) {
      const match = trimmedLine.match(/^HOW IZ I ([A-Za-z][A-Za-z0-9_]*)/)
      if (match) {
        const functionName = match[1]
        if (declaredFunctions.has(functionName)) {
          errors.push({
            error: `Duplicate function declaration: "${functionName}"`,
            line: lineNumber + 1
          })
        } else {
          declaredFunctions.add(functionName)
        }
      }
    }

    // **6. Function Calls**
    if (/^I IZ /.test(trimmedLine)) {
      const match = trimmedLine.match(/^I IZ ([A-Za-z][A-Za-z0-9_]*)/)
      if (match) {
        const functionName = match[1]
        if (!declaredFunctions.has(functionName)) {
          errors.push({
            error: `Undefined function called: "${functionName}"`,
            line: lineNumber + 1
          })
        }
      }
    }

    // **7. Loop Validations**
    if (/^IM IN YR /.test(trimmedLine)) {
      const match = trimmedLine.match(/^IM IN YR ([A-Za-z][A-Za-z0-9_]*)/)
      if (match) {
        const loopVariable = match[1]
        if (!declaredVariables.has(loopVariable)) {
          errors.push({
            error: `Undeclared variable used in loop: "${loopVariable}"`,
            line: lineNumber + 1
          })
        }
      }
    }

    // **8. Conditional Validations**
    if (/^O RLY\?$/.test(trimmedLine)) {
      // Ensure that there is a corresponding YA RLY and OIC block
      const conditionalBlock = extractConditionalBlock(lines, lineNumber)
      if (!conditionalBlock.valid) {
        errors.push({
          error: `Incomplete conditional structure starting at line ${lineNumber + 1}`,
          line: lineNumber + 1
        })
      }
    }

    // **9. Type Validation**
    if (/^MAEK /.test(trimmedLine)) {
      const match = trimmedLine.match(/^MAEK (.+) A (NUMBR|NUMBAR|YARN|TROOF)$/)
      if (match) {
        const expr = match[1]
        const type = match[2]
        if (!isLiteralOrIdentifier(expr, declaredVariables)) {
          errors.push({
            error: `Invalid expression for type casting: "${expr}"`,
            line: lineNumber + 1
          })
        }
      }
    }
  })

  // Push errors to the state
  setErrors((prevErrors) => [...prevErrors, ...errors])
}

export default semanticAnalyzer
