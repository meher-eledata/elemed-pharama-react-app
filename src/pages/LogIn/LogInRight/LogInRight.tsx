
import React from 'react';
import { Box } from '@mui/material';
import loginImage from "../../../assets/LogIn.svg"

interface LoginRightProps {
  className?: string;
}

const LoginRight: React.FC<LoginRightProps> = ({ className }) => {
  return (
    <Box
      // className={className}
      // sx={{
      //   display: { xs: 'none', lg: 'flex' },
      //   flex: 1, // Take full available space
      //   // height: '100%', // Take full height
      //   // width: '100%', // Take full width
      //   position: 'relative',
      //   overflow: 'hidden', // Prevent any overflow
      //   background: 'none',
      //   padding: 0,
      //   margin: 0,
      // }}
      sx={{
         display: { xs: 'none', md: 'flex' }, // Hides below 960px
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderBottomRightRadius: '1.25rem', // 20px = 1.25rem
        borderTopRightRadius: '1.25rem', // 20px = 1.25rem
      }}
    >
      <img
        src={loginImage}
        alt="Login illustration"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // display: 'block'
        }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "https://placehold.co/720x900/E0BBE4/FFFFFF?text=Image+Not+Found";
        }}
      />
    </Box>
  );
};

export default LoginRight;
