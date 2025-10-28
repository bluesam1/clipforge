import React from 'react';

interface VideoPreviewProps {
  videoSrc?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoSrc,
  isPlaying = false,
  onPlay,
  onPause,
  onSeek
}) => {
  return (
    <div className="video-preview" role="region" aria-label="Video preview">
      {videoSrc ? (
        <video
          className="video-player"
          src={videoSrc}
          controls
          preload="metadata"
          aria-label="Video player"
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="video-placeholder">
          <div className="placeholder-icon">🎬</div>
          <div className="placeholder-text">
            <h3>No Video Loaded</h3>
            <p>Import a video file to get started</p>
          </div>
        </div>
      )}
      
      <div className="video-controls">
        <button
          className="control-button play-pause"
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
          disabled={!videoSrc}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="video-info">
          <span className="video-status">
            {videoSrc ? (isPlaying ? 'Playing' : 'Paused') : 'No video'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
