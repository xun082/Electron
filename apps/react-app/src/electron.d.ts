// Electron 类型定义
export interface ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  };
}

export interface CustomAPI {
  getAppInfo: () => {
    name: string;
    version: string;
    author: string;
  };
  getSystemInfo: () => {
    platform: string;
    arch: string;
    nodeVersion: string;
  };
  sayHello: (name: string) => string;
  openFileDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  saveFileDialog: () => Promise<{ canceled: boolean; filePath?: string }>;
  showNotification: (title: string, body: string) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  openDevTools: () => Promise<void>;
  closeDevTools: () => Promise<void>;
  toggleDevTools: () => Promise<void>;
  logToConsole: (message: string, level?: 'info' | 'warn' | 'error' | 'debug') => Promise<string>;
  getAppStatus: () => Promise<{
    isDev: boolean;
    platform: string;
    arch: string;
    nodeVersion: string;
    electronVersion: string;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    uptime: number;
    windowCount: number;
    isDevToolsOpen: boolean;
  }>;
  ffmpeg: {
    getVideoInfo: (videoPath: string) => Promise<{
      duration: number;
      size: string;
      bitrate: string;
      codec: string;
      resolution: string;
      fps: number;
    }>;
    convertVideo: (options: {
      inputPath: string;
      outputPath: string;
      format: 'mp4' | 'avi' | 'mov' | 'webm' | 'gif';
      quality?: 'low' | 'medium' | 'high';
      resolution?: string;
      fps?: number;
    }) => Promise<string>;
    generateThumbnail: (videoPath: string, outputPath: string, timeOffset?: number) => Promise<string>;
    extractAudio: (videoPath: string, outputPath: string, format?: 'mp3' | 'wav' | 'aac') => Promise<string>;
    compressVideo: (inputPath: string, outputPath: string, quality?: 'low' | 'medium' | 'high') => Promise<string>;
    mergeVideos: (videoPaths: string[], outputPath: string) => Promise<string>;
    stopProcessing: () => Promise<void>;
    isProcessing: () => Promise<boolean>;
    onProgress: (callback: (progress: { percent: number; time: number; speed: string; eta: string }) => void) => void;
    onCompleted: (callback: (outputPath: string) => void) => void;
    onError: (callback: (error: string) => void) => void;
  };
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
    api?: CustomAPI;
  }
}
