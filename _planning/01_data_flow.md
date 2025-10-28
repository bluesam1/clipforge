``` mermaid
sequenceDiagram
    participant User
    participant Renderer as Renderer Process<br/>(React UI)
    participant Main as Main Process<br/>(Node.js)
    participant FFmpeg
    participant FileSystem as File System

    %% Import Flow
    rect rgb(200, 220, 250)
    Note over User,FileSystem: Import Flow
    User->>Renderer: Click Import / Drag File
    Renderer->>Main: IPC: import-video
    Main->>FileSystem: Open File Dialog
    FileSystem-->>Main: Selected File Path
    Main->>FFmpeg: Extract Metadata (duration, resolution)
    FFmpeg-->>Main: Video Metadata
    Main-->>Renderer: File Path + Metadata
    Renderer->>Renderer: Add to MediaLibraryContext
    Renderer->>Renderer: Update Timeline UI
    end

    %% Playback Flow
    rect rgb(220, 250, 220)
    Note over User,Renderer: Playback Flow
    User->>Renderer: Click Play Button
    Renderer->>Renderer: Start Playback Loop
    loop Every Frame (requestAnimationFrame)
        Renderer->>Renderer: Update Playhead Position
        Renderer->>Renderer: Update VideoPreview currentTime
        Renderer->>Renderer: Render Playhead on Timeline
    end
    User->>Renderer: Click Pause / Spacebar
    Renderer->>Renderer: Stop Playback Loop
    end

    %% Trim Flow
    rect rgb(250, 240, 200)
    Note over User,Renderer: Trim Flow
    User->>Renderer: Drag Trim Handle
    Renderer->>Renderer: Track Mouse Movement
    Renderer->>Renderer: Calculate New In/Out Point
    Renderer->>Renderer: Update Clip in MediaLibraryContext
    Renderer->>Renderer: Re-render Timeline Clip
    Renderer->>Renderer: Update Preview to Show Trim
    end

    %% Export Flow
    rect rgb(250, 220, 220)
    Note over User,FileSystem: Export Flow
    User->>Renderer: Click Export Button
    Renderer->>Main: IPC: export-video<br/>{clipData, outputPath}
    Main->>FFmpeg: Build FFmpeg Command<br/>(trim, codec settings)
    FFmpeg->>FileSystem: Write Output MP4
    loop During Export
        FFmpeg->>Main: Progress Update
        Main->>Renderer: IPC: export-progress
        Renderer->>Renderer: Update Toast Notification
    end
    FFmpeg-->>Main: Export Complete
    Main-->>Renderer: IPC: export-complete
    Renderer->>User: Show Success Toast
    end
```