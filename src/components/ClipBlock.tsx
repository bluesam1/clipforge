import React from 'react';
import { VideoClip } from '../types/ipc';
import { ClipPosition } from '../types/timeline';
import { formatTime } from '../utils/timelineUtils';
import { useMediaLibrary } from '../contexts/MediaLibraryContext';
import TrimEditor from './TrimEditor';

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
  pixelsPerSecond: number;
  showTrimHandles?: boolean;
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
  pixelsPerSecond,
  showTrimHandles = true,
}) => {
  const { updateClipTrim } = useMediaLibrary();
  if (!isVisible) return null;

  const handleClick = (e: React.MouseEvent) => {
    // Select clip for editing/trimming, but don't stop propagation
    // This allows the timeline click to also fire and move the playhead
    onSelect(clip);
    // Don't use e.stopPropagation() - let the event bubble to timeline
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
    console.log('Remove button clicked for clip:', clip.fileName);
    onRemove?.(clip);
  };

  const handleTrimChange = (clipId: string, inPoint: number, outPoint: number) => {
    updateClipTrim(clipId, inPoint, outPoint);
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
      data-clip-id={clip.id}
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
          className="ml-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 relative z-50 shadow-md"
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

      {/* Trim Editor */}
      {isSelected && showTrimHandles && (
        <TrimEditor
          clip={clip}
          clipPosition={{
            clipId: clip.id,
            startTime: position.startTime,
            endTime: position.startTime + clip.duration,
            duration: clip.duration,
            x: position.x,
            width: position.width,
            isSelected,
            isHovered,
          }}
          pixelsPerSecond={pixelsPerSecond}
          isVisible={isVisible}
          onTrimChange={handleTrimChange}
        />
      )}
    </div>
  );
};

export default ClipBlock;
