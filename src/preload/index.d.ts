import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      downloadFromChannel: (
        channel: string,
        resolution: number,
        savePath: string,
        type: string
      ) => Promise<boolean>
      selectFolder: () => Promise<string | null>
      onDownloadProgress: (callback: (data: ProgressData) => void) => void
      removeProgressListener: () => void
      openFolder: (path: string) => Promise<void>
      pauseDownload: () => Promise<void>
      resumeDownload: () => Promise<void>
      cancelDownload: () => Promise<void>
    }
  }

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
}
