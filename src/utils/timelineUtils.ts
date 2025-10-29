// Timeline calculation utilities

import { TimelineState, ClipPosition } from '../types/timeline';
import { VideoClip } from '../types/ipc';

/**
 * Convert time in seconds to pixel position on timeline
 */
export function timeToPixels(time: number, pixelsPerSecond: number): number {
  return time * pixelsPerSecond;
}

/**
 * Convert pixel position to time in seconds on timeline
 */
export function pixelsToTime(pixels: number, pixelsPerSecond: number): number {
  return pixels / pixelsPerSecond;
}

/**
 * Calculate the visible time range based on scroll position and timeline width
 */
export function getVisibleTimeRange(
  scrollPosition: number,
  timelineWidth: number,
  pixelsPerSecond: number
): { start: number; end: number } {
  const startTime = pixelsToTime(scrollPosition, pixelsPerSecond);
  const endTime = pixelsToTime(scrollPosition + timelineWidth, pixelsPerSecond);
  return { start: startTime, end: endTime };
}

/**
 * Calculate clip position on timeline
 */
export function calculateClipPosition(
  clipId: string,
  startTime: number,
  duration: number,
  scrollPosition: number,
  pixelsPerSecond: number,
  isSelected: boolean = false,
  isHovered: boolean = false
): ClipPosition {
  const x = timeToPixels(startTime, pixelsPerSecond) - scrollPosition;
  const width = timeToPixels(duration, pixelsPerSecond);
  
  return {
    clipId,
    startTime,
    endTime: startTime + duration,
    duration,
    x,
    width,
    isSelected,
    isHovered,
  };
}

/**
 * Snap time to grid intervals
 */
export function snapToGrid(
  time: number, 
  gridInterval: number, 
  snapEnabled: boolean = true
): number {
  if (!snapEnabled) return time;
  
  return Math.round(time / gridInterval) * gridInterval;
}

/**
 * Calculate zoom level based on desired pixels per second
 */
export function calculateZoomLevel(
  desiredPixelsPerSecond: number,
  timelineWidth: number,
  totalDuration: number
): number {
  const basePixelsPerSecond = timelineWidth / totalDuration;
  return desiredPixelsPerSecond / basePixelsPerSecond;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Format time in MM:SS or HH:MM:SS format
 */
export function formatTime(seconds: number, showHours: boolean = false): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (showHours || hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate time markers for timeline
 */
export function generateTimeMarkers(
  startTime: number,
  endTime: number,
  interval: number
): Array<{ time: number; label: string; x: number }> {
  const markers = [];
  const start = Math.floor(startTime / interval) * interval;
  
  for (let time = start; time <= endTime; time += interval) {
    if (time >= startTime) {
      markers.push({
        time,
        label: formatTime(time),
        x: timeToPixels(time, 100), // Will be recalculated with actual pixelsPerSecond
      });
    }
  }
  
  return markers;
}

/**
 * Calculate optimal grid interval based on zoom level and timeline width
 */
export function calculateOptimalGridInterval(
  timelineWidth: number,
  pixelsPerSecond: number
): number {
  const totalDuration = timelineWidth / pixelsPerSecond;
  
  // Choose interval based on total duration
  if (totalDuration <= 60) return 1; // 1 second
  if (totalDuration <= 300) return 5; // 5 seconds
  if (totalDuration <= 600) return 10; // 10 seconds
  if (totalDuration <= 1800) return 30; // 30 seconds
  if (totalDuration <= 3600) return 60; // 1 minute
  return 300; // 5 minutes
}

/**
 * Check if a clip is visible in the current viewport
 */
export function isClipVisible(
  clipPosition: ClipPosition,
  timelineWidth: number
): boolean {
  return clipPosition.x + clipPosition.width > 0 && clipPosition.x < timelineWidth;
}

/**
 * Calculate the total duration of all clips
 */
export function calculateTotalDuration(clips: Array<{ duration: number }>): number {
  return clips.reduce((total, clip) => total + clip.duration, 0);
}

/**
 * Find the clip at a specific time position
 */
export function findClipAtTime(
  clips: Array<{ startTime: number; duration: number; id: string }>,
  time: number
): string | null {
  for (const clip of clips) {
    if (time >= clip.startTime && time <= clip.startTime + clip.duration) {
      return clip.id;
    }
  }
  return null;
}

/**
 * Calculate the next snap position for a given time
 */
export function getNextSnapPosition(
  time: number,
  gridInterval: number,
  snapEnabled: boolean = true
): number {
  if (!snapEnabled) return time;
  
  const currentSnap = snapToGrid(time, gridInterval, snapEnabled);
  const nextSnap = currentSnap + gridInterval;
  
  // Return the closer snap position
  return Math.abs(time - currentSnap) < Math.abs(time - nextSnap) 
    ? currentSnap 
    : nextSnap;
}

/**
 * Calculate trimmed duration from clip
 */
export function getTrimmedDuration(clip: VideoClip): number {
  return Math.max(0, clip.outPoint - clip.inPoint);
}

/**
 * Validate trim points for a clip
 */
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

/**
 * Calculate trim handle positions for a clip
 */
export function calculateTrimHandlePositions(
  clip: VideoClip,
  clipPosition: ClipPosition,
  pixelsPerSecond: number
): { startHandle: number; endHandle: number } {
  // Trim handles are at the edges of the visible (trimmed) clip
  // Start handle is at the left edge (position 0)
  // End handle is at the right edge (clipPosition.width)
  
  return {
    startHandle: 0,                  // Left edge of visible clip
    endHandle: clipPosition.width    // Right edge of visible clip
  };
}

/**
 * Convert trim handle position to time
 */
export function trimHandlePositionToTime(
  position: number,
  clipStartTime: number,
  pixelsPerSecond: number
): number {
  const relativeTime = pixelsToTime(position, pixelsPerSecond);
  return clipStartTime + relativeTime;
}

/**
 * Apply trim constraints to a time value
 */
export function applyTrimConstraints(
  time: number,
  clip: VideoClip,
  handleType: 'start' | 'end'
): { time: number; isValid: boolean; violation: string | null } {
  let constrainedTime = time;
  let violation: string | null = null;
  
  if (handleType === 'start') {
    // Start handle constraints: can't go below 0 or above (outPoint - 1)
    constrainedTime = Math.max(0, Math.min(constrainedTime, clip.outPoint - 1));
    if (constrainedTime >= clip.outPoint - 1) {
      violation = 'Start point must be at least 1 second before end point';
    }
  } else {
    // End handle constraints: can't go below (inPoint + 1) or above clip duration
    constrainedTime = Math.max(clip.inPoint + 1, Math.min(constrainedTime, clip.duration));
    if (constrainedTime <= clip.inPoint + 1) {
      violation = 'End point must be at least 1 second after start point';
    }
  }
  
  return {
    time: constrainedTime,
    isValid: violation === null,
    violation
  };
}
