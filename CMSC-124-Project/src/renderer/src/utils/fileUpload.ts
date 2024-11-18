import processFileContent from "./lexemeAnalyzer"

const handleFileUpload = (
  event: React.ChangeEvent<HTMLInputElement>, 
  setText: React.Dispatch<React.SetStateAction<any>>, 
  setFileContent: React.Dispatch<React.SetStateAction<any>>, 
) => {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setText(content)
      setFileContent(content)
    }
    reader.readAsText(file)
  }
}

export default handleFileUpload;