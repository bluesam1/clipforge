import React, { useRef, useEffect, useState } from 'react';
import { useMediaLibrary } from '../contexts/MediaLibraryContext';
import { useTimeline } from '../hooks/useTimeline';
import { getTrimmedDuration } from '../utils/timelineUtils';

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

    // Normalize paths for comparison (handle file:// vs file:/// and forward/back slashes)
    const normalizePath = (path: string) => {
      return path
        .replace(/^file:\/\/\//, '') // Remove file:/// prefix
        .replace(/^file:\/\//, '')   // Remove file:// prefix
        .replace(/\\/g, '/')         // Convert backslashes to forward slashes
        .toLowerCase();              // Case-insensitive comparison
    };

    const currentSrc = normalizePath(video.src);
    const newSrc = normalizePath(actualVideoSrc);
    const sourcesAreDifferent = currentSrc !== newSrc;

    console.log('[VIDEO_SYNC] Video source comparison:', {
      currentSrc,
      newSrc,
      different: sourcesAreDifferent
    });

    // Only reload if source actually changed
    if (sourcesAreDifferent) {
      console.log('[VIDEO_SYNC] Loading new video source, setting isSyncingRef = true');
      isSyncingRef.current = true;
      video.src = actualVideoSrc;
      video.load();
      
      // Reset syncing flag after video loads and seek to inPoint if needed
      const handleLoadedData = () => {
        console.log('[AUTOPLAY_TRIM] ===== VIDEO LOADED DATA =====');
        console.log('[AUTOPLAY_TRIM] Current playing clip:', currentPlayingClip?.fileName);
        console.log('[AUTOPLAY_TRIM] Clip inPoint:', currentPlayingClip?.inPoint);
        console.log('[AUTOPLAY_TRIM] Clip outPoint:', currentPlayingClip?.outPoint);
        console.log('[AUTOPLAY_TRIM] Video duration:', video.duration);
        console.log('[AUTOPLAY_TRIM] Video currentTime BEFORE seek:', video.currentTime);
        
        isSyncingRef.current = false;
        
        // If the clip has an inPoint (trimmed at the beginning), seek to it
        if (currentPlayingClip && currentPlayingClip.inPoint > 0) {
          console.log('[AUTOPLAY_TRIM] >>> Seeking to inPoint:', currentPlayingClip.inPoint);
          video.currentTime = currentPlayingClip.inPoint;
          console.log('[AUTOPLAY_TRIM] >>> Video currentTime AFTER seek:', video.currentTime);
          
          // Also update the playhead position to reflect the seek
          // The playhead should stay at the clip's startTime (beginning of the trimmed clip on timeline)
          console.log('[AUTOPLAY_TRIM] >>> Playhead stays at clip start time (trimmed beginning)');
        } else {
          console.log('[AUTOPLAY_TRIM] No inPoint or inPoint is 0, staying at:', video.currentTime);
        }
        
        video.removeEventListener('loadeddata', handleLoadedData);
      };
      video.addEventListener('loadeddata', handleLoadedData);
      
      return () => video.removeEventListener('loadeddata', handleLoadedData);
    } else {
      console.log('[VIDEO_SYNC] Video source unchanged, skipping reload');
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
      const trimmedDuration = getTrimmedDuration(currentItem.clip);
      const clipEndTime = currentItem.startTime + trimmedDuration;
      
      if (timelineState.playheadPosition >= clipStartTime && timelineState.playheadPosition <= clipEndTime) {
        const localTime = timelineState.playheadPosition - currentItem.startTime;
        // Add inPoint to get the correct video time
        const videoTime = localTime + currentItem.clip.inPoint;
        
        // Only seek if difference is significant (reduced threshold for better responsiveness)
        const timeDifference = Math.abs(video.currentTime - videoTime);
        if (timeDifference > 0.1) {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] User selected time - seeking video to ${videoTime.toFixed(2)}s (timeline: ${timelineState.playheadPosition.toFixed(2)}s, local: ${localTime.toFixed(2)}s, inPoint: ${currentItem.clip.inPoint.toFixed(2)}s, clip: ${currentPlayingClip.fileName}, diff: ${timeDifference.toFixed(2)}s)`);
          
          // Set user interaction flag to prevent timeupdate from overriding
          userInteractingRef.current = true;
          video.currentTime = videoTime;
          
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
        const trimmedDuration = getTrimmedDuration(currentItem.clip);
        const clipEndTime = currentItem.startTime + trimmedDuration;
        
        if (pendingSeekRef.current >= clipStartTime && pendingSeekRef.current <= clipEndTime) {
          const localTime = pendingSeekRef.current - currentItem.startTime;
          // Add inPoint to get the correct video time
          const videoTime = localTime + currentItem.clip.inPoint;
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] Executing pending seek - seeking video to ${videoTime.toFixed(2)}s (timeline: ${pendingSeekRef.current.toFixed(2)}s, local: ${localTime.toFixed(2)}s, inPoint: ${currentItem.clip.inPoint.toFixed(2)}s, clip: ${currentPlayingClip.fileName})`);
          
          // Set user interaction flag to prevent timeupdate from overriding
          userInteractingRef.current = true;
          video.currentTime = videoTime;
          
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
        // Subtract inPoint to get the local timeline time
        const localTime = video.currentTime - currentItem.clip.inPoint;
        const timelineTime = currentItem.startTime + localTime;
        
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] TimeUpdate updating playhead to ${timelineTime.toFixed(2)}s (video: ${video.currentTime.toFixed(2)}s, local: ${localTime.toFixed(2)}s, inPoint: ${currentItem.clip.inPoint.toFixed(2)}s)`);
        
        isSyncingRef.current = true;
        setPlayheadPosition(timelineTime);
        setTimeout(() => { isSyncingRef.current = false; }, 100);
        
        // Manual end detection (in case native ended event doesn't fire)
        const trimmedDuration = getTrimmedDuration(currentItem.clip);
        // Check if LOCAL time (relative to inPoint) has reached the end
        if (localTime >= trimmedDuration - 0.1) {
          const endTimestamp = new Date().toISOString();
          console.log(`[${endTimestamp}] Manual end detection triggered`);
          console.log(`[${endTimestamp}] Video currentTime:`, video.currentTime);
          console.log(`[${endTimestamp}] Local time:`, localTime);
          console.log(`[${endTimestamp}] Clip trimmed duration:`, trimmedDuration);
          handleEnded();
        }
      }
    };

    const handleEnded = () => {
      console.log('[AUTOPLAY_TRIM] ===== VIDEO ENDED EVENT =====');
      console.log('[AUTOPLAY_TRIM] Current clip:', currentPlayingClip?.fileName);
      console.log('[AUTOPLAY_TRIM] Timeline is playing:', timelineState.isPlaying);
      console.log('[AUTOPLAY_TRIM] Video is paused:', videoRef.current?.paused);
      
      const clipSequence = getClipSequence();
      const currentItem = clipSequence.items.find(item => item.clip.id === currentPlayingClip.id);
      
      if (currentItem) {
        const nextItem = clipSequence.items[currentItem.index + 1];
        console.log('[AUTOPLAY_TRIM] Next clip exists:', !!nextItem);
        
        if (nextItem) {
          console.log('[AUTOPLAY_TRIM] Moving to next clip:', nextItem.clip.fileName);
          
          // Mark that we're switching videos to prevent other effects from interfering
          isVideoSwitchingRef.current = true;
          
          // Move to next clip
          console.log('[AUTOPLAY_TRIM] Setting currentPlayingClip to:', nextItem.clip.id);
          console.log('[AUTOPLAY_TRIM] Setting playhead position to:', nextItem.startTime);
          console.log('[AUTOPLAY_TRIM] Next clip inPoint:', nextItem.clip.inPoint);
          setCurrentPlayingClip(nextItem.clip.id);
          setPlayheadPosition(nextItem.startTime);
          
          // Check if we should auto-play: either timeline is playing OR video was playing
          const shouldAutoPlay = timelineState.isPlaying || !videoRef.current?.paused;
          console.log('[AUTOPLAY_TRIM] Should auto-play:', shouldAutoPlay);
          
          // Ensure the new video starts playing if it should
          if (shouldAutoPlay) {
            console.log('[AUTOPLAY_TRIM] ===== SCHEDULING AUTO-PLAY =====');
            console.log('[AUTOPLAY_TRIM] Next clip:', nextItem.clip.fileName);
            console.log('[AUTOPLAY_TRIM] Next clip inPoint:', nextItem.clip.inPoint);
            console.log('[AUTOPLAY_TRIM] Timeline is playing, scheduling auto-play in 300ms');
            
            // Delay to allow video source to change AND seek to inPoint
            setTimeout(() => {
              console.log('[AUTOPLAY_TRIM] ===== AUTO-PLAY TIMEOUT FIRED =====');
              const video = videoRef.current;
              console.log('[AUTOPLAY_TRIM] Video ref exists:', !!video);
              console.log('[AUTOPLAY_TRIM] Video paused:', video?.paused);
              console.log('[AUTOPLAY_TRIM] Video currentTime BEFORE seek:', video?.currentTime);
              console.log('[AUTOPLAY_TRIM] Video duration:', video?.duration);
              console.log('[AUTOPLAY_TRIM] Video readyState:', video?.readyState);
              console.log('[AUTOPLAY_TRIM] Expected inPoint:', nextItem.clip.inPoint);
              
              if (video && video.paused) {
                // CRITICAL: Seek to inPoint BEFORE calling play()
                if (nextItem.clip.inPoint > 0) {
                  console.log('[AUTOPLAY_TRIM] >>> Seeking to inPoint:', nextItem.clip.inPoint);
                  video.currentTime = nextItem.clip.inPoint;
                  console.log('[AUTOPLAY_TRIM] >>> Video currentTime AFTER seek:', video.currentTime);
                } else {
                  console.log('[AUTOPLAY_TRIM] No inPoint, staying at:', video.currentTime);
                }
                
                console.log('[AUTOPLAY_TRIM] >>> Calling video.play()...');
                video.play()
                  .then(() => {
                    console.log('[AUTOPLAY_TRIM] ✓ Video play() SUCCEEDED');
                    console.log('[AUTOPLAY_TRIM] Video is now playing from:', video.currentTime);
                    // Reset video switching flag after successful play
                    setTimeout(() => {
                      isVideoSwitchingRef.current = false;
                    }, 1000);
                  })
                  .catch((error) => {
                    console.error('[AUTOPLAY_TRIM] ✗ Video play() FAILED:', error);
                    // Reset video switching flag even on error
                    setTimeout(() => {
                      isVideoSwitchingRef.current = false;
                    }, 1000);
                  });
              } else {
                console.log('[AUTOPLAY_TRIM] Video not paused, skipping play()');
                // Reset video switching flag
                setTimeout(() => {
                  isVideoSwitchingRef.current = false;
                }, 1000);
              }
            }, 300);
          } else {
            console.log('[AUTOPLAY_TRIM] Timeline not playing, skipping auto-play');
            // Reset video switching flag
            setTimeout(() => {
              isVideoSwitchingRef.current = false;
            }, 1000);
          }
        } else {
          console.log('[AUTOPLAY_TRIM] No next item, ending timeline');
          // End of timeline
          setTimelinePlaying(false);
        }
      } else {
        console.log('[AUTOPLAY_TRIM] Current item not found in sequence');
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
      console.log('[VIDEO_SYNC] VideoPreview: Skipping update - syncing or switching', {
        isSyncing: isSyncingRef.current,
        isSwitching: isVideoSwitchingRef.current
      });
      return;
    }
    
    const position = getClipAtTime(timelineState.playheadPosition);
    
    console.log('[VIDEO_SYNC] VideoPreview: Checking clip at playhead position:', {
      playheadPosition: timelineState.playheadPosition,
      clipAtPosition: position.clipId,
      currentPlayingClipId: currentPlayingClip?.id,
      willSwitch: position.clipId !== currentPlayingClip?.id
    });
    
    if (position.clipId && position.clipId !== currentPlayingClip?.id) {
      console.log('[VIDEO_SYNC] VideoPreview: Switching to clip', {
        fromClip: currentPlayingClip?.id,
        toClip: position.clipId
      });
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
    <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300 min-h-[300px] flex flex-col justify-center items-center relative" role="region" aria-label="Video preview">
      {actualVideoSrc ? (
        <div className="w-full max-w-4xl">
          {/* Video Metadata Panel - Compact Top Right */}
          {currentPlayingClip && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white rounded px-2 py-1 text-xs font-mono z-10">
              {currentPlayingClip.fileName}, {currentPlayingClip.width}×{currentPlayingClip.height}, {formatTime(getTrimmedDuration(currentPlayingClip))}, {currentPlayingClip.fps.toFixed(0)}fps
            </div>
          )}
          
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
