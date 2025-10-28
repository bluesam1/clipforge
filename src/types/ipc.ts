// IPC Channel Types and Interfaces

// Video clip data structure
export interface VideoClip {
  id: string;
  filePath: string;
  fileName: string;
  duration: number; // in seconds
  width: number;
  height: number;
  fps: number;
  codec: string;
  fileSize: number; // in bytes
  createdAt: Date;
  thumbnailPath?: string;
}

// Video metadata from FFmpeg
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  fileSize: number;
}

// Import result
export interface ImportResult {
  success: boolean;
  clip?: VideoClip;
  error?: string;
}

// Batch import result
export interface BatchImportResult {
  success: boolean;
  clips: VideoClip[];
  errors: string[];
  totalProcessed: number;
}

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
  VIDEO_IMPORT_PICKER: 'video-import-picker',
  VIDEO_IMPORT_DRAGDROP: 'video-import-dragdrop',
  VIDEO_GET_METADATA: 'video-get-metadata',
  EXPORT_VIDEO: 'export-video',
  EXPORT_PROGRESS: 'export-progress',
  EXPORT_PROGRESS_UPDATE: 'export-progress-update',
  EXPORT_COMPLETE: 'export-complete',
} as const;

// Type for IPC channel names
export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
