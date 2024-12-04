const handleFileUpload = (
  event: React.ChangeEvent<HTMLInputElement>,
  setText: React.Dispatch<React.SetStateAction<any>>
) => {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setText(content)
    }
    reader.readAsText(file)
  }
}

export default handleFileUpload
