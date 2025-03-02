import React from 'react';
import styled from 'styled-components';

const NetworkStatsContainer = styled.div<{ className?: string }>`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 10;

  .unit {
    color: #ccc;
    font-size: 12px;
  }
  
  .status {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    background-color: ${props => {
      switch (props.className) {
        case 'excellent':
          return '#4caf50';
        case 'good':
          return '#8bc34a';
        case 'fair':
          return '#ffc107';
        case 'poor':
          return '#f44336';
        default:
          return '#aaa';
      }
    }};
    color: white;
    font-weight: bold;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  }
`;

const NetworkItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  
  .icon {
    font-size: 18px;
  }
  
  .value {
    color: #fff;
    font-family: monospace;
    font-size: 16px;
  }
`;

interface NetworkStatsProps {
  downSpeed: number;
  upSpeed: number;
  quality: string;
  signalStrength: number;
}

const NetworkStats: React.FC<NetworkStatsProps> = ({
  downSpeed,
  upSpeed,
  quality,
  signalStrength
}) => {
  const formatSpeed = (speed: number) => {
    if (speed >= 1000000) {
      return `${(speed / 1000000).toFixed(1)} Mbps`;
    }
    if (speed >= 1000) {
      return `${(speed / 1000).toFixed(1)} Kbps`;
    }
    return `${speed.toFixed(1)} bps`;
  };

  return (
    <NetworkStatsContainer className={quality}>
      <NetworkItem>
        <span className="icon">⬇️</span>
        <span className="value">{formatSpeed(downSpeed)}</span>
      </NetworkItem>
      <NetworkItem>
        <span className="icon">⬆️</span>
        <span className="value">{formatSpeed(upSpeed)}</span>
      </NetworkItem>
      <NetworkItem>
        <span className="status">{quality.toUpperCase()}</span>
      </NetworkItem>
      <NetworkItem>
        <span className="icon">
          {signalStrength >= 4 ? '📶' : signalStrength >= 3 ? '📶' : signalStrength >= 2 ? '📶' : '📶'}
        </span>
      </NetworkItem>
    </NetworkStatsContainer>
  );
};

export default NetworkStats;