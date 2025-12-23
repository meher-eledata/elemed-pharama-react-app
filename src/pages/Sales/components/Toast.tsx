import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface ToastProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  open,
  message,
  severity,
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        zIndex: 9999,
        '& .MuiSnackbar-root': {
          zIndex: 9999,
        },
      }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        sx={{ 
          width: '100%',
          fontSize: '14px',
          fontWeight: 500,
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
        variant="filled"
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

