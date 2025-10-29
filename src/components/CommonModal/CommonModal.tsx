import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { StandardButton } from '../Common';

interface CommonModalProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  onClose: () => void;
}

const CommonModal: React.FC<CommonModalProps> = ({
  open,
  title,
  content,
  onClose,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '85vh',
          height: 'auto',
          width: '80%',
        },
        '& .MuiDialogContent-root': {
          overflowY: 'auto',
          maxHeight: '70vh',
        }
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto' }}>{content}</DialogContent>
      <DialogActions>
        <StandardButton
          onClick={onClose}
          variant="primary"
          size="medium"
        >
          Close
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default CommonModal;
