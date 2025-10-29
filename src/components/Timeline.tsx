import React, { useRef, useEffect, useState } from 'react';
import { useMediaLibrary } from '../contexts/MediaLibraryContext';
import { useTimeline } from '../hooks/useTimeline';
import { VideoClip } from '../types/ipc';
import { formatTime } from '../utils/timelineUtils';
import ClipBlock from './ClipBlock';
import TimeMarkers from './TimeMarker';
import EmptyState from './EmptyState';
import Playhead, { PlayheadContainer } from './Playhead';

interface TimelineProps {
  onClipSelect?: (clip: VideoClip) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
  onClipSelect
}) => {
  const mediaLibrary = useMediaLibrary();
  const { state: mediaState, getClipSequence } = mediaLibrary;
  const { clips, selectedClipId } = mediaState;
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(800);
  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);
  
  const {
    state: timelineState,
    playhead,
    config,
    handleTimelineClick,
    handleKeyDown,
    getCurrentTimeDisplay,
    getTotalDurationDisplay,
    getProgressPercentage,
    timeToPixels,
    pixelsToTime,
    setTimelineWidth: setTimelineWidthContext,
    setTotalDuration,
    getVisibleTimeRange,
    setPlayheadPosition,
    updatePlayhead,
    zoomIn,
    zoomOut,
    zoomToFit,
  } = useTimeline();

  // Get total duration from clip sequence
  const clipSequence = React.useMemo(() => {
    if (!getClipSequence) {
      return { totalDuration: 0, items: [], gaps: [], isEmpty: true };
    }
    try {
      return getClipSequence();
    } catch (error) {
      console.error('Error calling getClipSequence:', error);
      return { totalDuration: 0, items: [], gaps: [], isEmpty: true };
    }
  }, [getClipSequence, clips]);
  
  const totalDuration = clipSequence.totalDuration;

  // Update timeline width when container resizes
  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        const width = timelineRef.current.offsetWidth;
        setTimelineWidth(width);
        setTimelineWidthContext(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [setTimelineWidthContext]);

  // Update total duration when clips change
  useEffect(() => {
    setTotalDuration(totalDuration);
  }, [totalDuration, setTotalDuration]);

  // Timeline position changes are handled internally

  const handleClipClick = (clip: VideoClip) => {
    console.log('[VIDEO_SYNC] Clip clicked:', {
      clipId: clip.id,
      fileName: clip.fileName,
      action: 'Setting both selectedClipId and currentPlayingClipId'
    });
    
    // Select the clip in the media library (for editing/trimming)
    mediaLibrary.selectClip(clip.id);
    // Also set as the current playing clip for preview
    mediaLibrary.setCurrentPlayingClip(clip.id);
    
    console.log('[VIDEO_SYNC] After setting:', {
      selectedClipId: mediaState.selectedClipId,
      currentPlayingClipId: mediaState.currentPlayingClipId
    });
    
    // Also notify parent component
    onClipSelect?.(clip);
  };

  const handleClipHover = (clip: VideoClip | null) => {
    setHoveredClipId(clip?.id || null);
  };

  const handleClipDoubleClick = (clip: VideoClip) => {
    // TODO: Implement double-click action (e.g., open in preview)
    console.log('Double-clicked clip:', clip.fileName);
  };

  const handleClipRemove = (clip: VideoClip) => {
    console.log('Remove clip:', clip.fileName);
    // Remove the clip from the media library
    mediaLibrary.removeClip(clip.id);
  };

  const handlePlayheadDrag = (deltaX: number) => {
    const deltaTime = pixelsToTime(deltaX);
    const newTime = Math.max(0, Math.min(timelineState.playheadPosition + deltaTime, totalDuration));
    setPlayheadPosition(newTime);
  };

  const handlePlayheadDragStart = () => {
    updatePlayhead({ isDragging: true });
  };

  const handlePlayheadDragEnd = () => {
    updatePlayhead({ isDragging: false });
  };


  const handleTimelineContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const clickedOnClip = target.closest('[data-clip-id]');
    
    // Calculate the clicked position BEFORE calling handleTimelineClick
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickedTime = pixelsToTime(clickX);
    
    console.log('[VIDEO_SYNC] Timeline clicked:', {
      clickedOnClip: !!clickedOnClip,
      currentSelectedClipId: selectedClipId,
      currentPlayingClipId: mediaState.currentPlayingClipId,
      clickedTime: clickedTime.toFixed(2)
    });
    
    // Only deselect if clicking on empty timeline area (not on a clip)
    if (!clickedOnClip && selectedClipId) {
      console.log('[VIDEO_SYNC] Clicking empty space - deselecting clip');
      mediaLibrary.selectClip(null);
    }
    
    // Always allow timeline click to move playhead
    handleTimelineClick(event);
    
    // Get the clip at the CLICKED position (not the old playhead position)
    const clipAtPosition = mediaLibrary.getClipAtTime(clickedTime);
    
    console.log('[VIDEO_SYNC] After playhead move:', {
      clickedTime: clickedTime.toFixed(2),
      clipAtPosition: clipAtPosition.clipId,
      shouldUpdatePlayingClip: true
    });
  };

  const handleTimelineKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    handleKeyDown(event);
  };


  // Calculate clip positions for timeline display using clip sequence
  const getClipPositions = () => {
    return clipSequence.items.map((item) => {
      const x = timeToPixels(item.startTime) - timelineState.scrollPosition;
      const width = timeToPixels(item.endTime - item.startTime);
      const position = { x, width, startTime: item.startTime };
      return { clip: item.clip, position };
    });
  };

  const clipPositions = getClipPositions();
  const visibleRange = getVisibleTimeRange();

  // Show empty state if no clips
  if (clips.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-800 text-lg font-semibold">Timeline</h3>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg" style={{ height: `${config.timelineHeight}px` }}>
          <EmptyState
            onImportClick={() => {/* TODO: Trigger import */}}
            title="No Video Clips"
            description="Import video files to start editing your timeline"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Timeline Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-800 text-lg font-semibold">
          Timeline ({clips.length} clips)
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Current: {getCurrentTimeDisplay()}</span>
          <span>Total: {getTotalDurationDisplay()}</span>
          <span>Zoom: {Math.round(timelineState.zoomLevel * 100)}%</span>
        </div>
      </div>

      {/* Timeline Container */}
      <div 
        ref={timelineRef}
        className="relative bg-white border border-gray-200 rounded-lg overflow-hidden"
        style={{ height: `${config.timelineHeight}px` }}
      >
        {/* Timeline Track */}
        <PlayheadContainer
          onPlayheadDrag={handlePlayheadDrag}
          onPlayheadDragStart={handlePlayheadDragStart}
          onPlayheadDragEnd={handlePlayheadDragEnd}
        >
          <div
            className="relative w-full h-full cursor-pointer select-none"
            onClick={handleTimelineContainerClick}
            onKeyDown={handleTimelineKeyDown}
            role="slider"
            aria-label="Video timeline"
            aria-valuemin={0}
            aria-valuemax={totalDuration}
            aria-valuenow={timelineState.playheadPosition}
            tabIndex={0}
            style={{ 
              transform: `translateX(-${timelineState.scrollPosition}px)`,
              width: `${timeToPixels(totalDuration)}px`,
              minWidth: '100%'
            }}
          >
          {/* Time Markers */}
          <div className="absolute top-0 left-0 w-full h-4 border-b border-gray-200">
            <TimeMarkers
              startTime={visibleRange.start}
              endTime={visibleRange.end}
              interval={config.gridInterval}
              pixelsPerSecond={timelineState.pixelsPerSecond}
              height={16}
              showLabels={true}
              majorInterval={5}
            />
          </div>

          {/* Clip Blocks */}
          <div className="absolute top-4 left-0 w-full" style={{ height: `${config.clipHeight}px` }}>
            {clipPositions.map(({ clip, position }) => (
              <ClipBlock
                key={clip.id}
                clip={clip}
                position={position}
                isSelected={selectedClipId === clip.id}
                isHovered={hoveredClipId === clip.id}
                isVisible={position.x + position.width > 0 && position.x < timelineWidth}
                onSelect={handleClipClick}
                onHover={handleClipHover}
                onDoubleClick={handleClipDoubleClick}
                onRemove={handleClipRemove}
                config={{
                  clipHeight: config.clipHeight,
                  minWidth: 20,
                }}
                pixelsPerSecond={timelineState.pixelsPerSecond}
                showTrimHandles={true}
              />
            ))}
          </div>


          {/* Playhead */}
          <Playhead
            position={timeToPixels(timelineState.playheadPosition)}
            height={config.timelineHeight}
            isVisible={playhead.isVisible}
            isDragging={playhead.isDragging}
            color={config.playheadColor}
          />

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          </div>
        </PlayheadContainer>

        {/* Scroll Indicators */}
        {timelineState.scrollPosition > 0 && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-gray-400 rounded-r opacity-50" />
        )}
        {timelineState.scrollPosition < timeToPixels(totalDuration) - timelineWidth && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-gray-400 rounded-l opacity-50" />
        )}
      </div>

      {/* Timeline Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={zoomOut}
            disabled={timelineState.zoomLevel <= config.minZoom}
            title="Zoom out"
          >
            Zoom Out
          </button>
          <button
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={zoomIn}
            disabled={timelineState.zoomLevel >= config.maxZoom}
            title="Zoom in"
          >
            Zoom In
          </button>
          <button
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors duration-200"
            onClick={zoomToFit}
            title="Zoom to fit all content"
          >
            Fit
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          {formatTime(visibleRange.start)} - {formatTime(visibleRange.end)}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
