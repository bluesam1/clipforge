import React, { useRef, useEffect, useState } from 'react';
import { useMediaLibrary } from '../contexts/MediaLibraryContext';
import { useTimeline } from '../hooks/useTimeline';

interface VideoPreviewProps {
  videoSrc?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoSrc,
  onPlayStateChange,
}) => {
  const { getSelectedClip } = useMediaLibrary();
  const selectedClip = getSelectedClip();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const isSeekingRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);
  
  const {
    state: timelineState,
    setPlayheadPosition,
    setPlaying: setTimelinePlaying,
  } = useTimeline();

  // Use the selected clip's file path if no videoSrc is provided
  const actualVideoSrc = videoSrc || (selectedClip ? `file://${selectedClip.filePath}` : '');

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle timeline seeking - only when timeline position changes significantly
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const timelineTime = timelineState.playheadPosition;
      
      // Only seek if the difference is significant and we're not currently seeking
      if (!isSeekingRef.current && Math.abs(video.currentTime - timelineTime) > 0.1) {
        isSeekingRef.current = true;
        video.currentTime = timelineTime;
        
        // Reset seeking flag after seeking is complete
        const handleSeeked = () => {
          isSeekingRef.current = false;
          video.removeEventListener('seeked', handleSeeked);
        };
        video.addEventListener('seeked', handleSeeked);
      }
    }
  }, [timelineState.playheadPosition]);

  // Sync timeline with video (only for play/pause and metadata)
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handlePlay = () => {
        setIsPlaying(true);
        setTimelinePlaying(true);
        onPlayStateChange?.(true);
      };

      const handlePause = () => {
        setIsPlaying(false);
        setTimelinePlaying(false);
        onPlayStateChange?.(false);
      };

      const handleLoadedMetadata = () => {
        setDuration(video.duration);
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [setTimelinePlaying, onPlayStateChange]);

  // Update timeline with video time
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        // Prevent updates if we're currently seeking
        if (isSeekingRef.current) return;
        
        const time = video.currentTime;
        const now = Date.now();
        
        // Throttle updates to prevent excessive re-renders
        if (now - lastUpdateTimeRef.current > 200) {
          lastUpdateTimeRef.current = now;
          setPlayheadPosition(time);
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [setPlayheadPosition]);

  // Sync timeline play state with video
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (timelineState.isPlaying && video.paused) {
        video.play();
      } else if (!timelineState.isPlaying && !video.paused) {
        video.pause();
      }
    }
  }, [timelineState.isPlaying]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300 min-h-[300px] flex flex-col justify-center items-center" role="region" aria-label="Video preview">
      {actualVideoSrc ? (
        <div className="w-full max-w-4xl">
          <video
            ref={videoRef}
            className="w-full max-h-96 rounded-lg cursor-pointer"
            src={actualVideoSrc}
            controls
            preload="metadata"
            aria-label="Video player"
            onClick={handleVideoClick}
          >
            Your browser does not support the video tag.
          </video>
          
          {/* Video Metadata Panel */}
          {selectedClip && (
            <div className="video-metadata">
              <h4 className="text-gray-800 mb-4 text-lg font-semibold border-b border-gray-200 pb-2">Video Information</h4>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">File Name:</span>
                  <span className="metadata-value" title={selectedClip.fileName}>
                    {selectedClip.fileName}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Duration:</span>
                  <span className="metadata-value">{formatTime(selectedClip.duration)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Resolution:</span>
                  <span className="metadata-value">{selectedClip.width} × {selectedClip.height}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Frame Rate:</span>
                  <span className="metadata-value">{selectedClip.fps.toFixed(2)} fps</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Codec:</span>
                  <span className="metadata-value">{selectedClip.codec.toUpperCase()}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">File Size:</span>
                  <span className="metadata-value">{formatFileSize(selectedClip.fileSize)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Imported:</span>
                  <span className="metadata-value">
                    {selectedClip.createdAt.toLocaleDateString()} {selectedClip.createdAt.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl opacity-50">🎬</div>
          <div className="text-center">
            <h3 className="text-gray-600 mb-2 text-xl font-semibold">No Video Loaded</h3>
            <p className="text-gray-500 text-sm">Import a video file to get started</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
