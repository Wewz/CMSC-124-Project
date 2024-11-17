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

interface LexemeTableProps {
  lexemes: Lexeme[]
}

const LexemeTable: React.FC<LexemeTableProps> = ({ lexemes }) => {
  return (
    <>
      <div className="py-[10px] border border-inherit w-[100%] rounded-md">
        <div className="w-full text-primary-foreground font-bold text-center pb-2 text-md">
          Lexemes
        </div>
        <ScrollArea className="h-[760px] w-full border-y">
          <Table className="text-center">
            <TableHeader className="">
              <TableRow className="">
                <TableHead className="sticky top-0 font-bold text-primary-foreground text-center">
                  Lexeme
                </TableHead>
                <TableHead className="sticky top-0 font-bold text-primary-foreground text-center ">
                  Classification
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lexemes.map(({ lexeme, classification }, index) => (
                <TableRow className="text-primary-foreground text-xs" key={index}>
                  <TableCell>{lexeme}</TableCell>
                  <TableCell>{classification}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </>
  )
}

export default LexemeTable
