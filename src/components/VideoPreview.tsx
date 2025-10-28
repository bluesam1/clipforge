import React from 'react';
import { useMediaLibrary } from '../contexts/MediaLibraryContext';

interface VideoPreviewProps {
  videoSrc?: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoSrc
}) => {
  const { getSelectedClip } = useMediaLibrary();
  const selectedClip = getSelectedClip();

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

  return (
    <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300 min-h-[300px] flex flex-col justify-center items-center" role="region" aria-label="Video preview">
      {actualVideoSrc ? (
        <div className="w-full max-w-4xl">
          <video
            className="w-full max-h-96 rounded-lg"
            src={actualVideoSrc}
            controls
            preload="metadata"
            aria-label="Video player"
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
