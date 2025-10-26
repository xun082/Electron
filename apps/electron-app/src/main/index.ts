// 在最早阶段设置环境变量来抑制 macOS 系统错误
if (process.platform === 'darwin') {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  process.env.ELECTRON_NO_ATTACH_CONSOLE = 'true';
  process.env.ELECTRON_DISABLE_GPU = 'true';
  process.env.ELECTRON_DISABLE_GPU_SANDBOX = 'true';
  process.env.ELECTRON_DISABLE_GPU_PROCESS_CRASH_LIMIT = 'true';

  // 重定向 stderr 来抑制系统错误
  const originalStderr = process.stderr.write;

  process.stderr.write = function (chunk: any, encoding?: any, callback?: any) {
    if (
      typeof chunk === 'string' &&
      (chunk.includes('IMKCFRunLoopWakeUpReliable') ||
        chunk.includes('mach port') ||
        chunk.includes('messaging the mach port') ||
        chunk.includes('Electron[') ||
        chunk.includes('error messaging'))
    ) {
      return true; // 抑制这些系统错误
    }

    return originalStderr.call(this, chunk, encoding, callback);
  };

  // 重定向 console.error 来抑制系统错误
  const originalConsoleError = console.error;

  console.error = function (...args: any[]) {
    const message = args.join(' ');

    if (
      message.includes('IMKCFRunLoopWakeUpReliable') ||
      message.includes('mach port') ||
      message.includes('messaging the mach port') ||
      message.includes('Electron[') ||
      message.includes('error messaging')
    ) {
      return; // 抑制这些系统错误
    }

    return originalConsoleError.apply(console, args);
  };
}

import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { AppConfigManager, MenuConfig } from '@monorepo/electron-core';
import { IpcConfig } from '@monorepo/electron-ipc';

// 添加关键的启动参数
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('--disable-gpu');
  app.commandLine.appendSwitch('--disable-gpu-sandbox');
  app.commandLine.appendSwitch('--disable-software-rasterizer');
  app.commandLine.appendSwitch('--disable-background-timer-throttling');
  app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('--disable-renderer-backgrounding');
  app.commandLine.appendSwitch('--disable-features', 'TranslateUI');
  app.commandLine.appendSwitch('--disable-ipc-flooding-protection');
  app.commandLine.appendSwitch('--disable-dev-shm-usage');
  app.commandLine.appendSwitch('--no-sandbox');
  app.commandLine.appendSwitch('--disable-web-security');
  app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
  app.commandLine.appendSwitch('--disable-gpu-process-crash-limit');
  app.commandLine.appendSwitch('--disable-accelerated-2d-canvas');
  app.commandLine.appendSwitch('--disable-accelerated-jpeg-decoding');
  app.commandLine.appendSwitch('--disable-accelerated-mjpeg-decode');
  app.commandLine.appendSwitch('--disable-accelerated-video-decode');
  app.commandLine.appendSwitch('--disable-accelerated-video-encode');
  app.commandLine.appendSwitch('--disable-gpu-memory-buffer-video-frames');
  app.commandLine.appendSwitch('--disable-gpu-rasterization');
  app.commandLine.appendSwitch('--disable-zero-copy');
}

// App configuration
const configManager = new AppConfigManager();

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const windowOptions = configManager.getWindowOptions();

  // Create the browser window
  mainWindow = new BrowserWindow({
    ...windowOptions,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      backgroundThrottling: false,
      offscreen: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);

    return { action: 'deny' };
  });

  // Load the React app
  if (is.dev) {
    // 开发环境：加载 React 应用的开发服务器
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // 生产环境：加载构建后的 React 应用
    mainWindow.loadFile(join(__dirname, '../../react-app/dist/index.html'));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  const config = configManager.getConfig();

  // Set app user model id for windows
  electronApp.setAppUserModelId(config.userModelId);

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Setup basic IPC handlers
  ipcMain.on('ping', () => console.log('pong'));

  // 设置 IPC 处理程序（在窗口创建之前）
  console.log('Setting up IPC handlers...');

  const ipcConfig = new IpcConfig();
  ipcConfig.setupHandlers();
  console.log('IPC handlers setup completed');

  // Create the main window
  createWindow();

  // 更新 IPC 配置的窗口引用
  ipcConfig.updateMainWindow(mainWindow);

  // 创建应用菜单
  const menuConfig = new MenuConfig(mainWindow);
  menuConfig.createMenu();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
