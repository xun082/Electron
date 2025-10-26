import React, { useState, useEffect } from 'react';

import '../electron.d.ts';

interface VideoInfo {
  duration: number;
  size: string;
  bitrate: string;
  codec: string;
  resolution: string;
  fps: number;
}

interface ConversionProgress {
  percent: number;
  time: number;
  speed: string;
  eta: string;
}

const FFmpegDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [outputPath, setOutputPath] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 检查是否在 Electron 环境中
  const isElectron = typeof window !== 'undefined' && window.electron;

  useEffect(() => {
    if (isElectron && window.api?.ffmpeg) {
      // 监听 FFmpeg 事件
      window.api.ffmpeg.onProgress((progressData) => {
        setProgress(progressData);
      });

      window.api.ffmpeg.onCompleted((path) => {
        setOutputPath(path);
        setIsProcessing(false);
        setProgress(null);
      });

      window.api.ffmpeg.onError((errorMessage) => {
        setError(errorMessage);
        setIsProcessing(false);
        setProgress(null);
      });
    }
  }, [isElectron]);

  const handleFileSelect = async () => {
    if (!isElectron || !window.api) return;

    try {
      const result = await window.api.openFileDialog();

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        setSelectedFile(filePath);
        setError('');

        // 获取视频信息
        try {
          const info = await window.api.ffmpeg.getVideoInfo(filePath);
          setVideoInfo(info);
        } catch {
          setError('获取视频信息失败');
        }
      }
    } catch {
      setError('选择文件失败');
    }
  };

  const handleConvertVideo = async () => {
    if (!isElectron || !window.api || !selectedFile) return;

    try {
      setIsProcessing(true);
      setError('');
      setProgress(null);

      const outputPath = selectedFile.replace(/\.[^/.]+$/, '_converted.mp4');

      await window.api.ffmpeg.convertVideo({
        inputPath: selectedFile,
        outputPath,
        format: 'mp4',
        quality: 'medium',
      });
    } catch {
      setError('视频转换失败');
      setIsProcessing(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!isElectron || !window.api || !selectedFile) return;

    try {
      const outputPath = selectedFile.replace(/\.[^/.]+$/, '_thumbnail.jpg');
      await window.api.ffmpeg.generateThumbnail(selectedFile, outputPath, 10);
      alert(`缩略图已生成: ${outputPath}`);
    } catch {
      setError('生成缩略图失败');
    }
  };

  const handleExtractAudio = async () => {
    if (!isElectron || !window.api || !selectedFile) return;

    try {
      const outputPath = selectedFile.replace(/\.[^/.]+$/, '_audio.mp3');
      await window.api.ffmpeg.extractAudio(selectedFile, outputPath, 'mp3');
      alert(`音频已提取: ${outputPath}`);
    } catch {
      setError('提取音频失败');
    }
  };

  const handleCompressVideo = async () => {
    if (!isElectron || !window.api || !selectedFile) return;

    try {
      setIsProcessing(true);
      setError('');
      setProgress(null);

      const outputPath = selectedFile.replace(/\.[^/.]+$/, '_compressed.mp4');
      await window.api.ffmpeg.compressVideo(selectedFile, outputPath, 'medium');
    } catch {
      setError('视频压缩失败');
      setIsProcessing(false);
    }
  };

  const handleStopProcessing = async () => {
    if (!isElectron || !window.api) return;

    try {
      await window.api.ffmpeg.stopProcessing();
      setIsProcessing(false);
      setProgress(null);
    } catch {
      setError('停止处理失败');
    }
  };

  if (!isElectron) {
    return (
      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
        <p className="text-sm text-yellow-700">🎬 FFmpeg 功能仅在 Electron 环境中可用</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🎬 FFmpeg 视频处理</h3>
      </div>

      <div className="space-y-4">
        {/* 文件选择 */}
        <div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            onClick={handleFileSelect}
            disabled={isProcessing}
          >
            选择视频文件
          </button>
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">已选择: {selectedFile.split('/').pop()}</p>
          )}
        </div>

        {/* 视频信息 */}
        {videoInfo && (
          <div className="bg-gray-50 p-3 rounded border">
            <h4 className="font-semibold mb-2">📊 视频信息</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>时长: {Math.round(videoInfo.duration)}秒</div>
              <div>大小: {videoInfo.size}</div>
              <div>分辨率: {videoInfo.resolution}</div>
              <div>帧率: {videoInfo.fps.toFixed(2)} FPS</div>
              <div>编码: {videoInfo.codec}</div>
              <div>码率: {videoInfo.bitrate}</div>
            </div>
          </div>
        )}

        {/* 处理进度 */}
        {progress && (
          <div className="bg-blue-50 p-3 rounded border">
            <h4 className="font-semibold mb-2">⏳ 处理进度</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>进度: {progress.percent.toFixed(1)}%</span>
                <span>速度: {progress.speed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>已处理: {Math.round(progress.time)}秒</span>
                <span>预计剩余: {progress.eta}</span>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
            onClick={handleConvertVideo}
            disabled={!selectedFile || isProcessing}
          >
            转换视频
          </button>
          <button
            className="bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
            onClick={handleGenerateThumbnail}
            disabled={!selectedFile || isProcessing}
          >
            生成缩略图
          </button>
          <button
            className="bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
            onClick={handleExtractAudio}
            disabled={!selectedFile || isProcessing}
          >
            提取音频
          </button>
          <button
            className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
            onClick={handleCompressVideo}
            disabled={!selectedFile || isProcessing}
          >
            压缩视频
          </button>
        </div>

        {/* 停止按钮 */}
        {isProcessing && (
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            onClick={handleStopProcessing}
          >
            停止处理
          </button>
        )}

        {/* 输出路径 */}
        {outputPath && (
          <div className="bg-green-50 p-3 rounded border">
            <h4 className="font-semibold mb-2">✅ 处理完成</h4>
            <p className="text-sm text-green-700">输出文件: {outputPath}</p>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-50 p-3 rounded border">
            <h4 className="font-semibold mb-2 text-red-700">❌ 错误</h4>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FFmpegDemo;
