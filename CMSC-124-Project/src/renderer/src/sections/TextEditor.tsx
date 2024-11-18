import React, { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark, vscodeDarkInit } from '@uiw/codemirror-theme-vscode'
import { createTheme } from '@uiw/codemirror-themes'

const myTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#101010',
    backgroundImage: '',
    foreground: '#ffff',
    caret: '#5d00ff',
    selection: '#0097b210',
    selectionMatch: '#403c3c',
    lineHighlight: '#403c3c60',
    gutterBorder: '0px',
    gutterBackground: '#101010',
    gutterForeground: '#838079',
    fontFamily: 'var(--font-sans)',
    fontSize: '14px'
  },
  styles: []
})

interface TextEditorProps {
  text: string
  setText: React.Dispatch<React.SetStateAction<string>>
}

const TextEditor: React.FC<TextEditorProps> = ({ text, setText }) => {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    setContent(text)
  }, [text])

  return (
    <>
      <CodeMirror
        value={content}
        height="475px"
        theme={myTheme}
        className="border border-border rounded-md overflow-hidden bg-background-dark"
        onChange={(value) => setText(value)}
      />
    </>
  )
}

export default TextEditor
