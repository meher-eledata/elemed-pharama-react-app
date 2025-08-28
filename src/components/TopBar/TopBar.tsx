
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

import userProfileImage from "../../assets/UserPhoto.png";

interface TopBarProps {
  name: string;
}

export const TopBar: React.FC<TopBarProps> = ({ name }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box className="topbar-container">
      <Box className="right-controls" sx={{ marginLeft: "auto" }}>
        <IconButton className="notification-icon-button">
          <img src={Notification} alt="icon" />
        </IconButton>
        <Divider orientation="vertical" flexItem  />

        <Box className="user-profile">
          <Avatar alt={name} src={userProfileImage} className="user-avatar" />
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
