import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface NavigationProps {
  items: Array<{
    id: string;
    title: string;
    selected?: boolean;
  }>;
  onSelect: (id: string) => void;
}

const NavContainer = styled.div`
  display: flex;
  flex-direction: row;
  background-color: #1a1a1a;
  padding: 10px 0;
  width: 100%;
  overflow-x: auto;
`;

const NavItem = styled.div<{ selected?: boolean }>`
  padding: 15px 30px;
  margin: 0 5px;
  color: ${props => props.selected ? '#ffffff' : '#b3b3b3'};
  background-color: ${props => props.selected ? '#333333' : 'transparent'};
  border-radius: 5px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover, &:focus {
    background-color: #333333;
    color: #ffffff;
    transform: scale(1.05);
    outline: none;
  }
`;

const Navigation: React.FC<NavigationProps> = ({ items, onSelect }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [navItems, setNavItems] = useState(items);

  // 更新选中项
  const updateSelectedItem = React.useCallback((id: string) => {
    const updatedItems = navItems.map(item => ({
      ...item,
      selected: item.id === id
    }));
    setNavItems(updatedItems);
  }, [navItems]);
  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowLeft':
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (items[focusedIndex]) {
            onSelect(items[focusedIndex].id);
            updateSelectedItem(items[focusedIndex].id);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, items, onSelect, updateSelectedItem]);
  return (
    <NavContainer>
      {navItems.map((item, index) => (
        <NavItem
          key={item.id}
          selected={index === focusedIndex || item.selected}
          onClick={() => {
            onSelect(item.id);
            updateSelectedItem(item.id);
            setFocusedIndex(index);
          }}
          tabIndex={0}
        >
          {item.title}
        </NavItem>
      ))}
    </NavContainer>
  );
};

export default Navigation;