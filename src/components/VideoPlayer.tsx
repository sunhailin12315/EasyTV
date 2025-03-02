import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import Hls from 'hls.js';
// 如果找不到模块，请确保已安装依赖：npm install hls.js @types/hls.js --save

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

const LoadingIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 15px 30px;
  border-radius: 8px;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ff5252;
  font-size: 18px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 8px;
  max-width: 80%;
`;

const ControlsOverlay = styled.div<{ visible: string }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 20px;
  opacity: ${props => props.visible === 'true' ? 1 : 0};
  transition: opacity 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
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

const NetworkStats = styled.div`
  color: #aaa;
  font-size: 14px;
  margin-top: 5px;
`;

const SourceSelector = styled.select`
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: 1px solid #666;
  padding: 5px;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #888;
  }
`;
const FullscreenButton = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  opacity: ${props => props.style?.opacity || 0};
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
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
  const [controlsVisible, setControlsVisible] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
const [networkStats, setNetworkStats] = useState({ speed: 0, quality: '良好' });

  useEffect(() => {
    const updateNetworkStats = () => {
      if ('connection' in navigator && navigator.connection) {
        const connection = navigator.connection as any;
        const speed = connection.downlink * 1024 * 1024; // 转换为bps
        let quality = '良好';
        
        if (speed < 1000000) { // 低于1Mbps
          quality = '较差';
        } else if (speed < 5000000) { // 低于5Mbps
          quality = '一般';
        }

        setNetworkStats({ speed, quality });
      }
    };

    // 初始更新网络状态
    updateNetworkStats();

    // 监听网络状态变化
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkStats);
    }

    return () => {
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStats);
      }
    };
  }, []);
const [currentUrl, setCurrentUrl] = useState(streamUrl);

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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && hasError) {
      console.log('用户触发重试播放');
      retryPlayback();
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (videoRef.current?.paused) {
        console.log('用户触发播放');
        videoRef.current.play().catch(error => {
          console.error('播放失败:', error);
        });
      } else {
        console.log('用户触发暂停');
        videoRef.current?.pause();
      }
      resetControlsTimer();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  }, [hasError, retryPlayback, toggleFullscreen]);

  const handleLoadStart = useCallback(() => {
    console.log('开始加载视频:', streamUrl);
    setIsLoading(true);
  }, [streamUrl]);

  const handleLoadedMetadata = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    console.log('视频元数据加载完成:', {
      duration: videoElement.duration,
      videoWidth: videoElement.videoWidth,
      videoHeight: videoElement.videoHeight,
      readyState: videoElement.readyState
    });
  }, []);

  const handleProgress = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (videoElement.buffered.length > 0) {
      const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
      console.log('视频缓冲进度:', {
        bufferedEnd,
        networkState: videoElement.networkState,
        readyState: videoElement.readyState
      });
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    console.log('视频可以开始播放');
    setIsLoading(false);
    if (autoPlay) {
      videoElement.play().catch(error => {
        console.error('自动播放失败:', error);
        setHasError(true);
        setErrorMessage('自动播放失败，请按确认键开始播放');
      });
    }
  }, [autoPlay]);

  const handleError = useCallback((e: Event) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const error = videoElement.error;
    const errorDetails = {
      code: error?.code,
      message: error?.message,
      networkState: videoElement.networkState,
      readyState: videoElement.readyState,
      currentSrc: videoElement.currentSrc,
      retryCount: retryCount
    };
    console.error('视频播放错误:', errorDetails);
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
    if (onError) onError(errorDetails);
  }, [maxRetries, onError, retryCount, retryPlayback]);

  const handleStalled = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    console.warn('视频加载停滞:', {
      networkState: videoElement.networkState,
      readyState: videoElement.readyState
    });
  }, []);

  const handleSuspend = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    console.log('视频加载暂停:', {
      networkState: videoElement.networkState,
      readyState: videoElement.readyState
    });
  }, []);

  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    setControlsVisible(true);
    controlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  const handleContainerClick = useCallback(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('click', handleContainerClick);

    return () => {
      container.removeEventListener('click', handleContainerClick);
    };
  }, [handleContainerClick]);

  useEffect(() => {
    setRetryCount(0);
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    resetControlsTimer();

    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [streamUrl, resetControlsTimer]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // 清理之前的HLS实例
    if (hls.current) {
      hls.current.destroy();
      hls.current = null;
    }

    // 检查是否是HLS流
    if (streamUrl.toLowerCase().endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        hls.current = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.current.loadSource(streamUrl);
        hls.current.attachMedia(videoElement);

        hls.current.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('HLS网络错误:', data);
                if (retryCount < maxRetries) {
                  setTimeout(() => hls.current?.loadSource(streamUrl), 2000);
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('HLS媒体错误:', data);
                if (retryCount < maxRetries) {
                  hls.current?.recoverMediaError();
                }
                break;
              default:
                console.error('HLS致命错误:', data);
                if (retryCount < maxRetries) {
                  hls.current?.destroy();
                  hls.current = new Hls();
                  hls.current.loadSource(streamUrl);
                  hls.current.attachMedia(videoElement);
                }
                break;
            }
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // 原生HLS支持（如Safari）
        videoElement.src = streamUrl;
      }
    } else {
      // 非HLS流
      videoElement.src = streamUrl;
    }

    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('stalled', handleStalled);
    videoElement.addEventListener('suspend', handleSuspend);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('stalled', handleStalled);
      videoElement.removeEventListener('suspend', handleSuspend);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [autoPlay, hasError, onError, retryCount, maxRetries, retryPlayback, streamUrl, handleKeyDown, handleLoadStart, handleLoadedMetadata, handleProgress, handleCanPlay, handleError, handleStalled, handleSuspend]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <PlayerContainer ref={containerRef}>
      <StyledVideo 
        ref={videoRef} 
        src={streamUrl}
        controls={false}
      />
      
      {isLoading && !hasError && (
        <LoadingIndicator>加载中...</LoadingIndicator>
      )}
      
      {hasError && (
        <ErrorMessage>{errorMessage}</ErrorMessage>
      )}
      
      <ControlsOverlay visible={controlsVisible.toString()}>
        <ChannelInfo>
          {channelNumber && <ChannelNumber>{channelNumber}</ChannelNumber>}
          {title && <ChannelTitle>{title}</ChannelTitle>}
        </ChannelInfo>
        <NetworkStats>
          网速: {(networkStats.speed / 1024 / 1024).toFixed(2)} Mbps | 信号: {networkStats.quality}
        </NetworkStats>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {alternativeUrls.length > 0 && (
            <SourceSelector
              value={currentUrl}
              onChange={(e) => {
                setCurrentUrl(e.target.value);
                if (onUrlChange) onUrlChange(e.target.value);
              }}
            >
              {alternativeUrls.map((url, index) => (
                <option key={`source-${index}`} value={url}>
                  线路 {index + 1}
                </option>
              ))}
            </SourceSelector>
          )}
          <FullscreenButton 
            style={{ opacity: controlsVisible ? 1 : 0 }}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </FullscreenButton>
        </div>
      </ControlsOverlay>
    </PlayerContainer>
  );
};

export default VideoPlayer;