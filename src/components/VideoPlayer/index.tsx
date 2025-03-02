import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import Hls from 'hls.js';
import Controls from './Controls';
import NetworkStats from './NetworkStats';
import LoadingAndError from './LoadingAndError';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
`;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const ChannelInfo = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  z-index: 10;
`;

const ChannelNumber = styled.span`
  color: #ff5722;
  font-size: 18px;
  font-weight: bold;
`;

const ChannelTitle = styled.h2`
  color: white;
  margin: 0;
  font-size: 24px;
  font-weight: 500;
`;

interface VideoPlayerProps {
  streamUrl: string;
  title?: string;
  autoPlay?: boolean;
  onError?: (error: any) => void;
  maxRetries?: number;
  channelNumber?: string;
  alternativeUrls?: string[];
  onUrlChange?: (url: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  title,
  autoPlay = true,
  onError,
  maxRetries = 3,
  channelNumber,
  alternativeUrls = [],
  onUrlChange
}) => {
  const hls = useRef<Hls | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [networkStats, setNetworkStats] = useState({
    downSpeed: 0,
    upSpeed: 0,
    quality: 'excellent',
    signalStrength: 4
  });

  // 网络状态监控
  useEffect(() => {
    const updateNetworkStats = () => {
      if ('connection' in navigator && navigator.connection) {
        const connection = navigator.connection as any;
        const downSpeed = connection.downlink * 1024 * 1024;
        const upSpeed = Math.max(downSpeed * 0.1, 500000);
        let quality = 'excellent';
        let signalStrength = 4;

        if (downSpeed < 1000000) {
          quality = 'poor';
          signalStrength = 1;
        } else if (downSpeed < 2000000) {
          quality = 'fair';
          signalStrength = 2;
        } else if (downSpeed < 5000000) {
          quality = 'good';
          signalStrength = 3;
        }

        setNetworkStats({ downSpeed, upSpeed, quality, signalStrength });
      }
    };

    updateNetworkStats();
    const interval = setInterval(updateNetworkStats, 2000);

    return () => clearInterval(interval);
  }, []);

  // 视频播放控制
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      setVolume(newVolume);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('全屏切换失败:', error);
    }
  }, []);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('画中画模式切换失败:', error);
    }
  }, []);

  // 错误处理和重试
  const retryPlayback = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setHasError(false);
      setIsLoading(true);
      setErrorMessage('');
      if (videoRef.current) {
        videoRef.current.load();
      }
    } else {
      setErrorMessage(`视频加载失败，已重试${maxRetries}次，请检查网络连接或稍后重试`);
    }
  }, [retryCount, maxRetries]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && hasError) {
        retryPlayback();
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (videoRef.current?.paused) {
          videoRef.current.play().catch(console.error);
        } else {
          videoRef.current?.pause();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasError, retryPlayback, toggleFullscreen]);

  // 视频事件处理
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const handleError = () => {
      const error = video.error;
      setIsLoading(false);
      setHasError(true);

      let errorMsg = '未知错误';
      if (error) {
        switch (error.code) {
          case 1:
            errorMsg = '视频加载被中止';
            break;
          case 2:
            errorMsg = '网络错误，请检查视频地址是否可访问';
            break;
          case 3:
            errorMsg = '视频解码错误，当前格式可能不受支持';
            break;
          case 4:
            errorMsg = '视频格式不支持或地址无效';
            break;
        }
      }

      if (retryCount < maxRetries) {
        setErrorMessage(`${errorMsg}，正在进行第${retryCount + 1}次重试...`);
        setTimeout(retryPlayback, 2000);
      } else {
        setErrorMessage(`${errorMsg}，已重试${maxRetries}次，请检查网络连接或稍后重试`);
      }
      if (onError) onError({ code: error?.code, message: errorMsg });
    };

    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', () => setIsLoading(true));
    video.addEventListener('canplay', () => {
      setIsLoading(false);
      if (autoPlay) {
        video.play().catch(console.error);
      }
    });

    return () => {
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', () => setIsLoading(true));
      video.removeEventListener('canplay', () => setIsLoading(false));
    };
  }, [autoPlay, maxRetries, onError, retryCount, retryPlayback]);

  // HLS 播放器初始化
  useEffect(() => {
    if (!videoRef.current) return;

    if (Hls.isSupported()) {
      if (hls.current) {
        hls.current.destroy();
      }

      const newHls = new Hls();
      hls.current = newHls;
      newHls.loadSource(streamUrl);
      newHls.attachMedia(videoRef.current);

      newHls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              newHls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              newHls.recoverMediaError();
              break;
            default:
              retryPlayback();
              break;
          }
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamUrl;
    }

    return () => {
      if (hls.current) {
        hls.current.destroy();
      }
    };
  }, [streamUrl, retryPlayback]);

  // 处理UI元素显示/隐藏
  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      setUiVisible(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => setUiVisible(false), 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      // 初始显示3秒后自动隐藏
      hideTimeout = setTimeout(() => setUiVisible(false), 3000);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(hideTimeout);
    };
  }, []);

  return (
    <PlayerContainer ref={containerRef}>
      <StyledVideo ref={videoRef} />
      
      {title && uiVisible && (
        <ChannelInfo>
          {channelNumber && <ChannelNumber>{channelNumber}</ChannelNumber>}
          <ChannelTitle>{title}</ChannelTitle>
        </ChannelInfo>
      )}

      <LoadingAndError
        isLoading={isLoading}
        hasError={hasError}
        errorMessage={errorMessage}
      />

      <Controls
        visible={uiVisible}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onTogglePiP={togglePiP}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      {uiVisible && (
        <NetworkStats
          downSpeed={networkStats.downSpeed}
          upSpeed={networkStats.upSpeed}
          quality={networkStats.quality}
          signalStrength={networkStats.signalStrength}
        />
      )}
    </PlayerContainer>
  );
};

export default VideoPlayer;