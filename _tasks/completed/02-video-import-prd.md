# 02 - Video Import - Product Requirements Document

## Introduction/Overview

This feature enables users to import video files into ClipForge through file picker dialogs and drag-and-drop functionality. It establishes the media library foundation and handles video file validation and metadata extraction.

**Goal:** Allow users to bring video content into the application through intuitive import methods and prepare it for editing.

## Goals

1. Implement file picker video import
2. Enable drag-and-drop video import
3. Extract and display video metadata
4. Validate video file formats
5. Add imported clips to media library

## User Stories

**US-002: Import Video via File Picker**
- As a user, I want to select video files from my file system so that I can bring content into the editor.
- **Acceptance Criteria:**
  - File picker opens when clicking "Import" button
  - Supports MP4 and MOV formats
  - Selected file appears in media library/timeline
  - Shows basic file metadata (name, duration)

**US-003: Drag & Drop Video Import**
- As a user, I want to drag video files directly into the application so that I can quickly add content without navigating dialogs.
- **Acceptance Criteria:**
  - Drag area is clearly indicated
  - Dropping a valid video file imports it
  - Invalid files show error message
  - Multiple files can be dropped at once

## Functional Requirements

1. The system must provide an "Import" button that opens a file picker dialog
2. The system must support MP4 and MOV video file formats
3. The system must validate file types before processing
4. The system must extract video metadata (duration, resolution, codec) using FFmpeg
5. The system must display drag-and-drop zones with visual feedback
6. The system must handle multiple file selection
7. The system must show error messages for invalid files
8. The system must add imported clips to a media library context
9. The system must display basic file information (name, duration, file size)
10. The system must handle file path references (not copy files)

## Non-Goals (Out of Scope)

- Video preview functionality
- Timeline display
- File conversion or processing
- Cloud storage integration
- Batch processing of large file sets
- UI styling framework migration (Tailwind CSS)

## Design Considerations

- Import button: Prominent, easily accessible
- Drag zones: Clear visual indication with hover states
- File validation: Immediate feedback on invalid files
- Metadata display: Clean, readable format
- Error handling: User-friendly error messages

## Technical Considerations

- Use Electron's dialog.showOpenDialog for file picker
- Implement HTML5 drag-and-drop API
- Use FFmpeg for metadata extraction
- Store file paths, not file contents
- Implement proper error handling for corrupted files
- Use IPC communication for file operations

## Success Metrics

- Users can successfully import MP4 and MOV files
- Drag-and-drop works smoothly
- Invalid files are properly rejected with clear messages
- Metadata extraction completes within 2 seconds
- Multiple files can be imported in one operation

## Open Questions

- Should we support additional video formats beyond MP4 and MOV?
- What's the maximum file size we should handle?
- Should we generate thumbnails during import?
- How should we handle files with missing metadata?

## Data Flow Integration

This feature implements the **Import Flow** from the main data flow:

```
User → Renderer: Click Import / Drag File
Renderer → Main: IPC: import-video
Main → FileSystem: Open File Dialog
FileSystem → Main: Selected File Path
Main → FFmpeg: Extract Metadata (duration, resolution)
FFmpeg → Main: Video Metadata
Main → Renderer: File Path + Metadata
Renderer → Renderer: Add to MediaLibraryContext
Renderer → Renderer: Update Timeline UI
```

**Key Components:**
- ImportButton component (file picker trigger)
- DragDropZone component (drag-and-drop area)
- MediaLibraryContext (state management)
- FFmpeg integration (metadata extraction)
- IPC handlers (main process file operations)

## Post-Implementation Tasks

### UI Framework Migration (11.0)
Following the completion of video import functionality, the following tasks are planned to modernize the UI styling approach:

**11.1 Install and configure Tailwind CSS with Vite**
- Install Tailwind CSS and required dependencies
- Configure Vite integration for optimal build performance
- Set up PostCSS configuration

**11.2 Set up Tailwind configuration for Electron app**
- Create tailwind.config.js with Electron-specific settings
- Configure content paths for proper purging
- Set up development and production builds

**11.3 Create Tailwind utility classes for app layout**
- Convert main app layout to Tailwind utilities
- Implement responsive grid and flexbox layouts
- Maintain existing visual hierarchy

**11.4 Convert component styles to Tailwind classes**
- Migrate all component styles from CSS to Tailwind
- Ensure visual consistency across components
- Optimize class usage for maintainability

**11.5 Implement responsive design with Tailwind**
- Add responsive breakpoints for mobile/desktop
- Implement mobile-first design approach
- Test across different screen sizes

**11.6 Add custom Tailwind theme for ClipForge branding**
- Define brand colors, fonts, and spacing
- Create custom component variants
- Maintain visual identity consistency

**11.7 Remove old CSS file and clean up styles**
- Remove src/index.css file
- Clean up unused CSS imports
- Verify no styling regressions

**11.8 Test UI consistency across all components**
- Verify all components render correctly
- Test responsive behavior
- Ensure accessibility standards maintained

**Benefits of Tailwind Migration:**
- Improved maintainability with utility-first approach
- Better responsive design capabilities
- Consistent spacing and typography
- Smaller bundle size with purged unused styles
- Enhanced developer experience with IntelliSense
