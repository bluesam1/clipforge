# 05 - Trim Editing - Product Requirements Document

## Introduction/Overview

This feature enables users to perform basic trim operations on video clips by adjusting the start and end points. It provides the core editing functionality for removing unwanted portions of video content.

**Goal:** Allow users to trim video clips by adjusting in/out points with intuitive drag handles, providing the essential editing capability for the MVP.

## Goals

1. Implement project persistence system for save/load functionality
2. Implement draggable trim handles on clip edges
3. Enable real-time preview of trim adjustments
4. Update clip duration and timeline representation
5. Provide visual feedback during trim operations
6. Maintain trim state in project files

## User Stories

**US-007: Project Save and Load**
- As a user, I want to save my editing project so that I can continue working later.
- **Acceptance Criteria:**
  - User can save project via File menu or Ctrl+S
  - User can load existing project via File menu or Ctrl+O
  - Project file contains all clips, trim points, and timeline state
  - Recent projects appear in File menu
  - Auto-save occurs on significant changes
  - Project recovery works for corrupted files

**US-008: Trim Clip Start/End Points**
- As a user, I want to adjust the start and end points of a clip so that I can remove unwanted portions.
- **Acceptance Criteria:**
  - User can select a clip on timeline
  - UI shows trim handles on clip edges
  - Dragging handles adjusts in/out points
  - Preview reflects trimmed result
  - Clip duration updates accordingly

## Functional Requirements

### Project Persistence
1. The system must save project data to `.clipforge` JSON files
2. The system must load project data from `.clipforge` files
3. The system must auto-save project on significant changes
4. The system must provide File menu options (Save, Save As, Open, Recent Projects)
5. The system must validate project file format and handle corruption
6. The system must persist all clip data, trim points, and timeline state
7. The system must maintain recent projects list in File menu
8. The system must handle file system errors gracefully

### Trim Editing
9. The system must show trim handles when a clip is selected
10. The system must allow dragging left handle to adjust start point
11. The system must allow dragging right handle to adjust end point
12. The system must update clip duration in real-time during drag
13. The system must update video preview to show trimmed content
14. The system must prevent handles from crossing over each other
15. The system must maintain minimum clip duration (1 second)
16. The system must update timeline clip width to reflect new duration
17. The system must provide visual feedback during drag operations
18. The system must save trim points to project data

## Non-Goals (Out of Scope)

- Split clips into multiple segments
- Copy/paste trim operations
- Undo/redo functionality
- Advanced trim tools (ripple, roll, slip, slide)
- Trim multiple clips simultaneously
- Trim with frame-level precision

## Design Considerations

- Trim handles: Small, draggable elements on clip edges
- Visual feedback: Highlight during drag, show duration
- Minimum duration: Clear indication when limit reached
- Handle size: Large enough to grab easily
- Color coding: Different colors for start/end handles

## Technical Considerations

### Project Persistence
- Use `.clipforge` JSON file format for project storage
- Implement file system operations in main process via IPC
- Add project validation schema for data integrity
- Implement auto-save with debouncing (save after 2 seconds of inactivity)
- Handle file system errors and provide user feedback
- Maintain recent projects list in application state
- Add project recovery for corrupted files with backup creation

### Mouse Event Handling
- Use `onMouseDown`, `onMouseMove`, `onMouseUp` for drag operations
- Implement `useCallback` for event handlers to prevent re-renders
- Add `preventDefault()` to prevent text selection during drag
- Use `stopPropagation()` to prevent timeline click events

### Coordinate Calculations
- Calculate time positions from pixel coordinates using `pixelsToTime()`
- Convert handle positions to trim points: `inPoint = pixelsToTime(handleX)`
- Apply constraints: `Math.max(0, Math.min(originalDuration, calculatedTime))`
- Use `requestAnimationFrame` for smooth 60fps updates

### State Management
- Add `UPDATE_CLIP_TRIM` action to MediaLibraryContext reducer
- Implement `updateClipTrim(clipId, inPoint, outPoint)` method
- Validate trim constraints before updating state
- Persist trim data to localStorage for app restarts

### Performance Optimization
- Throttle real-time updates to 60fps using `requestAnimationFrame`
- Debounce timeline width updates with 100ms delay
- Use `useMemo` for expensive calculations (trimmedDuration, handle positions)
- Limit preview updates to currently visible clips only

### Edge Case Handling
- Enforce 1-second minimum duration with smooth constraint
- Prevent trimming beyond original clip duration
- Pause video playback when trim operation starts
- Show visual feedback for constraint violations (red highlight)

### Timeline Integration
- Update `getClipPosition()` to use `trimmedDuration` for width calculation
- Maintain original `startTime` for timeline positioning
- Re-render timeline after trim changes using existing update mechanisms
- Ensure playhead positioning works correctly with trimmed clips

## Success Metrics

- Trim handles are easy to grab and drag
- Real-time preview updates smoothly
- Minimum duration constraint is enforced
- Timeline updates immediately after trim
- Trim operations feel responsive and intuitive

## Implementation Decisions

### Data Structure
- **Trim Points**: Add `inPoint` and `outPoint` fields directly to `VideoClip` interface
- **Default Values**: `inPoint: 0`, `outPoint: duration` (original clip duration)
- **Duration**: `duration` field represents original clip duration, `trimmedDuration = outPoint - inPoint`

### Minimum Duration
- **Global Constraint**: 1-second minimum duration enforced globally
- **Visual Feedback**: Red highlight when approaching minimum duration
- **Behavior**: Prevent trimming below 1 second with smooth constraint

### Real-time Preview
- **Update Frequency**: Update video preview immediately during drag for responsive feel
- **Performance**: Throttle updates to 60fps using `requestAnimationFrame`
- **Scope**: Limit preview updates to visible clips only

### Timeline Integration
- **Timeline Position**: `startTime` represents timeline position (unchanged)
- **Width Calculation**: Use `trimmedDuration` for timeline clip width
- **Positioning**: Maintain original timeline positioning, only width changes

### Visual Design
- **Start Handle**: Blue (`bg-blue-500`) with left-pointing arrow, 8px wide
- **End Handle**: Green (`bg-green-500`) with right-pointing arrow, 8px wide
- **Size**: Full clip height, 10px on hover with shadow
- **Visibility**: Only on selected clips
- **Animation**: Smooth transitions for handle interactions

### Edge Cases
- **Zero Duration**: Prevent trimming to 0 duration (enforce 1-second minimum)
- **Beyond Original**: Allow trimming up to original duration (no beyond)
- **Playback**: Pause playback when trimming starts, resume after completion
- **Warning**: Show warning if trimming currently playing clip

### State Management
- **Persistence**: Save trim operations immediately to clip data
- **Undo/Redo**: Not implemented for MVP (as specified in non-goals)
- **Persistence**: Persist trim data across app restarts
- **Actions**: Add `updateClipTrim` action to MediaLibraryContext

### Performance Optimizations
- **Throttling**: Throttle real-time updates to 60fps using `requestAnimationFrame`
- **Re-renders**: Use `useCallback` for drag handlers to prevent unnecessary re-renders
- **Debouncing**: Debounce timeline width updates (100ms delay)
- **Visibility**: Limit preview updates to visible clips only

## Component Architecture

### New Components
- **TrimHandle**: Reusable component for drag handle logic
- **TrimEditor**: Wrapper component for trim functionality
- **useTrimEditing**: Custom hook for drag state management

### Extended Components
- **ClipBlock**: Extended with trim handle integration
- **MediaLibraryContext**: Added trim data management

### Type Safety
- **TrimState**: Interface for drag operations
- **TrimAction**: Types for state management
- **Validation**: Functions for trim constraints

### User Experience Enhancements
- **Tooltips**: Show time values during drag operations
- **Keyboard Shortcuts**: Shift+Left/Right for fine adjustment
- **Visual Feedback**: Clear indication for constraint violations
- **Animations**: Smooth handle interactions and transitions

## Data Flow Integration

This feature implements both **Project Persistence Flow** and **Trim Flow**:

### Project Persistence Flow
```
User → Renderer: Save Project (Ctrl+S)
Renderer → Main: IPC Save Project Request
Main → File System: Write .clipforge JSON file
Main → Renderer: Save Success/Error Response
Renderer → Renderer: Update Project State

User → Renderer: Load Project (Ctrl+O)
Renderer → Main: IPC Load Project Request
Main → File System: Read .clipforge JSON file
Main → Renderer: Project Data Response
Renderer → Renderer: Update All Contexts with Project Data
```

### Trim Flow
```
User → Renderer: Drag Trim Handle
Renderer → Renderer: Track Mouse Movement
Renderer → Renderer: Calculate New In/Out Point
Renderer → Renderer: Update Clip in MediaLibraryContext
Renderer → Renderer: Re-render Timeline Clip
Renderer → Renderer: Update Preview to Show Trim
Renderer → Renderer: Trigger Auto-save (if enabled)
```

**Key Components:**
- **ProjectContext**: Project management context for save/load operations
- **ProjectFileManager**: Main process file system operations for .clipforge files
- **TrimHandle**: Reusable drag handle component with visual feedback
- **TrimEditor**: Wrapper component managing trim state and interactions
- **ClipBlock**: Extended with trim handle integration and selection logic
- **MediaLibraryContext**: Enhanced with trim data management and validation
- **useTrimEditing**: Custom hook for drag state and constraint management

**State Management:**
- **Project Data**: `projectName`, `filePath`, `lastModified`, `clips`, `timeline` in ProjectContext
- **Clip Data**: `inPoint`, `outPoint`, `trimmedDuration` in VideoClip interface
- **Drag State**: `isDragging`, `dragHandle`, `dragStartPosition` in TrimEditor
- **Constraints**: Minimum duration (1s), maximum duration (original), validation
- **Preview Updates**: Real-time video preview during trim operations
- **Timeline Sync**: Automatic timeline re-rendering after trim changes
- **Auto-save**: Debounced project persistence on state changes

**Data Flow:**
1. User opens app → Load project or create new project
2. User imports video → Add to project and save to .clipforge file
3. User selects clip → Show trim handles
4. User drags handle → Update drag state and calculate new trim points
5. Validate constraints → Apply minimum/maximum duration limits
6. Update clip data → Dispatch UPDATE_CLIP_TRIM action to MediaLibraryContext
7. Re-render timeline → Update clip width and position calculations
8. Update preview → Show trimmed content in video player
9. Auto-save project → Save all changes to .clipforge file
10. User saves project → Manual save via File menu or Ctrl+S
