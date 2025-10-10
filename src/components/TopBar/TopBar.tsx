
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
  Divider,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import dropdownIcon from "../../assets/DropDown.svg";
import Notification from "../../assets/Notification.svg";

import "./TopBar.scss";

interface TopBarProps {
  name: string;
  initials?: string;
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ name, initials, onToggleSidebar }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Generate initials from the name
  const getInitials = (fullName: string) => {
    if (!fullName || fullName === "Guest") return "G";
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length >= 2) {
      // First letter of first name + first letter of last name
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      // If only one name, take first two letters
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    return "G";
  };

  return (
    <Box className="topbar-container">
      <Box className="left-controls" sx={{ display: 'flex', alignItems: 'center' }}>
      </Box>
      <Box className="right-controls" sx={{ marginLeft: "auto" }}>
        <IconButton className="notification-icon-button">
          <img src={Notification} alt="icon" />
        </IconButton>
        <Divider orientation="vertical" flexItem  />

        <Box className="user-profile">
          <Avatar 
            alt={name} 
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
            {initials || getInitials(name)}
          </Avatar>
          <Typography variant="body1" className="user-name">
            {name}
          </Typography>
          <IconButton
            id="user-button"
            aria-controls={open ? "user-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
            size="small"
            className="dropdown-arrow-button"
          >
            <img
              src={dropdownIcon}
              alt="Dropdown"
              className="dropdown-arrow-icon"
            />
          </IconButton>
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "user-button",
            }}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>My account</MenuItem>
            <MenuItem onClick={handleClose}>Logout</MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
};
