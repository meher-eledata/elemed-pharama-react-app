import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
} from "@mui/material";
import { StandardButton } from '../Common';

interface CommonModalProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  onClose: () => void;
  actionButtons?: React.ReactNode; // Optional action buttons to display alongside Close button
}

const CommonModal: React.FC<CommonModalProps> = ({
  open,
  title,
  content,
  onClose,
  actionButtons,
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
          width: '90%',
          maxWidth: '1000px',
        },
        '& .MuiDialogContent-root': {
          overflowY: 'auto',
          maxHeight: '70vh',
        }
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto', padding: 0 }}>{content}</DialogContent>
      <DialogActions sx={{ padding: '8px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {actionButtons}
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
