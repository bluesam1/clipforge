import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { ImportButton, Timeline, VideoPreview, ExportButton } from './components';
import { MediaLibraryProvider, useMediaLibrary } from './contexts/MediaLibraryContext';
import { TimelineProvider } from './contexts/TimelineContext';
import { VideoClip } from './types/ipc';

const AppContent: React.FC = () => {
  const [ipcStatus, setIpcStatus] = useState<string>('Testing...');
  const [ipcTestResult, setIpcTestResult] = useState<string>('');
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  const { state, addClips, setError, selectClip } = useMediaLibrary();
  const { error } = state;

  // Test IPC communication on component mount
  useEffect(() => {
    const testIPC = async () => {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.ping();
          setIpcTestResult(result);
          setIpcStatus('✅ IPC Communication Working');
        } else {
          setIpcStatus('❌ IPC API not available');
        }
      } catch (error) {
        setIpcStatus('❌ IPC Communication Failed');
        console.error('IPC test failed:', error);
      }
    };

    testIPC();
  }, []);

  const handleImport = () => {
    console.log('Import button clicked');
    // Import functionality is now handled by ImportButton component
  };

  const handleClipSelect = (clip: VideoClip) => {
    selectClip(clip.id);
    setVideoSrc(clip.filePath);
    setDuration(clip.duration);
    console.log('Selected clip:', clip.fileName);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Get file paths from Electron (File objects in browsers don't have paths)
    const filePaths = Array.from(e.dataTransfer.files).map(file => (file as any).path || file.name);

    const videoFiles = filePaths.filter(path => {
      const ext = path.split('.').pop()?.toLowerCase();
      return ext === 'mp4' || ext === 'mov';
    });

    if (videoFiles.length === 0) {
      setError('Please drop MP4 or MOV video files');
      return;
    }
    
    try {
      const result = await window.electronAPI.importVideoDragDrop(filePaths);
      
      if (result.success && result.clips.length > 0) {
        addClips(result.clips);
        console.log(`Imported ${result.clips.length} video clips`);
      }
      
      if (result.errors.length > 0) {
        setError(`Some files failed to import: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Drag drop import error:', error);
      setError(error instanceof Error ? error.message : 'Failed to import videos');
    }
  }, [addClips, setError]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleExport = () => {
    console.log('Export button clicked');
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-strong p-4 sm:p-6 lg:p-8 max-w-6xl w-full min-h-[600px] flex flex-col transition-all duration-300 ${
        isDragOver ? 'drag-over' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">🎬 ClipForge</h1>
        <p className="text-base sm:text-lg text-gray-600">Professional Video Editing Made Simple</p>
      </header>
      
      <main className="flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8 justify-center">
          <ImportButton onImport={handleImport} />
          <ExportButton 
            onExport={handleExport}
            isExporting={isExporting}
            progress={exportProgress}
          />
        </div>
        
        {error && (
          <div className="error-message">
            <span className="text-xl">⚠️</span>
            <span className="flex-1 font-medium">{error}</span>
            <button 
              className="bg-none border-none text-red-800 text-xl cursor-pointer p-0 w-6 h-6 flex items-center justify-center rounded transition-colors duration-200 hover:bg-red-100"
              onClick={() => setError(null)}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="mb-8">
          <VideoPreview
            videoSrc={videoSrc}
            onPlayStateChange={(playing) => {
              setIsPlaying(playing);
            }}
          />
        </div>
        
        <div className="mb-8">
          <Timeline
            onClipSelect={handleClipSelect}
          />
        </div>
        
        <div className="mt-auto">
          <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-primary-500">
            <h3 className="text-gray-800 mb-4 text-xl font-semibold">System Status</h3>
            <ul className="list-none text-left">
              <li className="py-1 text-gray-600 text-sm">✅ Electron configured</li>
              <li className="py-1 text-gray-600 text-sm">✅ React 19 installed</li>
              <li className="py-1 text-gray-600 text-sm">✅ TypeScript configured</li>
              <li className="py-1 text-gray-600 text-sm">✅ Vite build system</li>
              <li className="py-1 text-gray-600 text-sm">{ipcStatus}</li>
              {ipcTestResult && <li className="py-1 text-gray-600 text-sm">IPC Test Result: {ipcTestResult}</li>}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <MediaLibraryProvider>
      <TimelineProvider>
        <AppContent />
      </TimelineProvider>
    </MediaLibraryProvider>
  );
};

export default App;
