import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface Channel {
  id: string;
  name: string;
  logo?: string;
  category?: string;
  streamUrl: string;
}

interface ChannelListProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
}

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #222222;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 10px;
`;

const ChannelItem = styled.div<{ focused: boolean }>`
  display: flex;
  align-items: center;
  padding: 15px;
  margin: 5px 0;
  background-color: ${props => props.focused ? '#444444' : '#333333'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: ${props => props.focused ? 'scale(1.02)' : 'scale(1)'} translateX(${props => props.focused ? '5px' : '0'});
  border-left: ${props => props.focused ? '4px solid #ff5722' : '4px solid transparent'};
  
  &:hover {
    background-color: #444444;
  }
`;

const ChannelLogo = styled.img`
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-right: 15px;
  border-radius: 5px;
  background-color: #1a1a1a;
  padding: 5px;
`;

const ChannelName = styled.div`
  color: white;
  font-size: 18px;
  font-weight: 500;
`;

const PlaceholderLogo = styled.div`
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
  color: #ffffff;
  font-weight: bold;
  margin-right: 15px;
  border-radius: 5px;
`;

const ChannelList: React.FC<ChannelListProps> = ({ channels, onSelectChannel }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, channels.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (channels[focusedIndex]) {
            onSelectChannel(channels[focusedIndex]);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [channels, focusedIndex, onSelectChannel]);

  // 自动滚动到当前焦点项
  useEffect(() => {
    const focusedElement = document.getElementById(`channel-${focusedIndex}`);
    if (focusedElement) {
      focusedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedIndex]);

  return (
    <ListContainer>
      {channels.map((channel, index) => (
        <ChannelItem
          key={channel.id}
          id={`channel-${index}`}
          focused={index === focusedIndex}
          onClick={() => {
            setFocusedIndex(index);
            onSelectChannel(channel);
          }}
        >
          {channel.logo ? (
            <ChannelLogo src={channel.logo} alt={channel.name} />
          ) : (
            <PlaceholderLogo>{channel.name.substring(0, 2).toUpperCase()}</PlaceholderLogo>
          )}
          <ChannelName>{channel.name}</ChannelName>
        </ChannelItem>
      ))}
    </ListContainer>
  );
};

export default ChannelList;