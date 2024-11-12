import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('myAPI', {
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath), // IPC call to read file
});