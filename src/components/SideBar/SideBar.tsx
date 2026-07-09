import './Sidebar.scss';
import { Box, IconButton, Typography, Divider } from '@mui/material';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import ArrowIcon from '../../assets/Arrow.svg';
import BgWhiteIcon from '../../assets/BG_White.svg';
import BoxIcon from '../../assets/Box.svg';
import CheckBoxIcon from '../../assets/CheckBox.svg';
import DollarIcon from '../../assets/Dollor.svg';
import GearIcon from '../../assets/Gear.svg';
import GroupIcon from '../../assets/Group.svg';
import HumanIcon from '../../assets/Human.svg';
import MailIcon from '../../assets/Mail.svg';
import VectorIcon from '../../assets/Vector.svg';
import SettingsIcon from '../../assets/Setting.svg';
import ThunderIcon from '../../assets/Thunder.svg';
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorageIcon from '@mui/icons-material/Storage';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { ADMIN_LABELS } from '../../config/label/Admin.labels';
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
  { id: 'mail', icon: MailIcon, alt: 'Mail', label: "Order Receive", iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/receive' },
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

  // Order, labels and icons mirror the AdminDashboard tiles (tiles are canonical).
  const adminItems: SidebarItem[] = useMemo(() => [
    { id: 'admin-home', icon: <WhiteIcon><LocalPharmacyOutlinedIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Pharmacist access', label: 'Pharmacist access', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/dashboard', isComponent: true },
    { id: 'admin-users', icon: <WhiteIcon><PeopleAltIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'User Account Management', label: 'User Account Management', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/users', isComponent: true },
    { id: 'admin-reports', icon: <WhiteIcon><BarChartIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Reports', label: 'Reports', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/reports', isComponent: true },
    { id: 'admin-master', icon: <WhiteIcon><StorageIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Master', label: 'Master', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/master', isComponent: true },
    { id: 'admin-inventory-adjustment', icon: <WhiteIcon><InventoryIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Inventory Adjustment', label: 'Inventory Adjustment', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/inventory-adjustment', isComponent: true },
    { id: 'admin-historical-data', icon: <WhiteIcon><FolderOpenOutlinedIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'Historical Data', label: 'Historical Data', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/historical-data', isComponent: true },
    { id: 'admin-credit', icon: <WhiteIcon><AccountBalanceWalletOutlinedIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: ADMIN_LABELS.SECTIONS.SUPPLIER_CREDIT.TITLE, label: ADMIN_LABELS.SECTIONS.SUPPLIER_CREDIT.TITLE, iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/supplier-credit', isComponent: true },
    { id: 'admin-audit', icon: <WhiteIcon><DescriptionIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'User Activity Log', label: 'User Activity Log', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/audit', isComponent: true },
    { id: 'admin-settings', icon: <WhiteIcon><SettingsOutlinedIcon sx={{ fontSize: 24 }} /></WhiteIcon>, alt: 'System Settings', label: 'System Settings', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/admin/settings', isComponent: true },
  ], []);

  const sidebarItems = useMemo(() => {
    if (location.pathname.startsWith('/admin')) return adminItems;
    return baseItems;
  }, [location.pathname, adminItems]);

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
          width: open ? '12.5rem' : '3.75rem', // 200px = 12.5rem, 60px = 3.75rem
          minWidth: open ? '12.5rem' : '3.75rem',
          maxWidth: open ? '12.5rem' : '3.75rem',
          overflow: 'hidden',
          overflowX: 'hidden',
          flexShrink: 0,
          backgroundColor: '#5C17E5',
          paddingTop: '0.625rem', // 10px = 0.625rem
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
          boxShadow: open ? '0.125rem 0 0.5rem rgba(0, 0, 0, 0.1)' : 'none', // 2px = 0.125rem, 8px = 0.5rem
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.25rem',
            width: open ? 'calc(100% - 1rem)' : 'calc(100% - 0.5rem)',
            margin: '0 auto 0.75rem auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            justifyContent: open ? 'flex-start' : 'center',
          }}
          onClick={() => {
            setUncontrolledOpen(prev => !prev);
            if (onOpenChange) onOpenChange(!open);
          }}
        >
          <img
            src={BgWhiteIcon}
            alt="Logo"
            style={{ width: '2.5rem', height: '2.5rem', cursor: 'pointer' }}
            onClick={(e) => {
              // Role-aware home navigation. Stop propagation so the click does NOT
              // also fire the surrounding Box's sidebar open/close toggle.
              e.stopPropagation();
              const role = user?.role;
              const isAdmin =
                role === 0 ||
                role === '0' ||
                String(role).toLowerCase() === 'admin';
              navigate(isAdmin ? '/admin' : '/dashboard');
            }}
          />
          {open && (
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                lineHeight: '1.2',
                color: '#5C17E5'
              }}
            >
              Elite  pharmacy
            </Typography>
          )}
        </Box>


        {sidebarItems.map(item => (
          <React.Fragment key={item.id}>
            <ListItem
              button
              onClick={() => {
                setActiveItemId(item.id)
                if (item.route) {
                  // If route is /receive, navigate to /receive/order-receive
                  const targetRoute = item.route === '/receive' ? '/receive/order-receive' : item.route;
                  navigate(targetRoute);
                }
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
                    lineHeight: 1.25,
                  }}
                  sx={{
                    my: 0,
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
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
            flexDirection: 'column',
            alignItems: open ? 'flex-start' : 'center',
            justifyContent: 'center',
            paddingLeft: open ? '16px' : '0',
          }}
        >
          {open ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <img src={ThunderIcon} alt="Elemed" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)', opacity: 0.7 }} />
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                Powered by Elemed
              </Typography>
            </Box>
          ) : (
            <img src={ThunderIcon} alt="Elemed" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)', opacity: 0.7 }} />
          )}
        </Box>
      </Box>
    </Box>
  );
};