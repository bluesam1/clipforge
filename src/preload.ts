import { contextBridge, ipcRenderer } from 'electron';
import { BatchImportResult, VideoMetadata } from './types/ipc';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // Basic ping/pong test
  ping: () => ipcRenderer.invoke('ping'),
  
  // Video import functionality
  importVideoPicker: (): Promise<BatchImportResult> => ipcRenderer.invoke('video-import-picker'),
  importVideoDragDrop: (filePaths: string[]): Promise<BatchImportResult> => ipcRenderer.invoke('video-import-dragdrop', filePaths),
  getVideoMetadata: (filePath: string): Promise<VideoMetadata> => ipcRenderer.invoke('video-get-metadata', filePath),
  
  // Legacy video features
  importVideo: (filePath: string) => ipcRenderer.invoke('import-video', filePath),
  exportVideo: (data: unknown) => ipcRenderer.invoke('export-video', data),
  getExportProgress: () => ipcRenderer.invoke('export-progress'),
  
  // Event listeners for progress updates
  onExportProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('export-progress-update', (_, progress) => callback(progress));
  },
  
  onExportComplete: (callback: (result: unknown) => void) => {
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
