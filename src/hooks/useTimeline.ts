// Custom hook for timeline interactions

import { useCallback, useRef, useEffect } from 'react';
import { useTimeline as useTimelineContext } from '../contexts/TimelineContext';
import { 
  snapToGrid, 
  clamp, 
  formatTime, 
  calculateOptimalGridInterval,
  getNextSnapPosition 
} from '../utils/timelineUtils';

export function useTimeline() {
  const timelineContext = useTimelineContext();
  const animationFrameRef = useRef<number>();
  const isDraggingRef = useRef(false);

  // Handle timeline click to position playhead
  const handleTimelineClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const time = timelineContext.pixelsToTime(clickX);
    
    // Snap to grid if enabled
    const snappedTime = snapToGrid(
      time, 
      timelineContext.config.gridInterval, 
      timelineContext.config.snapToGrid
    );
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] User clicked timeline - setting playhead to ${snappedTime.toFixed(2)}s (clicked at ${time.toFixed(2)}s)`);
    
    // Set a flag to prevent timeupdate interference (this will be handled by VideoPreview)
    // We can't access userInteractingRef directly here, so we'll rely on VideoPreview's handling
    
    timelineContext.setPlayheadPosition(snappedTime);
  }, [timelineContext]);

  // Handle playhead drag start
  const handlePlayheadDragStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    timelineContext.updatePlayhead({ isDragging: true });
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const time = timelineContext.pixelsToTime(mouseX);
      
      // Clamp to timeline bounds
      const clampedTime = clamp(time, 0, timelineContext.state.totalDuration);
      
      // Snap to grid if enabled
      const snappedTime = snapToGrid(
        clampedTime, 
        timelineContext.config.gridInterval, 
        timelineContext.config.snapToGrid
      );
      
      timelineContext.setPlayheadPosition(snappedTime);
    };
    
    const handleMouseUp = () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] User finished dragging playhead - final position: ${timelineContext.state.playheadPosition.toFixed(2)}s`);
      
      isDraggingRef.current = false;
      timelineContext.updatePlayhead({ isDragging: false });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [timelineContext]);

  // Handle zoom in
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(
      timelineContext.state.zoomLevel * 1.5,
      timelineContext.config.maxZoom
    );
    timelineContext.setZoomLevel(newZoom);
  }, [timelineContext]);

  // Handle zoom out
  const zoomOut = useCallback(() => {
    const newZoom = Math.max(
      timelineContext.state.zoomLevel / 1.5,
      timelineContext.config.minZoom
    );
    timelineContext.setZoomLevel(newZoom);
  }, [timelineContext]);

  // Handle zoom to fit
  const zoomToFit = useCallback(() => {
    if (timelineContext.state.totalDuration > 0) {
      const optimalZoom = calculateOptimalGridInterval(
        timelineContext.state.timelineWidth,
        timelineContext.state.pixelsPerSecond
      );
      timelineContext.setZoomLevel(1.0); // Reset to default
    }
  }, [timelineContext]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 10 : 1; // 10 seconds with Shift, 1 second without
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        const prevTime = Math.max(0, timelineContext.state.playheadPosition - step);
        timelineContext.setPlayheadPosition(prevTime);
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        const nextTime = Math.min(
          timelineContext.state.totalDuration, 
          timelineContext.state.playheadPosition + step
        );
        timelineContext.setPlayheadPosition(nextTime);
        break;
        
      case ' ':
        event.preventDefault();
        timelineContext.setPlaying(!timelineContext.state.isPlaying);
        break;
        
      case 'Home':
        event.preventDefault();
        timelineContext.setPlayheadPosition(0);
        break;
        
      case 'End':
        event.preventDefault();
        timelineContext.setPlayheadPosition(timelineContext.state.totalDuration);
        break;
    }
  }, [timelineContext]);

  // Note: Playback is handled by the video element, not the timeline
  // The timeline just follows the video's current time

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Get formatted time strings
  const getFormattedTime = useCallback((time: number) => {
    return formatTime(time, time >= 3600);
  }, []);

  // Get current time display
  const getCurrentTimeDisplay = useCallback(() => {
    return getFormattedTime(timelineContext.state.playheadPosition);
  }, [timelineContext.state.playheadPosition, getFormattedTime]);

  // Get total duration display
  const getTotalDurationDisplay = useCallback(() => {
    return getFormattedTime(timelineContext.state.totalDuration);
  }, [timelineContext.state.totalDuration, getFormattedTime]);

  // Check if timeline is at the beginning
  const isAtStart = timelineContext.state.playheadPosition <= 0;

  // Check if timeline is at the end
  const isAtEnd = timelineContext.state.playheadPosition >= timelineContext.state.totalDuration;

  // Get progress percentage
  const getProgressPercentage = useCallback(() => {
    if (timelineContext.state.totalDuration === 0) return 0;
    return (timelineContext.state.playheadPosition / timelineContext.state.totalDuration) * 100;
  }, [timelineContext.state.playheadPosition, timelineContext.state.totalDuration]);

  return {
    ...timelineContext,
    // Interaction handlers
    handleTimelineClick,
    handlePlayheadDragStart,
    handleKeyDown,
    // Zoom controls
    zoomIn,
    zoomOut,
    zoomToFit,
    // Utility functions
    getFormattedTime,
    getCurrentTimeDisplay,
    getTotalDurationDisplay,
    getProgressPercentage,
    // State checks
    isAtStart,
    isAtEnd,
    isDragging: isDraggingRef.current,
  };
}
