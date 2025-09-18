import React from 'react';
import { Modal, Box, Typography, TextField, Button, Grid, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styled from '@mui/system/styled';
import { NEW_PRODUCT_MODAL_CONSTANTS } from '../../../config/constants/NewProductModal.constants';
import { NEW_PRODUCT_MODAL_LABELS } from '../../../config/label/NewProductModal.labels';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.HEIGHT,
    borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
    backgroundColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BG,
    '& fieldset': {
      borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
    },
    '&.Mui-focused fieldset': {
      borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
      borderWidth: '1px',
    },
  },

  '& .MuiInputBase-input': {
    height: '100%',
    display: 'block',
    padding: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.INPUT_PADDING,
    boxSizing: 'border-box',
    textAlign: 'center',
    lineHeight: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.HEIGHT,
    fontFamily: 'Lexend, sans-serif',
    fontWeight: 400,
    color: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.INPUT_COLOR,
  },

  '& .MuiInputBase-input::placeholder': {
    color: '#728197',
    opacity: 1,
    textAlign: 'center',
  },

  '& .MuiInputLabel-root': {
    fontSize: '14px',
    fontFamily: 'Lexend, sans-serif',
    fontWeight: 400,
    color: '#728197',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
    },
  },
}));

interface NewProductModalProps {
  open: boolean;
  onClose: () => void;
}

const NewProductModal: React.FC<NewProductModalProps> = ({ open, onClose }) => {
  const modalContentStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.WIDTH,
    maxWidth: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.MAX_WIDTH,
    bgcolor: 'background.paper',
    borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.BORDER_RADIUS,
    boxShadow: 24,
    p: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.PADDING,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.GAP,
    outline: 'none',
    maxHeight: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.MAX_HEIGHT,
    overflowY: 'auto',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="new-product-modal-title"
      aria-describedby="new-product-modal-description"
    >
      <Box sx={modalContentStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <Typography
            id="new-product-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontFamily: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_FONT_FAMILY,
              fontWeight: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_WEIGHT,
              fontSize: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_SIZE,
              color: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_COLOR,
            }}
          >
            {NEW_PRODUCT_MODAL_LABELS.TITLE}
          </Typography>
          <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: -6, top: -6, color: '#728197' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Grid container spacing={2} rowSpacing={2} component="div">
          {NEW_PRODUCT_MODAL_LABELS.FIELDS.map((label, idx) => (
            <Grid key={idx} item xs={12} sm={6} component="div">
              <StyledTextField fullWidth label={label} variant="outlined" placeholder={label} />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              color: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.OUTLINED.COLOR,
              borderColor: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.OUTLINED.BORDER_COLOR,
              borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.OUTLINED.BORDER_RADIUS,
              padding: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.OUTLINED.PADDING,
              textTransform: 'none',
              border: 'none',
              '&:hover': {
                backgroundColor: '#FFFFFF',
                boxShadow: 'none',
                border: 'none'
              }
            }}
          >
            {NEW_PRODUCT_MODAL_LABELS.BUTTON_CANCEL}
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.BG,
              color: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.COLOR,
              borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.BORDER_RADIUS,
              height: 36,
              padding: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.PADDING,
              textTransform: 'none',
              '&:hover': {
                bgcolor: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.HOVER_BG,
              }
            }}
          >
            {NEW_PRODUCT_MODAL_LABELS.BUTTON_ADD}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default NewProductModal;
