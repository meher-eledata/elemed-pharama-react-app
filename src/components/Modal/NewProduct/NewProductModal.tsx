import React from 'react';
import { Modal, Box, Typography, TextField, Button, Grid } from '@mui/material'; import { styled } from '@mui/system';


const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: '16px', 

  '& .MuiOutlinedInput-root': {
    height: '40px', 
    borderRadius: '12px', 
    backgroundColor: '#FFFFFF', 
    '& fieldset': {
      borderColor: '#9AABBC', 
      borderWidth: '1px', 
    },
    '&:hover fieldset': {
      borderColor: '#9AABBC',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#9AABBC',
      borderWidth: '1px',
    },
  },

  '& .MuiInputBase-input': {
    padding: '12px 16px', 
    lineHeight: '20px', 
    fontFamily: 'Lexend, sans-serif', 
    fontWeight: 400, // Font weight from Figma
    color: '#728197', // Text color from Figma (for actual input text if different from placeholder)
  },

  // Styles for the placeholder text
  '& .MuiInputBase-input::placeholder': {
    color: '#728197', // Placeholder color from Figma
    opacity: 1, // Ensure placeholder is not faded by default browser styles
  },

  // Styles for the label (if used) to match the text style if needed, though placeholder is dominant here
  '& .MuiInputLabel-root': {
    fontSize: '14px',
    fontFamily: 'Lexend, sans-serif',
    fontWeight: 400,
    color: '#728197', // Label color
    // Adjust label position if it clashes with padding
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)', // Adjusted for smaller font and position when shrunk
    },
  },
}));

// Interface for the modal's props
interface NewProductModalProps {
  open: boolean; // Controls if the modal is open or closed
  onClose: () => void; // Callback function when the modal is requested to close
}

// React functional component for the New Product Modal
const NewProductModal: React.FC<NewProductModalProps> = ({ open, onClose }) => {
  // Inline style for the modal's content Box
  const modalContentStyle = {
    position: 'absolute' as 'absolute', // Absolute positioning for centering
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', // Centers the modal
    width: '90%', // Responsive width, max 800px
    maxWidth: 800, // Maximum width of the modal
    bgcolor: 'background.paper', // Material-UI theme background color
    borderRadius: '8px', // Assuming a border radius for the modal container itself
    boxShadow: 24, // Standard Material-UI shadow
    p: 4, // Padding inside the modal (overall padding)
    display: 'flex',
    flexDirection: 'column',
    gap: '24px', // Gap between the title, form grid, and buttons
    outline: 'none', // Remove default modal outline
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="new-product-modal-title"
      aria-describedby="new-product-modal-description"
    >
      <Box sx={modalContentStyle}>
        {/* Modal Title */}
        <Typography
          id="new-product-modal-title"
          variant="h6"
          component="h2"
          sx={{
            fontFamily: 'Lexend, sans-serif',
            fontWeight: 700, 
            fontSize: '20px', 
            color: '#333', 
          }}
        >
          New Product
        </Typography>

        <Grid container spacing={2} rowSpacing={2} component="div">
          {/* First Column of Inputs */}
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="SIN" variant="outlined" placeholder="SIN" />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="HSN Category" variant="outlined" placeholder="HSN Category" />
          </Grid>

          {/* Second Column of Inputs */}
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="MRP (INR)" variant="outlined" placeholder="MRP (INR)" />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="Generic Name" variant="outlined" placeholder="Generic Name" />
          </Grid>

          {/* Third Column of Inputs */}
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="Package Info (Eg 1,10)" variant="outlined" placeholder="Package Info (Eg 1,10)" />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="Type" variant="outlined" placeholder="Type" />
          </Grid>

          {/* Fourth Column of Inputs */}
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="Product Code" variant="outlined" placeholder="Product Code" />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="Barcode" variant="outlined" placeholder="Barcode" />
          </Grid>

          {/* Fifth Column of Inputs */}
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="Min Qty" variant="outlined" placeholder="Min Qty" />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="Product Location" variant="outlined" placeholder="Product Location" />
          </Grid>

          {/* Sixth Column (Single Input) */}
          <Grid item xs={12} sm={6} component="div">
            <StyledTextField fullWidth label="Reorder Level" variant="outlined" placeholder="Reorder Level" />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
          {/* Cancel Button */}
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              color: '#6B7280', // Text gray
              borderColor: '#D1D5DB', // Border gray
              borderRadius: '8px',
              padding: '8px 24px',
              textTransform: 'none', // Prevent uppercase transform
              '&:hover': {
                borderColor: '#9CA3AF', // Darker border on hover
              }
            }}
          >
            Cancel
          </Button>
          {/* Add Button */}
          <Button
            variant="contained"
            sx={{
              bgcolor: '#4F46E5', // Indigo 600
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px 24px',
              textTransform: 'none', // Prevent uppercase transform
              '&:hover': {
                bgcolor: '#4338CA', // Darker indigo on hover
              }
            }}
          >
            Add
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default NewProductModal;
