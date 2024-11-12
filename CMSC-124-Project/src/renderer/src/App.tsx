import { useState } from 'react'
import { Textarea } from './components/ui/textarea'
import { Button } from './components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ipcRenderer } from 'electron'

const invoices = [
  {
    invoice: 'INV001',
    paymentStatus: 'Paid',
    totalAmount: '$250.00',
    paymentMethod: 'Credit Card'
  },
  {
    invoice: 'INV002',
    paymentStatus: 'Pending',
    totalAmount: '$150.00',
    paymentMethod: 'PayPal'
  },
  {
    invoice: 'INV003',
    paymentStatus: 'Unpaid',
    totalAmount: '$350.00',
    paymentMethod: 'Bank Transfer'
  },
  {
    invoice: 'INV004',
    paymentStatus: 'Paid',
    totalAmount: '$450.00',
    paymentMethod: 'Credit Card'
  },
  {
    invoice: 'INV005',
    paymentStatus: 'Paid',
    totalAmount: '$550.00',
    paymentMethod: 'PayPal'
  },
  {
    invoice: 'INV006',
    paymentStatus: 'Pending',
    totalAmount: '$200.00',
    paymentMethod: 'Bank Transfer'
  },
  {
    invoice: 'INV007',
    paymentStatus: 'Unpaid',
    totalAmount: '$300.00',
    paymentMethod: 'Credit Card'
  }
]

function App(): JSX.Element {
  const [text, setText] = useState('')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  // const openFile = async () => {
  //   const result = await ipcRenderer.invoke('open-directory')
  //   if (result && !result.error) {
  //     setFilePath(result.filePath)
  //     setFileContent(result.fileContent)
  //   } else {
  //     console.error(result.error)
  //   }
  // }

  return (
    <div className="p-[10px] flex gap-3">
      {/* <div>
        <Button onClick={openFile}>Open File</Button>
        {filePath && (
          <div>
            <h3>File Path: {filePath}</h3>
            <pre>{fileContent}</pre>
          </div>
        )}
      </div> */}
      <Textarea
        placeholder="Type your LolCode Here"
        value={text}
        onChange={handleChange}
        className="whitespace-pre"
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
      <div className="flex gap-3 w-[60%]">
        <div className="p-[10px] border  border-inherit container rounded-md">
          <div className="w-full text-primary-foreground font-bold text-center border-b border-inherit pb-2">
            Lexemes
          </div>
          <Table className="text-center">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-primary-foreground text-center">
                  Lexeme
                </TableHead>
                <TableHead className="font-bold text-primary-foreground text-center">
                  Classification
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow className="text-primary-foreground" key={invoice.invoice}>
                  <TableCell>{invoice.invoice}</TableCell>
                  <TableCell>{invoice.totalAmount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-[10px] border  border-inherit container rounded-md">
          <div className="w-full text-primary-foreground font-bold text-center border-b border-inherit pb-2">
            Symbol Table
          </div>
          <Table className="text-center">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-primary-foreground text-center">
                  Identifier
                </TableHead>
                <TableHead className="font-bold text-primary-foreground text-center">
                  Value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow className="text-primary-foreground" key={invoice.invoice}>
                  <TableCell>{invoice.invoice}</TableCell>
                  <TableCell>{invoice.totalAmount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default App
