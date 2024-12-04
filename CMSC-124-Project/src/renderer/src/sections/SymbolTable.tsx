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
import { Rabbit } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@renderer/store/store'

const SymbolTable: React.FC = () => {
  const symbolTable = useSelector((state: RootState) => state.symbolTable.symbolTable)

  return (
    <>
      <div className="w-full h-[50%] px-[20px] pb-[20px]">
        <div className="w-full font-bold py-[10px] text-[14px]">Symbol Table</div>

        {Object.keys(symbolTable).length === 0 ? (
          <div className="w-full h-[350px] flex flex-col items-center justify-center border border-border rounded-md bg-background-dark">
            <Rabbit size={150} strokeWidth={1} className="text-background-medium mx-auto" />
            <div className="text-center text-background-medium font-semibold text-[14px] mt-2 px-3 rounded-md">
              <p>No Data in Symbol Table.</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[350px] w-full border border-inherit rounded-md">
            <Table className="text-center">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-center">Identifier</TableHead>
                  <TableHead className="font-bold text-center">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(symbolTable).map(([identifier, entry]) => (
                  <TableRow className="text-xs" key={identifier}>
                    <TableCell>{identifier}</TableCell>
                    <TableCell>
                      {entry.type.localeCompare('TROOF') === 0
                        ? entry.value
                          ? 'WIN'
                          : 'FAIL'
                        : entry.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    </>
  )
}

export default SymbolTable
