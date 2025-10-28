# Technical Context: ClipForge

## Technology Stack

### Desktop Framework
- **Electron**: 38.4.0
  - Cross-platform desktop app framework
  - Main + Renderer process architecture
  - Context isolation enabled for security
  - Node.js integration in main process only

### Frontend
- **React**: 19.2.0
  - UI component library
  - Functional components with hooks
  - Context API for state management
- **TypeScript**: 4.5.4
  - Type safety and better development experience
  - Strict mode enabled
- **CSS**: Custom CSS with modern features
  - Flexbox/Grid layouts
  - CSS custom properties
  - Responsive design principles

### Build System
- **Vite**: 5.4.21
  - Fast development server with HMR
  - Optimized production builds
  - Separate configs for main, renderer, and preload
- **Electron Forge**: 7.10.2
  - Project scaffolding and packaging
  - Vite plugin integration
  - Cross-platform builds

### Video Processing
- **FFmpeg**: Via @ffmpeg-installer/ffmpeg
  - Industry-standard media processing
  - Pre-bundled binary for reliability
  - Used for metadata extraction and video export
- **fluent-ffmpeg**: 2.1.3
  - Node.js wrapper for FFmpeg
  - Promise-based API
  - Progress tracking support

### Development Tools
- **ESLint**: 8.57.1
  - Code linting and formatting
  - TypeScript support
- **TypeScript ESLint**: 5.62.0
  - TypeScript-specific linting rules

## Development Setup

### Prerequisites
- Node.js 18+ (npm 10.9.3)
- Git for version control
- Windows 10/11 or macOS 10.14+

### Installation
```bash
npm install
```

### Development Commands
```bash
npm start          # Start development server
npm run package    # Build production package
npm run make       # Create distributable
npm run lint       # Run ESLint
```

### Project Structure
```
clipforge/
├── src/
│   ├── main.ts              # Main process
│   ├── preload.ts           # Preload script
│   ├── renderer.tsx         # React entry
│   ├── App.tsx              # Main component
│   ├── components/          # UI components
│   └── types/               # TypeScript types
├── _tasks/                  # PRDs and task lists
├── _planning/               # Planning documents
├── memory-bank/             # Project memory
├── .cursor/                 # Cursor rules
├── forge.config.ts          # Electron Forge config
├── vite.*.config.ts         # Vite configurations
└── package.json
```

## Technical Constraints

### Performance
- App launch time: < 5 seconds
- Timeline responsiveness with up to 5 clips
- Preview playback at 30 fps minimum
- Export process must not hang

### Compatibility
- **Windows**: 10/11 (primary target)
- **macOS**: 10.14+ (secondary target)
- **Input Formats**: MP4, MOV
- **Output Format**: MP4 with H.264 codec

### Security
- Context isolation enabled
- Node integration disabled in renderer
- CSP headers configured
- Secure IPC communication via preload script

## Dependencies

### Production Dependencies
- `@ffmpeg-installer/ffmpeg`: FFmpeg binary
- `electron-squirrel-startup`: Windows installer support
- `fluent-ffmpeg`: FFmpeg Node.js wrapper
- `react`: UI library
- `react-dom`: React DOM rendering
- `react-hot-toast`: Toast notifications

### Development Dependencies
- `@electron-forge/*`: Electron Forge toolchain
- `@types/*`: TypeScript type definitions
- `@vitejs/plugin-react`: React support for Vite
- `electron`: Electron framework
- `eslint`: Code linting
- `typescript`: TypeScript compiler
- `vite`: Build tool

## Build Configuration

### Vite Configurations
- **Main Process**: `vite.main.config.ts` - Bundles main.ts
- **Preload Script**: `vite.preload.config.ts` - Bundles preload.ts
- **Renderer Process**: `vite.renderer.config.ts` - Bundles React app

### Electron Forge Configuration
- **Packaging**: ASAR enabled for better performance
- **Makers**: Squirrel (Windows), ZIP (macOS), DEB/RPM (Linux)
- **Fuses**: Security features enabled
- **Vite Plugin**: Handles all build processes

## Development Workflow

### Hot Reload
- **Renderer**: Vite HMR for instant React updates
- **Main Process**: Restarts on file changes
- **Preload Script**: Rebuilds on changes

### Debugging
- **Renderer**: Chrome DevTools
- **Main Process**: VS Code debugger
- **IPC**: Console logging for communication

### Testing Strategy
- Manual testing checklist
- Edge case handling
- Cross-platform testing
- Performance validation

## Known Technical Challenges

### FFmpeg Integration
- Complex setup and configuration
- Platform-specific binaries
- Progress tracking implementation
- Error handling for corrupted files

### Video Performance
- Large file handling
- Memory management
- Preview quality vs performance
- Export optimization

### Packaging
- Cross-platform builds
- Binary size optimization
- Code signing (future)
- Auto-updater (future)

## Future Technical Considerations

### Scalability
- Multiple video tracks
- Advanced timeline features
- Plugin system
- Cloud integration

### Performance
- WebGL timeline rendering
- Worker threads for video processing
- Caching strategies
- Memory optimization

### Features
- Real-time collaboration
- Cloud storage integration
- Advanced export options
- Plugin architecture
