
import React, { useState } from "react";
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/SideBar/SideBar';
import { TopBar } from '../../components/TopBar/TopBar';
import { Box } from "@mui/material";
import { useSelector } from 'react-redux';

export const DashboardLayout = () => {
  const user = useSelector((state: any) => state.auth.user);
  const displayName = user ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) : "Guest";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actualSidebarOpen, setActualSidebarOpen] = useState(false);

  // Generate initials from user data
  const getInitials = () => {
    if (!user) return "G";
    if (user.first_name && user.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    } else if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "G";
  };

  const handleSidebarChange = (isOpen: boolean) => {
    setActualSidebarOpen(isOpen);
  };

  return (
    <Box display="flex" height="100vh">
      <Sidebar onOpenChange={handleSidebarChange} isOpen={sidebarOpen} />
      <Box 
        flexGrow={1} 
        display="flex" 
        flexDirection="column" 
        sx={{ 
          width: '100%', 
          marginLeft: actualSidebarOpen ? '200px' : '60px', 
          paddingLeft: '8px',
          transition: 'margin-left 0.08s cubic-bezier(0.4, 0, 0.2, 1), padding-left 0.08s cubic-bezier(0.4, 0, 0.2, 1)', 
          willChange: 'margin-left', 
          boxSizing: 'border-box', 
          minWidth: 0,
          position: 'relative',
          zIndex: 200,
          backgroundColor: 'transparent',
        }}
      >
        <TopBar name={displayName} initials={getInitials()} onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <Box 
          component="main" 
          flexGrow={1} 
          paddingLeft={2} 
          paddingRight={3} 
          overflow="auto" 
          marginTop={0}
          sx={{
            contain: 'layout style',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}