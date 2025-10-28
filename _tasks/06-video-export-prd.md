# 06 - Video Export - Product Requirements Document

## Introduction/Overview

This feature enables users to export their edited timeline as an MP4 video file. It integrates FFmpeg for video processing and provides export options with progress feedback.

**Goal:** Allow users to export their edited video content as a high-quality MP4 file with configurable output settings and progress indication.

## Goals

1. Implement MP4 export functionality using FFmpeg
2. Provide export dialog with output options
3. Show progress indication during export
4. Handle export completion and error states
5. Validate exported video file

## User Stories

**US-009: Export Timeline to MP4**
- As a user, I want to export my edited timeline as an MP4 file so that I can share or use the final video.
- **Acceptance Criteria:**
  - Export button is accessible
  - File picker allows choosing save location
  - Export processes the timeline composition
  - Progress indicator shows during export
  - Success notification when complete
  - Exported file plays in external video players
  - Export maintains reasonable quality

**US-010: Export with Resolution Options**
- As a user, I want to choose output resolution so that I can optimize for file size or quality.
- **Acceptance Criteria:**
  - Export dialog shows resolution dropdown
  - Options include: Source, 1080p, 720p
  - Selected resolution applies to export
  - Output video matches selected resolution

## Functional Requirements

1. The system must provide an export button in the UI
2. The system must open a file save dialog for output location
3. The system must show export dialog with resolution options
4. The system must process timeline composition using FFmpeg
5. The system must display progress indicator during export
6. The system must show success notification when complete
7. The system must handle export errors gracefully
8. The system must validate exported file can be played
9. The system must support resolution options (Source, 1080p, 720p)
10. The system must use H.264 codec with AAC audio

## Non-Goals (Out of Scope)

- Multiple export formats (only MP4)
- Advanced codec options
- Batch export functionality
- Cloud upload integration
- Export presets beyond resolution
- Video effects or filters during export

## Design Considerations

- Export button: Prominent, easily accessible
- Export dialog: Clean, simple options
- Progress indicator: Clear progress bar with percentage
- Success notification: Toast or modal confirmation
- Error handling: User-friendly error messages

## Technical Considerations

- Use FFmpeg via fluent-ffmpeg wrapper
- Implement IPC communication for export process
- Handle long-running export operations
- Use electron-builder for FFmpeg binary inclusion
- Implement proper error handling and cleanup
- Support cancellation of export operations

## Success Metrics

- Export completes successfully for typical video files
- Progress indication is accurate and responsive
- Exported videos play correctly in external players
- Export time is reasonable for typical clip lengths
- Error handling provides clear feedback

## Open Questions

- Should we support export cancellation?
- What's the maximum export duration we should handle?
- Should we show estimated time remaining?
- How should we handle export failures?

## Data Flow Integration

This feature implements the **Export Flow** from the main data flow:

```
User → Renderer: Click Export Button
Renderer → Main: IPC: export-video {clipData, outputPath}
Main → FFmpeg: Build FFmpeg Command (trim, codec settings)
FFmpeg → FileSystem: Write Output MP4
loop During Export
    FFmpeg → Main: Progress Update
    Main → Renderer: IPC: export-progress
    Renderer → Renderer: Update Toast Notification
end
FFmpeg → Main: Export Complete
Main → Renderer: IPC: export-complete
Renderer → User: Show Success Toast
```

**Key Components:**
- ExportDialog component (export options and progress)
- ExportButton component (trigger export)
- FFmpeg integration (video processing)
- Progress indicator (real-time feedback)
- Toast notifications (success/error messages)

**IPC Handlers:**
- export-video (start export process)
- export-progress (progress updates)
- export-complete (completion notification)
- export-error (error handling)
