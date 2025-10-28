// Timeline calculation utilities

import { TimelineState, ClipPosition } from '../types/timeline';

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
