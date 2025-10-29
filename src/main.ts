import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import started from 'electron-squirrel-startup';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { BatchImportResult, VideoMetadata, VideoClip } from './types/ipc';
import { 
  ProjectData, 
  ProjectSaveRequest, 
  ProjectSaveResponse, 
  ProjectLoadRequest, 
  ProjectLoadResponse,
  ProjectValidationResult,
  PROJECT_FILE_EXTENSION,
  MAX_RECENT_PROJECTS
} from './types/project';

// Vite environment variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Set up FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// ==================== VIDEO UTILITY FUNCTIONS (MAIN PROCESS ONLY) ====================

// Supported video formats
const SUPPORTED_FORMATS = ['.mp4', '.mov', '.MP4', '.MOV'];

// Video file validation
function isValidVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return SUPPORTED_FORMATS.includes(ext);
}

// Extract video metadata using FFmpeg
function extractVideoMetadata(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    console.log('Extracting metadata for:', filePath);
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('FFmpeg error:', err);
        reject(new Error(`Failed to extract metadata: ${err.message}`));
        return;
      }

      try {
        console.log('FFmpeg metadata:', JSON.stringify(metadata, null, 2));
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (!videoStream) {
          console.error('No video stream found');
          reject(new Error('No video stream found in file'));
          return;
        }

        const duration = metadata.format.duration || 0;
        const width = videoStream.width || 0;
        const height = videoStream.height || 0;
        // Parse FPS from format like "30/1" or "29.97/1"
        const fpsString = videoStream.r_frame_rate || '0';
        const fps = fpsString.includes('/') 
          ? parseFloat(fpsString.split('/')[0]) / parseFloat(fpsString.split('/')[1])
          : parseFloat(fpsString);
        const codec = videoStream.codec_name || 'unknown';

        const result = {
          duration,
          width,
          height,
          fps,
          codec,
          fileSize: parseInt(String(metadata.format.size || '0'), 10)
        };
        
        console.log('Extracted metadata:', result);
        resolve(result);
      } catch (error) {
        console.error('Metadata parsing error:', error);
        reject(new Error(`Failed to parse metadata: ${error}`));
      }
    });
  });
}

// Generate unique clip ID
function generateClipId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create video clip from file path and metadata
async function createVideoClip(filePath: string, metadata: VideoMetadata): Promise<VideoClip> {
  const fileName = path.basename(filePath);
  const id = generateClipId();
  
  return {
    id,
    filePath,
    fileName,
    duration: metadata.duration,
    inPoint: 0, // Default trim start point
    outPoint: metadata.duration, // Default trim end point (full duration)
    width: metadata.width,
    height: metadata.height,
    fps: metadata.fps,
    codec: metadata.codec,
    fileSize: metadata.fileSize,
    createdAt: new Date()
  };
}

// Validate video file and extract metadata
async function processVideoFile(filePath: string): Promise<VideoClip> {
  // Validate file format
  if (!isValidVideoFile(filePath)) {
    throw new Error(`Unsupported video format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
  }

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Extract metadata
  const metadata = await extractVideoMetadata(filePath);
  
  // Create video clip
  return createVideoClip(filePath, metadata);
}

// Process multiple video files
async function processVideoFiles(filePaths: string[]): Promise<{ clips: VideoClip[]; errors: string[] }> {
  console.log('Processing video files:', filePaths);
  const clips: VideoClip[] = [];
  const errors: string[] = [];

  for (const filePath of filePaths) {
    try {
      console.log('Processing file:', filePath);
      const clip = await processVideoFile(filePath);
      console.log('Successfully processed:', clip.fileName);
      clips.push(clip);
    } catch (error) {
      console.error('Error processing file:', filePath, error);
      errors.push(`${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('Final result:', { clips: clips.length, errors: errors.length });
  return { clips, errors };
}

// ==================== END VIDEO UTILITIES ====================

// Project file validation
function validateProjectData(data: any): ProjectValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!data.version || typeof data.version !== 'string') {
    errors.push('Missing or invalid version field');
  }
  if (!data.createdAt || typeof data.createdAt !== 'string') {
    errors.push('Missing or invalid createdAt field');
  }
  if (!data.lastModified || typeof data.lastModified !== 'string') {
    errors.push('Missing or invalid lastModified field');
  }
  if (!data.projectName || typeof data.projectName !== 'string') {
    errors.push('Missing or invalid projectName field');
  }
  if (!Array.isArray(data.clips)) {
    errors.push('Missing or invalid clips array');
  }
  if (!data.timeline || typeof data.timeline !== 'object') {
    errors.push('Missing or invalid timeline object');
  }
  if (!data.settings || typeof data.settings !== 'object') {
    errors.push('Missing or invalid settings object');
  }

  // Validate timestamps
  if (data.createdAt && isNaN(Date.parse(data.createdAt))) {
    errors.push('Invalid createdAt timestamp format');
  }
  if (data.lastModified && isNaN(Date.parse(data.lastModified))) {
    errors.push('Invalid lastModified timestamp format');
  }

  // Validate clips
  if (Array.isArray(data.clips)) {
    data.clips.forEach((clip: any, index: number) => {
      if (!clip.id || typeof clip.id !== 'string') {
        errors.push(`Clip ${index}: Missing or invalid id field`);
      }
      if (!clip.filePath || typeof clip.filePath !== 'string') {
        errors.push(`Clip ${index}: Missing or invalid filePath field`);
      }
      if (typeof clip.duration !== 'number' || clip.duration <= 0) {
        errors.push(`Clip ${index}: Invalid duration`);
      }
      if (typeof clip.inPoint !== 'number' || clip.inPoint < 0) {
        errors.push(`Clip ${index}: Invalid inPoint`);
      }
      if (typeof clip.outPoint !== 'number' || clip.outPoint <= clip.inPoint) {
        errors.push(`Clip ${index}: Invalid outPoint`);
      }
      if (clip.outPoint > clip.duration) {
        errors.push(`Clip ${index}: outPoint exceeds duration`);
      }
    });
  }

  // Validate timeline
  if (data.timeline) {
    if (typeof data.timeline.playheadPosition !== 'number' || data.timeline.playheadPosition < 0) {
      errors.push('Invalid timeline playheadPosition');
    }
    if (typeof data.timeline.zoomLevel !== 'number' || data.timeline.zoomLevel <= 0) {
      errors.push('Invalid timeline zoomLevel');
    }
    if (typeof data.timeline.totalDuration !== 'number' || data.timeline.totalDuration < 0) {
      errors.push('Invalid timeline totalDuration');
    }
  }

  // Validate settings
  if (data.settings) {
    if (data.settings.autoSaveInterval && (typeof data.settings.autoSaveInterval !== 'number' || data.settings.autoSaveInterval <= 0)) {
      errors.push('Invalid autoSaveInterval');
    }
    if (data.settings.recentProjects && (!Array.isArray(data.settings.recentProjects) || data.settings.recentProjects.length > MAX_RECENT_PROJECTS)) {
      warnings.push('Invalid or excessive recentProjects array');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? data as ProjectData : undefined
  };
}

// Project save function
async function saveProject(projectData: ProjectData, filePath: string): Promise<ProjectSaveResponse> {
  try {
    // Validate project data
    const validation = validateProjectData(projectData);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Project validation failed: ${validation.errors.join(', ')}`
      };
    }

    // Update lastModified timestamp
    const updatedProject: ProjectData = {
      ...projectData,
      lastModified: new Date().toISOString(),
      filePath: filePath
    };

    // Ensure file has .clipforge extension
    const finalPath = filePath.endsWith(PROJECT_FILE_EXTENSION) ? filePath : `${filePath}${PROJECT_FILE_EXTENSION}`;

    // Write project file
    const projectJson = JSON.stringify(updatedProject, null, 2);
    await fs.writeFile(finalPath, projectJson, 'utf8');

    console.log(`Project saved successfully: ${finalPath}`);
    return {
      success: true,
      message: 'Project saved successfully',
      filePath: finalPath
    };
  } catch (error) {
    console.error('Project save error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred while saving project'
    };
  }
}

// Project load function
async function loadProject(filePath: string): Promise<ProjectLoadResponse> {
  try {
    // Check if file exists
    await fs.access(filePath);
    
    // Read project file
    const projectJson = await fs.readFile(filePath, 'utf8');
    const projectData = JSON.parse(projectJson);

    // Validate project data
    const validation = validateProjectData(projectData);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Project validation failed: ${validation.errors.join(', ')}`
      };
    }

    // Update filePath in loaded data
    const updatedProject: ProjectData = {
      ...validation.data!,
      filePath: filePath
    };

    console.log(`Project loaded successfully: ${filePath}`);
    return {
      success: true,
      message: 'Project loaded successfully',
      projectData: updatedProject
    };
  } catch (error) {
    console.error('Project load error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred while loading project'
    };
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow local file access for video preview
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools only in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Set CSP headers for security
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data: blob: file:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob: file:; " +
          "media-src 'self' data: blob: file:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' ws: wss:;"
        ]
      }
    });
  });
};

// IPC Handlers
ipcMain.handle('ping', () => {
  return 'pong';
});

// Video import handlers
ipcMain.handle('video-import-picker', async (): Promise<BatchImportResult> => {
  try {
    console.log('Video import picker called');
    const result = await dialog.showOpenDialog({
      title: 'Select Video Files',
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mov'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    });

    console.log('Dialog result:', result);

    if (result.canceled || result.filePaths.length === 0) {
      console.log('No files selected or dialog canceled');
      return { 
        success: false, 
        clips: [], 
        errors: ['No files selected'], 
        totalProcessed: 0 
      };
    }

    console.log('Processing files:', result.filePaths);
    const { clips, errors } = await processVideoFiles(result.filePaths);
    console.log('Processing result:', { clips: clips.length, errors });
    
    return {
      success: clips.length > 0,
      clips,
      errors,
      totalProcessed: result.filePaths.length
    };
  } catch (error) {
    console.error('Video import error:', error);
    return {
      success: false,
      clips: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      totalProcessed: 0
    };
  }
});

ipcMain.handle('video-import-dragdrop', async (event, filePaths: string[]): Promise<BatchImportResult> => {
  try {
    const { clips, errors } = await processVideoFiles(filePaths);
    
    return {
      success: clips.length > 0,
      clips,
      errors,
      totalProcessed: filePaths.length
    };
  } catch (error) {
    console.error('Batch video import error:', error);
    return {
      success: false,
      clips: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      totalProcessed: 0
    };
  }
});

ipcMain.handle('video-get-metadata', async (event, filePath: string): Promise<VideoMetadata> => {
  try {
    const clip = await processVideoFile(filePath);
    return {
      duration: clip.duration,
      width: clip.width,
      height: clip.height,
      fps: clip.fps,
      codec: clip.codec,
      fileSize: clip.fileSize
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get metadata');
  }
});

// Legacy IPC handlers for video features
ipcMain.handle('import-video', async (event, filePath: string) => {
  // TODO: Implement video import logic
  console.log('Import video request:', filePath);
  return { success: true, message: 'Video import not yet implemented' };
});

ipcMain.handle('export-video', async (event, data: unknown) => {
  // TODO: Implement video export logic
  console.log('Export video request:', data);
  return { success: true, message: 'Video export not yet implemented' };
});

ipcMain.handle('export-progress', () => {
  // TODO: Return actual export progress
  return { progress: 0, status: 'idle' };
});

// Project save handler
ipcMain.handle('project-save', async (event, request: ProjectSaveRequest): Promise<ProjectSaveResponse> => {
  try {
    console.log('Project save request:', request.filePath);
    return await saveProject(request.projectData, request.filePath);
  } catch (error) {
    console.error('Project save IPC error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Project save as handler
ipcMain.handle('project-save-as', async (event, projectData: ProjectData): Promise<ProjectSaveResponse> => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Save Project As',
      defaultPath: `${projectData.projectName}${PROJECT_FILE_EXTENSION}`,
      filters: [
        { name: 'ClipForge Projects', extensions: ['clipforge'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return {
        success: false,
        message: 'Save operation canceled'
      };
    }

    console.log('Project save as request:', result.filePath);
    return await saveProject(projectData, result.filePath);
  } catch (error) {
    console.error('Project save as IPC error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Project load handler
ipcMain.handle('project-load', async (event, request: ProjectLoadRequest): Promise<ProjectLoadResponse> => {
  try {
    console.log('Project load request:', request.filePath);
    return await loadProject(request.filePath);
  } catch (error) {
    console.error('Project load IPC error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Project open handler
ipcMain.handle('project-open', async (): Promise<ProjectLoadResponse> => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Open Project',
      filters: [
        { name: 'ClipForge Projects', extensions: ['clipforge'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        message: 'Open operation canceled'
      };
    }

    console.log('Project open request:', result.filePaths[0]);
    return await loadProject(result.filePaths[0]);
  } catch (error) {
    console.error('Project open IPC error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
