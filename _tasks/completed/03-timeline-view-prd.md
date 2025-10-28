# 03 - Timeline View - Product Requirements Document

## Introduction/Overview

This feature creates a visual timeline interface where users can see their imported video clips arranged horizontally with time markers and a playhead for navigation. It provides the foundation for understanding the edit sequence and enables timeline-based interactions.

**Goal:** Display imported video clips in a timeline format with time-based navigation and visual representation of clip duration and position.

## Goals

1. Display imported clips in a horizontal timeline layout
2. Show time markers and duration information
3. Implement playhead navigation
4. Provide visual feedback for timeline interactions
5. Create empty state guidance for new users

## User Stories

**US-004: View Imported Clips in Timeline**
- As a user, I want to see my imported videos arranged in a timeline so that I can visualize my edit sequence.
- **Acceptance Criteria:**
  - Timeline displays horizontally with time markers
  - Each clip shows as a visual block
  - Clip duration is proportional to its length
  - Clips display thumbnail or name
  - Empty state shows helpful instructions

**US-005: Timeline Playhead Navigation**
- As a user, I want to see and move a playhead indicator so that I can navigate to specific moments in my edit.
- **Acceptance Criteria:**
  - Vertical playhead line visible on timeline
  - Playhead position updates during playback
  - User can click timeline to jump playhead
  - Current time is displayed

## Functional Requirements

1. The system must display a horizontal timeline with time markers
2. The system must show imported clips as visual blocks on the timeline
3. The system must make clip width proportional to duration
4. The system must display a vertical playhead line
5. The system must allow clicking on timeline to position playhead
6. The system must show current time position
7. The system must display clip names or thumbnails
8. The system must show empty state when no clips are imported
9. The system must support horizontal scrolling for long timelines
10. The system must update playhead position during playback

## Non-Goals (Out of Scope)

- Video preview functionality
- Trim editing capabilities
- Multiple tracks or layers
- Snap-to-grid functionality
- Timeline zoom controls
- Advanced timeline features (split, copy, paste)

## Design Considerations

- Timeline height: 120px minimum
- Clip blocks: Distinct colors, rounded corners
- Playhead: Red vertical line, always visible
- Time markers: Every 1-5 seconds depending on zoom
- Empty state: Clear instructions and visual guidance
- Responsive: Adapt to different window sizes

## Technical Considerations

- Use DOM-based implementation (flexbox/grid)
- Implement smooth scrolling
- Use requestAnimationFrame for playhead updates
- Store timeline state in React context
- Handle mouse events for playhead positioning
- Calculate time positions based on pixel coordinates

## Success Metrics

- Timeline accurately represents clip durations
- Playhead navigation is smooth and responsive
- Empty state provides clear guidance
- Timeline scrolls smoothly for long content
- Visual feedback is immediate and clear

## Open Questions

- What should be the default time scale (seconds per pixel)?
- Should we show frame-level precision or just seconds?
- How should we handle very short clips (< 1 second)?
- Should the timeline auto-zoom to fit content?

## Data Flow Integration

This feature implements parts of the **Playback Flow** and **Trim Flow** from the main data flow:

**Playback Flow Integration:**
```
User → Renderer: Click Play Button
Renderer → Renderer: Start Playback Loop
loop Every Frame (requestAnimationFrame)
    Renderer → Renderer: Update Playhead Position
    Renderer → Renderer: Render Playhead on Timeline
end
```

**Timeline State Management:**
- TimelineContext for sequence and playhead state
- MediaLibraryContext integration for clip data
- Real-time playhead position updates
- Mouse interaction handling for navigation

**Key Components:**
- Timeline component (main timeline display)
- Playhead component (vertical line indicator)
- ClipBlock component (individual clip representation)
- TimeMarker component (time scale indicators)
- EmptyState component (guidance when no clips)
