import { useEffect } from 'react'
import { ReactTerminal } from 'react-terminal'

interface TerminalProps {
  terminalMsg: string
  setTerminalMsg: React.Dispatch<React.SetStateAction<any>>
}

const Terminal: React.FC<TerminalProps> = ({ terminalMsg, setTerminalMsg }) => {
  const commands = {
    whoami: 'jackharper',
    cd: (directory: string) => `changed path to ${directory}`,
    echo: (text: string) => text,
    clear: () => {
      setTerminalMsg('')
      return ''
    }
  }

  const handleCommand = (command: string, args: string[]) => {
    if (commands[command]) {
      const result = commands[command](...args)
      setTerminalMsg((prevOutput) => `${prevOutput}\n$ ${command} ${args.join(' ')}\n${result}`)
    } else {
      setTerminalMsg(
        (prevOutput) => `${prevOutput}\n$ ${command} ${args.join(' ')}\nCommand not found`
      )
    }
  }

  const announce = (message: string) => {
    setTerminalMsg((prevOutput) => `${prevOutput}\n${message}`)
  }

  useEffect(() => {
    announce('Welcome to the terminal!\n')
  }, [])

  return (
    <>
      <div className="pt-[20px] px-[20px] border-t border-border font-bold text-[14px]">
        <div className="bg-background-dark rounded-t-md border-t border-x border-border py-[5px] px-[20px]">
          Terminal
        </div>
      </div>
      <div className="h-[215px] mx-[20px] text-base border bg-background-dark border-border rounded-b-md overflow-hidden">
        <ReactTerminal
          commands={commands}
          prompt={'$ '}
          themes={{
            'my-custom-theme': {
              themeBGColor: '#101010', // Dark background color
              themeToolbarColor: '#1E1E1E', // Dark top bar color
              themeColor: '#FFFFFF', // Text color
              themePromptColor: '#00FF00', // Prompt color
              themeFontSize: '12px' // Font size
            }
          }}
          theme="my-custom-theme"
          showControlBar={false} // Remove the 3 dots in the top bar
          onCommand={(command, args) => handleCommand(command, args)}
          welcomeMessage={terminalMsg}
        />
      </div>
    </>
  )
}

export default Terminal
