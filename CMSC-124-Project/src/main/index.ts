import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import express from 'express';
import router from './routes/route'
import contextMenu from 'electron-context-menu';

let mainWindow: BrowserWindow;

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    trafficLightPosition: { x:15, y:10 },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, './preload/preload.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function handleOpenDirectory() {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    return null;
  }

  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'openDirectory'],
  });

  if (result.canceled) {
    return null;
  }

  const filePath = result.filePaths[0];
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return { filePath, fileContent };
  } catch (error) {
    console.error('Error reading file:', error);
    return { error: 'Failed to read file' };
  }
}

ipcMain.handle('open-directory', handleOpenDirectory);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow();

  contextMenu({
    prepend: (defaultActions, params, browserWindow) => [
      {
        label: 'View Page Source',
        click: () => {
          (browserWindow as BrowserWindow).webContents.executeJavaScript('document.documentElement.outerHTML').then((html) => {
            const sourceWindow = new BrowserWindow({
              width: 800,
              height: 600,
              webPreferences: {
                nodeIntegration: true,
              },
            });
            sourceWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
          });
        },
      },
    ],
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Set up Express server
const expressApp = express();
const port = 3000;

expressApp.use(express.json());
expressApp.use('/api', router);

expressApp.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
