// Export-related type definitions

// Export resolution options
export type ExportResolution = 'source' | '1080p' | '720p';

// Export status types
export type ExportStatus = 'idle' | 'exporting' | 'success' | 'error' | 'cancelled';

// Export quality preset
export type ExportQuality = 'low' | 'medium' | 'high';

// Export options interface
export interface ExportOptions {
  resolution: ExportResolution;
  outputPath: string;
  quality: ExportQuality;
  filename?: string;
}

// Export progress information
export interface ExportProgress {
  percent: number; // 0-100
  currentTime: number; // Current time in seconds
  estimatedTime?: number; // Estimated remaining time in seconds
  fps?: number; // Current processing FPS
  speed?: string; // Processing speed (e.g., "2.5x")
}

// Export result after completion
export interface ExportResult {
  success: boolean;
  outputPath?: string;
  message?: string;
  error?: string;
  duration?: number; // Total export duration in seconds
}

// Export state for context management
export interface ExportState {
  status: ExportStatus;
  progress: ExportProgress | null;
  options: ExportOptions | null;
  result: ExportResult | null;
  error: string | null;
}

// Resolution dimensions mapping
export interface ResolutionDimensions {
  width: number;
  height: number;
}

export const RESOLUTION_DIMENSIONS: Record<ExportResolution, ResolutionDimensions | null> = {
  'source': null, // Use source video dimensions
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 }
};

// Export request for IPC communication
export interface ExportRequest {
  clips: Array<{
    filePath: string;
    inPoint: number;
    outPoint: number;
    duration: number;
  }>;
  outputPath: string;
  options: ExportOptions;
}

// Export progress event from FFmpeg
export interface ExportProgressEvent {
  percent: number;
  currentTime: number;
  targetSize?: number;
  currentFps?: number;
  speed?: string;
}

// Export codec settings
export interface ExportCodecSettings {
  videoCodec: string;
  audioCodec: string;
  videoBitrate?: string;
  audioBitrate?: string;
  preset?: string;
  crf?: number; // Constant Rate Factor for quality
}

export const DEFAULT_CODEC_SETTINGS: Record<ExportQuality, ExportCodecSettings> = {
  low: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    videoBitrate: '2000k',
    audioBitrate: '128k',
    preset: 'veryfast',
    crf: 28
  },
  medium: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    videoBitrate: '5000k',
    audioBitrate: '192k',
    preset: 'medium',
    crf: 23
  },
  high: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    videoBitrate: '10000k',
    audioBitrate: '256k',
    preset: 'slow',
    crf: 18
  }
};

