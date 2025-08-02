import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  downloadFromChannel: (channel: string, resolution: number, savePath: string, type: string) =>
    ipcRenderer.invoke('download-from-channel', { channel, resolution, savePath, type }),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  onDownloadProgress: (callback: (data: any) => void) => {
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
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
