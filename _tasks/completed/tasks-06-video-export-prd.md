# Tasks: 06 - Video Export PRD

## Relevant Files

- `src/components/ExportButton.tsx` - Export button component to trigger export dialog
- `src/components/ExportDialog.tsx` - Export dialog with resolution options and progress tracking
- `src/types/ipc.ts` - Add export-related IPC types and interfaces
- `src/main.ts` - Add FFmpeg export IPC handlers and video processing logic
- `src/contexts/ProjectContext.tsx` - Update with export state management and notifications
- `src/utils/exportUtils.ts` - New utility functions for export operations and FFmpeg command building
- `src/utils/videoUtils.ts` - Extend with export validation functions
- `src/types/export.ts` - New export-related type definitions (ExportOptions, ExportProgress, etc.)

### Notes

- FFmpeg integration uses fluent-ffmpeg wrapper already installed in the project
- Export operations run in the main process for security and access to file system
- Progress tracking uses IPC event streaming from main to renderer
- Export respects trim points (inPoint/outPoint) from timeline clips

## Tasks

- [x] 1.0 Implement Export UI Components
  - [x] 1.1 Update `ExportButton` component to open export dialog instead of direct export
  - [x] 1.2 Create `ExportDialog` component with modal/dialog UI structure
  - [x] 1.3 Add resolution selection dropdown (Source, 1080p, 720p) to export dialog
  - [x] 1.4 Add output filename input field with default naming (project-name-export.mp4)
  - [x] 1.5 Integrate native file save dialog for output location selection
  - [x] 1.6 Add export button and cancel button to dialog
  - [x] 1.7 Implement dialog state management (open/close, form validation)
  - [x] 1.8 Add loading state during export with disabled form fields
  - [x] 1.9 Style export dialog with Tailwind CSS v4 matching app design

- [x] 2.0 Add Export Types and Interfaces
  - [x] 2.1 Create `src/types/export.ts` with export-related type definitions
  - [x] 2.2 Define `ExportOptions` interface (resolution, outputPath, quality)
  - [x] 2.3 Define `ExportProgress` interface (percent, currentTime, estimatedTime)
  - [x] 2.4 Define `ExportResolution` type ('source' | '1080p' | '720p')
  - [x] 2.5 Define `ExportStatus` type ('idle' | 'exporting' | 'success' | 'error' | 'cancelled')
  - [x] 2.6 Update `src/types/ipc.ts` with export IPC channel types
  - [x] 2.7 Add `ExportResult` interface for export completion data

- [x] 3.0 Implement FFmpeg Export Integration
  - [x] 3.1 Create `src/utils/exportUtils.ts` for export utility functions
  - [x] 3.2 Implement `buildFFmpegCommand` function with timeline composition logic
  - [x] 3.3 Add trim point handling (filter clips by inPoint/outPoint)
  - [x] 3.4 Implement resolution scaling logic for 1080p and 720p options
  - [x] 3.5 Configure H.264 video codec with appropriate quality settings
  - [x] 3.6 Configure AAC audio codec with appropriate bitrate
  - [x] 3.7 Add FFmpeg progress event parsing and normalization
  - [x] 3.8 Implement export cleanup (temp files, error recovery)
  - [x] 3.9 Add export validation (check output file exists and is playable)

- [x] 4.0 Add IPC Communication for Export
  - [x] 4.1 Add `export-video` IPC handler in `src/main.ts`
  - [x] 4.2 Implement timeline data serialization for export
  - [x] 4.3 Add `export-progress` IPC event streaming from main to renderer
  - [x] 4.4 Add `export-complete` IPC handler with success data
  - [x] 4.5 Add `export-error` IPC handler with error details
  - [x] 4.6 Add `export-cancel` IPC handler for cancellation support
  - [x] 4.7 Update `src/preload.ts` with export IPC bridge functions
  - [x] 4.8 Add IPC error handling and timeout management

- [x] 5.0 Implement Progress Tracking and Notifications
  - [x] 5.1 Add export state to `ProjectContext` (status, progress, error)
  - [x] 5.2 Create progress bar component in `ExportDialog`
  - [x] 5.3 Implement real-time progress updates from IPC events
  - [x] 5.4 Add estimated time remaining calculation and display
  - [x] 5.5 Create toast notification component for success/error messages
  - [x] 5.6 Add success notification with "Open in Finder/Explorer" action
  - [x] 5.7 Add error notification with detailed error message and retry option
  - [x] 5.8 Implement export cancellation UI and logic
  - [x] 5.9 Add export state cleanup on dialog close

