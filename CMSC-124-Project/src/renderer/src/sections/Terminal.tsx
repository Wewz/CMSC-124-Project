import useTerminal from '@renderer/hooks/useTerminal'
import useTerminalEffects from '@renderer/hooks/useTerminalEffects'
import useTerminalInput from '@renderer/hooks/useTerminalInput'

const TerminalBox: React.FC = () => {
  const { terminalRef, terminalInstanceRef, inputBufferRef } = useTerminal()

  useTerminalEffects(terminalInstanceRef, inputBufferRef)
  useTerminalInput({ terminalInstanceRef, inputBufferRef })

  return (
    <div className="flex flex-col px-[20px]">
      <div className="w-full font-bold py-[10px] pl-[20px] text-[14px] bg-background-dark rounded-t-md border-x border-t border-border">
        Terminal
      </div>

      <div className="max-w-4xl h-[225px] pl-[10px] pr-[5px] pt-[10px] border border-border rounded-b-md bg-background-dark">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  )
}

export default TerminalBox
