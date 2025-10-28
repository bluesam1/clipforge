import React from 'react';
import { useMediaLibrary } from '../contexts/MediaLibraryContext';
import { VideoClip } from '../types/ipc';

interface TimelineProps {
  duration?: number;
  currentTime?: number;
  onClipSelect?: (clip: VideoClip) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
  duration = 0, 
  currentTime = 0, 
  onClipSelect
}) => {
  const { state } = useMediaLibrary();
  const { clips, selectedClipId } = state;
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClipClick = (clip: VideoClip) => {
    onClipSelect?.(clip);
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Video Clips Section */}
      {clips.length > 0 && (
        <div className="mb-6">
          <h3 className="text-gray-800 mb-4 text-lg font-semibold">Imported Clips ({clips.length})</h3>
          <div className="flex flex-col gap-2">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className={`bg-white border border-gray-200 rounded-md p-3 cursor-pointer transition-all duration-200 flex justify-between items-center hover:border-primary-500 hover:shadow-soft ${
                  selectedClipId === clip.id ? 'selected' : ''
                }`}
                onClick={() => handleClipClick(clip)}
                role="button"
                tabIndex={0}
                aria-label={`Select clip: ${clip.fileName}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 mb-1 whitespace-nowrap overflow-hidden text-ellipsis" title={clip.fileName}>
                    {clip.fileName}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{formatTime(clip.duration)}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{clip.width}x{clip.height}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{clip.codec}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{formatFileSize(clip.fileSize)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="clip-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement remove functionality
                    }}
                    aria-label={`Remove clip: ${clip.fileName}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Track */}
      <div 
        className="cursor-pointer"
        role="slider"
        aria-label="Video timeline"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
      >
        <div className="relative h-1.5 bg-gray-300 rounded-full mb-2">
          <div 
            className="timeline-progress"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="timeline-thumb"
            style={{ left: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>
            {formatTime(currentTime)}
          </span>
          <span>
            {formatTime(duration)}
          </span>
        </div>
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
