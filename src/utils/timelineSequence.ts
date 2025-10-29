// Timeline Sequence Utilities
// Provides functions for mapping timeline time to clip positions and managing clip sequences

import { VideoClip } from '../types/ipc';
import { getTrimmedDuration } from './videoUtils';

// Timeline position interface
export interface TimelinePosition {
  clipId: string | null;
  localTime: number; // Time within the clip (0 to clip.duration)
  timelineTime: number; // Global timeline time
  isInGap: boolean; // Whether position is in a gap between clips
}

// Clip sequence item interface
export interface ClipSequenceItem {
  clip: VideoClip;
  startTime: number; // When this clip starts on the timeline
  endTime: number; // When this clip ends on the timeline
  index: number; // Order in the sequence
}

// Gap information interface
export interface GapInfo {
  startTime: number;
  endTime: number;
  duration: number;
  beforeClipId: string | null;
  afterClipId: string | null;
}

// Complete clip sequence interface
export interface ClipSequence {
  items: ClipSequenceItem[];
  gaps: GapInfo[];
  totalDuration: number;
  isEmpty: boolean;
}

/**
 * Builds a clip sequence from an array of video clips
 * Clips are ordered by their creation time (import order)
 */
export function buildClipSequence(clips: VideoClip[]): ClipSequence {
  if (clips.length === 0) {
    return {
      items: [],
      gaps: [],
      totalDuration: 0,
      isEmpty: true,
    };
  }

  // Sort clips by creation time to maintain import order
  const sortedClips = [...clips].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  const items: ClipSequenceItem[] = [];
  const gaps: GapInfo[] = [];
  let currentTime = 0;

  // Build sequence items
  sortedClips.forEach((clip, index) => {
    const startTime = currentTime;
    // Use trimmed duration for sequence building
    const trimmedDuration = getTrimmedDuration(clip);
    const endTime = currentTime + trimmedDuration;
    
    items.push({
      clip,
      startTime,
      endTime,
      index,
    });
    
    currentTime = endTime;
  });

  // Detect gaps (currently no gaps since clips are placed sequentially)
  // This is a placeholder for future gap detection logic
  // Gaps would be detected if clips have custom start times or if there are intentional gaps

  return {
    items,
    gaps,
    totalDuration: currentTime,
    isEmpty: false,
  };
}

/**
 * Maps timeline time to clip position and local time
 */
export function mapTimelineToClip(
  timelineTime: number,
  sequence: ClipSequence
): TimelinePosition {
  if (sequence.isEmpty || timelineTime < 0) {
    return {
      clipId: null,
      localTime: 0,
      timelineTime,
      isInGap: true,
    };
  }

  // Check if time is beyond the sequence
  if (timelineTime >= sequence.totalDuration) {
    const lastItem = sequence.items[sequence.items.length - 1];
    return {
      clipId: lastItem?.clip.id || null,
      localTime: lastItem?.clip.duration || 0,
      timelineTime,
      isInGap: false,
    };
  }

  // Find the clip that contains this timeline time
  for (const item of sequence.items) {
    if (timelineTime >= item.startTime && timelineTime < item.endTime) {
      const localTime = timelineTime - item.startTime;
      return {
        clipId: item.clip.id,
        localTime,
        timelineTime,
        isInGap: false,
      };
    }
  }

  // Check if time is in a gap
  for (const gap of sequence.gaps) {
    if (timelineTime >= gap.startTime && timelineTime < gap.endTime) {
      return {
        clipId: null,
        localTime: 0,
        timelineTime,
        isInGap: true,
      };
    }
  }

  // Fallback - should not reach here
  return {
    clipId: null,
    localTime: 0,
    timelineTime,
    isInGap: true,
  };
}

/**
 * Maps clip ID and local time to timeline time
 */
export function mapClipToTimeline(
  clipId: string,
  localTime: number,
  sequence: ClipSequence
): TimelinePosition {
  if (sequence.isEmpty) {
    return {
      clipId: null,
      localTime: 0,
      timelineTime: 0,
      isInGap: true,
    };
  }

  // Find the clip in the sequence
  const item = sequence.items.find(item => item.clip.id === clipId);
  if (!item) {
    return {
      clipId: null,
      localTime: 0,
      timelineTime: 0,
      isInGap: true,
    };
  }

  // Clamp local time to clip duration
  const clampedLocalTime = Math.max(0, Math.min(localTime, item.clip.duration));
  const timelineTime = item.startTime + clampedLocalTime;

  return {
    clipId,
    localTime: clampedLocalTime,
    timelineTime,
    isInGap: false,
  };
}

/**
 * Finds the clip at a specific timeline time
 */
export function findClipAtTime(
  timelineTime: number,
  sequence: ClipSequence
): ClipSequenceItem | null {
  if (sequence.isEmpty) {
    return null;
  }

  for (const item of sequence.items) {
    if (timelineTime >= item.startTime && timelineTime < item.endTime) {
      return item;
    }
  }

  return null;
}

/**
 * Calculates the start time of a specific clip on the timeline
 */
export function calculateClipStartTime(
  clipId: string,
  sequence: ClipSequence
): number {
  if (sequence.isEmpty) {
    return 0;
  }

  const item = sequence.items.find(item => item.clip.id === clipId);
  return item?.startTime || 0;
}

/**
 * Gets the next clip in the sequence
 */
export function getNextClip(
  currentClipId: string | null,
  sequence: ClipSequence
): ClipSequenceItem | null {
  if (sequence.isEmpty) {
    return null;
  }

  if (!currentClipId) {
    return sequence.items[0] || null;
  }

  const currentIndex = sequence.items.findIndex(item => item.clip.id === currentClipId);
  if (currentIndex === -1 || currentIndex >= sequence.items.length - 1) {
    return null;
  }

  return sequence.items[currentIndex + 1];
}

/**
 * Gets the previous clip in the sequence
 */
export function getPreviousClip(
  currentClipId: string | null,
  sequence: ClipSequence
): ClipSequenceItem | null {
  if (sequence.isEmpty) {
    return null;
  }

  if (!currentClipId) {
    return sequence.items[sequence.items.length - 1] || null;
  }

  const currentIndex = sequence.items.findIndex(item => item.clip.id === currentClipId);
  if (currentIndex <= 0) {
    return null;
  }

  return sequence.items[currentIndex - 1];
}

/**
 * Checks if a timeline time is in a gap between clips
 */
export function isInGap(timelineTime: number, sequence: ClipSequence): boolean {
  if (sequence.isEmpty) {
    return true;
  }

  // Check if time is in any gap
  for (const gap of sequence.gaps) {
    if (timelineTime >= gap.startTime && timelineTime < gap.endTime) {
      return true;
    }
  }

  // Check if time is before first clip or after last clip
  if (sequence.items.length === 0) {
    return true;
  }

  const firstClip = sequence.items[0];
  const lastClip = sequence.items[sequence.items.length - 1];

  return timelineTime < firstClip.startTime || timelineTime >= lastClip.endTime;
}

/**
 * Gets the total duration of all clips in the sequence
 */
export function getSequenceDuration(sequence: ClipSequence): number {
  return sequence.totalDuration;
}

/**
 * Gets the number of clips in the sequence
 */
export function getSequenceLength(sequence: ClipSequence): number {
  return sequence.items.length;
}

/**
 * Validates a clip sequence for consistency
 */
export function validateSequence(sequence: ClipSequence): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (sequence.isEmpty) {
    return { isValid: true, errors: [] };
  }

  // Check for overlapping clips
  for (let i = 0; i < sequence.items.length - 1; i++) {
    const current = sequence.items[i];
    const next = sequence.items[i + 1];
    
    if (current.endTime > next.startTime) {
      errors.push(`Clips ${current.clip.id} and ${next.clip.id} overlap`);
    }
  }

  // Check for negative durations
  for (const item of sequence.items) {
    if (item.clip.duration <= 0) {
      errors.push(`Clip ${item.clip.id} has invalid duration: ${item.clip.duration}`);
    }
  }

  // Check for invalid start times
  for (const item of sequence.items) {
    if (item.startTime < 0) {
      errors.push(`Clip ${item.clip.id} has negative start time: ${item.startTime}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

