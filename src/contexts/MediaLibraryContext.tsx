import React, { createContext, useContext, useReducer, ReactNode, useMemo, useCallback, useEffect, useRef } from 'react';
import { VideoClip } from '../types/ipc';
import { buildClipSequence, mapTimelineToClip, ClipSequence, TimelinePosition } from '../utils/timelineSequence';
import { useProject } from './ProjectContext';

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
  | { type: 'UPDATE_CLIP'; payload: VideoClip }
  | { type: 'UPDATE_CLIP_TRIM'; payload: { clipId: string; inPoint: number; outPoint: number } }
  | { type: 'LOAD_PROJECT_CLIPS'; payload: VideoClip[] };

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
    
    case 'UPDATE_CLIP_TRIM':
      return {
        ...state,
        clips: state.clips.map(clip => 
          clip.id === action.payload.clipId 
            ? { 
                ...clip, 
                inPoint: action.payload.inPoint, 
                outPoint: action.payload.outPoint 
              }
            : clip
        ),
      };
    
    case 'LOAD_PROJECT_CLIPS':
      return {
        ...state,
        clips: action.payload,
        isLoading: false,
        error: null,
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
  updateClipTrim: (clipId: string, inPoint: number, outPoint: number) => void;
  loadProjectClips: (clips: VideoClip[]) => void;
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
  const { state: projectState, updateProject } = useProject();
  const isUpdatingFromProject = useRef(false);

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
    console.log('[VIDEO_SYNC] MediaLibrary: setCurrentPlayingClip called', {
      newClipId: clipId,
      currentClipId: state.currentPlayingClipId,
      selectedClipId: state.selectedClipId
    });
    dispatch({ type: 'SET_CURRENT_PLAYING_CLIP', payload: clipId });
  };

  const clearClips = () => {
    dispatch({ type: 'CLEAR_CLIPS' });
  };

  const updateClip = (clip: VideoClip) => {
    dispatch({ type: 'UPDATE_CLIP', payload: clip });
  };

  const updateClipTrim = (clipId: string, inPoint: number, outPoint: number) => {
    dispatch({ type: 'UPDATE_CLIP_TRIM', payload: { clipId, inPoint, outPoint } });
  };

  const loadProjectClips = (clips: VideoClip[]) => {
    dispatch({ type: 'LOAD_PROJECT_CLIPS', payload: clips });
  };

  // Sync clips with project when project changes
  useEffect(() => {
    if (projectState.currentProject) {
      isUpdatingFromProject.current = true;
      loadProjectClips(projectState.currentProject.clips);
      // Reset the flag after a short delay to allow the state to update
      setTimeout(() => {
        isUpdatingFromProject.current = false;
      }, 0);
    } else {
      clearClips();
    }
  }, [projectState.currentProject]);

  // Update project when clips change (but not when updating from project)
  useEffect(() => {
    if (projectState.currentProject && !isUpdatingFromProject.current) {
      updateProject({ clips: state.clips });
    }
  }, [state.clips, projectState.currentProject, updateProject]);

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
    updateClipTrim,
    loadProjectClips,
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
