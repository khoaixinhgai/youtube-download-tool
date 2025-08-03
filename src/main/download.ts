import { ChildProcess, spawn } from 'child_process'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import kill from 'tree-kill'

type ProgressData =
  | {
      type: 'progress'
      percent: number
      speed: string
      eta: string
      filename: string
    }
  | {
      type: 'log'
      message: string
    }
  | {
      type: 'done'
      success: boolean
      canceled?: boolean
    }

type ProgressCallback = (data: ProgressData) => void

let currentDownloadProcess: ChildProcess | null = null
let isPaused = false
let wasCancelled = false

const isDev = !app.isPackaged

let ytDlpBinaryName = ''

switch (process.platform) {
  case 'win32':
    ytDlpBinaryName = 'yt-dlp.exe'
    break
  case 'darwin':
    ytDlpBinaryName = 'yt-dlp_macos'
    break
  case 'linux':
    ytDlpBinaryName = 'yt-dlp_linux'
    break
  default:
    throw new Error(`Unsupported platform: ${process.platform}`)
}

const ytDlpPath = isDev
  ? path.join(app.getAppPath(), 'resources', 'bin', ytDlpBinaryName)
  : path.join(process.resourcesPath, 'bin', ytDlpBinaryName)

export function downloadFromChannel(
  channel: string,
  resolution: number,
  savePath: string,
  type: 'all' | 'videos' | 'shorts' | 'playlists',
  onProgress: ProgressCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    let suffixType = ''
    if (type !== 'all') {
      suffixType = `${type}`
    }
    const channelUrl = `https://www.youtube.com/@${channel}/${suffixType}`
    const outputDir = path.join(savePath, `@${channel}`)

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const ytDlpArgs: string[] = [
      channelUrl,
      '-o',
      `${outputDir}/%(autonumber)d-%(title)s.%(ext)s`,
      '--format',
      `bv[height=${resolution}][ext=mp4][vcodec^=avc1]+ba[ext=m4a][acodec^=mp4a]/best[height=${resolution}]/best`,
      '--merge-output-format',
      'mp4',
      '--write-thumbnail',
      '--convert-thumbnails',
      'jpg',
      '--embed-thumbnail',
      '--yes-playlist',
      '--no-warnings',
      '--progress'
    ]

    let currentFilename = ''
    const proc = spawn(ytDlpPath, ytDlpArgs)
    currentDownloadProcess = proc

    const handleData = (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(Boolean)

      for (const line of lines) {
        const cleanLine = line.replace('\r', '').trim()
        onProgress({ type: 'log', message: cleanLine })

        const fileMatch = cleanLine.match(/Destination:\s(.+)/)
        if (fileMatch) {
          currentFilename = fileMatch[1].trim()
        }

        const progressMatch = cleanLine.match(
          /\[download\]\s+(\d+(?:\.\d+)?)%.*?at\s+([^\s]+).*?ETA\s+([^\s]+)/
        )

        if (progressMatch) {
          const percent = parseFloat(progressMatch[1])
          const speed = progressMatch[2]
          const eta = progressMatch[3]

          onProgress({
            type: 'progress',
            percent,
            speed,
            eta,
            filename: path.basename(currentFilename)
          })
        }
      }
    }

    proc.stdout.on('data', handleData)
    proc.stderr.on('data', handleData)

    proc.on('close', (code: number) => {
      currentDownloadProcess = null
      isPaused = false
      if (wasCancelled) {
        onProgress({ type: 'done', success: false, canceled: true })
        return resolve()
      }
      onProgress({ type: 'done', success: code === 0 })
      code === 0 ? resolve() : reject(new Error(`Download failed with code ${code}`))
    })

    proc.on('error', (err) => {
      currentDownloadProcess = null
      isPaused = false
      reject(err)
    })

    // proc.stdin.end()
  })
}

export function pauseDownload(): void {
  if (currentDownloadProcess && !isPaused && !currentDownloadProcess.killed) {
    try {
      currentDownloadProcess.kill('SIGSTOP')
      isPaused = true
      console.log('Download paused.')
    } catch (err) {
      console.error('Failed to pause download:', err)
    }
  } else {
    console.warn('Cannot pause: No active or already paused process.')
  }
}

export function resumeDownload(): void {
  if (currentDownloadProcess && isPaused && !currentDownloadProcess.killed) {
    try {
      currentDownloadProcess.kill('SIGCONT')
      isPaused = false
      console.log('Download resumed.')
    } catch (err) {
      console.error('Failed to resume download:', err)
    }
  } else {
    console.warn('Cannot resume: No paused process or already running.')
  }
}

export function cancelDownload(): void {
  if (currentDownloadProcess && currentDownloadProcess.pid) {
    wasCancelled = true
    kill(currentDownloadProcess.pid, 'SIGKILL', (err) => {
      if (!err) {
        console.log('Download canceled.')
        currentDownloadProcess = null
        isPaused = false
      } else {
        console.error('Failed to cancel:', err)
      }
    })
  }
}
