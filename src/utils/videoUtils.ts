import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { VideoMetadata, VideoClip } from '../types/ipc';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// Set the FFmpeg and FFprobe paths to the bundled binaries
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Supported video formats
export const SUPPORTED_FORMATS = ['.mp4', '.mov', '.MP4', '.MOV'];

// Video file validation
export function isValidVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return SUPPORTED_FORMATS.includes(ext);
}

// Get file size
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    throw new Error(`Failed to get file size: ${error}`);
  }
}

// Extract video metadata using FFmpeg
export function extractVideoMetadata(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    console.log('Extracting metadata for:', filePath);
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('FFmpeg error:', err);
        reject(new Error(`Failed to extract metadata: ${err.message}`));
        return;
      }

      try {
        console.log('FFmpeg metadata:', JSON.stringify(metadata, null, 2));
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (!videoStream) {
          console.error('No video stream found');
          reject(new Error('No video stream found in file'));
          return;
        }

        const duration = metadata.format.duration || 0;
        const width = videoStream.width || 0;
        const height = videoStream.height || 0;
        // Parse FPS from format like "30/1" or "29.97/1"
        const fpsString = videoStream.r_frame_rate || '0';
        const fps = fpsString.includes('/') 
          ? parseFloat(fpsString.split('/')[0]) / parseFloat(fpsString.split('/')[1])
          : parseFloat(fpsString);
        const codec = videoStream.codec_name || 'unknown';

        const result = {
          duration,
          width,
          height,
          fps,
          codec,
          fileSize: parseInt(String(metadata.format.size || '0'), 10)
        };
        
        console.log('Extracted metadata:', result);
        resolve(result);
      } catch (error) {
        console.error('Metadata parsing error:', error);
        reject(new Error(`Failed to parse metadata: ${error}`));
      }
    });
  });
}

// Create video clip from file path and metadata
export async function createVideoClip(filePath: string, metadata: VideoMetadata): Promise<VideoClip> {
  const fileName = path.basename(filePath);
  const id = generateClipId();
  
  return {
    id,
    filePath,
    fileName,
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
    fps: metadata.fps,
    codec: metadata.codec,
    fileSize: metadata.fileSize,
    createdAt: new Date()
  };
}

// Generate unique clip ID
function generateClipId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate video file and extract metadata
export async function processVideoFile(filePath: string): Promise<VideoClip> {
  // Validate file format
  if (!isValidVideoFile(filePath)) {
    throw new Error(`Unsupported video format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
  }

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Extract metadata
  const metadata = await extractVideoMetadata(filePath);
  
  // Create video clip
  return createVideoClip(filePath, metadata);
}

// Process multiple video files
export async function processVideoFiles(filePaths: string[]): Promise<{ clips: VideoClip[]; errors: string[] }> {
  console.log('Processing video files:', filePaths);
  const clips: VideoClip[] = [];
  const errors: string[] = [];

  for (const filePath of filePaths) {
    try {
      console.log('Processing file:', filePath);
      const clip = await processVideoFile(filePath);
      console.log('Successfully processed:', clip.fileName);
      clips.push(clip);
    } catch (error) {
      console.error('Error processing file:', filePath, error);
      errors.push(`${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('Final result:', { clips: clips.length, errors: errors.length });
  return { clips, errors };
}
