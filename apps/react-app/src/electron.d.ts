// Electron 类型定义
declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        on: (channel: string, listener: (...args: any[]) => void) => void;
        removeListener: (channel: string, listener: (...args: any[]) => void) => void;
      };
    };
    api?: {
      openFileDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      showNotification: (title: string, body: string) => void;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      getSystemInfo: () => Promise<{
        platform: string;
        arch: string;
      }>;
      convertVideo: (options: any) => Promise<any>;
      getVideoInfo: (path: string) => Promise<any>;
      generateThumbnail: (videoPath: string, outputPath: string, timeOffset?: number) => Promise<string>;
      extractAudio: (videoPath: string, outputPath: string, format?: string) => Promise<string>;
      compressVideo: (inputPath: string, outputPath: string, quality?: string) => Promise<string>;
      mergeVideos: (videoPaths: string[], outputPath: string) => Promise<string>;
      // 调试控制台相关方法
      getAppStatus: () => Promise<any>;
      logToConsole: (message: string, level?: string) => void;
      toggleDevTools: () => void;
      // FFmpeg 相关方法
      ffmpeg: {
        convertVideo: (options: any) => Promise<any>;
        getVideoInfo: (path: string) => Promise<any>;
        generateThumbnail: (videoPath: string, outputPath: string, timeOffset?: number) => Promise<string>;
        extractAudio: (videoPath: string, outputPath: string, format?: string) => Promise<string>;
        compressVideo: (inputPath: string, outputPath: string, quality?: string) => Promise<string>;
        mergeVideos: (videoPaths: string[], outputPath: string) => Promise<string>;
        stopProcessing: () => void;
        on: (event: string, callback: (data: any) => void) => void;
        off: (event: string, callback: (data: any) => void) => void;
        onProgress: (callback: (progressData: any) => void) => void;
        onCompleted: (callback: (path: any) => void) => void;
        onError: (callback: (errorMessage: any) => void) => void;
      };
    };
  }
}

export {};