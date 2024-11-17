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
      <div className="w-full h-[50%] p-[10px]">
        <div className="w-full font-bold py-[10px] text-md pl-[30px]">Lexeme Table</div>
        <ScrollArea className="h-[330px] w-full border border-inherit rounded-md">
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
      </div>
    </>
  )
}

export default LexemeTable
