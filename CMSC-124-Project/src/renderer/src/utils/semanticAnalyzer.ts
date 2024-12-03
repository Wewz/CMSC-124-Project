import { Lexeme, SymbolTableEntry } from '@renderer/interfaces/interfaces'
import { isLiteralOrIdentifier, extractConditionalBlock } from './analyzerHelperFunctions'

const semanticAnalyzer = (
  content: string,
  lexemes: Lexeme[],
  symbolTable: Record<string, SymbolTableEntry>,
  setSymbolTable: React.Dispatch<React.SetStateAction<any>>,
  setErrors: React.Dispatch<React.SetStateAction<any>>
) => {
  const errors: { error: string; line: number }[] = []
  const declaredVariables = new Set<string>()
  const declaredFunctions = new Set<string>()
  const lines = content.split('\n')

  let insideConditional = false
  let insideLoop = false
  let insideFunction = false

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
      return
    }

    // **2. Variable Usage**
    if (/^[A-Za-z][A-Za-z0-9_]* R /.test(trimmedLine)) {
      const match = trimmedLine.match(/^([A-Za-z][A-Za-z0-9_]*) R (.+)$/)
      if (match) {
        const variable = match[1]
        const value = match[2]
        if (!declaredVariables.has(variable)) {
          errors.push({
            error: `Undeclared variable used in assignment: "${variable}"`,
            line: lineNumber + 1
          })
        } else if (!isLiteralOrIdentifier(value, declaredVariables)) {
          errors.push({
            error: `Invalid value assigned to variable "${variable}": "${value}"`,
            line: lineNumber + 1
          })
        }
      }
      return
    }

    // **3. Output Statements**
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
      return
    }

    // **4. Input Statements**
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
      return
    }

    // **5. Conditional Statements**
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

    // **6. Loops**
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

    // **7. Function Declarations**
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

    // **8. Function Calls**
    if (/^I IZ /.test(trimmedLine)) {
      const match = trimmedLine.match(/^I IZ ([A-Za-z][A-Za-z0-9_]*)(?: YR .+)? MKAY$/)
      if (match) {
        const functionName = match[1]
        if (!declaredFunctions.has(functionName)) {
          errors.push({
            error: `Undeclared function called: "${functionName}"`,
            line: lineNumber + 1
          })
        }
      } else {
        errors.push({
          error: `Invalid function call syntax: "${trimmedLine}"`,
          line: lineNumber + 1
        })
      }
      return
    }

    // **9. Type Casting with MAEK**
    if (/^MAEK /.test(trimmedLine)) {
      const match = trimmedLine.match(/^MAEK (.+) A (NOOB|NUMBR|NUMBAR|YARN|TROOF)$/)
      if (match) {
        const value = match[1]
        const targetType = match[2]
        if (!isLiteralOrIdentifier(value, declaredVariables)) {
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

    // **10. Switch Cases**
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

  console.log('Semantic Errors', errors)

  // Update symbol table state
  // setSymbolTable(declaredVariables)

  // Push errors to the state
  setErrors((prevErrors) => [...prevErrors, ...errors])
}

export default semanticAnalyzer
