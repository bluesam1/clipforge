// Project Types and Interfaces

import { VideoClip } from './ipc';
import { TimelineState } from './timeline';

// Project file format version
export const PROJECT_VERSION = '1.0.0';

// Project data structure
export interface ProjectData {
  version: string;
  createdAt: string; // ISO 8601 timestamp
  lastModified: string; // ISO 8601 timestamp
  projectName: string;
  filePath?: string; // Path to the .clipforge file
  clips: VideoClip[];
  timeline: TimelineState;
  settings: ProjectSettings;
}

// Project settings
export interface ProjectSettings {
  exportQuality: 'low' | 'medium' | 'high';
  outputFormat: 'mp4' | 'mov' | 'avi';
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  recentProjects: string[]; // Array of recent project file paths
}

// Project file validation result
export interface ProjectValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: ProjectData;
}

// Project save/load operations
export interface ProjectSaveRequest {
  projectData: ProjectData;
  filePath: string;
}

export interface ProjectSaveResponse {
  success: boolean;
  message: string;
  filePath?: string;
}

export interface ProjectLoadRequest {
  filePath: string;
}

export interface ProjectLoadResponse {
  success: boolean;
  message: string;
  projectData?: ProjectData;
}

// Project context state
export interface ProjectContextState {
  currentProject: ProjectData | null;
  isDirty: boolean; // Has unsaved changes
  isSaving: boolean;
  isLoading: boolean;
  lastSaved?: string; // ISO 8601 timestamp
  error: string | null;
}

// Project context actions
export type ProjectAction =
  | { type: 'SET_PROJECT'; payload: ProjectData }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_PROJECT'; payload: Partial<ProjectData> }
  | { type: 'CLEAR_PROJECT' }
  | { type: 'SET_LAST_SAVED'; payload: string };

// Default project settings
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  exportQuality: 'high',
  outputFormat: 'mp4',
  autoSave: true,
  autoSaveInterval: 30, // 30 seconds
  recentProjects: [],
};

// Default project data
export const DEFAULT_PROJECT_DATA: Omit<ProjectData, 'filePath'> = {
  version: PROJECT_VERSION,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  projectName: 'Untitled Project',
  clips: [],
  timeline: {
    playheadPosition: 0,
    zoomLevel: 1.0,
    isPlaying: false,
    totalDuration: 0,
    timelineWidth: 1200,
    pixelsPerSecond: 10,
    scrollPosition: 0,
  },
  settings: DEFAULT_PROJECT_SETTINGS,
};

// Project file extension
export const PROJECT_FILE_EXTENSION = '.clipforge';

// Maximum recent projects to keep
export const MAX_RECENT_PROJECTS = 10;
