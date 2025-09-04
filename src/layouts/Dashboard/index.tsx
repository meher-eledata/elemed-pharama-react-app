
import React, { useState } from "react";
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/SideBar/SideBar';
import { TopBar } from '../../components/TopBar/TopBar';
import { Box } from "@mui/material";
import { useSelector } from 'react-redux';

export const DashboardLayout = () => {
  const username = useSelector((state: any) => state.auth.user?.username);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box display="flex" height="100vh">
      <Sidebar onOpenChange={setSidebarOpen} />
      <Box flexGrow={1} display="flex" flexDirection="column" sx={{ marginLeft: sidebarOpen ? '200px' : '60px', transition: 'margin-left 0.3s ease' }}>
        <TopBar name={username || "Guest"} />
        <Box component="main" flexGrow={1} paddingLeft={3} paddingRight={3} overflow="auto" marginTop={0}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}