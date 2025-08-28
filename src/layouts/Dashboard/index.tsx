
import React from "react";
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/SideBar/SideBar';
import { TopBar } from '../../components/TopBar/TopBar';
import { Box } from "@mui/material";
import { useSelector } from 'react-redux';

export const DashboardLayout = () => {
  const username = useSelector((state: any) => state.auth.user?.username);

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <TopBar name={username || "Guest"} />
        <Box component="main" flexGrow={1} paddingLeft={3} paddingRight={3} overflow="auto" marginTop={0}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}