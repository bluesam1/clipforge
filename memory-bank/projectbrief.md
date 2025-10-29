# Project Brief: ClipForge

## Project Overview
ClipForge is a desktop video editor built with Electron that enables creators to import, edit, and export video content. The MVP focuses on establishing the core media pipeline: import → preview → basic editing → export.

## Core Mission
Create a simple, fast desktop video editor that allows users to:
- Import video files (MP4, MOV)
- Preview video content with playback controls
- Perform basic trim operations on clips
- Export edited content to MP4 format

## MVP Success Criteria
The MVP is considered complete when:
- A packaged desktop application launches on macOS/Windows
- Users can import video files and see them in a timeline
- Users can preview video content in a player
- Users can perform basic trim operations on clips
- Users can export edited content to MP4 format

## Key Constraints
- **Deadline**: Tuesday, October 28th, 2025 at 10:59 PM CT
- **Platform**: Primary Windows, secondary macOS
- **Scope**: Single video track, one clip at a time for MVP
- **Performance**: App launches < 5 seconds, responsive timeline

## Technology Stack
- **Desktop**: Electron 38.4.0+ with context isolation
- **Frontend**: React 19.2.0 + TypeScript 4.5.4
- **Build**: Vite 5.4.21 + Electron Forge
- **Video Processing**: FFmpeg via fluent-ffmpeg
- **State Management**: React Context API

## Current Status
✅ **MVP COMPLETE**: All core features implemented
✅ **Video Export**: Complete export functionality with FFmpeg integration
🔄 **Next Phase**: Advanced features and polish

## Success Metrics
1. All user stories have acceptance criteria met
2. Manual testing checklist passes
3. Packaged app launches on target OS
4. Demo video can be recorded showing full workflow
5. Submission made before deadline
