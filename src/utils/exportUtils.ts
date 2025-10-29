// Export utility functions for FFmpeg video export

import type { 
  ExportOptions, 
  ExportResolution, 
  ExportCodecSettings,
  DEFAULT_CODEC_SETTINGS,
  RESOLUTION_DIMENSIONS,
  ResolutionDimensions 
} from '../types/export';

// Get codec settings based on quality
export function getCodecSettings(quality: 'low' | 'medium' | 'high'): ExportCodecSettings {
  const settings: Record<string, ExportCodecSettings> = {
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
  return settings[quality];
}

// Get resolution dimensions
export function getResolutionDimensions(resolution: ExportResolution): ResolutionDimensions | null {
  const dimensions: Record<ExportResolution, ResolutionDimensions | null> = {
    'source': null,
    '1080p': { width: 1920, height: 1080 },
    '720p': { width: 1280, height: 720 }
  };
  return dimensions[resolution];
}

// Calculate scaled dimensions maintaining aspect ratio
export function calculateScaledDimensions(
  sourceWidth: number,
  sourceHeight: number,
  targetResolution: ExportResolution
): { width: number; height: number } {
  const targetDimensions = getResolutionDimensions(targetResolution);
  
  // If source resolution, return original dimensions
  if (!targetDimensions) {
    return { width: sourceWidth, height: sourceHeight };
  }
  
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetDimensions.width / targetDimensions.height;
  
  let width = targetDimensions.width;
  let height = targetDimensions.height;
  
  // Maintain aspect ratio by fitting within target dimensions
  if (sourceAspect > targetAspect) {
    // Source is wider, fit to width
    height = Math.round(width / sourceAspect);
  } else {
    // Source is taller, fit to height
    width = Math.round(height * sourceAspect);
  }
  
  // Ensure dimensions are even (required for H.264)
  width = width % 2 === 0 ? width : width - 1;
  height = height % 2 === 0 ? height : height - 1;
  
  return { width, height };
}

// Parse FFmpeg progress output
export function parseFFmpegProgress(progressLine: string): {
  percent?: number;
  currentTime?: number;
  fps?: number;
  speed?: string;
} | null {
  try {
    const result: {
      percent?: number;
      currentTime?: number;
      fps?: number;
      speed?: string;
    } = {};
    
    // Extract time (format: time=00:00:10.50)
    const timeMatch = progressLine.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseFloat(timeMatch[3]);
      result.currentTime = hours * 3600 + minutes * 60 + seconds;
    }
    
    // Extract FPS (format: fps=30)
    const fpsMatch = progressLine.match(/fps=\s*(\d+)/);
    if (fpsMatch) {
      result.fps = parseInt(fpsMatch[1], 10);
    }
    
    // Extract speed (format: speed=2.5x)
    const speedMatch = progressLine.match(/speed=\s*(\d+\.?\d*)x/);
    if (speedMatch) {
      result.speed = `${speedMatch[1]}x`;
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Error parsing FFmpeg progress:', error);
    return null;
  }
}

// Calculate export progress percentage
export function calculateExportProgress(currentTime: number, totalDuration: number): number {
  if (totalDuration <= 0) return 0;
  const percent = (currentTime / totalDuration) * 100;
  return Math.min(Math.max(percent, 0), 100);
}

// Estimate remaining time
export function estimateRemainingTime(
  currentTime: number,
  totalDuration: number,
  elapsedSeconds: number
): number {
  if (currentTime <= 0 || elapsedSeconds <= 0) return 0;
  
  const progress = currentTime / totalDuration;
  if (progress <= 0) return 0;
  
  const estimatedTotal = elapsedSeconds / progress;
  const remaining = estimatedTotal - elapsedSeconds;
  
  return Math.max(remaining, 0);
}

// Validate export file exists and is playable
export function validateExportFile(filePath: string, minSizeBytes: number = 1024): boolean {
  try {
    const fs = require('fs');
    const stats = fs.statSync(filePath);
    
    // Check file exists and has minimum size
    if (!stats.isFile() || stats.size < minSizeBytes) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating export file:', error);
    return false;
  }
}

// Format time for display (HH:MM:SS)
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Generate default export filename
export function generateExportFilename(projectName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${projectName}-${timestamp}.mp4`;
}

// Sanitize filename for file system
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
}

