import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  // 获取应用信息
  getAppInfo: () => ({
    name: '我的 Electron 应用',
    version: '1.0.0',
    author: '您的名字',
  }),

  // 获取系统信息
  getSystemInfo: () => ({
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
  }),

  // 自定义功能
  sayHello: (name: string) => `你好, ${name}! 欢迎使用我的应用!`,

  // 文件操作
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),

  // 通知功能
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', title, body),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // 调试控制台
  openDevTools: () => ipcRenderer.invoke('open-devtools'),
  closeDevTools: () => ipcRenderer.invoke('close-devtools'),
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),

  // 日志功能
  logToConsole: (message: string, level?: 'info' | 'warn' | 'error' | 'debug') =>
    ipcRenderer.invoke('log-to-console', message, level),

  // 获取应用状态
  getAppStatus: () => ipcRenderer.invoke('get-app-status'),

  // FFmpeg 功能
  ffmpeg: {
    getVideoInfo: (videoPath: string) => ipcRenderer.invoke('ffmpeg-get-video-info', videoPath),
    convertVideo: (options: any) => ipcRenderer.invoke('ffmpeg-convert-video', options),
    generateThumbnail: (videoPath: string, outputPath: string, timeOffset?: number) => 
      ipcRenderer.invoke('ffmpeg-generate-thumbnail', videoPath, outputPath, timeOffset),
    extractAudio: (videoPath: string, outputPath: string, format?: 'mp3' | 'wav' | 'aac') => 
      ipcRenderer.invoke('ffmpeg-extract-audio', videoPath, outputPath, format),
    compressVideo: (inputPath: string, outputPath: string, quality?: 'low' | 'medium' | 'high') => 
      ipcRenderer.invoke('ffmpeg-compress-video', inputPath, outputPath, quality),
    mergeVideos: (videoPaths: string[], outputPath: string) => 
      ipcRenderer.invoke('ffmpeg-merge-videos', videoPaths, outputPath),
    stopProcessing: () => ipcRenderer.invoke('ffmpeg-stop-processing'),
    isProcessing: () => ipcRenderer.invoke('ffmpeg-is-processing'),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('ffmpeg-progress', (_, progress) => callback(progress));
    },
    onCompleted: (callback: (outputPath: string) => void) => {
      ipcRenderer.on('ffmpeg-completed', (_, outputPath) => callback(outputPath));
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('ffmpeg-error', (_, error) => callback(error));
    },
  },

  // IPC 通信
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI;
  // @ts-expect-error (define in dts)
  window.api = api;
}
