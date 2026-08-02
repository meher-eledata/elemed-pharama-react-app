
// import React from "react";
// import {
//   Box,
//   Typography,
//   Avatar,
//   IconButton,
//   Menu,
//   MenuItem,
//   Divider,
// } from "@mui/material";
// import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
// import dropdownIcon from "../../assets/DropDown.svg";
// import Notification from "../../assets/Notification.svg";

// import "./TopBar.scss";

// import userProfileImage from "../../assets/UserPhoto.png";

// interface TopBarProps {
//   name: string;
// }

// export const TopBar: React.FC<TopBarProps> = ({ name }) => {
//   const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
//   const open = Boolean(anchorEl);

//   const handleClick = (event: React.MouseEvent<HTMLElement>) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   return (
//     <Box className="topbar-container">
//       <Box className="right-controls" sx={{ marginLeft: "auto" }}>
//         <IconButton className="notification-icon-button">
//           <img src={Notification} alt="icon" />
//         </IconButton>
//         <Divider orientation="vertical" flexItem  />

//         <Box className="user-profile">
//           <Avatar alt={name} src={userProfileImage} className="user-avatar" />
//           <Typography variant="body1" className="user-name">
//             {name}
//           </Typography>
//           <IconButton
//             id="user-button"
//             aria-controls={open ? "user-menu" : undefined}
//             aria-haspopup="true"
//             aria-expanded={open ? "true" : undefined}
//             onClick={handleClick}
//             size="small"
//             className="dropdown-arrow-button"
//           >
//             <img
//               src={dropdownIcon}
//               alt="Dropdown"
//               className="dropdown-arrow-icon"
//             />
//           </IconButton>
//           <Menu
//             id="user-menu"
//             anchorEl={anchorEl}
//             open={open}
//             onClose={handleClose}
//             MenuListProps={{
//               "aria-labelledby": "user-button",
//             }}
//           >
//             <MenuItem onClick={handleClose}>Profile</MenuItem>
//             <MenuItem onClick={handleClose}>My account</MenuItem>
//             <MenuItem onClick={handleClose}>Logout</MenuItem>
//           </Menu>
//         </Box>
//       </Box>
//     </Box>
//   );
// };


import React from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  ListItemText,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
// import dropdownIcon from "../../assets/DropDown.svg"; // Removed for standardization
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { useLogoutMutation } from "../../redux/slices/activityApi";
import { useGetAlertsQuery } from "../../redux/slices/alertsApi";
import { RootState } from "../../redux/store";
import { useNavigate, useLocation } from "react-router-dom";
import { getInitials } from "../../config/helpers/initials";
import { ModuleSwitcher } from "../ModuleSwitcher/ModuleSwitcher";
import { LocationSwitcher } from "./LocationSwitcher";
import { currentAreaKeyFromPath } from "../../config/areas.config";
import { NOTIFICATION_LABELS } from "../../config/label/Notifications.labels";

import "./TopBar.scss";

interface TopBarProps {
  name?: string;
  initials?: string;
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ name: propName, initials, onToggleSidebar }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [alertsAnchorEl, setAlertsAnchorEl] = React.useState<null | HTMLElement>(null);
  const alertsOpen = Boolean(alertsAnchorEl);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutRequest] = useLogoutMutation();

  // Pharmacy Admin is a pharmacy-area destination, so only surface it while in
  // the pharmacy area — it would be confusing alongside the Org/Outpatient areas.
  const inPharmacyArea = currentAreaKeyFromPath(location.pathname) === 'pharmacy';

  // Near-expiry alerts feed for the notification bell. Near-expiry is measured
  // in days, so an hourly poll is plenty; it's also recalculated on demand each
  // time the bell is opened (see handleAlertsOpen). Pharmacy-module data: only
  // poll while in the pharmacy area so non-pharmacy orgs/areas don't hit a
  // module-gated endpoint.
  const { data: alertsData, refetch: refetchAlerts } = useGetAlertsQuery(undefined, {
    pollingInterval: 3600000,
    skip: !inPharmacyArea,
  });
  const alertCount = alertsData?.count ?? 0;
  const alerts = alertsData?.alerts ?? [];

  // Get user info from Redux store
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Use Redux user name if available, otherwise use prop
  const displayName = isAuthenticated && user
    ? `${user.first_name} ${user.last_name}`
    : (propName || 'Guest');

  // Determine whether the current user is an admin (matches loginHandlers / RoleGuard)
  const userRole = user?.role;
  const isAdmin =
    userRole === 0 ||
    userRole === '0' ||
    String(userRole).toLowerCase() === 'admin';

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAlertsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAlertsAnchorEl(event.currentTarget);
    // Recalculate the alerts fresh whenever the bell is opened. Skipped outside
    // the pharmacy area (the query is skipped there — module-gated endpoint).
    if (inPharmacyArea) refetchAlerts();
  };

  const handleAlertsClose = () => {
    setAlertsAnchorEl(null);
  };

  const handleAlertClick = (window: '1month' | '3month') => {
    setAlertsAnchorEl(null);
    navigate('/inventory', {
      state: { tab: 'nearExpiry', nearExpiryMonths: window === '1month' ? 1 : 3 },
    });
  };

  const handleAdminAccess = () => {
    handleClose();
    // Return an admin to their admin dashboard
    navigate('/admin');
  };

  const handleLogout = async () => {
    handleClose();
    // Tell the server to log the Logout event while the token is still valid.
    // Never block logout on a failed/slow call — always clear the token + navigate.
    try {
      await logoutRequest().unwrap();
    } catch {
      // ignore — proceed to clear auth regardless of success/failure
    }
    // Clear auth state from Redux and localStorage
    dispatch(logout());
    // Redirect to login page
    navigate('/');
  };

  return (
    <Box className="topbar-container">
      <Box className="left-controls" sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ModuleSwitcher />
        <LocationSwitcher />
      </Box>
      <Box className="right-controls" sx={{ marginLeft: "auto" }}>
        <IconButton
          className="notification-icon-button"
          aria-label={NOTIFICATION_LABELS.ARIA_LABEL}
          aria-controls={alertsOpen ? "notifications-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={alertsOpen ? "true" : undefined}
          onClick={handleAlertsOpen}
        >
          <Badge badgeContent={alertCount} color="error" overlap="circular">
            <NotificationsNoneOutlinedIcon className="notification-icon" />
          </Badge>
        </IconButton>
        <Menu
          id="notifications-menu"
          anchorEl={alertsAnchorEl}
          open={alertsOpen}
          onClose={handleAlertsClose}
          MenuListProps={{ "aria-labelledby": "notifications-menu" }}
          slotProps={{ paper: { sx: { maxWidth: 360, maxHeight: 420 } } }}
        >
          <MenuItem disabled sx={{ opacity: 1, fontWeight: 600, fontSize: 14 }}>
            {NOTIFICATION_LABELS.TITLE}
          </MenuItem>
          {alerts.length === 0 ? (
            <MenuItem disabled>{NOTIFICATION_LABELS.EMPTY}</MenuItem>
          ) : (
            alerts.map((alert) => (
              <MenuItem
                key={alert.id}
                onClick={() => handleAlertClick(alert.window)}
                sx={{ display: 'block', whiteSpace: 'normal' }}
              >
                <ListItemText
                  primary={`${alert.name} · ${alert.batchNumber}`}
                  secondary={NOTIFICATION_LABELS.expiresIn(alert.daysUntilExpiry)}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                  secondaryTypographyProps={{
                    fontSize: 12,
                    sx: { color: NOTIFICATION_LABELS.SEVERITY_COLOR[alert.window] },
                  }}
                />
              </MenuItem>
            ))
          )}
        </Menu>

        <Box
          className="user-profile"
          id="user-button"
          role="button"
          aria-controls={open ? "user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          sx={{ cursor: 'pointer' }}
        >
          <Avatar
            alt={displayName}
            className="user-avatar"
            sx={{
              backgroundColor: '#5C17E5',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              borderRadius: '50%', // Ensures perfect circle
              width: 40,
              height: 40
            }}
          >
            {initials || getInitials(displayName)}
          </Avatar>
          <Typography variant="body1" className="user-name">
            {displayName}
          </Typography>
          <IconButton
            size="small"
            className="dropdown-arrow-button"
            tabIndex={-1}
            disableRipple
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </Box>
        {/* Menu rendered as a sibling (not inside the clickable user-profile Box) so
            its portal click/backdrop events don't bubble back into handleClick and
            re-open the menu — this is what allows click-outside (and Escape) to close it. */}
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "user-button",
          }}
        >
          {isAdmin && inPharmacyArea && (
            <MenuItem onClick={handleAdminAccess}>Pharmacy Admin</MenuItem>
          )}
          <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>Profile</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};
