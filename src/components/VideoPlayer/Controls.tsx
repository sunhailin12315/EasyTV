import React from 'react';
import styled from 'styled-components';

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
  pointer-events: ${props => props.visible === 'true' ? 'auto' : 'none'};
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 15px;
  
  .volume-icon {
    color: white;
    font-size: 18px;
  }
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }
`;

const ControlButton = styled.button`
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const PiPButton = styled(ControlButton)`
  margin-right: 10px;
`;

const FullscreenButton = styled(ControlButton)`
  margin-left: auto;
`;

interface ControlsProps {
  visible: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onTogglePiP: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  visible,
  volume,
  onVolumeChange,
  onTogglePiP,
  onToggleFullscreen,
  isFullscreen
}) => {
  return (
    <ControlsOverlay visible={visible.toString()}>
      <ControlsBar>
        <VolumeControl>
          <span className="volume-icon">🔊</span>
          <VolumeSlider
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
          />
        </VolumeControl>
        <PiPButton onClick={onTogglePiP}>
          画中画
        </PiPButton>
        <FullscreenButton onClick={onToggleFullscreen}>
          {isFullscreen ? '退出全屏' : '全屏'}
        </FullscreenButton>
      </ControlsBar>
    </ControlsOverlay>
  );
};

export default Controls;