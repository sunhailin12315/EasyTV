interface Channel {
  id: string;
  name: string;
  logo?: string;
  category?: string;
  streamUrl: string;
  channelNumber?: string;
  alternativeUrls?: string[];
}

interface M3UChannel {
  name: string;
  logo: string;
  group: string;
  urls: string[];
}

// 解析M3U格式的内容
const parseM3U = (content: string): M3UChannel[] => {
  const channelsMap = new Map<string, M3UChannel>();
  const lines = content.split('\n');
  let currentChannel: Partial<M3UChannel> = {};

  console.log('开始解析M3U内容，总行数:', lines.length);

  lines.forEach((line, index) => {
    line = line.trim();
    if (line.startsWith('#EXTINF:-1')) {
      // 解析频道信息行
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const nameMatch = line.match(/tvg-name="([^"]+)"/i);
      const titleMatch = line.match(/,([^,]+)$/);

      const channelName = nameMatch ? nameMatch[1] : (titleMatch ? titleMatch[1].trim() : '');
      console.log(`解析第${index + 1}行: 频道名称="${channelName}", 分组="${groupMatch?.[1] || '未分类'}", Logo="${logoMatch?.[1] || '无'}"`);

      currentChannel = {
        name: channelName,
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : '未分类'
      };
    } else if (line.startsWith('http')) {
      // 处理播放地址行
      if (currentChannel.name) {
        const existingChannel = channelsMap.get(currentChannel.name);
        if (existingChannel) {
          // 如果频道已存在，添加新的播放源
          existingChannel.urls.push(line);
          console.log(`为频道 ${currentChannel.name} 添加新的播放源: ${line}`);
        } else {
          // 创建新的频道记录
          channelsMap.set(currentChannel.name, {
            name: currentChannel.name,
            logo: currentChannel.logo || '',
            group: currentChannel.group || '未分类',
            urls: [line]
          });
          console.log(`添加新频道: ${currentChannel.name}, URL=${line}`);
        }
      } else {
        console.warn(`第${index + 1}行: 发现URL但没有对应的频道信息:`, line);
      }
      currentChannel = {};
    }
  });

  const channels = Array.from(channelsMap.values());
  console.log('M3U解析完成，共解析到', channels.length, '个频道');
  return channels;
};

// 将M3U频道数据转换为应用使用的Channel格式
const convertToAppChannel = (m3uChannels: M3UChannel[]): Channel[] => {
  return m3uChannels.map((channel, index) => ({
    id: `${index + 1}`,
    name: channel.name,
    logo: channel.logo,
    category: channel.group.replace(/^[📺🕘️]/, ''), // 移除emoji前缀
    streamUrl: channel.urls[0], // 使用第一个播放源作为默认源
    channelNumber: `${index + 1}`.padStart(3, '0'),
    alternativeUrls: channel.urls
  }));
};

// 获取频道列表
export const fetchChannels = async (sourceUrl?: string): Promise<Channel[]> => {
  try {
    console.log('开始获取频道列表...');
    const url = sourceUrl || (process.env.PUBLIC_URL + '/data/channels.m3u');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.text();
    console.log('成功获取M3U内容，长度:', data.length);
    
    // 移除BOM和处理空白字符
    data = data.trim().replace(/^\uFEFF/, '');
    
    // 验证M3U内容的基本格式（忽略大小写和空白字符）
    if (!data.toUpperCase().includes('#EXTM3U')) {
      throw new Error('无效的M3U格式：缺少#EXTM3U标头');
    }
    
    // 打印M3U文件的前几行用于调试
    const firstLines = data.split('\n').slice(0, 5).join('\n');
    console.log('M3U文件前5行内容：\n', firstLines);
    
    const m3uChannels = parseM3U(data);
    console.log('解析到的M3U频道数量:', m3uChannels.length);
    
    if (m3uChannels.length === 0) {
      throw new Error('未能从M3U内容中解析出任何频道');
    }
    
    const appChannels = convertToAppChannel(m3uChannels);
    console.log('频道列表转换完成，总数:', appChannels.length);
    return appChannels;
  } catch (error) {
    console.error('获取频道列表失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    return [];
  }
};

// 获取所有可用的频道分类
export const getCategories = (channels: Channel[]) => {
  const categories = new Set(channels.map(channel => channel.category));
  return [{ id: 'all', title: '全部频道' }]
    .concat(Array.from(categories)
      .filter(Boolean)
      .map(category => ({
        id: category || '',
        title: category || '未分类'
      })));
};