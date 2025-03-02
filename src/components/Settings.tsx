import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

interface SettingsProps {
  onClose: () => void;
  onSaveChannelSource: (url: string) => Promise<void>;
  currentChannelSource?: string;
}

const SettingsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const SettingsPanel = styled.div`
  background-color: #222;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  color: white;
`;

const Title = styled.h2`
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #fff;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  color: #ccc;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: white;
  font-size: 14px;
  margin-bottom: 10px;

  &:focus {
    outline: none;
    border-color: #666;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background-color: ${props => props.primary ? '#007bff' : '#444'};
  color: white;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.primary ? '#0056b3' : '#555'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const Settings: React.FC<SettingsProps> = ({
  onClose,
  onSaveChannelSource,
  currentChannelSource
}) => {
  const [channelSource, setChannelSource] = useState(currentChannelSource || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!channelSource) return;
    setIsSaving(true);
    try {
      await onSaveChannelSource(channelSource);
      onClose();
    } catch (error) {
      console.error('保存频道源失败:', error);
      // 这里可以添加错误提示UI
    } finally {
      setIsSaving(false);
    }
  }, [channelSource, onSaveChannelSource, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      handleSave();
    }
  }, [onClose, handleSave]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <SettingsOverlay>
      <SettingsPanel>
        <Title>设置</Title>
        <Section>
          <Label>频道源地址</Label>
          <Input
            type="text"
            value={channelSource}
            onChange={(e) => setChannelSource(e.target.value)}
            placeholder="请输入M3U频道源地址"
            disabled={isSaving}
          />
        </Section>
        <ButtonGroup>
          <Button onClick={onClose}>取消</Button>
          <Button primary onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </ButtonGroup>
      </SettingsPanel>
    </SettingsOverlay>
  );
};

export default Settings;