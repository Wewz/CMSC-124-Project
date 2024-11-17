import React from 'react'
import { Textarea } from '../components/index'

interface TextEditorProps {
  text: string
  setText: React.Dispatch<React.SetStateAction<any>>
}

const TextEditor: React.FC<TextEditorProps> = ({ text, setText }) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  return (
    <>
      <Textarea
        placeholder="Type your LolCode Here"
        value={text}
        onChange={handleChange}
        className="whitespace-pre w-full"
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault()
            const start = e.currentTarget.selectionStart
            const end = e.currentTarget.selectionEnd
            setText(text.substring(0, start) + '\t' + text.substring(end))
            setTimeout(() => {
              e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 1
            }, 0)
          }
        }}
      />
    </>
  )
}

export default TextEditor
