import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Box
} from '@mui/material';

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
      <DialogContent sx={{ p: 3, pb: 2 }}>
        <Box sx={{ bgcolor: '#ECEFF4', borderRadius: 2, p: 3 }}>
          <DialogContentText id="alert-dialog-description" sx={{ color: '#1A212B' }}>
            {message}
          </DialogContentText>
          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={onConfirm}
              disableRipple
              sx={{
                backgroundColor: "#5C17E5",
                textTransform: 'none',
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

