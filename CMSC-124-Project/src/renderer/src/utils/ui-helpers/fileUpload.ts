import { AppDispatch } from '@renderer/store/store'
import { setContent } from '@renderer/store/slices/contentSlice'

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, dispatch: AppDispatch) => {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      dispatch(setContent(content))
    }
    reader.readAsText(file)
  }
}

export default handleFileUpload
