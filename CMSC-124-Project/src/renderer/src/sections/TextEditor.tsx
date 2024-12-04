import React from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { createTheme } from '@uiw/codemirror-themes'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@renderer/store/store'
import { setContent } from '@renderer/store/slices/contentSlice'

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

const TextEditor: React.FC = () => {
  const dispatch: AppDispatch = useDispatch()
  const content = useSelector((state: RootState) => state.content.text)

  return (
    <>
      <CodeMirror
        value={content}
        height="465px"
        theme={myTheme}
        className="border border-border rounded-md overflow-hidden bg-background-dark"
        onChange={(value) => dispatch(setContent(value))}
      />
    </>
  )
}

export default TextEditor
