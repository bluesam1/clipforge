import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { ProjectData, ProjectContextState, ProjectAction, DEFAULT_PROJECT_DATA } from '../types/project';
import { autoSaveManager, AutoSaveOptions } from '../utils/autoSave';

// Initial state
const initialState: ProjectContextState = {
  currentProject: null,
  isDirty: false,
  isSaving: false,
  isLoading: false,
  lastSaved: undefined,
  error: null,
};

// Reducer function
function projectReducer(state: ProjectContextState, action: ProjectAction): ProjectContextState {
  switch (action.type) {
    case 'SET_PROJECT':
      return {
        ...state,
        currentProject: action.payload,
        isDirty: false,
        error: null,
        lastSaved: new Date().toISOString(),
      };
    
    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload,
      };
    
    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isSaving: false,
        isLoading: false,
      };
    
    case 'UPDATE_PROJECT':
      if (!state.currentProject) return state;
      return {
        ...state,
        currentProject: { ...state.currentProject, ...action.payload },
        isDirty: true,
      };
    
    case 'CLEAR_PROJECT':
      return {
        ...state,
        currentProject: null,
        isDirty: false,
        isSaving: false,
        isLoading: false,
        lastSaved: undefined,
        error: null,
      };
    
    case 'SET_LAST_SAVED':
      return {
        ...state,
        lastSaved: action.payload,
        isDirty: false,
      };
    
    default:
      return state;
  }
}

// Context interface
interface ProjectContextType {
  state: ProjectContextState;
  // Project management
  createNewProject: (projectName?: string) => void;
  loadProject: (projectData: ProjectData) => void;
  clearProject: () => void;
  updateProject: (updates: Partial<ProjectData>) => void;
  // Save operations
  saveProject: () => Promise<boolean>;
  saveProjectAs: () => Promise<boolean>;
  // Auto-save
  enableAutoSave: (enabled: boolean) => void;
  updateAutoSaveInterval: (interval: number) => void;
  // Utility functions
  getProjectName: () => string;
  isProjectLoaded: () => boolean;
  hasUnsavedChanges: () => boolean;
}

// Create context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Provider component
interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Initialize auto-save manager
  useEffect(() => {
    const autoSaveOptions: AutoSaveOptions = {
      enabled: state.currentProject?.settings.autoSave ?? true,
      interval: (state.currentProject?.settings.autoSaveInterval ?? 30) * 1000, // Convert to milliseconds
      maxRetries: 3,
      onSave: async (projectData: ProjectData) => {
        try {
          dispatch({ type: 'SET_SAVING', payload: true });
          
          // Call IPC to save project
          const { ipcRenderer } = window.require('electron');
          const result = await ipcRenderer.invoke('project-save', {
            projectData,
            filePath: projectData.filePath || ''
          });
          
          if (result.success) {
            dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() });
            return true;
          } else {
            dispatch({ type: 'SET_ERROR', payload: result.message });
            return false;
          }
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Auto-save failed' });
          return false;
        } finally {
          dispatch({ type: 'SET_SAVING', payload: false });
        }
      },
      onError: (error: Error) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };

    autoSaveManager.updateOptions(autoSaveOptions);
    
    if (state.currentProject && state.isDirty) {
      autoSaveManager.start();
    } else {
      autoSaveManager.stop();
    }

    return () => {
      autoSaveManager.stop();
    };
  }, [state.currentProject, state.isDirty]);

  // Create new project
  const createNewProject = useCallback((projectName: string = 'Untitled Project') => {
    const newProject: ProjectData = {
      ...DEFAULT_PROJECT_DATA,
      projectName,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    dispatch({ type: 'SET_PROJECT', payload: newProject });
  }, []);

  // Load project
  const loadProject = useCallback((projectData: ProjectData) => {
    dispatch({ type: 'SET_PROJECT', payload: projectData });
  }, []);

  // Clear project
  const clearProject = useCallback(() => {
    autoSaveManager.stop();
    dispatch({ type: 'CLEAR_PROJECT' });
  }, []);

  // Update project
  const updateProject = useCallback((updates: Partial<ProjectData>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: updates });
  }, []);

  // Save project
  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!state.currentProject) {
      dispatch({ type: 'SET_ERROR', payload: 'No project loaded' });
      return false;
    }

    if (!state.currentProject.filePath) {
      // No file path, use save as
      return saveProjectAs();
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('project-save', {
        projectData: state.currentProject,
        filePath: state.currentProject.filePath
      });
      
      if (result.success) {
        dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.message });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Save failed' });
      return false;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.currentProject]);

  // Save project as
  const saveProjectAs = useCallback(async (): Promise<boolean> => {
    if (!state.currentProject) {
      dispatch({ type: 'SET_ERROR', payload: 'No project loaded' });
      return false;
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('project-save-as', state.currentProject);
      
      if (result.success) {
        // Update project with new file path
        dispatch({ type: 'UPDATE_PROJECT', payload: { filePath: result.filePath } });
        dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.message });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Save as failed' });
      return false;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.currentProject]);

  // Enable/disable auto-save
  const enableAutoSave = useCallback((enabled: boolean) => {
    if (state.currentProject) {
      updateProject({
        settings: {
          ...state.currentProject.settings,
          autoSave: enabled
        }
      });
    }
  }, [state.currentProject, updateProject]);

  // Update auto-save interval
  const updateAutoSaveInterval = useCallback((interval: number) => {
    if (state.currentProject) {
      updateProject({
        settings: {
          ...state.currentProject.settings,
          autoSaveInterval: interval
        }
      });
    }
  }, [state.currentProject, updateProject]);

  // Get project name
  const getProjectName = useCallback(() => {
    return state.currentProject?.projectName || 'Untitled Project';
  }, [state.currentProject]);

  // Check if project is loaded
  const isProjectLoaded = useCallback(() => {
    return state.currentProject !== null;
  }, [state.currentProject]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return state.isDirty;
  }, [state.isDirty]);

  const value: ProjectContextType = {
    state,
    createNewProject,
    loadProject,
    clearProject,
    updateProject,
    saveProject,
    saveProjectAs,
    enableAutoSave,
    updateAutoSaveInterval,
    getProjectName,
    isProjectLoaded,
    hasUnsavedChanges,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// Hook to use the context
export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
