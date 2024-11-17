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
      <div className="py-[10px] border border-inherit w-[100%] rounded-md">
        <div className="w-full text-primary-foreground font-bold text-center pb-2 text-md">
          Symbol Table
        </div>
        <ScrollArea className="h-[760px] w-full border-y">
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
              {Object.entries(symbolTable).map(([identifier, value]) => (
                <TableRow className="text-primary-foreground text-xs" key={identifier}>
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
