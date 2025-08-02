import { ChildProcess, spawn } from 'child_process'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'

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
    }

type ProgressCallback = (data: ProgressData) => void

let currentDownloadProcess: ChildProcess | null = null
let isPaused = false

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
      `${outputDir}/%(title)s.%(ext)s`,
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
  if (currentDownloadProcess && !isPaused) {
    currentDownloadProcess.kill('SIGSTOP')
    isPaused = true
  }
}

export function resumeDownload(): void {
  if (currentDownloadProcess && isPaused) {
    currentDownloadProcess.kill('SIGCONT')
    isPaused = false
  }
}

export function cancelDownload(): void {
  if (currentDownloadProcess) {
    currentDownloadProcess.kill('SIGKILL')
    currentDownloadProcess = null
    isPaused = false
  }
}
