import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import './App.css';
import Navigation from './components/Navigation';
import ChannelList from './components/ChannelList';
import VideoPlayer from './components/VideoPlayer';
import Settings from './components/Settings';
import { fetchChannels, getCategories } from './services/channelService';

// 定义频道数据接口
interface Channel {
  id: string;
  name: string;
  logo?: string;
  category?: string;
  streamUrl: string;
  channelNumber?: string;
  alternativeUrls?: string[];
}

// 定义分类接口
interface Category {
  id: string;
  title: string;
}

// 应用容器样式
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #121212;
  color: white;
  overflow: hidden;
`;

// 主内容区域样式
const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

// 频道列表区域样式
const ChannelListSection = styled.div`
  width: 30%;
  height: 100%;
  border-right: 1px solid #333;
`;

// 视频播放区域样式
const VideoSection = styled.div`
  flex: 1;
  height: 100%;
`;

function App() {
  // 状态管理
  const [categories, setCategories] = useState<Category[]>([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [channelSource, setChannelSource] = useState<string>('');

  // 加载频道数据
  useEffect(() => {
    const loadChannels = async () => {
      const channels = await fetchChannels(channelSource);
      setAllChannels(channels);
      setCategories(getCategories(channels));
    };
    loadChannels();
  }, [channelSource]);

  // 根据分类筛选频道
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredChannels(allChannels);
    } else {
      setFilteredChannels(allChannels.filter(channel => channel.category === selectedCategory));
    }
  }, [selectedCategory, allChannels]);

  // 选择频道时的处理函数
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
  };

  // 选择分类时的处理函数
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // 处理频道源保存
  const handleSaveChannelSource = async (url: string) => {
    setChannelSource(url);
    localStorage.setItem('channelSource', url);
  };

  // 加载保存的频道源
  useEffect(() => {
    const savedSource = localStorage.getItem('channelSource');
    if (savedSource) {
      setChannelSource(savedSource);
    }
  }, []);

  return (
    <AppContainer>
      <Navigation 
        items={[...categories, { id: 'settings', title: '设置' }]} 
        onSelect={(id) => {
          if (id === 'settings') {
            setShowSettings(true);
          } else {
            handleSelectCategory(id);
          }
        }} 
      />
      <MainContent>
        <ChannelListSection>
          <ChannelList 
            channels={filteredChannels} 
            onSelectChannel={handleSelectChannel} 
          />
        </ChannelListSection>
        <VideoSection>
          {selectedChannel ? (
            <VideoPlayer 
              streamUrl={selectedChannel.streamUrl}
              title={selectedChannel.name}
              autoPlay={true}
              onError={(error) => console.error('播放错误:', error)}
              channelNumber={selectedChannel.channelNumber}
              alternativeUrls={selectedChannel.alternativeUrls}
              onUrlChange={(url) => {
                setSelectedChannel({
                  ...selectedChannel,
                  streamUrl: url
                });
              }}
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              backgroundColor: '#000',
              fontSize: '20px'
            }}>
              请选择一个频道开始观看
            </div>
          )}
        </VideoSection>
      </MainContent>
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSaveChannelSource={handleSaveChannelSource}
          currentChannelSource={channelSource}
        />
      )}
    </AppContainer>
  );
}

export default App;
