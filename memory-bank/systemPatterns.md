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
- **MediaLibraryContext**: Manages imported video clips and clip sequence with timeline mapping
- **TimelineContext**: Handles timeline state, playhead, zoom, and playback
- **VideoPreview Component**: Manages video playback, seeking, and clip switching
- **Local State**: Component-specific data with refs for interaction flags
- **Timeline Sequence**: Maps timeline time to clip positions and local times
- **User Interaction Protection**: Prevents circular updates and timeupdate interference

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
1. User drags handle → Renderer
2. Mouse tracking calculates new in/out points
3. Update clip data in context
4. Re-render timeline with new clip length
5. Update preview to show trimmed content

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
