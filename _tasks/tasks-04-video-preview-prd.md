# Tasks: 04 - Video Preview & Playback - Multi-Clip Support

## Relevant Files

- `src/utils/timelineSequence.ts` - Timeline sequence utilities for mapping timeline time to clip positions
- `src/types/timeline.ts` - TypeScript interfaces for sequence data structures and multi-clip support
- `src/contexts/MediaLibraryContext.tsx` - Enhanced context with clip sequence state management
- `src/components/VideoPreview.tsx` - Updated component for dynamic clip switching during playback
- `src/contexts/TimelineContext.tsx` - Enhanced context for multi-clip playback and synchronization
- `src/components/Timeline.tsx` - Updated timeline component for multi-clip support and gap handling
- `src/hooks/useTimeline.ts` - Enhanced timeline hook for multi-clip functionality
- `src/components/GapIndicator.tsx` - New component for displaying gaps between clips

## Tasks

- [ ] 1.0 Create Timeline Sequence Management System
  - [x] 1.1 Create `src/utils/timelineSequence.ts` with core mapping functions
  - [x] 1.2 Implement `buildClipSequence()` to create ordered clip array from MediaLibraryContext
  - [x] 1.3 Implement `mapTimelineToClip()` to convert timeline time to clip ID and local time
  - [x] 1.4 Implement `mapClipToTimeline()` to convert clip ID and local time to timeline time
  - [x] 1.5 Implement `findClipAtTime()` to get current clip at timeline position
  - [x] 1.6 Implement `calculateClipStartTime()` to get cumulative start time for each clip
  - [x] 1.7 Add gap detection between clips
  - [x] 1.8 Update `src/types/timeline.ts` with sequence data structures and interfaces

- [x] 2.0 Enhance MediaLibraryContext for Multi-Clip Support
  - [x] 2.1 Add `clipSequence` state to MediaLibraryContext
  - [x] 2.2 Add `currentPlayingClipId` state for active clip tracking
  - [x] 2.3 Add `rebuildSequence()` method to update sequence when clips change
  - [x] 2.4 Add `getClipAtTime()` method for timeline-to-clip mapping
  - [x] 2.5 Add `getTimelinePosition()` method for clip-to-timeline mapping
  - [x] 2.6 Add sequence validation and error handling
  - [x] 2.7 Add automatic sequence rebuilding when clips are added/removed
  - [x] 2.8 Add sequence persistence with localStorage
  - [x] 2.9 Update context types and interfaces

- [x] 3.0 Update VideoPreview Component for Dynamic Clip Switching
  - [x] 3.1 Add `currentClipId` state to VideoPreview component
  - [x] 3.2 Implement `switchToClip()` method for changing video source
  - [x] 3.3 Add `seekToLocalTime()` method for precise time positioning
  - [x] 3.4 Implement video loading state management
  - [x] 3.5 Add error handling for video load failures
  - [x] 3.6 Prevent circular update loops with ref-based flags
  - [x] 3.7 Add `syncWithTimeline()` method for timeline position updates
  - [x] 3.8 Implement `onVideoTimeUpdate()` handler for video-to-timeline sync
  - [x] 3.9 Add throttling for frequent updates to prevent stuttering
  - [x] 3.10 Implement smooth seeking across clip boundaries
  - [x] 3.11 Add gap handling UI when between clips
  - [x] 3.12 Update play/pause logic to work with multi-clip sequences
  - [x] 3.13 Add keyboard shortcut support (spacebar, arrow keys)

- [ ] 4.0 Implement Multi-Clip Playback Logic
  - [ ] 4.1 Update TimelineContext playback loop for multi-clip support
  - [ ] 4.2 Implement `checkClipChange()` method in playback loop
  - [ ] 4.3 Add automatic video source switching during playback
  - [ ] 4.4 Implement seamless seeking to local time in new clips
  - [ ] 4.5 Add playback state management for clip transitions
  - [ ] 4.6 Implement smooth transitions between clips
  - [ ] 4.7 Add preloading for adjacent clips (optional optimization)
  - [ ] 4.8 Handle rapid seeking across multiple clips
  - [ ] 4.9 Implement clip boundary detection and handling
  - [ ] 4.10 Add transition loading states and feedback

- [ ] 5.0 Add Timeline-Preview Synchronization and Controls
  - [ ] 5.1 Implement bidirectional sync between timeline and video preview
  - [ ] 5.2 Add circular update prevention with ref-based flags
  - [ ] 5.3 Implement throttled updates to prevent excessive re-renders
  - [ ] 5.4 Add sync state management to prevent conflicts
  - [ ] 5.5 Implement priority system for conflicting updates
  - [ ] 5.6 Update timeline click-to-seek for multi-clip support
  - [ ] 5.7 Implement accurate timeline-to-clip time mapping
  - [ ] 5.8 Add seeking across clip boundaries
  - [ ] 5.9 Implement keyboard navigation (arrow keys, home/end)
  - [ ] 5.10 Add seeking with gap handling
  - [ ] 5.11 Create GapIndicator component for gap visualization
  - [ ] 5.12 Add gap interaction (click-to-skip, highlighting)
  - [ ] 5.13 Implement error handling for video loading failures
  - [ ] 5.14 Add edge case handling (empty timeline, single clip, short clips)
