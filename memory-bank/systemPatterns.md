# System Patterns: ClipForge

## Architecture Overview
ClipForge follows a classic Electron architecture with clear separation between main and renderer processes, using IPC for communication and React for the UI layer.

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
- **CSP Headers**: Content Security Policy configured

### 3. State Management Pattern
- **MediaLibraryContext**: Manages imported video clips
- **TimelineContext**: Handles timeline state and playhead
- **PlayerContext**: Controls playback state
- **Local State**: Component-specific data

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
App.tsx
├── Toolbar (ImportButton, ExportButton)
├── VideoSection (VideoPreview)
├── TimelineSection (Timeline)
└── StatusSection (System Status)
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
4. VideoPreview seeks to current time
5. Timeline renders playhead position

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

## Component Relationships

### Core Components
- **App**: Main container, orchestrates all components
- **ImportButton**: Triggers file import flow
- **VideoPreview**: Displays video content and controls
- **Timeline**: Shows clips and playhead, handles trim operations
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
├── components/          # UI components
│   ├── ImportButton.tsx
│   ├── VideoPreview.tsx
│   ├── Timeline.tsx
│   └── ExportButton.tsx
├── types/               # TypeScript definitions
│   └── ipc.ts
└── contexts/            # React contexts (future)
```

## Performance Considerations
- **Video Preview**: Use HTML5 video element for hardware acceleration
- **Timeline Rendering**: DOM-based approach for MVP (not canvas)
- **State Updates**: Batch updates to avoid excessive re-renders
- **IPC Calls**: Debounce rapid IPC calls
- **Memory Management**: Clean up event listeners and intervals
