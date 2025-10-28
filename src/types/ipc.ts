// IPC Channel Types and Interfaces

export interface VideoImportRequest {
  filePath: string;
}

export interface VideoImportResponse {
  success: boolean;
  message: string;
  videoData?: {
    duration: number;
    width: number;
    height: number;
    fps: number;
  };
}

export interface VideoExportRequest {
  outputPath: string;
  startTime: number;
  endTime: number;
  quality: 'low' | 'medium' | 'high';
}

export interface VideoExportResponse {
  success: boolean;
  message: string;
  outputPath?: string;
}

export interface ExportProgress {
  progress: number; // 0-100
  status: 'idle' | 'processing' | 'completed' | 'error';
  message?: string;
}

// IPC Channel Names
export const IPC_CHANNELS = {
  PING: 'ping',
  IMPORT_VIDEO: 'import-video',
  EXPORT_VIDEO: 'export-video',
  EXPORT_PROGRESS: 'export-progress',
  EXPORT_PROGRESS_UPDATE: 'export-progress-update',
  EXPORT_COMPLETE: 'export-complete',
} as const;

// Type for IPC channel names
export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
