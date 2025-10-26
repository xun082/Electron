import React, { useState, useEffect } from 'react';

import '../electron.d.ts';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

interface AppStatus {
  isDev: boolean;
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  memoryUsage: MemoryUsage;
  uptime: number;
  windowCount: number;
  isDevToolsOpen: boolean;
}

const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [newLogMessage, setNewLogMessage] = useState('');
  const [logLevel, setLogLevel] = useState<'info' | 'warn' | 'error' | 'debug'>('info');

  // 检查是否在 Electron 环境中
  const isElectron = typeof window !== 'undefined' && window.electron;

  useEffect(() => {
    if (isElectron && window.api) {
      // 获取应用状态
      window.api.getAppStatus().then(setAppStatus);
    }
  }, [isElectron]);

  const addLog = (message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info') => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      level,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleSendLog = async () => {
    if (!newLogMessage.trim()) return;

    if (isElectron && window.api) {
      try {
        await window.api.logToConsole(newLogMessage, logLevel);
        addLog(newLogMessage, logLevel);
        setNewLogMessage('');
      } catch (error) {
        console.error('发送日志失败:', error);
      }
    } else {
      addLog(newLogMessage, logLevel);
      setNewLogMessage('');
    }
  };

  const handleToggleDevTools = async () => {
    if (isElectron && window.api) {
      try {
        await window.api.toggleDevTools();

        // 更新应用状态
        const status = await window.api.getAppStatus();
        setAppStatus(status);
      } catch (error) {
        console.error('切换开发者工具失败:', error);
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const formatMemoryUsage = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isElectron) {
    return (
      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
        <p className="text-sm text-yellow-700">🔧 调试控制台仅在 Electron 环境中可用</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🔧 调试控制台</h3>
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? '隐藏' : '显示'}
        </button>
      </div>

      {isVisible && (
        <div className="space-y-4">
          {/* 应用状态 */}
          {appStatus && (
            <div className="bg-gray-50 p-3 rounded border">
              <h4 className="font-semibold mb-2">📊 应用状态</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>平台: {appStatus.platform}</div>
                <div>架构: {appStatus.arch}</div>
                <div>Node 版本: {appStatus.nodeVersion}</div>
                <div>Electron 版本: {appStatus.electronVersion}</div>
                <div>运行时间: {Math.round(appStatus.uptime)}s</div>
                <div>窗口数量: {appStatus.windowCount}</div>
                <div>内存使用: {formatMemoryUsage(appStatus.memoryUsage.heapUsed)}</div>
                <div>开发者工具: {appStatus.isDevToolsOpen ? '已打开' : '已关闭'}</div>
              </div>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="flex space-x-2">
            <button
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
              onClick={handleToggleDevTools}
            >
              切换开发者工具
            </button>
            <button
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
              onClick={clearLogs}
            >
              清空日志
            </button>
          </div>

          {/* 日志输入 */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newLogMessage}
                onChange={(e) => setNewLogMessage(e.target.value)}
                placeholder="输入日志消息..."
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSendLog()}
              />
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value as any)}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
              <button
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                onClick={handleSendLog}
              >
                发送
              </button>
            </div>
          </div>

          {/* 日志显示 */}
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">暂无日志</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="mb-1">
                  <span className="text-gray-400">[{log.timestamp}]</span>
                  <span
                    className={`ml-2 ${
                      log.level === 'error'
                        ? 'text-red-400'
                        : log.level === 'warn'
                          ? 'text-yellow-400'
                          : log.level === 'debug'
                            ? 'text-blue-400'
                            : 'text-green-400'
                    }`}
                  >
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="ml-2">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugConsole;
