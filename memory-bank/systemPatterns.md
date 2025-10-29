# System Patterns: ClipForge

## Architecture Overview
ClipForge follows a classic Electron architecture with clear separation between main and renderer processes, using IPC for communication and React for the UI layer. The system successfully implements video import functionality with FFmpeg integration, working video preview with local file access, and Tailwind CSS v4 styling.

## Key Technical Decisions

### 1. Electron Process Architecture
```
Main Process (Node.js)
├── Window Management
├── IPC Handlers
├── File System Access
└── FFmpeg Process Management

Renderer Process (Chromium)
├── React Application
├── Video Preview (HTML5)
├── Timeline UI
└── User Interactions
```

### 2. Security Model
- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer
- **Preload Script**: Secure IPC bridge
- **CSP Headers**: Content Security Policy configured with file: protocol support
- **Web Security**: Disabled to allow local file access for video preview

### 3. State Management Pattern
- **ProjectContext**: Manages project state, save/load, and auto-save functionality
- **MediaLibraryContext**: Manages imported video clips, clip sequence, trim state, and timeline mapping
- **TimelineContext**: Handles timeline state, playhead, zoom, and playback
- **VideoPreview Component**: Manages video playback, seeking, clip switching, and trimmed content
- **Local State**: Component-specific data with refs for interaction flags
- **Timeline Sequence**: Maps timeline time to clip positions and local times (respects trim)
- **User Interaction Protection**: Prevents circular updates and timeupdate interference
- **Trim State Management**: Tracks clip inPoint/outPoint with 1-second minimum duration validation

### 4. IPC Communication Pattern
```typescript
// Preload exposes secure API
contextBridge.exposeInMainWorld('electronAPI', {
  importVideo: (filePath: string) => ipcRenderer.invoke('import-video', filePath),
  exportVideo: (data: any) => ipcRenderer.invoke('export-video', data),
  // ... other methods
});

// Main process handles IPC
ipcMain.handle('import-video', async (event, filePath: string) => {
  // Handle video import logic
});
```

### 5. Component Structure
```
App.tsx (MediaLibraryProvider)
├── Toolbar (ImportButton, ExportButton)
├── VideoSection (VideoPreview)
├── TimelineSection (Timeline)
├── StatusSection (StatusCard)
└── Error Display (Global error messages)
```

### 6. Data Flow Patterns

#### Import Flow
1. User triggers import → Renderer
2. Renderer → IPC → Main Process
3. Main Process → File System + FFmpeg
4. Main Process → IPC → Renderer
5. Renderer → Update State → Re-render UI

#### Playback Flow
1. User clicks play → Renderer
2. Renderer starts requestAnimationFrame loop
3. Loop updates playhead position
4. TimelineContext maps timeline time to clip and local time
5. VideoPreview switches to correct clip and seeks to local time
6. Timeline renders playhead position
7. Video time updates feed back to timeline position

#### Trim Flow
1. User selects clip → Renderer highlights clip and shows trim handles
2. User drags trim handle → `TrimHandle` component captures mouse events
3. `useTrimEditing` hook calculates new in/out points with constraints
4. Constraints applied: 1-second minimum, within clip duration
5. `MediaLibraryContext` updates clip trim state (inPoint/outPoint)
6. Timeline re-renders with new clip width (trimmed duration)
7. Video preview updates to respect trim bounds during playback
8. Project auto-saves trim state to .clipforge file

#### Project Persistence Flow
1. User creates/opens project → `ProjectContext` loads/initializes state
2. User makes changes (import, trim) → `MediaLibraryContext` updates
3. `ProjectContext` detects changes → Triggers auto-save via `AutoSaveManager`
4. Auto-save serializes project data → IPC → Main process
5. Main process writes .clipforge JSON file
6. Project state includes clips with trim data (inPoint/outPoint)

#### Export Flow
1. User clicks export → Renderer
2. Renderer → IPC → Main Process
3. Main Process → FFmpeg command
4. FFmpeg processes video
5. Progress updates via IPC
6. Completion notification

## Design Patterns in Use

### 1. Context Provider Pattern
```typescript
const MediaLibraryProvider = ({ children }) => {
  const [clips, setClips] = useState([]);
  // ... context logic
  return (
    <MediaLibraryContext.Provider value={{ clips, addClip, removeClip }}>
      {children}
    </MediaLibraryContext.Provider>
  );
};
```

### 2. Custom Hooks Pattern
```typescript
const useMediaLibrary = () => {
  const context = useContext(MediaLibraryContext);
  if (!context) {
    throw new Error('useMediaLibrary must be used within MediaLibraryProvider');
  }
  return context;
};
```

### 3. IPC Handler Pattern
```typescript
// Centralized IPC handlers in main process
const setupIpcHandlers = () => {
  ipcMain.handle('import-video', handleImportVideo);
  ipcMain.handle('export-video', handleExportVideo);
  // ... other handlers
};
```

### 4. Error Boundary Pattern
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  // ... error handling logic
}
```

## Multi-Clip Playback Patterns

### 1. Timeline Sequence Management
```typescript
// Timeline sequence maps global timeline time to clip positions
interface ClipSequenceItem {
  clip: VideoClip;
  startTime: number;  // Global timeline position
  endTime: number;    // Global timeline position
  duration: number;   // Clip duration
}

// Utility functions for time mapping
const getClipAtTime = (timelineTime: number) => {
  // Find which clip contains the timeline time
  // Return clip ID and local time within clip
};

const getTimelineTime = (clipId: string, localTime: number) => {
  // Convert clip local time to global timeline time
};
```

### 2. Video Switching Pattern
```typescript
// VideoPreview component handles dynamic clip switching
const VideoPreview = () => {
  const [currentPlayingClip, setCurrentPlayingClip] = useState<VideoClip>();
  const userInteractingRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  
  // Effect 1: Handle video source changes
  useEffect(() => {
    // Load new video source when clip changes
  }, [currentPlayingClip]);
  
  // Effect 2: Handle timeline seeking within current clip
  useEffect(() => {
    // Seek video to correct position within current clip
  }, [timelineState.playheadPosition, currentPlayingClip]);
  
  // Effect 3: Handle pending seeks after clip switching
  useEffect(() => {
    // Execute pending seek after new video loads
  }, [currentPlayingClip, pendingSeekRef.current]);
};
```

### 3. User Interaction Protection
```typescript
// Prevents timeupdate from overriding user actions
const userInteractingRef = useRef(false);

// Set flag during user interactions
const handleTimelineClick = () => {
  userInteractingRef.current = true;
  // Perform action
  setTimeout(() => {
    userInteractingRef.current = false;
  }, 500);
};

// Block timeupdate during user interactions
const handleTimeUpdate = () => {
  if (userInteractingRef.current) return;
  // Update timeline position
};
```

### 4. Clip Switching Flow
1. **User clicks timeline** → playhead position changes
2. **Timeline seeking effect** → checks if position is within current clip
3. **If outside current clip** → sets `pendingSeekRef` and `userInteractingRef`
4. **Timeline position effect** → switches to correct clip
5. **Video source effect** → loads new video
6. **Pending seek effect** → seeks to correct position after video loads
7. **User interaction flag clears** → allows normal timeupdate updates

### 5. Gap Functionality Removal
- **Decision**: Removed all gap-related functionality from timeline and video preview
- **Reason**: Gap indicators were interfering with timeline click responsiveness
- **Impact**: Simplified timeline interaction logic, improved click reliability
- **Components Removed**: GapIndicator component, gap detection logic, gap interaction handlers

### 6. Trim Editing Patterns

#### Trim State Structure
```typescript
interface VideoClip {
  id: string;
  filePath: string;
  fileName: string;
  duration: number;     // Original clip duration
  inPoint: number;      // Trim start point (seconds)
  outPoint: number;     // Trim end point (seconds)
  // ... other metadata
}

// Trimmed duration calculation
const getTrimmedDuration = (clip: VideoClip) => clip.outPoint - clip.inPoint;
```

#### Trim Handle Drag Pattern
```typescript
const useTrimEditing = (clipId: string, handleType: 'start' | 'end') => {
  const [trimState, dispatch] = useReducer(trimReducer, initialState);
  
  const startDrag = (startPosition: number) => {
    // Record initial state
    dispatch({ 
      type: 'START_DRAG', 
      dragHandle: handleType,
      dragStartPosition: startPosition,
      dragStartTime: clip[handleType === 'start' ? 'inPoint' : 'outPoint']
    });
  };
  
  const updateDrag = (currentPosition: number) => {
    // Calculate time delta from start
    const positionDelta = currentPosition - trimState.dragStartPosition;
    const timeDelta = pixelsToTime(positionDelta);
    const newTime = trimState.dragStartTime + timeDelta;
    
    // Apply constraints
    const { time, isValid, violation } = applyTrimConstraints(
      newTime, 
      clip, 
      handleType
    );
    
    dispatch({ type: 'UPDATE_DRAG', currentTime: time, isValid, violation });
  };
  
  const endDrag = () => {
    // Commit trim to clip data
    updateClipTrim(clipId, {
      inPoint: handleType === 'start' ? trimState.currentTime : clip.inPoint,
      outPoint: handleType === 'end' ? trimState.currentTime : clip.outPoint
    });
    dispatch({ type: 'END_DRAG' });
  };
  
  return { trimState, startDrag, updateDrag, endDrag };
};
```

#### Trim Constraints
```typescript
const applyTrimConstraints = (
  time: number,
  clip: VideoClip,
  handleType: 'start' | 'end'
) => {
  if (handleType === 'start') {
    // Start handle: 0 <= inPoint <= outPoint - 1
    const constrainedTime = Math.max(0, Math.min(time, clip.outPoint - 1));
    const violation = constrainedTime >= clip.outPoint - 1
      ? 'Start point must be at least 1 second before end point'
      : null;
    return { time: constrainedTime, isValid: !violation, violation };
  } else {
    // End handle: inPoint + 1 <= outPoint <= duration
    const constrainedTime = Math.max(clip.inPoint + 1, Math.min(time, clip.duration));
    const violation = constrainedTime <= clip.inPoint + 1
      ? 'End point must be at least 1 second after start point'
      : null;
    return { time: constrainedTime, isValid: !violation, violation };
  }
};
```

#### Video Preview Trim Integration
```typescript
// VideoPreview respects clip trim bounds
const VideoPreview = () => {
  // When video loads, seek to inPoint if trimmed
  useEffect(() => {
    if (video && currentClip && currentClip.inPoint > 0) {
      video.currentTime = currentClip.inPoint;
    }
  }, [currentClip]);
  
  // Map timeline position to video time (accounting for inPoint)
  const videoTime = timelinePositionWithinClip + currentClip.inPoint;
  
  // Detect end of trimmed content (use local time, not absolute)
  const localTime = video.currentTime - currentClip.inPoint;
  const trimmedDuration = getTrimmedDuration(currentClip);
  if (localTime >= trimmedDuration - 0.1) {
    handleClipEnd();
  }
  
  // Auto-play next clip: seek to inPoint before playing
  if (nextClip && nextClip.inPoint > 0) {
    video.currentTime = nextClip.inPoint;
  }
  video.play();
};
```

#### Timeline Sequence with Trim
```typescript
// Build clip sequence using trimmed durations
const buildClipSequence = (clips: VideoClip[]) => {
  let currentTime = 0;
  const items = clips.map(clip => {
    const trimmedDuration = getTrimmedDuration(clip);
    const item = {
      clip,
      startTime: currentTime,
      endTime: currentTime + trimmedDuration,
      duration: trimmedDuration
    };
    currentTime += trimmedDuration;
    return item;
  });
  return { items, totalDuration: currentTime };
};
```

### 7. Project Persistence Patterns

#### Project Data Structure
```typescript
interface ProjectData {
  version: string;
  createdAt: string;
  lastModified: string;
  projectName: string;
  filePath: string | null;
  clips: VideoClip[];  // Includes inPoint/outPoint
  timeline: {
    playheadPosition: number;
    zoomLevel: number;
    totalDuration: number;
    scrollPosition: number;
  };
  settings: {
    autoSaveInterval: number;
    recentProjects: string[];
  };
}
```

#### Auto-Save Manager
```typescript
class AutoSaveManager {
  private intervalId: NodeJS.Timeout | null = null;
  private isSaving: boolean = false;
  
  start(interval: number, onSave: () => Promise<void>) {
    this.intervalId = setInterval(async () => {
      if (this.isSaving) return;
      this.isSaving = true;
      try {
        await onSave();
      } catch (error) {
        // Retry logic with exponential backoff
      } finally {
        this.isSaving = false;
      }
    }, interval);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

#### FFmpeg Security Pattern
```typescript
// MAIN PROCESS (src/main.ts)
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// Set paths in main process
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Video processing functions in main process
const extractVideoMetadata = async (filePath: string) => {
  // FFmpeg operations here
};

// RENDERER PROCESS (src/utils/videoUtils.ts)
// Only browser-safe utilities
export const getTrimmedDuration = (clip: VideoClip) => {
  return clip.outPoint - clip.inPoint;
};

export const validateTrimPoints = (clip: VideoClip) => {
  // Pure JavaScript validation, no Node.js deps
};
```

## Component Relationships

### Core Components
- **App**: Main container, orchestrates all components
- **ImportButton**: Triggers file import flow
- **VideoPreview**: Displays video content with dynamic clip switching and timeline sync
- **Timeline**: Shows clips and playhead, handles trim operations and multi-clip positioning
- **Timeline Components**: ClipBlock, TimeMarkers, Playhead, EmptyState for modular timeline
- **ExportButton**: Initiates export process

### Supporting Components
- **StatusCard**: Shows system status and IPC communication
- **ProgressBar**: Displays export progress
- **Toast**: Shows notifications and errors

## File Organization
```
src/
├── main.ts              # Main process entry
├── preload.ts           # IPC bridge
├── renderer.tsx         # React entry point
├── App.tsx              # Main React component
├── index.css            # Tailwind CSS v4 configuration
├── components/          # UI components
│   ├── ImportButton.tsx     # Video import with drag-drop
│   ├── VideoPreview.tsx     # Video display with dynamic clip switching
│   ├── Timeline.tsx         # Clip timeline display with multi-clip support
│   ├── ClipBlock.tsx        # Individual clip display component
│   ├── TimeMarker.tsx       # Timeline time markers
│   ├── Playhead.tsx         # Timeline playhead component
│   ├── EmptyState.tsx       # Empty timeline state
│   ├── ExportButton.tsx     # Export functionality
│   ├── ImportProgress.tsx   # Progress modal for imports
│   └── index.ts             # Component exports
├── contexts/            # React contexts
│   ├── MediaLibraryContext.tsx  # Video clip state management
│   └── TimelineContext.tsx      # Timeline state and playhead management
├── hooks/               # Custom React hooks
│   └── useTimeline.ts       # Timeline logic and interactions
├── types/               # TypeScript definitions
│   ├── ipc.ts               # IPC interfaces and types
│   └── timeline.ts          # Timeline-specific types and interfaces
└── utils/               # Utility functions
    ├── videoUtils.ts        # FFmpeg integration and video processing
    └── timelineUtils.ts     # Timeline calculation utilities
```

## Performance Considerations
- **Video Preview**: HTML5 video element with hardware acceleration and dynamic source switching
- **Timeline Rendering**: DOM-based approach for MVP (not canvas) with efficient clip positioning
- **State Updates**: MediaLibraryContext + TimelineContext manage state efficiently with persistence
- **IPC Calls**: Secure IPC bridge with proper error handling
- **FFmpeg Integration**: On-demand processing with progress tracking
- **Tailwind CSS v4**: Optimized Vite plugin for fast HMR
- **Memory Management**: Context cleanup and event listener management
- **Build Performance**: Fast development builds with hot reload
- **Timeline Performance**: Throttled updates to prevent excessive re-renders
- **Video Switching**: Efficient clip source changes with seeking protection
- **Circular Update Prevention**: Ref-based flags to prevent infinite loops
