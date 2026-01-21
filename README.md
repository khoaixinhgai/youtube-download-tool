# YouTube Downloader Tool

A powerful, cross-platform YouTube downloader built with **Electron**, **React**, and **TypeScript**.
It leverages [yt-dlp](https://github.com/yt-dlp/yt-dlp) for downloading and [ffmpeg](https://ffmpeg.org/) for media processing, ensuring high-quality downloads (4K/8K) with merged audio and video.

## Features

- 🎥 **High Quality Downloads**: Supports 4K, 1080p, 720p, etc.
- 🎵 **Audio & Video Merging**: Automatically merges video and audio streams using `ffmpeg`.
- 🪟 **Cross-Platform**: Fully functional on **Windows** and **macOS**.
- 🚀 **Smart Optimizations**:
  - Auto-selects best available format if the requested one is missing.
  - Includes platform-specific binaries (`yt-dlp`, `ffmpeg`) in the build.
  - Portable Windows build (runs without installation).

## Project Structure

```bash
├── resources/
│   ├── bin/              # External binaries (Downloaded automatically via postinstall)
│   │   ├── essentials/   # (Temp folder for building)
│   │   ├── ffmpeg        # macOS ffmpeg
│   │   ├── ffmpeg.exe    # Windows ffmpeg (Essentials build)
│   │   ├── yt-dlp_macos  # macOS yt-dlp
│   │   └── yt-dlp.exe    # Windows yt-dlp
│   └── icon.png
├── src/
│   ├── main/             # Electron Main Process
│   ├── preload/          # Preload Scripts
│   └── renderer/         # React UI
└── release/              # Build outputs
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- Yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd youtube-download-tool

# Install dependencies
yarn install
# Note: This will automatically download necessary binaries (yt-dlp, ffmpeg) to resources/bin/
```

### Development Mode

Run the app in development mode with hot-reloading:

```bash
yarn dev
```

## Building for Production

### 1. For Windows (Portable Zip)

This command builds a portable Zip containing the executable and all Windows-specific dependencies (yt-dlp.exe, ffmpeg.exe).
**Note:** You can run this command on macOS! It uses a portable build strategy.

```bash
yarn build:win
# Output: release/YouTubeDownloader-1.0.0-win.zip
```

> **Usage on Windows:**
>
> 1. Download/Transfer the `.zip` file to Windows.
> 2. Right-click > **"Extract All..."**.
> 3. Open the folder and run **`YouTubeDownloader.exe`**.

### 2. For macOS

Builds a `.dmg` installer for macOS.

```bash
yarn build:mac
# Output: release/YouTubeDownloader-1.0.0.dmg
```

## Troubleshooting

### "HTTP Error 403: Forbidden"

- **Cause:** YouTube may block requests from outdated `yt-dlp` versions or specific IPs.
- **Fix:** restart the app or check if `resources/bin/yt-dlp_macos` (or `.exe`) is up to date.

### "Format Not Available" or "Only Audio"

- **Cause:** Requested resolution (e.g., 1080p) might not exist, or `ffmpeg` is missing to merge streams.
- **Fix:** The app now includes `ffmpeg` automatically. Ensure you unzip the Windows build fully.

### "This app can't run on your PC" (Windows)

- **Cause:** Running an x64 app on an ARM machine (like Surface Pro X or Mac Parallels) without emulation, or vice versa.
- **Fix:** Use the standard `yarn build:win` (x64) for most valid Windows PCs.

## Tech Stack

- **Electron**: Desktop app runtime.
- **React + TypeScript**: UI library and logic.
- **Vite**: Fast build tool.
- **yt-dlp**: Core download engine.
- **FFmpeg**: Media processing engine.
- **Ant Design**: UI Component library.
