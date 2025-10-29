// Video utility functions for RENDERER PROCESS
// This file contains only browser-safe utilities
// Main process utilities (with ffmpeg) are in main.ts

import { VideoClip } from '../types/ipc';

// Calculate trimmed duration from clip
export function getTrimmedDuration(clip: VideoClip): number {
  return Math.max(0, clip.outPoint - clip.inPoint);
}

// Validate trim points
export function validateTrimPoints(clip: VideoClip): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (clip.inPoint < 0) {
    errors.push('inPoint cannot be negative');
  }
  
  if (clip.outPoint <= clip.inPoint) {
    errors.push('outPoint must be greater than inPoint');
  }
  
  if (clip.outPoint > clip.duration) {
    errors.push('outPoint cannot exceed original duration');
  }
  
  const trimmedDuration = getTrimmedDuration(clip);
  if (trimmedDuration < 1) {
    errors.push('Trimmed duration must be at least 1 second');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Supported video formats
export const SUPPORTED_FORMATS = ['.mp4', '.mov', '.MP4', '.MOV'];

// Export validation functions
export function validateExportReadiness(clips: VideoClip[]): { canExport: boolean; message: string } {
  if (!clips || clips.length === 0) {
    return {
      canExport: false,
      message: 'No clips to export. Please import at least one video.'
    };
  }
  
  // Check if all clips have valid trim points
  for (const clip of clips) {
    const validation = validateTrimPoints(clip);
    if (!validation.isValid) {
      return {
        canExport: false,
        message: `Invalid clip "${clip.fileName}": ${validation.errors.join(', ')}`
      };
    }
  }
  
  return {
    canExport: true,
    message: 'Ready to export'
  };
}

// Calculate total export duration
export function calculateTotalExportDuration(clips: VideoClip[]): number {
  return clips.reduce((total, clip) => total + getTrimmedDuration(clip), 0);
}