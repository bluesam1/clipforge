import React from 'react';

interface PlayheadProps {
  position: number; // Position in pixels
  height: number;
  isVisible: boolean;
  isDragging: boolean;
  color?: string;
  onDragStart?: (event: React.MouseEvent) => void;
  onDrag?: (event: React.MouseEvent) => void;
  onDragEnd?: (event: React.MouseEvent) => void;
}

const Playhead: React.FC<PlayheadProps> = ({
  position,
  height,
  isVisible,
  isDragging,
  color = '#ef4444', // Red color
  onDragStart,
  onDrag,
  onDragEnd,
}) => {
  if (!isVisible) return null;

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onDragStart?.(event);
  };

  const getPlayheadStyles = () => {
    return {
      left: `${position}px`,
      height: `${height}px`,
      backgroundColor: color,
    };
  };

  const getHandleStyles = () => {
    return {
      backgroundColor: color,
    };
  };

  return (
    <div
      className={`absolute top-0 w-0.5 z-10 pointer-events-none ${
        isDragging ? 'pointer-events-auto' : ''
      }`}
      style={getPlayheadStyles()}
    >
      {/* Playhead Line */}
      <div className="w-full h-full" />
      
      {/* Playhead Handle */}
      <div
        className={`absolute -top-1 -left-1 w-2 h-2 rounded-full cursor-grab active:cursor-grabbing ${
          isDragging ? 'scale-110' : 'hover:scale-105'
        } transition-transform duration-150`}
        style={getHandleStyles()}
        onMouseDown={handleMouseDown}
      />
      
      {/* Playhead Shadow */}
      <div
        className="absolute top-0 left-0 w-0.5 h-full opacity-30"
        style={{
          backgroundColor: color,
          filter: 'blur(1px)',
        }}
      />
    </div>
  );
};

interface PlayheadContainerProps {
  children: React.ReactNode;
  onPlayheadDrag?: (deltaX: number) => void;
  onPlayheadDragStart?: () => void;
  onPlayheadDragEnd?: () => void;
}

const PlayheadContainer: React.FC<PlayheadContainerProps> = ({
  children,
  onPlayheadDrag,
  onPlayheadDragStart,
  onPlayheadDragEnd,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStartX, setDragStartX] = React.useState(0);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setIsDragging(true);
      setDragStartX(event.clientX);
      onPlayheadDragStart?.();
    }
  };

  const handleMouseMove = React.useCallback((event: MouseEvent) => {
    if (isDragging) {
      const deltaX = event.clientX - dragStartX;
      onPlayheadDrag?.(deltaX);
    }
  }, [isDragging, dragStartX, onPlayheadDrag]);

  const handleMouseUp = React.useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onPlayheadDragEnd?.();
    }
  }, [isDragging, onPlayheadDragEnd]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="relative w-full h-full"
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
};

export default Playhead;
export { PlayheadContainer };
