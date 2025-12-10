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
      maxWidth="sm" 
      fullWidth={true}
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '85vh',
          height: 'auto',
          width: '100%',
          maxWidth: '600px',
          borderRadius: '16px',
        },
        '& .MuiDialogContent-root': {
          overflowY: 'auto',
          maxHeight: 'calc(85vh - 140px)',
          padding: '16px',
          overflowX: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: "'Lexend', sans-serif",
        fontWeight: 600,
        fontSize: '20px',
        padding: '20px 24px 16px 24px',
        borderBottom: '1px solid #E5E7EB'
      }}>
        {title}
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto', overflowX: 'hidden', padding: '16px' }}>{content}</DialogContent>
      <DialogActions sx={{ padding: '12px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB' }}>
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
