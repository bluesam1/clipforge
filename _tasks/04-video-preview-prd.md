# 04 - Video Preview & Playback - Product Requirements Document

## Introduction/Overview

This feature provides video preview functionality with playback controls, allowing users to watch their imported video clips and see the current frame at the playhead position. It enables real-time preview of the edit sequence with seamless multi-clip playback and timeline synchronization.

**Goal:** Enable users to preview video content with smooth playback controls, synchronized audio/video display, and automatic switching between multiple clips on the timeline.

## Goals

1. Display video preview at current playhead position
2. Implement play/pause controls
3. Synchronize video with timeline playhead
4. Provide smooth playback experience
5. Support keyboard shortcuts for playback
6. Enable seamless multi-clip playback with automatic switching
7. Handle gaps between clips with appropriate UI feedback
8. Support accurate timeline-to-clip time mapping

## User Stories

**US-006: Preview Video Content**
- As a user, I want to watch my video clips in a preview window so that I can see the current frame at the playhead position.
- **Acceptance Criteria:**
  - Preview window displays video at playhead position
  - Preview updates when playhead moves
  - Video renders at reasonable quality
  - Preview window has defined dimensions

**US-007: Play/Pause Video**
- As a user, I want to play and pause the timeline so that I can watch my edit in real-time.
- **Acceptance Criteria:**
  - Play button starts playback from current playhead
  - Pause button stops playback
  - Playhead advances during playback
  - Audio plays synchronized with video
  - Spacebar keyboard shortcut works

**US-008: Multi-Clip Playback**
- As a user, I want to play through multiple clips sequentially so that I can preview my entire edit sequence.
- **Acceptance Criteria:**
  - Video automatically switches to the next clip when current clip ends
  - Playback continues seamlessly across clip boundaries
  - Timeline position accurately reflects current clip and time
  - Gaps between clips show appropriate empty state
  - Clicking on timeline seeks to correct clip and time position

**US-009: Timeline-to-Preview Sync**
- As a user, I want the video preview to always show the correct clip and time position based on the timeline playhead.
- **Acceptance Criteria:**
  - Preview shows the clip at the current timeline position
  - Seeking on timeline immediately updates video preview
  - Video time updates are reflected in timeline playhead position
  - No circular update loops or stuttering
  - Smooth transitions when switching between clips

## Functional Requirements

1. The system must display a video preview window with defined dimensions
2. The system must show video content at the current playhead position
3. The system must update preview when playhead moves (scrubbing)
4. The system must provide play and pause buttons
5. The system must advance playhead during playback
6. The system must play audio synchronized with video
7. The system must support spacebar keyboard shortcut for play/pause
8. The system must maintain video quality during preview
9. The system must handle video seeking smoothly
10. The system must show loading state when switching clips
11. The system must automatically switch between clips during playback
12. The system must map timeline time to correct clip and local time
13. The system must handle gaps between clips with appropriate UI
14. The system must prevent circular update loops between timeline and preview
15. The system must support seamless seeking across clip boundaries
16. The system must maintain clip sequence state in MediaLibraryContext
17. The system must update video source dynamically based on timeline position

## Non-Goals (Out of Scope)

- Video editing controls
- Timeline editing functionality
- Multiple video previews
- Video effects or filters
- Frame-by-frame navigation
- Audio waveform display

## Design Considerations

- Preview window: 16:9 aspect ratio, minimum 640x360
- Playback controls: Standard play/pause buttons
- Loading states: Spinner or placeholder during video loading
- Responsive: Scale with window size
- Keyboard shortcuts: Spacebar for play/pause

## Technical Considerations

- Use HTML5 video element for preview
- Implement requestAnimationFrame for smooth playhead updates
- Handle video loading and error states
- Use video.currentTime for seeking
- Implement proper cleanup on component unmount
- Handle different video formats and codecs

## Timeline-Preview Synchronization Architecture

### Key Concepts

**Timeline Time vs Clip Time:**
- **Timeline Time**: Global time position from 0 to total duration (sum of all clips)
- **Clip Time**: Local time within an individual clip (0 to clip.duration)
- **Clip Start Time**: When this clip begins on the timeline (cumulative time of previous clips)

Example:
```
Clip 1: 0-10s (timeline time)  -> 0-10s (clip time)
Clip 2: 10-25s (timeline time) -> 0-15s (clip time)
Clip 3: 25-40s (timeline time) -> 0-15s (clip time)
```

### Implementation Components

1. **Timeline Sequence Manager** (`src/utils/timelineSequence.ts`)
   - Build clip sequence from imported clips
   - Map timeline time to clip and local time
   - Handle gap detection between clips

2. **Enhanced MediaLibraryContext**
   - Store clip sequence state
   - Track current playing clip ID
   - Rebuild sequence when clips change

3. **Dynamic VideoPreview Component**
   - Switch video sources based on timeline position
   - Handle seeking to correct clip and time
   - Show gap UI when between clips
   - Prevent circular update loops

4. **Updated Timeline Component**
   - Use clip sequence for positioning
   - Support accurate timeline-to-clip mapping
   - Handle seeking across clip boundaries

### Data Flow

```
Timeline Position Change → Find Target Clip → Switch Video Source → Seek to Local Time
Video Time Update → Convert to Timeline Time → Update Playhead Position
Clip Ended → Move to Next Clip → Continue Playback
```

### Edge Cases

- Empty timeline: Show empty state
- Single clip: Works same as multiple clips
- Very short clips (< 1 second): Ensure correct display and playback
- Rapid seeking: Throttle clip switches to prevent flicker
- Video load errors: Show error state, continue to next clip
- Playhead at exact clip boundary: Prefer next clip over previous

## Success Metrics

- Video preview updates smoothly during scrubbing
- Playback maintains 30fps minimum
- Audio and video stay synchronized
- Keyboard shortcuts work reliably
- Video quality is acceptable for preview
- Multi-clip playback transitions seamlessly
- Timeline-to-preview sync is accurate and responsive
- No stuttering or circular update loops
- Gap handling provides clear user feedback

## Open Questions

- Should we support fullscreen preview?
- What's the minimum video resolution we should handle?
- Should we show video metadata in the preview area?
- How should we handle videos with different aspect ratios?
- Should we pre-load adjacent clips for smoother transitions?
- How should we handle very large numbers of clips (performance)?
- Should we support custom clip ordering or only sequential placement?

## Data Flow Integration

This feature implements the **Enhanced Playback Flow** with multi-clip support:

```
User → Renderer: Click Play Button
Renderer → Renderer: Start Playback Loop
loop Every Frame (requestAnimationFrame)
    Renderer → Renderer: Update Playhead Position
    Renderer → Renderer: Check Current Clip at Timeline Position
    if Clip Changed
        Renderer → Renderer: Switch Video Source
        Renderer → Renderer: Seek to Local Time in New Clip
    else
        Renderer → Renderer: Update VideoPreview currentTime
    end
    Renderer → Renderer: Render Playhead on Timeline
end
User → Renderer: Click Pause / Spacebar
Renderer → Renderer: Stop Playback Loop

User → Renderer: Click Timeline Position
Renderer → Renderer: Calculate Target Clip and Local Time
Renderer → Renderer: Switch Video Source if Needed
Renderer → Renderer: Seek to Local Time
Renderer → Renderer: Update Playhead Position
```

**Key Components:**
- VideoPreview component (dynamic clip switching)
- Timeline component (clip sequence positioning)
- MediaLibraryContext (clip sequence state)
- TimelineSequence utilities (time mapping)
- Video element integration (HTML5 video)

**State Management:**
- MediaLibraryContext for clip sequence and current playing clip
- TimelineContext for playhead position and playback state
- Real-time synchronization between preview and timeline
- Prevention of circular update loops
