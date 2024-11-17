import React from 'react'
import {
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/index'

interface SymbolTableProps {
  symbolTable: Record<string, string>
}

const SymbolTable: React.FC<SymbolTableProps> = ({ symbolTable }) => {
  return (
    <>
      <div className="w-full h-[50%] p-[10px]">
        <div className="w-full font-bold py-[10px] text-md pl-[30px]">Symbol Table</div>
        <ScrollArea className="h-[330px] w-full border border-inherit rounded-md">
          <Table className="text-center">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-center">Identifier</TableHead>
                <TableHead className="font-bold text-center">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(symbolTable).map(([identifier, value]) => (
                <TableRow className="text-xs" key={identifier}>
                  <TableCell>{identifier}</TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </>
  )
}

export default SymbolTable
