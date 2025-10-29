# Tasks: 05 - Trim Editing PRD

## Relevant Files

- `src/types/project.ts` - New project data structure interface and file format specification
- `src/contexts/ProjectContext.tsx` - New project management context for save/load operations
- `src/main.ts` - Add project save/load IPC handlers and file system operations
- `src/types/ipc.ts` - Update VideoClip interface to include trim points (inPoint, outPoint)
- `src/contexts/MediaLibraryContext.tsx` - Add trim data management and UPDATE_CLIP_TRIM action
- `src/components/ClipBlock.tsx` - Extend with trim handle integration and selection logic
- `src/components/TrimHandle.tsx` - New reusable drag handle component with visual feedback
- `src/components/TrimEditor.tsx` - New wrapper component managing trim state and interactions
- `src/hooks/useTrimEditing.ts` - New custom hook for drag state and constraint management
- `src/types/timeline.ts` - Add TrimState and TrimAction interfaces
- `src/utils/timelineUtils.ts` - Add trim validation and constraint functions
- `src/components/VideoPreview.tsx` - Update to handle trimmed content display

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npm test` to run the test suite
- Focus on drag interaction testing and constraint validation

## Tasks

- [x] 1.0 Implement Project Persistence System
  - [x] 1.1 Create project data structure interface in `src/types/project.ts`
  - [x] 1.2 Add project file format specification (`.clipforge` JSON format)
  - [x] 1.3 Implement project save functionality in main process (`src/main.ts`)
  - [x] 1.4 Implement project load functionality in main process (`src/main.ts`)
  - [x] 1.5 Add project auto-save mechanism (save on every significant change)
  - [x] 1.6 Create project management context (`src/contexts/ProjectContext.tsx`)
  - [x] 1.7 Add File menu integration (Save Project, Save As, Open Project, Recent Projects)
  - [x] 1.8 Implement project file validation and error handling
  - [x] 1.9 Update MediaLibraryContext to work with project persistence instead of localStorage

- [x] 2.0 Update Data Structures and Types
  - [x] 2.1 Add `inPoint` and `outPoint` fields to `VideoClip` interface in `src/types/ipc.ts`
  - [x] 2.2 Create `TrimState` interface for drag operations in `src/types/timeline.ts`
  - [x] 2.3 Add `TrimAction` types for state management in `src/types/timeline.ts`
  - [x] 2.4 Create `TrimHandleProps` interface for handle component props
  - [x] 2.5 Add `trimmedDuration` calculation utility function in `src/utils/timelineUtils.ts`
  - [x] 2.6 Create trim validation functions for constraints (min/max duration) in `src/utils/timelineUtils.ts`

- [x] 3.0 Implement Trim Handle Components
  - [x] 3.1 Create `TrimHandle` component with drag functionality in `src/components/TrimHandle.tsx`
  - [x] 3.2 Implement visual feedback (colors, hover states, size changes) for trim handles
  - [x] 3.3 Add mouse event handlers (onMouseDown, onMouseMove, onMouseUp) with proper event management
  - [x] 3.4 Create `TrimEditor` wrapper component in `src/components/TrimEditor.tsx`
  - [x] 3.5 Implement `useTrimEditing` custom hook in `src/hooks/useTrimEditing.ts` for drag state management
  - [x] 3.6 Add constraint validation and smooth constraint enforcement in drag operations
  - [x] 3.7 Implement performance optimizations (requestAnimationFrame, useCallback) for smooth dragging

- [x] 4.0 Add Trim State Management
  - [x] 4.1 Add `UPDATE_CLIP_TRIM` action type to MediaLibraryContext reducer
  - [x] 4.2 Implement `updateClipTrim` method in MediaLibraryContext
  - [x] 4.3 Add trim data validation before state updates
  - [x] 4.4 Update trim data persistence to use project system instead of localStorage
  - [x] 4.5 Add trim constraint enforcement (1-second minimum, original duration maximum)
  - [x] 4.6 Update clip selection logic to show/hide trim handles
  - [x] 4.7 Add trim data initialization for existing clips (default inPoint: 0, outPoint: duration)

- [x] 5.0 Integrate Trim Functionality with Timeline
  - [x] 5.1 Extend `ClipBlock` component to include trim handles when selected
  - [x] 5.2 Update `getClipPosition` function to use `trimmedDuration` for width calculations
  - [x] 5.3 Implement trim handle positioning based on clip position and zoom level
  - [x] 5.4 Add coordinate conversion (pixels to time) for trim handle positions
  - [x] 5.5 Update timeline re-rendering after trim changes
  - [x] 5.6 Ensure playhead positioning works correctly with trimmed clips
  - [ ] 5.7 Add visual feedback for constraint violations (red highlight when approaching minimum)
  - [ ] 5.8 Implement smooth animations for handle interactions and transitions

- [x] 6.0 Update Video Preview for Trimmed Content
  - [x] 6.1 Update `VideoPreview` component to handle trimmed content display
  - [x] 6.2 Implement real-time preview updates during trim operations
  - [x] 6.3 Add seeking logic to work with trimmed clip boundaries
  - [x] 6.4 Update clip switching logic to respect trim points
  - [x] 6.5 Implement pause/resume behavior when trim operations start/end
  - [x] 6.6 Add warning display when trimming currently playing clip
  - [ ] 6.7 Optimize preview updates to only affect visible clips
  - [ ] 6.8 Test and validate trim preview accuracy with different video formats
