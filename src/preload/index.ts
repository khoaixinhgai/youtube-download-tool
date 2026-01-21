import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

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

const api = {
  downloadFromChannel: (channel: string, resolution: number, savePath: string, type: string) =>
    ipcRenderer.invoke('download-from-channel', { channel, resolution, savePath, type }),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  onDownloadProgress: (callback: (data: ProgressData) => void) => {
    ipcRenderer.on('download-progress', (_, data) => callback(data))
  },
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
  },
  openFolder: (path: string) => ipcRenderer.invoke('open-folder', path),
  pauseDownload: () => ipcRenderer.invoke('pause-download'),
  resumeDownload: () => ipcRenderer.invoke('resume-download'),
  cancelDownload: () => ipcRenderer.invoke('cancel-download')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
