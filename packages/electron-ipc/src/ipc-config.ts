import { ipcMain, dialog, Notification, BrowserWindow } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import { FFmpegService } from '@monorepo/electron-core';

export class IpcConfig {
  private mainWindow: BrowserWindow | null;
  private ffmpegService: FFmpegService;

  constructor(mainWindow: BrowserWindow | null = null) {
    this.mainWindow = mainWindow;
    this.ffmpegService = new FFmpegService();
  }

  updateMainWindow(mainWindow: BrowserWindow | null): void {
    this.mainWindow = mainWindow;
  }

  setupHandlers(): void {
    this.setupFileHandlers();
    this.setupNotificationHandlers();
    this.setupWindowHandlers();
    this.setupDebugHandlers();
    this.setupAppStatusHandlers();
    this.setupFFmpegHandlers();
  }

  private setupFileHandlers(): void {
    ipcMain.handle('open-file-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile'],
        filters: [
          {
            name: '视频文件',
            extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'mpg', 'mpeg'],
          },
          { name: '所有文件', extensions: ['*'] },
          { name: '文本文件', extensions: ['txt', 'md'] },
          { name: '图片文件', extensions: ['jpg', 'png', 'gif'] },
        ],
      });
      return result;
    });

    ipcMain.handle('save-file-dialog', async () => {
      const result = await dialog.showSaveDialog(this.mainWindow!, {
        filters: [
          { name: '文本文件', extensions: ['txt'] },
          { name: 'Markdown 文件', extensions: ['md'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      });
      return result;
    });
  }

  private setupNotificationHandlers(): void {
    ipcMain.handle('show-notification', (_, title, body) => {
      if (Notification.isSupported()) {
        new Notification({
          title,
          body,
          icon: join(__dirname, '../../resources/icon.png'),
        }).show();
      }
    });
  }

  private setupWindowHandlers(): void {
    ipcMain.handle('minimize-window', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('maximize-window', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('close-window', () => {
      this.mainWindow?.close();
    });
  }

  private setupDebugHandlers(): void {
    ipcMain.handle('open-devtools', () => {
      this.mainWindow?.webContents.openDevTools();
    });

    ipcMain.handle('close-devtools', () => {
      this.mainWindow?.webContents.closeDevTools();
    });

    ipcMain.handle('toggle-devtools', () => {
      if (this.mainWindow?.webContents.isDevToolsOpened()) {
        this.mainWindow.webContents.closeDevTools();
      } else {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    ipcMain.handle('log-to-console', (_, message, level = 'info') => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      switch (level) {
        case 'error':
          console.error(logMessage);
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        case 'debug':
          console.debug(logMessage);
          break;
        default:
          console.log(logMessage);
      }

      return logMessage;
    });
  }

  private setupAppStatusHandlers(): void {
    ipcMain.handle('get-app-status', () => {
      return {
        isDev: is.dev,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        windowCount: BrowserWindow.getAllWindows().length,
        isDevToolsOpen: this.mainWindow?.webContents.isDevToolsOpened() || false,
      };
    });

    ipcMain.handle('get-system-info', () => {
      return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron,
      };
    });

    ipcMain.handle('get-app-version', () => {
      return process.env.npm_package_version || '1.0.0';
    });

    ipcMain.handle('get-platform', () => {
      return process.platform;
    });
  }

  private setupFFmpegHandlers(): void {
    ipcMain.handle('ffmpeg-get-video-info', async (_, videoPath: string) => {
      try {
        return await this.ffmpegService.getVideoInfo(videoPath);
      } catch (error: any) {
        return {
          error: true,
          message: `获取视频信息失败: ${error.message || error}`,
          duration: 0,
          size: '0 Bytes',
          bitrate: '0',
          codec: 'unknown',
          resolution: '0x0',
          fps: 0,
        };
      }
    });

    ipcMain.handle('ffmpeg-convert-video', async (_, options) => {
      try {
        return await this.ffmpegService.convertVideo(options);
      } catch (error: any) {
        throw new Error(`视频转换失败: ${error.message || error}`);
      }
    });

    ipcMain.handle(
      'ffmpeg-generate-thumbnail',
      async (_, videoPath: string, outputPath: string, timeOffset: number = 10) => {
        try {
          return await this.ffmpegService.generateThumbnail(videoPath, outputPath, timeOffset);
        } catch (error: any) {
          throw new Error(`生成缩略图失败: ${error.message || error}`);
        }
      },
    );

    ipcMain.handle(
      'ffmpeg-extract-audio',
      async (_, videoPath: string, outputPath: string, format: 'mp3' | 'wav' | 'aac' = 'mp3') => {
        try {
          return await this.ffmpegService.extractAudio(videoPath, outputPath, format);
        } catch (error: any) {
          throw new Error(`提取音频失败: ${error.message || error}`);
        }
      },
    );

    ipcMain.handle(
      'ffmpeg-compress-video',
      async (
        _,
        inputPath: string,
        outputPath: string,
        quality: 'low' | 'medium' | 'high' = 'medium',
      ) => {
        try {
          return await this.ffmpegService.compressVideo(inputPath, outputPath, quality);
        } catch (error: any) {
          throw new Error(`压缩视频失败: ${error.message || error}`);
        }
      },
    );

    ipcMain.handle('ffmpeg-merge-videos', async (_, videoPaths: string[], outputPath: string) => {
      try {
        return await this.ffmpegService.mergeVideos(videoPaths, outputPath);
      } catch (error: any) {
        throw new Error(`合并视频失败: ${error.message || error}`);
      }
    });

    ipcMain.handle('ffmpeg-stop-processing', () => {
      this.ffmpegService.stopProcessing();
    });

    ipcMain.handle('ffmpeg-is-processing', () => {
      return this.ffmpegService.isCurrentlyProcessing();
    });

    this.setupFFmpegEventListeners();
  }

  private setupFFmpegEventListeners(): void {
    this.ffmpegService.on('conversion-progress', (progress) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('ffmpeg-progress', progress);
      }
    });

    this.ffmpegService.on('conversion-completed', (outputPath) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('ffmpeg-completed', outputPath);
      }
    });

    this.ffmpegService.on('conversion-error', (error) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('ffmpeg-error', error.message);
      }
    });
  }
}
