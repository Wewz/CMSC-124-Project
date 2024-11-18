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
import { Lexeme } from '@renderer/interfaces/interfaces'
import { Bird } from 'lucide-react'

interface LexemeTableProps {
  lexemes: Lexeme[]
}

const LexemeTable: React.FC<LexemeTableProps> = ({ lexemes }) => {
  return (
    <>
      <div className="w-full h-[50%] p-[20px]">
        <div className="w-full font-bold py-[10px] text-[14px]">Lexeme Table</div>

        {Object.keys(lexemes).length === 0 ? (
          <div className="w-full h-[350px] flex flex-col items-center justify-center border border-border rounded-md bg-background-dark">
            <Bird size={150} strokeWidth={1} className="text-background-medium mx-auto" />
            <div className="text-center text-background-medium font-semibold text-[14px] mt-2 px-3 rounded-md">
              <p>No Data in Lexeme Table.</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[350px] w-full border border-inherit rounded-md">
            <Table className="text-center">
              <TableHeader className="">
                <TableRow className="">
                  <TableHead className="sticky top-0 font-bold text-center">Lexeme</TableHead>
                  <TableHead className="sticky top-0 font-bold text-center ">
                    Classification
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lexemes.map(({ lexeme, classification }, index) => (
                  <TableRow className="text-xs" key={index}>
                    <TableCell>{lexeme}</TableCell>
                    <TableCell>{classification}</TableCell>
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

export default LexemeTable
