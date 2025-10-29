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
  const { 
    getCurrentPlayingClip,
    getClipSequence,
    getClipAtTime,
    setCurrentPlayingClip,
  } = useMediaLibrary();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isSyncingRef = useRef(false); // Single flag to prevent circular updates
  const isVideoSwitchingRef = useRef(false); // Flag to prevent interference during video switches
  const pendingSeekRef = useRef<number | null>(null); // Track pending seek after clip change
  const userInteractingRef = useRef(false); // Flag to prevent timeupdate from overriding user clicks
  const [preloadedNextClip, setPreloadedNextClip] = useState<string | null>(null);
  
  const {
    state: timelineState,
    setPlayheadPosition,
    setPlaying: setTimelinePlaying,
  } = useTimeline();

  // Get current clip from context (single source of truth)
  const currentPlayingClip = getCurrentPlayingClip();
  const actualVideoSrc = videoSrc || (currentPlayingClip ? `file://${currentPlayingClip.filePath}` : '');

  // Preload next clip for smoother transitions
  useEffect(() => {
    if (!currentPlayingClip) return;

    const clipSequence = getClipSequence();
    const currentIndex = clipSequence.items.findIndex(item => item.clip.id === currentPlayingClip.id);
    
    if (currentIndex >= 0 && currentIndex < clipSequence.items.length - 1) {
      const nextClip = clipSequence.items[currentIndex + 1].clip;
      const nextVideoSrc = `file://${nextClip.filePath}`;
      
      if (preloadedNextClip !== nextClip.id) {
        setPreloadedNextClip(nextClip.id);
        
        // Preload the next video
        if (nextVideoRef.current) {
          nextVideoRef.current.src = nextVideoSrc;
          nextVideoRef.current.load();
          nextVideoRef.current.style.display = 'none';
        }
      }
    } else {
      setPreloadedNextClip(null);
    }
  }, [currentPlayingClip, getClipSequence, preloadedNextClip]);

  // 1. Sync video source when current playing clip changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !actualVideoSrc) return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Video source effect triggered`);
    console.log(`[${timestamp}] Current video src:`, video.src);
    console.log(`[${timestamp}] New video src:`, actualVideoSrc);
    console.log(`[${timestamp}] Sources different:`, video.src !== actualVideoSrc);

    // Only reload if source actually changed
    if (video.src !== actualVideoSrc) {
      console.log(`[${timestamp}] Loading new video source...`);
      isSyncingRef.current = true;
      video.src = actualVideoSrc;
      video.load();
      
      // Reset syncing flag after video loads
      const handleLoadedData = () => {
        const loadTimestamp = new Date().toISOString();
        console.log(`[${loadTimestamp}] Video loaded data event fired`);
        console.log(`[${loadTimestamp}] Video src after load:`, video.src);
        console.log(`[${loadTimestamp}] Video duration:`, video.duration);
        console.log(`[${loadTimestamp}] Video readyState:`, video.readyState);
        isSyncingRef.current = false;
        video.removeEventListener('loadeddata', handleLoadedData);
      };
      video.addEventListener('loadeddata', handleLoadedData);
      
      return () => video.removeEventListener('loadeddata', handleLoadedData);
    } else {
      console.log(`[${timestamp}] Video source unchanged, skipping reload`);
    }
  }, [actualVideoSrc]); // Removed timelineState.isPlaying to prevent reload on pause

  // 2. Sync timeline position to video currentTime (timeline controls video)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentPlayingClip || isSyncingRef.current || isVideoSwitchingRef.current) {
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Timeline position effect triggered - playhead: ${timelineState.playheadPosition.toFixed(2)}s, current clip: ${currentPlayingClip.fileName}`);

    const clipSequence = getClipSequence();
    const currentItem = clipSequence.items.find(item => item.clip.id === currentPlayingClip.id);
    
    if (currentItem) {
      // Check if timeline position is within current clip's time range
      const clipStartTime = currentItem.startTime;
      const clipEndTime = currentItem.startTime + currentItem.clip.duration;
      
      if (timelineState.playheadPosition >= clipStartTime && timelineState.playheadPosition <= clipEndTime) {
        const localTime = timelineState.playheadPosition - currentItem.startTime;
        
        // Only seek if difference is significant (reduced threshold for better responsiveness)
        const timeDifference = Math.abs(video.currentTime - localTime);
        if (timeDifference > 0.1) {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] User selected time - seeking video to ${localTime.toFixed(2)}s (timeline: ${timelineState.playheadPosition.toFixed(2)}s, clip: ${currentPlayingClip.fileName}, diff: ${timeDifference.toFixed(2)}s)`);
          
          // Set user interaction flag to prevent timeupdate from overriding
          userInteractingRef.current = true;
          video.currentTime = localTime;
          
          // If timeline was playing, resume playback after seeking
          if (timelineState.isPlaying) {
            const timestamp2 = new Date().toISOString();
            console.log(`[${timestamp2}] Resuming playback after seek (timeline was playing)`);
            video.play().catch(console.error);
          }
          
          // Clear user interaction flag after a delay
          setTimeout(() => {
            userInteractingRef.current = false;
          }, 500);
        } else {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] Skipping seek - difference too small: ${timeDifference.toFixed(2)}s (video: ${video.currentTime.toFixed(2)}s, target: ${localTime.toFixed(2)}s)`);
        }
      } else {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Timeline position ${timelineState.playheadPosition.toFixed(2)}s is outside current clip range [${clipStartTime.toFixed(2)}s - ${clipEndTime.toFixed(2)}s], letting clip switching handle it`);
        // Store the seek position for after clip switching
        pendingSeekRef.current = timelineState.playheadPosition;
        // Set user interaction flag to prevent timeupdate interference
        userInteractingRef.current = true;
      }
    }
  }, [timelineState.playheadPosition, currentPlayingClip, getClipSequence]);


  // 2.5. Handle pending seek after video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentPlayingClip || !pendingSeekRef.current) {
      return;
    }

    const handleSeekAfterLoad = () => {
      const clipSequence = getClipSequence();
      const currentItem = clipSequence.items.find(item => item.clip.id === currentPlayingClip.id);
      
      if (currentItem && pendingSeekRef.current) {
        const clipStartTime = currentItem.startTime;
        const clipEndTime = currentItem.startTime + currentItem.clip.duration;
        
        if (pendingSeekRef.current >= clipStartTime && pendingSeekRef.current <= clipEndTime) {
          const localTime = pendingSeekRef.current - currentItem.startTime;
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] Executing pending seek - seeking video to ${localTime.toFixed(2)}s (timeline: ${pendingSeekRef.current.toFixed(2)}s, clip: ${currentPlayingClip.fileName})`);
          
          // Set user interaction flag to prevent timeupdate from overriding
          userInteractingRef.current = true;
          video.currentTime = localTime;
          
          // If timeline was playing, resume playback after seeking
          if (timelineState.isPlaying) {
            const timestamp2 = new Date().toISOString();
            console.log(`[${timestamp2}] Resuming playback after seek (timeline was playing)`);
            video.play().catch(console.error);
          }
          
          // Clear user interaction flag after a delay
          setTimeout(() => {
            userInteractingRef.current = false;
          }, 500);
          
          pendingSeekRef.current = null; // Clear pending seek
        }
      }
    };

    // Seek when video is ready
    if (video.readyState >= 3) { // HAVE_FUTURE_DATA or higher
      handleSeekAfterLoad();
    } else {
      video.addEventListener('loadeddata', handleSeekAfterLoad, { once: true });
    }

    return () => {
      video.removeEventListener('loadeddata', handleSeekAfterLoad);
    };
  }, [currentPlayingClip, getClipSequence, timelineState.isPlaying]);

  // 3. Sync video playback to timeline (video updates timeline)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentPlayingClip) return;

    const handleTimeUpdate = () => {
      if (isSyncingRef.current || userInteractingRef.current) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] TimeUpdate blocked - syncing: ${isSyncingRef.current}, userInteracting: ${userInteractingRef.current}`);
        return;
      }

      const clipSequence = getClipSequence();
      const currentItem = clipSequence.items.find(item => item.clip.id === currentPlayingClip.id);
      
      if (currentItem) {
        const timelineTime = currentItem.startTime + video.currentTime;
        
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] TimeUpdate updating playhead to ${timelineTime.toFixed(2)}s (video: ${video.currentTime.toFixed(2)}s)`);
        
        isSyncingRef.current = true;
        setPlayheadPosition(timelineTime);
        setTimeout(() => { isSyncingRef.current = false; }, 100);
        
        // Manual end detection (in case native ended event doesn't fire)
        if (video.currentTime >= currentItem.clip.duration - 0.1) {
          const endTimestamp = new Date().toISOString();
          console.log(`[${endTimestamp}] Manual end detection triggered`);
          console.log(`[${endTimestamp}] Video currentTime:`, video.currentTime);
          console.log(`[${endTimestamp}] Clip duration:`, currentItem.clip.duration);
          handleEnded();
        }
      }
    };

    const handleEnded = () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ===== VIDEO ENDED EVENT =====`);
      console.log(`[${timestamp}] Current playing clip:`, currentPlayingClip?.fileName);
      console.log(`[${timestamp}] Timeline is playing:`, timelineState.isPlaying);
      
      const clipSequence = getClipSequence();
      console.log(`[${timestamp}] Clip sequence items:`, clipSequence.items.length);
      
      const currentItem = clipSequence.items.find(item => item.clip.id === currentPlayingClip.id);
      console.log(`[${timestamp}] Current item found:`, !!currentItem);
      console.log(`[${timestamp}] Current item index:`, currentItem?.index);
      
      if (currentItem) {
        const nextItem = clipSequence.items[currentItem.index + 1];
        console.log(`[${timestamp}] Next item exists:`, !!nextItem);
        console.log(`[${timestamp}] Next item:`, nextItem?.clip.fileName);
        
        if (nextItem) {
          console.log(`[${timestamp}] Moving to next clip:`, nextItem.clip.fileName);
          
          // Mark that we're switching videos to prevent other effects from interfering
          isVideoSwitchingRef.current = true;
          
          // Move to next clip
          setCurrentPlayingClip(nextItem.clip.id);
          setPlayheadPosition(nextItem.startTime);
          
          // Ensure the new video starts playing if timeline is playing
          if (timelineState.isPlaying) {
            console.log(`[${timestamp}] Timeline is playing, scheduling auto-play in 200ms`);
            // Small delay to allow video source to change
            setTimeout(() => {
              const checkTimestamp = new Date().toISOString();
              const video = videoRef.current;
              console.log(`[${checkTimestamp}] Auto-play timeout fired`);
              console.log(`[${checkTimestamp}] Video ref exists:`, !!video);
              console.log(`[${checkTimestamp}] Video paused:`, video?.paused);
              console.log(`[${checkTimestamp}] Video src:`, video?.src);
              console.log(`[${checkTimestamp}] Video currentTime:`, video?.currentTime);
              console.log(`[${checkTimestamp}] Video duration:`, video?.duration);
              
              if (video && video.paused) {
                console.log(`[${checkTimestamp}] Attempting to play video...`);
                video.play()
                  .then(() => {
                    console.log(`[${checkTimestamp}] Video play() succeeded`);
                    // Reset video switching flag after successful play
                    setTimeout(() => {
                      isVideoSwitchingRef.current = false;
                      console.log(`[${checkTimestamp}] Video switching flag reset`);
                    }, 1000);
                  })
                  .catch((error) => {
                    console.error(`[${checkTimestamp}] Video play() failed:`, error);
                    // Reset video switching flag even on error
                    setTimeout(() => {
                      isVideoSwitchingRef.current = false;
                      console.log(`[${checkTimestamp}] Video switching flag reset (error)`);
                    }, 1000);
                  });
              } else {
                console.log(`[${checkTimestamp}] Video not paused, skipping play()`);
                // Reset video switching flag
                setTimeout(() => {
                  isVideoSwitchingRef.current = false;
                  console.log(`[${checkTimestamp}] Video switching flag reset (not paused)`);
                }, 1000);
              }
            }, 200);
          } else {
            console.log(`[${timestamp}] Timeline not playing, skipping auto-play`);
            // Reset video switching flag
            setTimeout(() => {
              isVideoSwitchingRef.current = false;
              console.log(`[${timestamp}] Video switching flag reset (not playing)`);
            }, 1000);
          }
        } else {
          console.log(`[${timestamp}] No next item, ending timeline`);
          // End of timeline
          setTimelinePlaying(false);
        }
      } else {
        console.log(`[${timestamp}] Current item not found in sequence`);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentPlayingClip, getClipSequence, setPlayheadPosition, setCurrentPlayingClip, setTimelinePlaying]);

  // 4. Sync play/pause state
  useEffect(() => {
      const video = videoRef.current;
    if (!video) return;

    if (timelineState.isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!timelineState.isPlaying && !video.paused) {
      video.pause();
    }
  }, [timelineState.isPlaying]);

  // 5. Update current playing clip based on timeline position (only when not syncing)
  useEffect(() => {
    if (isSyncingRef.current || isVideoSwitchingRef.current) {
      return;
    }
    
    const position = getClipAtTime(timelineState.playheadPosition);
    
    if (position.clipId && position.clipId !== currentPlayingClip?.id) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Timeline position effect - switching to clip ${position.clipId} for timeline position ${timelineState.playheadPosition.toFixed(2)}s`);
      setCurrentPlayingClip(position.clipId);
    }
  }, [timelineState.playheadPosition, getClipAtTime, currentPlayingClip?.id, setCurrentPlayingClip]);

  // 6. Handle play/pause events and notify parent
  useEffect(() => {
      const video = videoRef.current;
    if (!video) return;
      
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

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
  }, [setTimelinePlaying, onPlayStateChange]);

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
            ref={videoRef}
            className="w-full max-h-96 rounded-lg"
            src={actualVideoSrc}
            controls
            preload="auto"
            aria-label="Video player"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;

              const timestamp = new Date().toISOString();
              if (video.paused) {
                console.log(`[${timestamp}] User clicked to PLAY video`);
                video.play();
              } else {
                console.log(`[${timestamp}] User clicked to PAUSE video`);
                video.pause();
              }
            }}
          >
            Your browser does not support the video tag.
          </video>
          
          {/* Hidden next video for preloading */}
          <video
            ref={nextVideoRef}
            style={{ display: 'none' }}
            preload="metadata"
          />
          
          {/* Video Metadata Panel */}
          {currentPlayingClip && (
            <div className="video-metadata">
              <h4 className="text-gray-800 mb-4 text-lg font-semibold border-b border-gray-200 pb-2">Video Information</h4>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">File Name:</span>
                  <span className="metadata-value" title={currentPlayingClip.fileName}>
                    {currentPlayingClip.fileName}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Duration:</span>
                  <span className="metadata-value">{formatTime(currentPlayingClip.duration)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Resolution:</span>
                  <span className="metadata-value">{currentPlayingClip.width} × {currentPlayingClip.height}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Frame Rate:</span>
                  <span className="metadata-value">{currentPlayingClip.fps.toFixed(2)} fps</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Codec:</span>
                  <span className="metadata-value">{currentPlayingClip.codec.toUpperCase()}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">File Size:</span>
                  <span className="metadata-value">{formatFileSize(currentPlayingClip.fileSize)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Imported:</span>
                  <span className="metadata-value">
                    {currentPlayingClip.createdAt.toLocaleDateString()} {currentPlayingClip.createdAt.toLocaleTimeString()}
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
