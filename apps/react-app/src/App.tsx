import React from 'react';

import DebugConsole from './components/DebugConsole';
import FFmpegDemo from './components/FFmpegDemo';

function App(): React.JSX.Element {
  // 检查是否在 Electron 环境中
  const isElectron = typeof window !== 'undefined' && window.electron;

  const handleElectronAPI = () => {
    if (isElectron) {
      // 使用 Electron 的 IPC 通信
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.invoke('get-system-info').then((systemInfo) => {
          console.log('系统信息:', systemInfo);
          alert(
            `欢迎使用我的 Electron 应用！\n平台: ${systemInfo.platform}\n架构: ${systemInfo.arch}`,
          );
        });
      }
    } else {
      alert('当前在 Web 环境中运行');
    }
  };

  const handleFileDialog = async () => {
    if (isElectron && window.api) {
      try {
        const result = await window.api.openFileDialog();

        if (!result.canceled && result.filePaths.length > 0) {
          alert(`选择的文件: ${result.filePaths[0]}`);
        }
      } catch (error) {
        console.error('文件对话框错误:', error);
      }
    } else {
      alert('文件对话框功能仅在 Electron 环境中可用');
    }
  };

  const handleNotification = () => {
    if (isElectron && window.api) {
      window.api.showNotification('测试通知', '这是一个来自 Electron 的通知！');
    } else {
      alert('通知功能仅在 Electron 环境中可用');
    }
  };

  const handleWindowControl = (action: string) => {
    if (isElectron && window.api) {
      switch (action) {
        case 'minimize':
          window.api.minimizeWindow();
          break;
        case 'maximize':
          window.api.maximizeWindow();
          break;
        case 'close':
          window.api.closeWindow();
          break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {isElectron ? '我的 Electron 应用' : 'React Web 应用'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isElectron ? '欢迎使用 Electron 桌面应用！' : '欢迎使用 React Web 应用！'}
        </p>
        <p className="text-sm text-gray-500 mb-6">今天: {new Date().toLocaleDateString()}</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              onClick={handleElectronAPI}
            >
              {isElectron ? '系统信息' : 'Web 功能'}
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              onClick={handleFileDialog}
            >
              打开文件
            </button>
            <button
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              onClick={handleNotification}
            >
              显示通知
            </button>
            <button
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
              onClick={() => console.log('按钮被点击')}
            >
              控制台日志
            </button>
          </div>

          {isElectron && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">窗口控制</h3>
              <div className="flex space-x-2">
                <button
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                  onClick={() => handleWindowControl('minimize')}
                >
                  最小化
                </button>
                <button
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                  onClick={() => handleWindowControl('maximize')}
                >
                  最大化
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                  onClick={() => handleWindowControl('close')}
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
        {isElectron && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
            <p className="text-sm text-green-700">🖥️ 正在 Electron 环境中运行</p>
          </div>
        )}
      </div>

      {/* 调试控制台 */}
      <DebugConsole />

      {/* FFmpeg 演示 */}
      <FFmpegDemo />
    </div>
  );
}

export default App;
