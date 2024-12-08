const separateVisibleStatement = (outputExpr: string) => {
  // Regex that splits on "+" only if it's outside of quotes
  const parts: string[] = []
  let currentPart = ''
  let insideQuotes = false
  let escapeNext = false

  for (let i = 0; i < outputExpr.length; i++) {
    const char = outputExpr[i]

    if (escapeNext) {
      // Handle escaping of characters like \" or \+
      currentPart += char
      escapeNext = false
      continue
    }

    if (char === '\\') {
      // Handle escape sequence (e.g., \")
      escapeNext = true
      currentPart += char
      continue
    }

    if (char === '"' && !escapeNext) {
      // Toggle insideQuotes flag on encountering a quote
      insideQuotes = !insideQuotes
      currentPart += char
    } else if (char === '+' && !insideQuotes) {
      // Split only if not inside quotes
      if (currentPart.trim()) {
        parts.push(currentPart.trim())
      }
      currentPart = ''
    } else {
      // Add character to current part
      currentPart += char
    }
  }

  // Add the last part if it exists
  if (currentPart.trim()) {
    parts.push(currentPart.trim())
  }

  return parts
}

export { separateVisibleStatement }
