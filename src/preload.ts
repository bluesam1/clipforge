import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // Basic ping/pong test
  ping: () => ipcRenderer.invoke('ping'),
  
  // Future IPC channels for video features
  importVideo: (filePath: string) => ipcRenderer.invoke('import-video', filePath),
  exportVideo: (data: any) => ipcRenderer.invoke('export-video', data),
  getExportProgress: () => ipcRenderer.invoke('export-progress'),
  
  // Event listeners for progress updates
  onExportProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('export-progress-update', (_, progress) => callback(progress));
  },
  
  onExportComplete: (callback: (result: any) => void) => {
    ipcRenderer.on('export-complete', (_, result) => callback(result));
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the global window object
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
