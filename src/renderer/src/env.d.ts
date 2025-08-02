/// <reference types="vite/client" />

export {}

declare global {
  interface ElectronAPI {
    downloadFromChannel: (
      channel: string,
      resolution: number,
      savePath: string,
      type: string
    ) => Promise<void>
    selectFolder: () => Promise<string | null>
    onDownloadProgress: (callback: (data: any) => void) => void
    removeProgressListener: () => void
    openFolder: (path: string) => Promise<void>
    pauseDownload: () => Promise<void>
    resumeDownload: () => Promise<void>
    cancelDownload: () => Promise<void>
  }

  interface Window {
    api: ElectronAPI
  }
}
