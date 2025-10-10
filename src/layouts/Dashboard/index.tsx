
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

  return (
    <Box display="flex" height="100vh">
      <Sidebar onOpenChange={setSidebarOpen} isOpen={sidebarOpen} />
      <Box flexGrow={1} display="flex" flexDirection="column" sx={{ width: '100%', paddingLeft: sidebarOpen ? '200px' : '60px', transition: 'padding-left 0.3s ease', boxSizing: 'border-box', minWidth: 0 }}>
        <TopBar name={displayName} initials={getInitials()} onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <Box component="main" flexGrow={1} paddingLeft={3} paddingRight={3} overflow="auto" marginTop={0}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}