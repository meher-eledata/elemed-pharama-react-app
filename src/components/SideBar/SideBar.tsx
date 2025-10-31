import './Sidebar.scss';
import { Box, IconButton, Typography, Divider } from '@mui/material';
import React, { useMemo, useState, } from 'react';
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
const baseItems: SidebarItem[] = [
  { id: 'vector', icon: VectorIcon, alt: 'Vector', label: "Home", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/dashboard' },
  { id: 'dollar', icon: DollarIcon, alt: 'Dollar', label: "Sales", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/sales/sale-history' },
  { id: 'box', icon: BoxIcon, alt: 'Box', label: "Inventory", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/inventory' },
  { id: 'human', icon: HumanIcon, alt: 'Human', label: "Customers", iconWidth: '26px', iconHeight: '26px', marginTop: '5px' },
  { id: 'mail', icon: MailIcon, alt: 'Mail', label: "Order Receive", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/receive/order-receive' },
  { id: 'checkbox', icon: CheckBoxIcon, alt: 'CheckBox', label: "Tasks", iconWidth: '24px', iconHeight: '24px', marginTop: '5px' },
  { id: 'arrow', icon: ArrowIcon, alt: 'Arrow', label: "Reports", iconWidth: '24px', iconHeight: '24px', marginTop: '5px' },
  { id: 'gear', icon: GearIcon, alt: 'Gear', label: "Tools", iconWidth: '24px', iconHeight: '24px', marginTop: '5px' }
];
interface SidebarProps {
  onOpenChange?: (isOpen: boolean) => void;
  isOpen?: boolean; // controlled open state (from parent)
}

// Helper component to render white Material-UI icons
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

export const Sidebar: React.FC<SidebarProps> = ({ onOpenChange, isOpen }) => {
  const [activeItemId, setActiveItemId] = useState<string>('vector');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = typeof isOpen === 'boolean' ? isOpen : uncontrolledOpen;
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: any) => state.auth.user);
  const isAdmin = useMemo(() => Boolean((user as any)?.role === 'admin' || (user as any)?.is_admin), [user]);

  // Admin-specific sidebar items
  const adminItems: SidebarItem[] = [
    { id: 'admin-home', icon: <WhiteIcon><DashboardIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Dashboard', label: 'Dashboard', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin', isComponent: true },
    { id: 'admin-users', icon: <WhiteIcon><PeopleAltIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'User Management', label: 'User Management', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/users', isComponent: true },
    { id: 'admin-reports', icon: <WhiteIcon><BarChartIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Reports', label: 'Reports', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/reports', isComponent: true },
    { id: 'admin-settings', icon: <WhiteIcon><SettingsOutlinedIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Settings', label: 'Settings', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/settings', isComponent: true },
    { id: 'admin-audit', icon: <WhiteIcon><DescriptionIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Audit Log', label: 'Audit Log', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/audit', isComponent: true },
  ];

  const sidebarItems = useMemo(() => {
    // On any /admin route, always show ONLY the admin menu (regardless of role flag)
    if (location.pathname.startsWith('/admin')) return adminItems;
    // Otherwise show normal app sidebar; if user is admin, include an entry to jump to Admin
    if (isAdmin) {
      return [
        ...baseItems,
        { id: 'admin-link', icon: GearIcon, alt: 'Admin', label: 'Admin', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin' },
      ];
    }
    return baseItems;
  }, [isAdmin, location.pathname]);
return (
    <Box sx={{ display: 'flex', height: '100vh', }}>
      <Box
        className="sidebar"
        sx={{
          width: open ? 200 : 60,
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: '#5C17E5',
          paddingTop: '10px',
          zIndex: 1200,
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 0,
          color: 'white',
          transition: "width 0.3s ease",

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
    <Typography variant="subtitle1" sx={{ fontSize: '18px', fontWeight: 700 }}>
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
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
                marginBottom: 0,
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
                />
              )}
            </ListItem>

            {(item.id === 'vector' || item.id === 'human' || item.id === 'arrow') && (
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