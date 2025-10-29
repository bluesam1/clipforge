// Timeline Types and Interfaces

// Timeline state interface
export interface TimelineState {
  playheadPosition: number; // Current playhead position in seconds
  zoomLevel: number; // Zoom level (1.0 = normal, 2.0 = 2x zoom, etc.)
  isPlaying: boolean; // Whether video is currently playing
  totalDuration: number; // Total duration of all clips in seconds
  timelineWidth: number; // Width of timeline in pixels
  pixelsPerSecond: number; // How many pixels represent one second
  scrollPosition: number; // Horizontal scroll position in pixels
}

// Playhead state interface
export interface PlayheadState {
  position: number; // Position in seconds
  isVisible: boolean; // Whether playhead is visible
  isDragging: boolean; // Whether user is currently dragging playhead
}

// Trim state interface for drag operations
export interface TrimState {
  isDragging: boolean; // Whether user is currently dragging a trim handle
  dragHandle: 'start' | 'end' | null; // Which handle is being dragged
  dragStartPosition: number; // Initial position when drag started
  dragStartTime: number; // Initial time when drag started
  currentPosition: number; // Current mouse position during drag
  currentTime: number; // Current time during drag
  clipId: string | null; // ID of the clip being trimmed
  isValid: boolean; // Whether current trim position is valid
  constraintViolation: string | null; // Description of any constraint violation
}

// Trim handle props interface
export interface TrimHandleProps {
  type: 'start' | 'end';
  clipId: string;
  position: number; // Position in pixels
  isVisible: boolean;
  isDragging: boolean;
  onDragStart: (handleType: 'start' | 'end', clipId: string, startPosition: number) => void;
  onDragMove: (position: number) => void;
  onDragEnd: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// Clip position on timeline
export interface ClipPosition {
  clipId: string;
  startTime: number; // Start time in seconds
  endTime: number; // End time in seconds
  duration: number; // Duration in seconds
  x: number; // X position in pixels
  width: number; // Width in pixels
  isSelected: boolean; // Whether clip is selected
  isHovered: boolean; // Whether clip is hovered
}

// Timeline interaction events
export interface TimelineInteraction {
  type: 'click' | 'drag' | 'hover' | 'scroll' | 'zoom';
  position: number; // Position in seconds
  pixelX: number; // X position in pixels
  clipId?: string; // Associated clip ID if applicable
}

// Timeline configuration
export interface TimelineConfig {
  minZoom: number; // Minimum zoom level
  maxZoom: number; // Maximum zoom level
  defaultZoom: number; // Default zoom level
  snapToGrid: boolean; // Whether to snap to time grid
  gridInterval: number; // Grid interval in seconds
  playheadColor: string; // Color of playhead line
  clipHeight: number; // Height of clip blocks in pixels
  timelineHeight: number; // Height of timeline in pixels
}

// Default timeline configuration
export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  minZoom: 0.1,
  maxZoom: 10.0,
  defaultZoom: 1.0,
  snapToGrid: true,
  gridInterval: 1.0, // 1 second intervals
  playheadColor: '#ef4444', // Red color
  clipHeight: 60,
  timelineHeight: 120,
};

// Timeline action types
export type TimelineAction =
  | { type: 'SET_PLAYHEAD_POSITION'; payload: number }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_TOTAL_DURATION'; payload: number }
  | { type: 'SET_TIMELINE_WIDTH'; payload: number }
  | { type: 'SET_SCROLL_POSITION'; payload: number }
  | { type: 'UPDATE_PLAYHEAD'; payload: PlayheadState }
  | { type: 'RESET_TIMELINE' }
  | { type: 'SET_CONFIG'; payload: Partial<TimelineConfig> };

// Trim action types
export type TrimAction =
  | { type: 'START_DRAG'; payload: { handleType: 'start' | 'end'; clipId: string; startPosition: number; startTime: number } }
  | { type: 'UPDATE_DRAG'; payload: { position: number; time: number } }
  | { type: 'END_DRAG' }
  | { type: 'SET_VALIDITY'; payload: { isValid: boolean; violation: string | null } }
  | { type: 'RESET_TRIM' };

// Timeline context interface
export interface TimelineContextType {
  state: TimelineState;
  playhead: PlayheadState;
  config: TimelineConfig;
  dispatch: React.Dispatch<TimelineAction>;
  // Actions
  setPlayheadPosition: (position: number) => void;
  setZoomLevel: (zoom: number) => void;
  setPlaying: (playing: boolean) => void;
  setTotalDuration: (duration: number) => void;
  setTimelineWidth: (width: number) => void;
  setScrollPosition: (position: number) => void;
  updatePlayhead: (playhead: Partial<PlayheadState>) => void;
  resetTimeline: () => void;
  updateConfig: (config: Partial<TimelineConfig>) => void;
  clearPersistedState: () => void;
  // Utility functions
  timeToPixels: (time: number) => number;
  pixelsToTime: (pixels: number) => number;
  getVisibleTimeRange: () => { start: number; end: number };
  getClipPosition: (clipId: string, startTime: number, duration: number) => ClipPosition;
}
