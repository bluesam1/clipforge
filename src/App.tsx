import React, { useState, useEffect } from 'react';
import './index.css';
import { ImportButton, Timeline, VideoPreview, ExportButton } from './components';

const App: React.FC = () => {
  const [ipcStatus, setIpcStatus] = useState<string>('Testing...');
  const [ipcTestResult, setIpcTestResult] = useState<string>('');
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

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
    // TODO: Implement file dialog and video import
  };

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
    <div className="app">
      <header className="app-header">
        <h1>🎬 ClipForge</h1>
        <p>Professional Video Editing Made Simple</p>
      </header>
      
      <main className="app-main">
        <div className="toolbar">
          <ImportButton onImport={handleImport} />
          <ExportButton 
            onExport={handleExport}
            isExporting={isExporting}
            progress={exportProgress}
          />
        </div>
        
        <div className="video-section">
          <VideoPreview
            videoSrc={videoSrc}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
          />
        </div>
        
        <div className="timeline-section">
          <Timeline
            duration={duration}
            currentTime={currentTime}
          />
        </div>
        
        <div className="status-section">
          <div className="status-card">
            <h3>System Status</h3>
            <ul>
              <li>✅ Electron configured</li>
              <li>✅ React 19 installed</li>
              <li>✅ TypeScript configured</li>
              <li>✅ Vite build system</li>
              <li>{ipcStatus}</li>
              {ipcTestResult && <li>IPC Test Result: {ipcTestResult}</li>}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
