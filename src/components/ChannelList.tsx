import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface Program {
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface Channel {
  id: string;
  name: string;
  logo?: string;
  category?: string;
  streamUrl: string;
  currentProgram?: Program;
  nextProgram?: Program;
}

interface ChannelListProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite?: (channelId: string) => void;
  favoriteChannels?: string[];
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

const SearchContainer = styled.div`
  padding: 10px;
  background-color: #333333;
  border-radius: 8px;
  margin-bottom: 10px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: #444444;
  color: white;
  font-size: 16px;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #ff5722;
  }
  
  &::placeholder {
    color: #888888;
  }
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

const ProgramInfo = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 15px;
  flex: 1;
`;

const CurrentProgram = styled.div`
  color: #ffffff;
  font-size: 14px;
  margin-top: 4px;
`;

const NextProgram = styled.div`
  color: #888888;
  font-size: 12px;
  margin-top: 2px;
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

const ChannelList: React.FC<ChannelListProps> = ({ 
  channels, 
  onSelectChannel, 
  onToggleFavorite, 
  favoriteChannels = [] 
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ListContainer>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="搜索频道..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchContainer>
      {filteredChannels.map((channel, index) => (
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
          <ProgramInfo>
            <ChannelName>{channel.name}</ChannelName>
            {channel.currentProgram && (
              <CurrentProgram>
                {channel.currentProgram.title}
                ({channel.currentProgram.startTime} - {channel.currentProgram.endTime})
              </CurrentProgram>
            )}
            {channel.nextProgram && (
              <NextProgram>
                下一个: {channel.nextProgram.title}
                ({channel.nextProgram.startTime} - {channel.nextProgram.endTime})
              </NextProgram>
            )}
          </ProgramInfo>
          <div style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(channel.id);
            }}>
              {favoriteChannels.includes(channel.id) ? '❤️' : '🤍'}
            </div>
        </ChannelItem>
      ))}
    </ListContainer>
  );
};

export default ChannelList;