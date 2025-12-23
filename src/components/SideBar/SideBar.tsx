import './Sidebar.scss';
import { Box, IconButton, Typography, Divider } from '@mui/material';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import ArrowIcon from '../../assets/Arrow.svg';
import BoxIcon from '../../assets/Box.svg';
import CheckBoxIcon from '../../assets/CheckBox.svg';
import DollarIcon from '../../assets/Dollor.svg';
import GearIcon from '../../assets/Gear.svg';
import GroupIcon from '../../assets/Group.svg';
import HumanIcon from '../../assets/Human.svg';
import MailIcon from '../../assets/Mail.svg';
import VectorIcon from '../../assets/Vector.svg';
import SettingsIcon from '../../assets/Setting.svg';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorageIcon from '@mui/icons-material/Storage';
interface SidebarItem {
  id: string;
  icon: string | React.ReactNode;
  alt: string;
  iconWidth: string;
  iconHeight: string;
  marginTop: string;
  label: string;
  route?: string;
  isComponent?: boolean;
}

const WhiteIcon: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <Box 
    sx={{ 
      color: 'white', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '& svg': { 
        fill: 'white !important',
        color: 'white !important',
        '& path, & circle, & rect, & polygon': { 
          fill: 'white !important',
          stroke: 'white !important'
        }
      }
    }}
  >
    {children}
  </Box>
);

const baseItems: SidebarItem[] = [
  { id: 'vector', icon: VectorIcon, alt: 'Vector', label: "Home", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/dashboard' },
  { id: 'dollar', icon: DollarIcon, alt: 'Dollar', label: "Sales", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/sales' },
  { id: 'box', icon: BoxIcon, alt: 'Box', label: "Inventory", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/inventory' },
  // { id: 'human', icon: HumanIcon, alt: 'Human', label: "Customers", iconWidth: '26px', iconHeight: '26px', marginTop: '5px' },
  { id: 'mail', icon: MailIcon, alt: 'Mail', label: "Order Receive", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/receive/order-receive' },
  { id: 'master', icon: <WhiteIcon><StorageIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Master', label: "Master", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/master', isComponent: true },
  // { id: 'checkbox', icon: CheckBoxIcon, alt: 'CheckBox', label: "Tasks", iconWidth: '24px', iconHeight: '24px', marginTop: '5px' },
  // { id: 'arrow', icon: ArrowIcon, alt: 'Arrow', label: "Reports", iconWidth: '24px', iconHeight: '24px', marginTop: '5px' },
  // { id: 'gear', icon: GearIcon, alt: 'Gear', label: "Tools", iconWidth: '24px', iconHeight: '24px', marginTop: '5px' }
];
interface SidebarProps {
  onOpenChange?: (isOpen: boolean) => void;
  isOpen?: boolean; 
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenChange, isOpen }) => {
  const [activeItemId, setActiveItemId] = useState<string>('vector');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const open = isHovered || (typeof isOpen === 'boolean' ? isOpen : uncontrolledOpen);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (onOpenChange) {
      onOpenChange(true);
    }
  }, [onOpenChange]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (onOpenChange && !uncontrolledOpen && typeof isOpen !== 'boolean') {
      onOpenChange(false);
    }
  }, [onOpenChange, uncontrolledOpen, isOpen]);

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(open);
    }
  }, [open, onOpenChange]);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: any) => state.auth.user);
  const isAdmin = useMemo(() => Boolean((user as any)?.role === 'admin' || (user as any)?.is_admin), [user]);

  const adminItems: SidebarItem[] = useMemo(() => [
    { id: 'admin-home', icon: <WhiteIcon><DashboardIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Dashboard', label: 'Dashboard', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin', isComponent: true },
    { id: 'admin-users', icon: <WhiteIcon><PeopleAltIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'User Management', label: 'User Management', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/users', isComponent: true },
    { id: 'admin-reports', icon: <WhiteIcon><BarChartIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Reports', label: 'Reports', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/reports', isComponent: true },
    { id: 'admin-inventory-adjustment', icon: <WhiteIcon><InventoryIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Inventory Adjustment', label: 'Inventory Adjustment', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/inventory-adjustment', isComponent: true },
    { id: 'admin-settings', icon: <WhiteIcon><SettingsOutlinedIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Settings', label: 'Settings', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/settings', isComponent: true },
    { id: 'admin-audit', icon: <WhiteIcon><DescriptionIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Audit Log', label: 'Audit Log', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/audit', isComponent: true },
  ], []);

  const sidebarItems = useMemo(() => {
    if (location.pathname.startsWith('/admin')) return adminItems;
    if (isAdmin) {
      return [
        ...baseItems,
        { id: 'admin-link', icon: GearIcon, alt: 'Admin', label: 'Admin', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin' },
      ];
    }
    return baseItems;
  }, [isAdmin, location.pathname, adminItems]);

  useEffect(() => {
    const currentPath = location.pathname;
        const sortedItems = [...sidebarItems].filter(item => item.route).sort((a, b) => {
      const aLength = a.route?.length || 0;
      const bLength = b.route?.length || 0;
      return bLength - aLength;
    });
    
    const matchingItem = sortedItems.find(item => {
      if (!item.route) return false;
      
      if (item.route === currentPath) return true;
         
      if (currentPath.startsWith(item.route + '/')) return true;
      
      return false;
    });
    
    if (matchingItem) {
      setActiveItemId(matchingItem.id);
    } else {
      if (sidebarItems.length > 0) {
        setActiveItemId(sidebarItems[0].id);
      }
    }
  }, [location.pathname, sidebarItems]);
return (
    <Box sx={{ display: 'flex', height: '100vh', }}>
      <Box
        className="sidebar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          width: open ? 200 : 60,
          minWidth: open ? 200 : 60,
          maxWidth: open ? 200 : 60,
          overflow: 'hidden',
          overflowX: 'hidden',
          flexShrink: 0,
          backgroundColor: '#5C17E5',
          paddingTop: '10px',
          zIndex: 100,
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 0,
          color: 'white',
          transition: "width 0.08s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.08s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.08s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: 'width',
          contain: 'layout style paint',
          pointerEvents: 'auto',
          boxShadow: open ? '2px 0 8px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
         <Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 12px 12px 12px',
    width: '100%',
    cursor: 'pointer', // make it clickable
  }}
  onClick={() => {
    setUncontrolledOpen(prev => !prev); // toggle sidebar
    if (onOpenChange) onOpenChange(!open); // notify parent if needed
  }}
>
  <img src={GroupIcon} alt="Logo" style={{ width: '32px', height: '32px' }} />
  {open && (
    <Typography 
      variant="subtitle1" 
      sx={{ 
        fontSize: '18px', 
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}
    >
      Pharma App
    </Typography>
  )}
</Box>


        {sidebarItems.map(item => (
          <React.Fragment key={item.id}>
            <ListItem
              button
              onClick={() => {
                setActiveItemId(item.id)
                if (item.route) navigate(item.route);
              }}
              className={`sidebar-item ${activeItemId === item.id ? 'sidebar-item-active' : ''}`}
              sx={{
                padding: "8px 16px",
                color: "white",
                display: "flex",
                alignItems: "center",
                '&:hover': {
                  backgroundColor: activeItemId === item.id ? "rgba(74, 18, 196, 0.8)" : "rgba(255,255,255,0.1)",
                },
                marginBottom: 0,
                position: 'relative',
              }}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: "40px", 
                  color: "white",
                  '& svg': {
                    color: 'white !important',
                    fill: 'white !important',
                    '& path, & circle, & rect, & polygon': {
                      fill: 'white !important',
                      stroke: 'white !important'
                    }
                  }
                }}
              >
                {item.isComponent ? (
                  item.icon
                ) : (
                  <img
                    src={item.icon as string}
                    alt={item.alt}
                    style={{ width: item.iconWidth, height: item.iconHeight }}
                  />
                )}
              </ListItemIcon>

              {open && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                />
              )}
            </ListItem>

            {(item.id === 'vector') && (
              <Divider
                sx={{
                  width: "100%",
                  backgroundColor: "#CBD4E166",
                  margin: "4px 0",
                }}
              />
            )}
          </React.Fragment>
        ))}


        <Box
          sx={{
            marginTop: 'auto',
            paddingBottom: '24px',
            display: 'flex',
            width: '100%',
            justifyContent: open ? "center" : "flex-start",
          }}
        >
          <IconButton className="settings-icon-border">
            <img
              src={SettingsIcon}
              alt="Settings"
              style={{ width: '24.91px', height: '24px' }}
            />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};