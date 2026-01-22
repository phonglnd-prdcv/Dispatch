import React from 'react';

import { Box } from '@/components/ui/box';

import SideMenu from './side-menu';

interface WebSidebarProps {
  onNavigate?: () => void;
}

const WebSidebar: React.FC<WebSidebarProps> = ({ onNavigate }) => {
  return (
    <Box className="hidden w-full max-w-[340px] flex-1 pl-12 md:flex md:web:max-h-[calc(100vh-144px)]">
      <SideMenu onNavigate={onNavigate} />
    </Box>
  );
};

export default WebSidebar;
