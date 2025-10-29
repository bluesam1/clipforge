import React, { useCallback, useMemo } from 'react';
import { VideoClip } from '../types/ipc';
import { ClipPosition } from '../types/timeline';
import { useTrimEditing } from '../hooks/useTrimEditing';
import { calculateTrimHandlePositions } from '../utils/timelineUtils';
import TrimHandle from './TrimHandle';

interface TrimEditorProps {
  clip: VideoClip;
  clipPosition: ClipPosition;
  pixelsPerSecond: number;
  isVisible: boolean;
  onTrimChange: (clipId: string, inPoint: number, outPoint: number) => void;
  onTrimStart?: (clipId: string) => void;
  onTrimEnd?: (clipId: string) => void;
  className?: string;
}

const TrimEditor: React.FC<TrimEditorProps> = ({
  clip,
  clipPosition,
  pixelsPerSecond,
  isVisible,
  onTrimChange,
  onTrimStart,
  onTrimEnd,
  className = '',
}) => {
  const {
    trimState,
    startDrag,
    updateDrag,
    endDrag,
    isValid,
    violation,
  } = useTrimEditing(clip, pixelsPerSecond, onTrimChange);

  const handlePositions = useMemo(() => {
    return calculateTrimHandlePositions(clip, clipPosition, pixelsPerSecond);
  }, [clip, clipPosition, pixelsPerSecond]);

  const handleDragStart = useCallback((handleType: 'start' | 'end', clipId: string, startPosition: number) => {
    // Pass the current trim values as startTime (the hook will use the correct one)
    const startTime = handleType === 'start' ? clip.inPoint : clip.outPoint;
    startDrag(handleType, startPosition, startTime);
    onTrimStart?.(clipId);
  }, [clip.inPoint, clip.outPoint, startDrag, onTrimStart]);

  const handleDragMove = useCallback((position: number) => {
    updateDrag(position);
  }, [updateDrag]);

  const handleDragEnd = useCallback(() => {
    endDrag();
    onTrimEnd?.(clip.id);
  }, [endDrag, onTrimEnd, clip.id]);

  const handleMouseEnter = useCallback(() => {
    // Optional: Add hover effects or tooltips
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Optional: Remove hover effects
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Start handle - at left edge of visible clip */}
      <div className="pointer-events-auto">
        <TrimHandle
          type="start"
          clipId={clip.id}
          position={handlePositions.startHandle}
          isVisible={isVisible}
          isDragging={trimState.isDragging && trimState.dragHandle === 'start'}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* End handle */}
      <div className="pointer-events-auto">
        <TrimHandle
          type="end"
          clipId={clip.id}
          position={handlePositions.endHandle}
          isVisible={isVisible}
          isDragging={trimState.isDragging && trimState.dragHandle === 'end'}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* Trim preview overlay */}
      {trimState.isDragging && (
        <div
          className="absolute top-0 h-full bg-blue-200 bg-opacity-30 pointer-events-none"
          style={{
            left: `${handlePositions.startHandle}px`,
            width: `${handlePositions.endHandle - handlePositions.startHandle}px`,
            zIndex: 5,
          }}
        />
      )}

      {/* Constraint violation indicator */}
      {!isValid && violation && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50"
        >
          {violation}
        </div>
      )}

      {/* Trim duration indicator */}
      {trimState.isDragging && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50"
        >
          Duration: {((handlePositions.endHandle - handlePositions.startHandle) / pixelsPerSecond).toFixed(1)}s
        </div>
      )}
    </div>
  );
};

export default TrimEditor;
