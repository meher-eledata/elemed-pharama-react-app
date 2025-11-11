import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Box,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 3, p: 0 } }}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      {/* Dialog Header with Title and Close Icon */}
      <DialogTitle 
        id="alert-dialog-title"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
          px: 3,
          pt: 3,
          fontWeight: 600, 
          color: '#1A212B',
          fontFamily: "'Lexend', sans-serif"
        }}
      >
        {title}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#6B7280',
            '&:hover': {
              backgroundColor: '#F3F4F6',
              color: '#374151'
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pb: 2 }}>
        <Box sx={{ bgcolor: '#ECEFF4', borderRadius: 2, p: 3, textAlign: 'center' }}>
          <DialogContentText id="alert-dialog-description" sx={{ color: '#1A212B', textAlign: 'center', mb: 3 }}>
            {message}
          </DialogContentText>
          <DialogActions sx={{ px: 0, pb: 0, justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={onConfirm}
              disableRipple
              sx={{
                backgroundColor: "#5C17E5",
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: "none",
                "&:hover": { backgroundColor: "#5C17E5", boxShadow: "none" },
                "&:focus": { backgroundColor: "#5C17E5" },
                "&:active": { backgroundColor: "#5C17E5" },
              }}
            >
              Yes
            </Button>
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                textTransform: 'none',
                backgroundColor: "#5C17E5",
                borderRadius: '8px',
                boxShadow: "none",
                "&:hover": { backgroundColor: "#5C17E5", boxShadow: "none" },
                "&:focus": { backgroundColor: "#5C17E5" },
                "&:active": { backgroundColor: "#5C17E5" },
              }}
            >
              Do not delete
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;


