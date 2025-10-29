import { contextBridge, ipcRenderer } from 'electron';
import { BatchImportResult, VideoMetadata } from './types/ipc';
import type { ExportRequest, ExportResult, ExportProgress } from './types/export';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // Basic ping/pong test
  ping: () => ipcRenderer.invoke('ping'),
  
  // Video import functionality
  importVideoPicker: (): Promise<BatchImportResult> => ipcRenderer.invoke('video-import-picker'),
  importVideoDragDrop: (filePaths: string[]): Promise<BatchImportResult> => ipcRenderer.invoke('video-import-dragdrop', filePaths),
  getVideoMetadata: (filePath: string): Promise<VideoMetadata> => ipcRenderer.invoke('video-get-metadata', filePath),
  
  // Export functionality
  exportVideo: (request: ExportRequest): Promise<ExportResult> => ipcRenderer.invoke('export-video', request),
  cancelExport: (): Promise<{ success: boolean; message: string }> => ipcRenderer.invoke('export-cancel'),
  showSaveDialog: (options: any): Promise<{ canceled: boolean; filePath?: string }> => ipcRenderer.invoke('dialog:showSaveDialog', options),
  
  // Event listeners for export progress and completion
  onExportProgressUpdate: (callback: (progress: ExportProgress) => void) => {
    const listener = (_: any, progress: ExportProgress) => callback(progress);
    ipcRenderer.on('export-progress-update', listener);
    return () => ipcRenderer.removeListener('export-progress-update', listener);
  },
  
  onExportComplete: (callback: (result: ExportResult) => void) => {
    const listener = (_: any, result: ExportResult) => callback(result);
    ipcRenderer.on('export-complete', listener);
    return () => ipcRenderer.removeListener('export-complete', listener);
  },
  
  onExportError: (callback: (result: ExportResult) => void) => {
    const listener = (_: any, result: ExportResult) => callback(result);
    ipcRenderer.on('export-error', listener);
    return () => ipcRenderer.removeListener('export-error', listener);
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
