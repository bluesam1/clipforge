import React from 'react';

interface TimelineProps {
  duration?: number;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
  duration = 0, 
  currentTime = 0, 
  onSeek 
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="timeline"
      role="slider"
      aria-label="Video timeline"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      tabIndex={0}
    >
      <div className="timeline-track">
        <div 
          className="timeline-progress"
          style={{ width: `${progress}%` }}
        />
        <div 
          className="timeline-thumb"
          style={{ left: `${progress}%` }}
        />
      </div>
      <div className="timeline-labels">
        <span className="timeline-current">
          {formatTime(currentTime)}
        </span>
        <span className="timeline-duration">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default Timeline;
