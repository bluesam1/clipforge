import React, { useState, useEffect, useCallback } from 'react';
import type { ExportOptions, ExportResolution, ExportStatus, ExportProgress } from '../types/export';
import { generateExportFilename, formatTime } from '../utils/exportUtils';
import { useProject } from '../contexts/ProjectContext';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  exportStatus: ExportStatus;
  exportProgress: ExportProgress | null;
  totalDuration: number;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  exportStatus,
  exportProgress,
  totalDuration
}) => {
  const { getProjectName } = useProject();
  const [resolution, setResolution] = useState<ExportResolution>('source');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [filename, setFilename] = useState('');

  // Initialize filename when dialog opens
  useEffect(() => {
    if (isOpen && !filename) {
      const defaultFilename = generateExportFilename(getProjectName());
      setFilename(defaultFilename);
    }
  }, [isOpen, filename, getProjectName]);

  // Reset form when export completes
  useEffect(() => {
    if (exportStatus === 'success' || exportStatus === 'error') {
      // Keep dialog open to show result
    }
  }, [exportStatus]);

  const handleExport = useCallback(async () => {
    // Validate filename
    if (!filename || filename.trim() === '') {
      alert('Please enter a filename');
      return;
    }

    try {
      // Open native file save dialog
      const result = await window.electronAPI.showSaveDialog({
        defaultPath: filename,
        filters: [
          { name: 'MP4 Video', extensions: ['mp4'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return; // User cancelled
      }

      const exportOptions: ExportOptions = {
        resolution,
        outputPath: result.filePath,
        quality,
        filename: filename
      };

      onExport(exportOptions);
    } catch (error) {
      console.error('Export dialog error:', error);
      alert('Failed to open save dialog');
    }
  }, [resolution, quality, filename, onExport]);

  const handleClose = useCallback(async () => {
    if (exportStatus === 'exporting') {
      const confirmClose = window.confirm('Export is in progress. Are you sure you want to cancel?');
      if (!confirmClose) return;
      
      try {
        // Cancel export
        await window.electronAPI.cancelExport();
      } catch (error) {
        console.error('Cancel export error:', error);
      }
    }
    onClose();
  }, [exportStatus, onClose]);

  const isExporting = exportStatus === 'exporting';
  const isDisabled = isExporting || exportStatus === 'success';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-800 border border-surface-700 rounded-2xl shadow-2xl w-[600px] max-w-[90vw] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-surface-700">
          <h2 className="text-2xl font-bold text-white">Export Video</h2>
          <p className="text-sm text-gray-400 mt-1">
            Configure export settings for your project
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Filename Input */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={isDisabled}
              className="w-full px-4 py-3 bg-surface-900 border border-surface-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="my-video-export.mp4"
            />
            <p className="text-xs text-gray-500 mt-1">
              File will be saved as MP4 format
            </p>
          </div>

          {/* Resolution Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Resolution
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['source', '1080p', '720p'] as ExportResolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  disabled={isDisabled}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    resolution === res
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-surface-600 bg-surface-900 text-gray-300 hover:border-surface-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {res === 'source' ? 'Source' : res.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {resolution === 'source'
                ? 'Use original video resolution'
                : `Export at ${resolution} resolution`}
            </p>
          </div>

          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Quality
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as Array<'low' | 'medium' | 'high'>).map((qual) => (
                <button
                  key={qual}
                  onClick={() => setQuality(qual)}
                  disabled={isDisabled}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    quality === qual
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-surface-600 bg-surface-900 text-gray-300 hover:border-surface-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {qual.charAt(0).toUpperCase() + qual.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {quality === 'low' && 'Fast export, smaller file size'}
              {quality === 'medium' && 'Balanced quality and file size'}
              {quality === 'high' && 'Best quality, larger file size'}
            </p>
          </div>

          {/* Export Info */}
          <div className="bg-surface-900 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Duration:</span>
              <span className="text-white font-medium">{formatTime(totalDuration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Format:</span>
              <span className="text-white font-medium">MP4 (H.264 + AAC)</span>
            </div>
          </div>

          {/* Progress Bar (visible during export) */}
          {isExporting && exportProgress && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress:</span>
                <span className="text-white font-medium">
                  {exportProgress.percent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-surface-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
                  style={{ width: `${exportProgress.percent}%` }}
                />
              </div>
              {exportProgress.currentTime !== undefined && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Time: {formatTime(exportProgress.currentTime)}</span>
                  {exportProgress.estimatedTime !== undefined && (
                    <span>Remaining: ~{formatTime(exportProgress.estimatedTime)}</span>
                  )}
                </div>
              )}
              {exportProgress.fps !== undefined && (
                <div className="text-xs text-gray-500">
                  Processing: {exportProgress.fps} fps
                  {exportProgress.speed && ` at ${exportProgress.speed}`}
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {exportStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="text-green-400 font-medium">Export completed successfully!</p>
                  <p className="text-sm text-gray-400 mt-1">Your video is ready</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {exportStatus === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠</span>
                <div>
                  <p className="text-red-400 font-medium">Export failed</p>
                  <p className="text-sm text-gray-400 mt-1">Please try again</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-surface-700 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-3 rounded-lg border border-surface-600 text-gray-200 font-medium hover:bg-surface-700 transition-colors"
          >
            {isExporting ? 'Cancel' : exportStatus === 'success' ? 'Close' : 'Cancel'}
          </button>
          {exportStatus !== 'success' && (
            <button
              onClick={handleExport}
              disabled={isDisabled}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;

