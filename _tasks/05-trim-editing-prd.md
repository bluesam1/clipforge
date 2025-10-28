# 05 - Trim Editing - Product Requirements Document

## Introduction/Overview

This feature enables users to perform basic trim operations on video clips by adjusting the start and end points. It provides the core editing functionality for removing unwanted portions of video content.

**Goal:** Allow users to trim video clips by adjusting in/out points with intuitive drag handles, providing the essential editing capability for the MVP.

## Goals

1. Implement draggable trim handles on clip edges
2. Enable real-time preview of trim adjustments
3. Update clip duration and timeline representation
4. Provide visual feedback during trim operations
5. Maintain trim state in media library

## User Stories

**US-008: Trim Clip Start/End Points**
- As a user, I want to adjust the start and end points of a clip so that I can remove unwanted portions.
- **Acceptance Criteria:**
  - User can select a clip on timeline
  - UI shows trim handles on clip edges
  - Dragging handles adjusts in/out points
  - Preview reflects trimmed result
  - Clip duration updates accordingly

## Functional Requirements

1. The system must show trim handles when a clip is selected
2. The system must allow dragging left handle to adjust start point
3. The system must allow dragging right handle to adjust end point
4. The system must update clip duration in real-time during drag
5. The system must update video preview to show trimmed content
6. The system must prevent handles from crossing over each other
7. The system must maintain minimum clip duration (1 second)
8. The system must update timeline clip width to reflect new duration
9. The system must provide visual feedback during drag operations
10. The system must save trim points to clip data

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

- Use mouse event handlers for drag operations
- Calculate time positions from pixel coordinates
- Update clip data in MediaLibraryContext
- Implement smooth drag with requestAnimationFrame
- Handle edge cases (minimum duration, maximum duration)
- Update timeline rendering after trim changes

## Success Metrics

- Trim handles are easy to grab and drag
- Real-time preview updates smoothly
- Minimum duration constraint is enforced
- Timeline updates immediately after trim
- Trim operations feel responsive and intuitive

## Open Questions

- Should we show time values during drag?
- What's the minimum clip duration we should allow?
- Should we snap to specific time intervals?
- How should we handle very short clips?

## Data Flow Integration

This feature implements the **Trim Flow** from the main data flow:

```
User → Renderer: Drag Trim Handle
Renderer → Renderer: Track Mouse Movement
Renderer → Renderer: Calculate New In/Out Point
Renderer → Renderer: Update Clip in MediaLibraryContext
Renderer → Renderer: Re-render Timeline Clip
Renderer → Renderer: Update Preview to Show Trim
```

**Key Components:**
- TrimEditor component (trim handle management)
- ClipBlock component (updated with trim handles)
- MediaLibraryContext (trim data storage)
- Mouse event handlers (drag operations)

**State Management:**
- Clip trim data (inPoint, outPoint, duration)
- Real-time preview updates
- Timeline re-rendering after changes
- Drag state management (isDragging, dragHandle)
