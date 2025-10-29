import React, { useCallback, useRef, useState } from 'react';
import { TrimHandleProps } from '../types/timeline';

const TrimHandle: React.FC<TrimHandleProps> = ({
  type,
  clipId,
  position,
  isVisible,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startPosition = e.clientX;
    onDragStart(type, clipId, startPosition);
  }, [type, clipId, onDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      onDragMove(e.clientX);
    }
  }, [isDragging, onDragMove]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      onDragEnd();
    }
  }, [isDragging, onDragEnd]);

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseEnterLocal = useCallback(() => {
    setIsHovered(true);
    onMouseEnter?.();
  }, [onMouseEnter]);

  const handleMouseLeaveLocal = useCallback(() => {
    setIsHovered(false);
    onMouseLeave?.();
  }, [onMouseLeave]);

  if (!isVisible) return null;

  const isStart = type === 'start';
  const handleColor = isStart ? 'bg-blue-500' : 'bg-green-500';
  const hoverColor = isStart ? 'bg-blue-600' : 'bg-green-600';
  const dragColor = isStart ? 'bg-blue-700' : 'bg-green-700';

  const getHandleColor = () => {
    if (isDragging) return dragColor;
    if (isHovered) return hoverColor;
    return handleColor;
  };

  const getHandleSize = () => {
    if (isDragging) return 'w-3 h-full';
    if (isHovered) return 'w-2.5 h-full';
    return 'w-2 h-full';
  };

  const getCursorStyle = () => {
    return isDragging ? 'cursor-ew-resize' : 'cursor-ew-resize';
  };

  return (
    <div
      ref={dragRef}
      className={`absolute top-0 ${getHandleSize()} ${getCursorStyle()} transition-all duration-200 flex items-center justify-center group`}
      style={{
        left: `${position}px`,
        zIndex: isDragging ? 50 : 10,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnterLocal}
      onMouseLeave={handleMouseLeaveLocal}
    >
      {/* Handle visual element */}
      <div
        className={`${getHandleColor()} rounded-sm shadow-lg transition-all duration-200 flex items-center justify-center ${
          isDragging ? 'shadow-2xl' : 'shadow-md'
        }`}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {/* Handle grip lines */}
        <div className="flex flex-col space-y-0.5 opacity-70">
          <div className="w-0.5 h-1 bg-white rounded-full" />
          <div className="w-0.5 h-1 bg-white rounded-full" />
          <div className="w-0.5 h-1 bg-white rounded-full" />
        </div>
      </div>

      {/* Tooltip */}
      {(isHovered || isDragging) && (
        <div
          className={`absolute top-0 transform -translate-y-full -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50 ${
            isStart ? 'left-0' : 'right-0'
          }`}
        >
          {isStart ? 'Start' : 'End'} Handle
          {isDragging && (
            <div className="text-gray-300 text-xs mt-1">
              Drag to adjust
            </div>
          )}
        </div>
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div
          className={`absolute top-0 w-0.5 h-full ${
            isStart ? 'bg-blue-400' : 'bg-green-400'
          } opacity-50`}
          style={{
            left: isStart ? '100%' : '-1px',
          }}
        />
      )}
    </div>
  );
};

export default TrimHandle;
