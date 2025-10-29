# ClipForge Project File Format Specification

## Overview

ClipForge projects are stored as JSON files with the `.clipforge` extension. This format provides a human-readable, version-controlled, and cross-platform way to store video editing projects.

## File Structure

### Root Object
```json
{
  "version": "1.0.0",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "lastModified": "2024-01-15T11:45:00.000Z",
  "projectName": "My Video Project",
  "filePath": "/path/to/project.clipforge",
  "clips": [...],
  "timeline": {...},
  "settings": {...}
}
```

### Field Specifications

#### `version` (string, required)
- **Type**: Semantic version string
- **Format**: `"MAJOR.MINOR.PATCH"`
- **Example**: `"1.0.0"`
- **Purpose**: Ensures compatibility across different ClipForge versions

#### `createdAt` (string, required)
- **Type**: ISO 8601 timestamp
- **Format**: `"YYYY-MM-DDTHH:mm:ss.sssZ"`
- **Example**: `"2024-01-15T10:30:00.000Z"`
- **Purpose**: Records when the project was first created

#### `lastModified` (string, required)
- **Type**: ISO 8601 timestamp
- **Format**: `"YYYY-MM-DDTHH:mm:ss.sssZ"`
- **Example**: `"2024-01-15T11:45:00.000Z"`
- **Purpose**: Records when the project was last modified

#### `projectName` (string, required)
- **Type**: Human-readable project name
- **Max Length**: 255 characters
- **Example**: `"My Video Project"`
- **Purpose**: Display name for the project

#### `filePath` (string, optional)
- **Type**: Absolute file system path
- **Format**: Platform-specific path
- **Example**: `"C:\\Users\\User\\Documents\\MyProject.clipforge"`
- **Purpose**: Reference to the project file location

#### `clips` (array, required)
- **Type**: Array of VideoClip objects
- **Min Length**: 0
- **Purpose**: Contains all video clips in the project

#### `timeline` (object, required)
- **Type**: TimelineState object
- **Purpose**: Contains timeline configuration and state

#### `settings` (object, required)
- **Type**: ProjectSettings object
- **Purpose**: Contains project-specific settings and preferences

## VideoClip Object

```json
{
  "id": "clip-1234567890",
  "filePath": "C:\\Videos\\sample.mp4",
  "fileName": "sample.mp4",
  "duration": 120.5,
  "inPoint": 10.0,
  "outPoint": 110.0,
  "width": 1920,
  "height": 1080,
  "fps": 30.0,
  "codec": "h264",
  "fileSize": 15728640,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "thumbnailPath": "C:\\Thumbnails\\clip-1234567890.jpg"
}
```

### VideoClip Fields

- **`id`** (string, required): Unique identifier for the clip
- **`filePath`** (string, required): Absolute path to the video file
- **`fileName`** (string, required): Original filename
- **`duration`** (number, required): Original duration in seconds
- **`inPoint`** (number, required): Trim start point in seconds (default: 0)
- **`outPoint`** (number, required): Trim end point in seconds (default: duration)
- **`width`** (number, required): Video width in pixels
- **`height`** (number, required): Video height in pixels
- **`fps`** (number, required): Frames per second
- **`codec`** (string, required): Video codec
- **`fileSize`** (number, required): File size in bytes
- **`createdAt`** (string, required): Import timestamp
- **`thumbnailPath`** (string, optional): Path to thumbnail image

## TimelineState Object

```json
{
  "playheadPosition": 45.2,
  "zoomLevel": 1.5,
  "isPlaying": false,
  "totalDuration": 100.0,
  "timelineWidth": 1200,
  "pixelsPerSecond": 10.0,
  "scrollPosition": 0
}
```

### TimelineState Fields

- **`playheadPosition`** (number): Current playhead position in seconds
- **`zoomLevel`** (number): Zoom level (1.0 = normal)
- **`isPlaying`** (boolean): Whether video is currently playing
- **`totalDuration`** (number): Total duration of all clips in seconds
- **`timelineWidth`** (number): Width of timeline in pixels
- **`pixelsPerSecond`** (number): Pixels per second ratio
- **`scrollPosition`** (number): Horizontal scroll position in pixels

## ProjectSettings Object

```json
{
  "exportQuality": "high",
  "outputFormat": "mp4",
  "autoSave": true,
  "autoSaveInterval": 30,
  "recentProjects": [
    "C:\\Projects\\Project1.clipforge",
    "C:\\Projects\\Project2.clipforge"
  ]
}
```

### ProjectSettings Fields

- **`exportQuality`** (string): Export quality ("low", "medium", "high")
- **`outputFormat`** (string): Output format ("mp4", "mov", "avi")
- **`autoSave`** (boolean): Whether auto-save is enabled
- **`autoSaveInterval`** (number): Auto-save interval in seconds
- **`recentProjects`** (array): List of recent project file paths

## File Validation

### Required Fields
All root-level fields are required except `filePath`.

### Data Types
- All timestamps must be valid ISO 8601 format
- All numeric values must be finite numbers
- All string values must be non-empty (except optional fields)
- Arrays must contain only valid objects of their specified type

### Constraints
- `inPoint` must be >= 0 and < `outPoint`
- `outPoint` must be <= `duration`
- `zoomLevel` must be > 0
- `autoSaveInterval` must be > 0
- `recentProjects` array length must be <= 10

## Error Handling

### Invalid Files
- Missing required fields
- Invalid data types
- Constraint violations
- Corrupted JSON

### Recovery
- Attempt to load partial data where possible
- Provide user feedback on specific errors
- Offer to create backup of corrupted files

## Version Compatibility

### Version 1.0.0
- Initial project format
- Supports basic video editing features
- Includes trim points and timeline state

### Future Versions
- Backward compatibility maintained
- New fields added as optional
- Migration tools provided for major version changes

## Example Project File

```json
{
  "version": "1.0.0",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "lastModified": "2024-01-15T11:45:00.000Z",
  "projectName": "My First Project",
  "filePath": "C:\\Users\\User\\Documents\\MyFirstProject.clipforge",
  "clips": [
    {
      "id": "clip-1234567890",
      "filePath": "C:\\Videos\\sample.mp4",
      "fileName": "sample.mp4",
      "duration": 120.5,
      "inPoint": 10.0,
      "outPoint": 110.0,
      "width": 1920,
      "height": 1080,
      "fps": 30.0,
      "codec": "h264",
      "fileSize": 15728640,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "timeline": {
    "playheadPosition": 45.2,
    "zoomLevel": 1.5,
    "isPlaying": false,
    "totalDuration": 100.0,
    "timelineWidth": 1200,
    "pixelsPerSecond": 10.0,
    "scrollPosition": 0
  },
  "settings": {
    "exportQuality": "high",
    "outputFormat": "mp4",
    "autoSave": true,
    "autoSaveInterval": 30,
    "recentProjects": []
  }
}
```
