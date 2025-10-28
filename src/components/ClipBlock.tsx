import React from 'react';
import { VideoClip } from '../types/ipc';
import { formatTime } from '../utils/timelineUtils';

interface ClipBlockProps {
  clip: VideoClip;
  position: {
    x: number;
    width: number;
    startTime: number;
  };
  isSelected: boolean;
  isHovered: boolean;
  isVisible: boolean;
  onSelect: (clip: VideoClip) => void;
  onHover: (clip: VideoClip | null) => void;
  onDoubleClick?: (clip: VideoClip) => void;
  onRemove?: (clip: VideoClip) => void;
  config: {
    clipHeight: number;
    minWidth: number;
  };
}

const ClipBlock: React.FC<ClipBlockProps> = ({
  clip,
  position,
  isSelected,
  isHovered,
  isVisible,
  onSelect,
  onHover,
  onDoubleClick,
  onRemove,
  config,
}) => {
  if (!isVisible) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(clip);
  };

  const handleMouseEnter = () => {
    onHover(clip);
  };

  const handleMouseLeave = () => {
    onHover(null);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(clip);
  };

  const getClipColor = () => {
    if (isSelected) return 'bg-blue-600';
    if (isHovered) return 'bg-blue-500';
    return 'bg-blue-400';
  };

  const getTextColor = () => {
    return 'text-white';
  };

  const getShadowClass = () => {
    if (isSelected) return 'shadow-lg';
    if (isHovered) return 'shadow-md';
    return 'shadow-sm';
  };

  return (
    <div
      className={`absolute top-0 h-full rounded cursor-pointer transition-all duration-200 flex items-center px-2 group ${getClipColor()} ${getTextColor()} ${getShadowClass()}`}
      style={{
        left: `${position.x}px`,
        width: `${Math.max(position.width, config.minWidth)}px`,
        height: `${config.clipHeight}px`,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${clip.fileName} (${formatTime(clip.duration)})`}
    >
      {/* Clip Content */}
      <div className="flex-1 min-w-0 flex items-center">
        <span className="text-xs font-medium truncate">
          {clip.fileName}
        </span>
      </div>

      {/* Duration Badge */}
      <div className="ml-2 px-1 py-0.5 bg-black bg-opacity-20 rounded text-xs font-medium">
        {formatTime(clip.duration)}
      </div>

      {/* Remove Button */}
      {onRemove && (
        <button
          className="ml-2 w-4 h-4 bg-black bg-opacity-20 hover:bg-opacity-40 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={handleRemove}
          title={`Remove ${clip.fileName}`}
        >
          ×
        </button>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
      )}

      {/* Hover Indicator */}
      {isHovered && !isSelected && (
        <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
      )}
    </div>
  );
};

export default ClipBlock;
