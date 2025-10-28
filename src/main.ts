import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { processVideoFile, processVideoFiles } from './utils/videoUtils';
import { BatchImportResult, VideoMetadata } from './types/ipc';

// Vite environment variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow local file access for video preview
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools only in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Set CSP headers for security
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data: blob: file:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob: file:; " +
          "media-src 'self' data: blob: file:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' ws: wss:;"
        ]
      }
    });
  });
};

// IPC Handlers
ipcMain.handle('ping', () => {
  return 'pong';
});

// Video import handlers
ipcMain.handle('video-import-picker', async (): Promise<BatchImportResult> => {
  try {
    console.log('Video import picker called');
    const result = await dialog.showOpenDialog({
      title: 'Select Video Files',
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mov'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    });

    console.log('Dialog result:', result);

    if (result.canceled || result.filePaths.length === 0) {
      console.log('No files selected or dialog canceled');
      return { 
        success: false, 
        clips: [], 
        errors: ['No files selected'], 
        totalProcessed: 0 
      };
    }

    console.log('Processing files:', result.filePaths);
    const { clips, errors } = await processVideoFiles(result.filePaths);
    console.log('Processing result:', { clips: clips.length, errors });
    
    return {
      success: clips.length > 0,
      clips,
      errors,
      totalProcessed: result.filePaths.length
    };
  } catch (error) {
    console.error('Video import error:', error);
    return {
      success: false,
      clips: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      totalProcessed: 0
    };
  }
});

ipcMain.handle('video-import-dragdrop', async (event, filePaths: string[]): Promise<BatchImportResult> => {
  try {
    const { clips, errors } = await processVideoFiles(filePaths);
    
    return {
      success: clips.length > 0,
      clips,
      errors,
      totalProcessed: filePaths.length
    };
  } catch (error) {
    console.error('Batch video import error:', error);
    return {
      success: false,
      clips: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      totalProcessed: 0
    };
  }
});

ipcMain.handle('video-get-metadata', async (event, filePath: string): Promise<VideoMetadata> => {
  try {
    const clip = await processVideoFile(filePath);
    return {
      duration: clip.duration,
      width: clip.width,
      height: clip.height,
      fps: clip.fps,
      codec: clip.codec,
      fileSize: clip.fileSize
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get metadata');
  }
});

// Legacy IPC handlers for video features
ipcMain.handle('import-video', async (event, filePath: string) => {
  // TODO: Implement video import logic
  console.log('Import video request:', filePath);
  return { success: true, message: 'Video import not yet implemented' };
});

ipcMain.handle('export-video', async (event, data: unknown) => {
  // TODO: Implement video export logic
  console.log('Export video request:', data);
  return { success: true, message: 'Video export not yet implemented' };
});

ipcMain.handle('export-progress', () => {
  // TODO: Return actual export progress
  return { progress: 0, status: 'idle' };
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
