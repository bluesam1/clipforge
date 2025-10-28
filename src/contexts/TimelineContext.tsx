import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import { 
  TimelineState, 
  PlayheadState, 
  TimelineConfig, 
  TimelineAction, 
  TimelineContextType,
  ClipPosition,
  DEFAULT_TIMELINE_CONFIG 
} from '../types/timeline';

// Storage keys for persistence
const STORAGE_KEYS = {
  TIMELINE_STATE: 'clipforge_timeline_state',
  PLAYHEAD_STATE: 'clipforge_playhead_state',
  TIMELINE_CONFIG: 'clipforge_timeline_config',
} as const;

// Load state from localStorage
function loadTimelineState(): TimelineState {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMELINE_STATE);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...initialTimelineState,
        ...parsed,
        // Ensure calculated values are correct
        pixelsPerSecond: (parsed.timelineWidth / Math.max(parsed.totalDuration, 1)) * parsed.zoomLevel,
      };
    }
  } catch (error) {
    console.warn('Failed to load timeline state from localStorage:', error);
  }
  return initialTimelineState;
}

function loadPlayheadState(): PlayheadState {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYHEAD_STATE);
    if (saved) {
      return { ...initialPlayheadState, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.warn('Failed to load playhead state from localStorage:', error);
  }
  return initialPlayheadState;
}

function loadTimelineConfig(): TimelineConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMELINE_CONFIG);
    if (saved) {
      return { ...DEFAULT_TIMELINE_CONFIG, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.warn('Failed to load timeline config from localStorage:', error);
  }
  return DEFAULT_TIMELINE_CONFIG;
}

// Initial timeline state
const initialTimelineState: TimelineState = {
  playheadPosition: 0,
  zoomLevel: DEFAULT_TIMELINE_CONFIG.defaultZoom,
  isPlaying: false,
  totalDuration: 0,
  timelineWidth: 800,
  pixelsPerSecond: 100, // Will be calculated based on zoom and width
  scrollPosition: 0,
};

// Initial playhead state
const initialPlayheadState: PlayheadState = {
  position: 0,
  isVisible: true,
  isDragging: false,
};

// Timeline reducer
function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case 'SET_PLAYHEAD_POSITION':
      return {
        ...state,
        playheadPosition: Math.max(0, Math.min(action.payload, state.totalDuration)),
      };
    
    case 'SET_ZOOM_LEVEL':
      const newZoom = Math.max(
        DEFAULT_TIMELINE_CONFIG.minZoom,
        Math.min(action.payload, DEFAULT_TIMELINE_CONFIG.maxZoom)
      );
      return {
        ...state,
        zoomLevel: newZoom,
        pixelsPerSecond: (state.timelineWidth / state.totalDuration) * newZoom,
      };
    
    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.payload,
      };
    
    case 'SET_TOTAL_DURATION':
      const newDuration = Math.max(0, action.payload);
      return {
        ...state,
        totalDuration: newDuration,
        pixelsPerSecond: (state.timelineWidth / newDuration) * state.zoomLevel,
        playheadPosition: Math.min(state.playheadPosition, newDuration),
      };
    
    case 'SET_TIMELINE_WIDTH':
      const newWidth = Math.max(100, action.payload);
      return {
        ...state,
        timelineWidth: newWidth,
        pixelsPerSecond: (newWidth / state.totalDuration) * state.zoomLevel,
      };
    
    case 'SET_SCROLL_POSITION':
      return {
        ...state,
        scrollPosition: Math.max(0, action.payload),
      };
    
    case 'RESET_TIMELINE':
      return {
        ...initialTimelineState,
        timelineWidth: state.timelineWidth, // Keep current width
      };
    
    case 'SET_CONFIG':
      // Handle config updates if needed
      return state;
    
    default:
      return state;
  }
}

// Create context
const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

// Provider component
interface TimelineProviderProps {
  children: ReactNode;
}

export function TimelineProvider({ children }: TimelineProviderProps) {
  const [state, dispatch] = useReducer(timelineReducer, loadTimelineState());
  const [playhead, setPlayhead] = React.useState<PlayheadState>(loadPlayheadState());
  const [config, setConfig] = React.useState<TimelineConfig>(loadTimelineConfig());

  // Action creators
  const setPlayheadPosition = useCallback((position: number) => {
    dispatch({ type: 'SET_PLAYHEAD_POSITION', payload: position });
    setPlayhead(prev => ({ ...prev, position }));
  }, []);

  const setZoomLevel = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: zoom });
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    dispatch({ type: 'SET_PLAYING', payload: playing });
  }, []);

  const setTotalDuration = useCallback((duration: number) => {
    dispatch({ type: 'SET_TOTAL_DURATION', payload: duration });
  }, []);

  const setTimelineWidth = useCallback((width: number) => {
    dispatch({ type: 'SET_TIMELINE_WIDTH', payload: width });
  }, []);

  const setScrollPosition = useCallback((position: number) => {
    dispatch({ type: 'SET_SCROLL_POSITION', payload: position });
  }, []);

  const updatePlayhead = useCallback((playheadUpdate: Partial<PlayheadState>) => {
    setPlayhead(prev => ({ ...prev, ...playheadUpdate }));
  }, []);

  const resetTimeline = useCallback(() => {
    dispatch({ type: 'RESET_TIMELINE' });
    setPlayhead(initialPlayheadState);
    setConfig(DEFAULT_TIMELINE_CONFIG);
  }, []);

  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TIMELINE_STATE);
      localStorage.removeItem(STORAGE_KEYS.PLAYHEAD_STATE);
      localStorage.removeItem(STORAGE_KEYS.TIMELINE_CONFIG);
      resetTimeline();
    } catch (error) {
      console.warn('Failed to clear persisted timeline state:', error);
    }
  }, [resetTimeline]);

  const updateConfig = useCallback((configUpdate: Partial<TimelineConfig>) => {
    setConfig(prev => ({ ...prev, ...configUpdate }));
  }, []);

  // Utility functions
  const timeToPixels = useCallback((time: number): number => {
    return time * state.pixelsPerSecond;
  }, [state.pixelsPerSecond]);

  const pixelsToTime = useCallback((pixels: number): number => {
    return pixels / state.pixelsPerSecond;
  }, [state.pixelsPerSecond]);

  const getVisibleTimeRange = useCallback(() => {
    const startTime = pixelsToTime(state.scrollPosition);
    const endTime = pixelsToTime(state.scrollPosition + state.timelineWidth);
    return { start: startTime, end: endTime };
  }, [state.scrollPosition, state.timelineWidth, pixelsToTime]);

  const getClipPosition = useCallback((
    clipId: string, 
    startTime: number, 
    duration: number
  ): ClipPosition => {
    const x = timeToPixels(startTime) - state.scrollPosition;
    const width = timeToPixels(duration);
    
    return {
      clipId,
      startTime,
      endTime: startTime + duration,
      duration,
      x,
      width,
      isSelected: false, // Will be determined by parent component
      isHovered: false, // Will be determined by parent component
    };
  }, [timeToPixels, state.scrollPosition]);

  // Persist timeline state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMELINE_STATE, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save timeline state to localStorage:', error);
    }
  }, [state]);

  // Persist playhead state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYHEAD_STATE, JSON.stringify(playhead));
    } catch (error) {
      console.warn('Failed to save playhead state to localStorage:', error);
    }
  }, [playhead]);

  // Persist timeline config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMELINE_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save timeline config to localStorage:', error);
    }
  }, [config]);

  const value: TimelineContextType = {
    state,
    playhead,
    config,
    dispatch,
    setPlayheadPosition,
    setZoomLevel,
    setPlaying,
    setTotalDuration,
    setTimelineWidth,
    setScrollPosition,
    updatePlayhead,
    resetTimeline,
    updateConfig,
    timeToPixels,
    pixelsToTime,
    getVisibleTimeRange,
    getClipPosition,
    clearPersistedState,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

// Hook to use the context
export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}
