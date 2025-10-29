import React, { createContext, useContext, useReducer, ReactNode, useMemo, useCallback } from 'react';
import { VideoClip } from '../types/ipc';
import { buildClipSequence, mapTimelineToClip, ClipSequence, TimelinePosition } from '../utils/timelineSequence';

// State interface
interface MediaLibraryState {
  clips: VideoClip[];
  isLoading: boolean;
  error: string | null;
  selectedClipId: string | null;
  currentPlayingClipId: string | null;
}

// Action types
type MediaLibraryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_CLIP'; payload: VideoClip }
  | { type: 'ADD_CLIPS'; payload: VideoClip[] }
  | { type: 'REMOVE_CLIP'; payload: string }
  | { type: 'SELECT_CLIP'; payload: string | null }
  | { type: 'SET_CURRENT_PLAYING_CLIP'; payload: string | null }
  | { type: 'CLEAR_CLIPS' }
  | { type: 'UPDATE_CLIP'; payload: VideoClip };

// Initial state
const initialState: MediaLibraryState = {
  clips: [],
  isLoading: false,
  error: null,
  selectedClipId: null,
  currentPlayingClipId: null,
};

// Reducer function
function mediaLibraryReducer(state: MediaLibraryState, action: MediaLibraryAction): MediaLibraryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'ADD_CLIP':
      return {
        ...state,
        clips: [...state.clips, action.payload],
        isLoading: false,
        error: null,
      };
    
    case 'ADD_CLIPS':
      return {
        ...state,
        clips: [...state.clips, ...action.payload],
        isLoading: false,
        error: null,
      };
    
    case 'REMOVE_CLIP':
      return {
        ...state,
        clips: state.clips.filter(clip => clip.id !== action.payload),
        selectedClipId: state.selectedClipId === action.payload ? null : state.selectedClipId,
      };
    
    case 'SELECT_CLIP':
      return {
        ...state,
        selectedClipId: action.payload,
      };
    
    case 'SET_CURRENT_PLAYING_CLIP':
      return {
        ...state,
        currentPlayingClipId: action.payload,
      };
    
    case 'CLEAR_CLIPS':
      return {
        ...state,
        clips: [],
        selectedClipId: null,
        currentPlayingClipId: null,
        error: null,
      };
    
    case 'UPDATE_CLIP':
      return {
        ...state,
        clips: state.clips.map(clip => 
          clip.id === action.payload.id ? action.payload : clip
        ),
      };
    
    default:
      return state;
  }
}

// Context interface
interface MediaLibraryContextType {
  state: MediaLibraryState;
  addClip: (clip: VideoClip) => void;
  addClips: (clips: VideoClip[]) => void;
  removeClip: (clipId: string) => void;
  selectClip: (clipId: string | null) => void;
  setCurrentPlayingClip: (clipId: string | null) => void;
  clearClips: () => void;
  updateClip: (clip: VideoClip) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getClipById: (clipId: string) => VideoClip | undefined;
  getAllClips: () => VideoClip[];
  getSelectedClip: () => VideoClip | undefined;
  getCurrentPlayingClip: () => VideoClip | undefined;
  // Timeline sequence methods
  getClipSequence: () => ClipSequence;
  getClipAtTime: (timelineTime: number) => TimelinePosition;
  getTimelinePosition: (clipId: string, localTime: number) => TimelinePosition;
}

// Create context
const MediaLibraryContext = createContext<MediaLibraryContextType | undefined>(undefined);

// Provider component
interface MediaLibraryProviderProps {
  children: ReactNode;
}

export function MediaLibraryProvider({ children }: MediaLibraryProviderProps) {
  const [state, dispatch] = useReducer(mediaLibraryReducer, initialState);

  // Action creators
  const addClip = (clip: VideoClip) => {
    dispatch({ type: 'ADD_CLIP', payload: clip });
  };

  const addClips = (clips: VideoClip[]) => {
    dispatch({ type: 'ADD_CLIPS', payload: clips });
  };

  const removeClip = (clipId: string) => {
    dispatch({ type: 'REMOVE_CLIP', payload: clipId });
  };

  const selectClip = (clipId: string | null) => {
    dispatch({ type: 'SELECT_CLIP', payload: clipId });
  };

  const setCurrentPlayingClip = (clipId: string | null) => {
    dispatch({ type: 'SET_CURRENT_PLAYING_CLIP', payload: clipId });
  };

  const clearClips = () => {
    dispatch({ type: 'CLEAR_CLIPS' });
  };

  const updateClip = (clip: VideoClip) => {
    dispatch({ type: 'UPDATE_CLIP', payload: clip });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  // Utility functions
  const getClipById = (clipId: string): VideoClip | undefined => {
    return state.clips.find(clip => clip.id === clipId);
  };

  const getAllClips = (): VideoClip[] => {
    return state.clips;
  };

  const getSelectedClip = (): VideoClip | undefined => {
    if (!state.selectedClipId) return undefined;
    return getClipById(state.selectedClipId);
  };

  const getCurrentPlayingClip = (): VideoClip | undefined => {
    if (!state.currentPlayingClipId) return undefined;
    return getClipById(state.currentPlayingClipId);
  };

  // Timeline sequence methods
  const getClipSequence = useCallback((): ClipSequence => {
    return buildClipSequence(state.clips);
  }, [state.clips]);

  const getClipAtTime = useCallback((timelineTime: number): TimelinePosition => {
    return mapTimelineToClip(timelineTime, getClipSequence());
  }, [getClipSequence]);

  const getTimelinePosition = useCallback((clipId: string, localTime: number): TimelinePosition => {
    return mapClipToTimeline(clipId, localTime, getClipSequence());
  }, [getClipSequence]);

  const value: MediaLibraryContextType = {
    state,
    addClip,
    addClips,
    removeClip,
    selectClip,
    setCurrentPlayingClip,
    clearClips,
    updateClip,
    setLoading,
    setError,
    getClipById,
    getAllClips,
    getSelectedClip,
    getCurrentPlayingClip,
    getClipSequence,
    getClipAtTime,
    getTimelinePosition,
  };

  return (
    <MediaLibraryContext.Provider value={value}>
      {children}
    </MediaLibraryContext.Provider>
  );
}

// Hook to use the context
export function useMediaLibrary() {
  const context = useContext(MediaLibraryContext);
  if (context === undefined) {
    throw new Error('useMediaLibrary must be used within a MediaLibraryProvider');
  }
  return context;
}
