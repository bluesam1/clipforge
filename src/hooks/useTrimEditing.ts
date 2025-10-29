import { useReducer, useCallback, useMemo } from 'react';
import { VideoClip } from '../types/ipc';
import { TrimState, TrimAction } from '../types/timeline';
import { applyTrimConstraints, pixelsToTime } from '../utils/timelineUtils';

// Initial trim state
const initialTrimState: TrimState = {
  isDragging: false,
  dragHandle: null,
  dragStartPosition: 0,
  dragStartTime: 0,
  currentPosition: 0,
  currentTime: 0,
  clipId: null,
  isValid: true,
  constraintViolation: null,
};

// Trim reducer
function trimReducer(state: TrimState, action: TrimAction): TrimState {
  switch (action.type) {
    case 'START_DRAG':
      return {
        ...state,
        isDragging: true,
        dragHandle: action.payload.handleType,
        dragStartPosition: action.payload.startPosition,
        dragStartTime: action.payload.startTime,
        currentPosition: action.payload.startPosition,
        currentTime: action.payload.startTime,
        clipId: action.payload.clipId,
        isValid: true,
        constraintViolation: null,
      };

    case 'UPDATE_DRAG':
      return {
        ...state,
        currentPosition: action.payload.position,
        currentTime: action.payload.time,
      };

    case 'END_DRAG':
      return {
        ...state,
        isDragging: false,
        dragHandle: null,
        dragStartPosition: 0,
        dragStartTime: 0,
        currentPosition: 0,
        currentTime: 0,
        clipId: null,
        isValid: true,
        constraintViolation: null,
      };

    case 'SET_VALIDITY':
      return {
        ...state,
        isValid: action.payload.isValid,
        constraintViolation: action.payload.violation,
      };

    case 'RESET_TRIM':
      return initialTrimState;

    default:
      return state;
  }
}

interface UseTrimEditingProps {
  clip: VideoClip;
  pixelsPerSecond: number;
  onTrimChange: (clipId: string, inPoint: number, outPoint: number) => void;
}

export function useTrimEditing(clip: VideoClip, pixelsPerSecond: number, onTrimChange: (clipId: string, inPoint: number, outPoint: number) => void) {
  const [trimState, dispatch] = useReducer(trimReducer, initialTrimState);

  const startDrag = useCallback((handleType: 'start' | 'end', startPosition: number, startTime: number) => {
    // Store the current clip values when drag starts
    const currentInPoint = clip.inPoint;
    const currentOutPoint = clip.outPoint;
    
    dispatch({
      type: 'START_DRAG',
      payload: {
        handleType,
        clipId: clip.id,
        startPosition,
        startTime: handleType === 'start' ? currentInPoint : currentOutPoint,
      },
    });
  }, [clip.id, clip.inPoint, clip.outPoint]);

  const updateDrag = useCallback((position: number) => {
    if (!trimState.isDragging || !trimState.dragHandle) return;

    // Calculate the time based on the position change from the original drag start
    const positionDelta = position - trimState.dragStartPosition;
    const timeDelta = pixelsToTime(positionDelta, pixelsPerSecond);
    
    // Calculate the new time based on the handle type
    let newTime: number;
    if (trimState.dragHandle === 'start') {
      // For start handle, add the time delta to the original inPoint
      newTime = clip.inPoint + timeDelta;
    } else {
      // For end handle, add the time delta to the original outPoint
      newTime = clip.outPoint + timeDelta;
    }

    // Apply constraints
    const constraints = applyTrimConstraints(newTime, clip, trimState.dragHandle);
    
    dispatch({
      type: 'UPDATE_DRAG',
      payload: {
        position,
        time: constraints.time,
      },
    });

    dispatch({
      type: 'SET_VALIDITY',
      payload: {
        isValid: constraints.isValid,
        violation: constraints.violation,
      },
    });

    // Update the clip if the constraint is valid
    if (constraints.isValid) {
      const newInPoint = trimState.dragHandle === 'start' ? constraints.time : clip.inPoint;
      const newOutPoint = trimState.dragHandle === 'end' ? constraints.time : clip.outPoint;
      
      onTrimChange(clip.id, newInPoint, newOutPoint);
    }
  }, [trimState.isDragging, trimState.dragHandle, trimState.dragStartPosition, clip, pixelsPerSecond, onTrimChange]);

  const endDrag = useCallback(() => {
    if (trimState.isDragging && trimState.isValid) {
      // Final update to ensure the trim is applied
      const finalInPoint = trimState.dragHandle === 'start' ? trimState.currentTime : clip.inPoint;
      const finalOutPoint = trimState.dragHandle === 'end' ? trimState.currentTime : clip.outPoint;
      
      onTrimChange(clip.id, finalInPoint, finalOutPoint);
    }
    
    dispatch({ type: 'END_DRAG' });
  }, [trimState.isDragging, trimState.isValid, trimState.dragHandle, trimState.currentTime, clip.id, onTrimChange]);

  const resetTrim = useCallback(() => {
    dispatch({ type: 'RESET_TRIM' });
  }, []);

  // Memoized values
  const isValid = useMemo(() => trimState.isValid, [trimState.isValid]);
  const violation = useMemo(() => trimState.constraintViolation, [trimState.constraintViolation]);

  return {
    trimState,
    startDrag,
    updateDrag,
    endDrag,
    resetTrim,
    isValid,
    violation,
  };
}
