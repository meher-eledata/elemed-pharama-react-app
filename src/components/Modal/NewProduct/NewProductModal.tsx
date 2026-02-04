// import React from 'react';
// import { Modal, Box, Typography, TextField, Button, Grid, IconButton } from '@mui/material';
// import CloseIcon from '@mui/icons-material/Close';
// import styled from '@mui/system/styled';
// import { NEW_PRODUCT_MODAL_CONSTANTS } from '../../../config/constants/NewProductModal.constants';
// import { NEW_PRODUCT_MODAL_LABELS } from '../../../config/label/NewProductModal.labels';

// const StyledTextField = styled(TextField)(({ theme }) => ({
//   '& .MuiOutlinedInput-root': {
//     height: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.HEIGHT,
//     borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
//     backgroundColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BG,
//     '& fieldset': {
//       borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
//       borderWidth: '1px',
//     },
//     '&:hover fieldset': {
//       borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
//     },
//     '&.Mui-focused fieldset': {
//       borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
//       borderWidth: '1px',
//     },
//   },

//   '& .MuiInputBase-input': {
//     height: '100%',
//     display: 'block',
//     padding: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.INPUT_PADDING,
//     boxSizing: 'border-box',
//     textAlign: 'center',
//     lineHeight: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.HEIGHT,
//     fontFamily: "'Lexend', sans-serif",
//     fontWeight: 400,
//     color: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.INPUT_COLOR,
//   },

//   '& .MuiInputBase-input::placeholder': {
//     color: '#728197',
//     opacity: 1,
//     textAlign: 'center',
//   },

//   '& .MuiInputLabel-root': {
//     fontSize: '14px',
//     fontFamily: "'Lexend', sans-serif",
//     fontWeight: 400,
//     color: '#728197',
//     '&.MuiInputLabel-shrink': {
//       transform: 'translate(14px, -9px) scale(0.75)',
//     },
//   },
// }));

// interface NewProductModalProps {
//   open: boolean;
//   onClose: () => void;
// }

// const NewProductModal: React.FC<NewProductModalProps> = ({ open, onClose }) => {
//   const modalContentStyle = {
//     position: 'absolute' as const,
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     width: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.WIDTH,
//     maxWidth: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.MAX_WIDTH,
//     bgcolor: 'background.paper',
//     borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.BORDER_RADIUS,
//     boxShadow: 24,
//     p: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.PADDING,
//     display: 'flex',
//     flexDirection: 'column' as const,
//     gap: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.GAP,
//     outline: 'none',
//     maxHeight: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.MAX_HEIGHT,
//     overflowY: 'auto',
//   };

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       aria-labelledby="new-product-modal-title"
//       aria-describedby="new-product-modal-description"
//     >
//       <Box sx={modalContentStyle}>
//         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
//           <Typography
//             id="new-product-modal-title"
//             variant="h6"
//             component="h2"
//             sx={{
//               fontFamily: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_FONT_FAMILY,
//               fontWeight: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_WEIGHT,
//               fontSize: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_SIZE,
//               color: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_COLOR,
//             }}
//           >
//             {NEW_PRODUCT_MODAL_LABELS.TITLE}
//           </Typography>
//           <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: -6, top: -6, color: '#728197' }}>
//             <CloseIcon />
//           </IconButton>
//         </Box>

//         <Grid container spacing={4} rowSpacing={3} component="div">
//           {NEW_PRODUCT_MODAL_LABELS.FIELDS.map((label, idx) => (
//             <Grid key={idx} item xs={12} sm={6} component="div">
//               <StyledTextField fullWidth label={label} variant="outlined" placeholder={label} />
//             </Grid>
//           ))}
//         </Grid>

//         <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
//           <Button
//             variant="outlined"
//             onClick={onClose}
//             sx={{
//               color: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.OUTLINED.COLOR,
//               borderColor: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.OUTLINED.BORDER_COLOR,
//               borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.OUTLINED.BORDER_RADIUS,
//               padding: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.OUTLINED.PADDING,
//               textTransform: 'none',
//               border: 'none',
//               '&:hover': {
//                 backgroundColor: '#FFFFFF',
//                 boxShadow: 'none',
//                 border: 'none'
//               }
//             }}
//           >
//             {NEW_PRODUCT_MODAL_LABELS.BUTTON_CANCEL}
//           </Button>
//           <Button
//             variant="contained"
//             sx={{
//               bgcolor: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.BG,
//               color: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.COLOR,
//               borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.BORDER_RADIUS,
//               height: 36,
//               padding: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.PADDING,
//               textTransform: 'none',
//               '&:hover': {
//                 bgcolor: NEW_PRODUCT_MODAL_CONSTANTS.BUTTONS.CONTAINED.HOVER_BG,
//               }
//             }}
//           >
//             {NEW_PRODUCT_MODAL_LABELS.BUTTON_ADD}
//           </Button>
//         </Box>
//       </Box>
//     </Modal>
//   );
// };

// export default NewProductModal;


import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Grid, IconButton, Alert, CircularProgress } from '@mui/material';
import { StandardButton, PharmaDatePicker } from '../../Common';
import dayjs, { Dayjs } from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import styled from '@mui/system/styled';
import { useAddProductMutation } from '../../../redux/slices/inventoryApi';
import { extractErrorMessage } from '../../../utils/errorUtils';

// Enhanced constants for better UI
export const NEW_PRODUCT_MODAL_CONSTANTS = {
  MODAL: {
    WIDTH: '90%',
    MAX_WIDTH: '700px',
    BORDER_RADIUS: '12px',
    PADDING: '24px',
    GAP: '20px',
    MAX_HEIGHT: '90vh',
    BACKGROUND: '#ffffff',
    BOX_SHADOW: '0 20px 60px rgba(0, 0, 0, 0.15)',
  },
  HEADER: {
    TITLE_FONT_FAMILY: 'Lexend, sans-serif',
    TITLE_WEIGHT: 600,
    TITLE_SIZE: '22px',
    TITLE_COLOR: '#1a202c',
    MARGIN_BOTTOM: '8px',
  },
  TEXTFIELD: {
    HEIGHT: '44px',
    BORDER_RADIUS: '6px',
    BG: '#ffffff',
    BORDER_COLOR: '#e2e8f0',
    INPUT_PADDING: '0 12px',
    INPUT_COLOR: '#2d3748',
    FOCUS_BORDER_COLOR: '#D1D5DB',
    LABEL_COLOR: '#4a5568',
    FONT_SIZE: '14px',
  },
  BUTTONS: {
    OUTLINED: {
      COLOR: '#4a5568',
      BORDER_COLOR: '#e2e8f0',
      BORDER_RADIUS: '8px',
      PADDING: '8px 16px',
      HEIGHT: '40px',
      FONT_SIZE: '14px',
      FONT_WEIGHT: 500,
    },
    CONTAINED: {
      BG: '#5C17E5',
      COLOR: '#FFFFFF',
      BORDER_RADIUS: '8px',
      PADDING: '8px 16px',
      HEIGHT: '40px',
      FONT_SIZE: '14px',
      FONT_WEIGHT: 500,
      HOVER_BG: '#4a11c1',
      BOX_SHADOW: '0 2px 8px rgba(92, 23, 229, 0.3)',
    }
  },
  GRID: {
    SPACING: 6,
    ROW_SPACING: 2,
  }
};

export const NEW_PRODUCT_MODAL_LABELS = {
  TITLE: 'New Product',
  FIELDS: [
    { key: 'product_name', label: 'Product name *', type: 'text' },
    { key: 'expiry', label: 'Expiry date *', type: 'date' },
    { key: 'type', label: 'Type *', type: 'text' },
    { key: 'brand_name', label: 'Brand name *', type: 'text' },
    { key: 'hsn_id', label: 'HSN code *', type: 'text' },
    { key: 'package_info', label: 'Package info', type: 'text' },
    { key: 'unit_of_measure', label: 'Unit of measure *', type: 'text' },
    { key: 'mrp', label: 'MRP *', type: 'number' },
    { key: 'min_quantity', label: 'Minimum quantity *', type: 'number' },
    { key: 'max_quantity', label: 'Maximum quantity', type: 'number' },
    { key: 'product_code', label: 'Product code *', type: 'text' }
  ],
  BUTTON_CANCEL: 'Cancel',
  BUTTON_ADD: 'Add'
} as const;

// Enhanced StyledTextField component with modern styling
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.HEIGHT,
    borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
    backgroundColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BG,
    fontSize: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.FONT_SIZE,
    transition: 'all 0.2s ease-in-out',

    '& fieldset': {
      borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
      borderWidth: '2px',
      transition: 'border-color 0.2s ease-in-out',
    },

    '&:hover fieldset': {
      borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
    },

    '&.Mui-focused fieldset': {
      borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
    },

    '&.Mui-error fieldset': {
      borderColor: '#e53e3e',
      borderWidth: '2px',
    },
  },

  '& .MuiInputBase-input': {
    height: '100%',
    padding: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.INPUT_PADDING,
    boxSizing: 'border-box',
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 500,
    color: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.INPUT_COLOR,
    fontSize: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.FONT_SIZE,

    '&::placeholder': {
      color: '#a0aec0',
      opacity: 1,
      fontWeight: 400,
    },
  },

  '& .MuiInputLabel-root': {
    fontSize: '14px',
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 500,
    color: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
    backgroundColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BG,
    padding: '0 4px',

    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.85)',
      color: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      backgroundColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BG,
    },

    '&.Mui-focused': {
      color: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
    },
  },

  '& .MuiFormHelperText-root': {
    fontSize: '12px',
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 400,
    marginLeft: '4px',
    marginTop: '4px',
  },
}));

interface NewProductModalProps {
  open: boolean;
  onClose: () => void;
  onProductAdded?: () => void; // Callback to notify parent when product is added
}

const NewProductModal: React.FC<NewProductModalProps> = ({ open, onClose, onProductAdded }) => {
  const [addProduct, { isLoading, error, isSuccess }] = useAddProductMutation();

  // Form state
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    type: '',
    brand_name: '',
    hsn_id: '',
    package_info: '',
    unit_of_measure: '',
    mrp: '',
    min_quantity: '',
    max_quantity: ''
  });

  const [expiryDate, setExpiryDate] = useState<Dayjs | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (formErrors[key]) {
      setFormErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.product_name.trim()) errors.product_name = 'Product name is required';
    if (!formData.product_code.trim()) errors.product_code = 'Product code is required';
    if (!formData.type.trim()) errors.type = 'Type is required';
    if (!formData.brand_name.trim()) errors.brand_name = 'Brand name is required';
    if (!formData.hsn_id.trim()) errors.hsn_id = 'HSN code is required';
    // Package info is NOT mandatory
    if (!formData.unit_of_measure.trim()) errors.unit_of_measure = 'Unit of measure is required';
    if (!formData.mrp || isNaN(Number(formData.mrp))) errors.mrp = 'Valid MRP is required';
    if (!formData.min_quantity || isNaN(Number(formData.min_quantity))) errors.min_quantity = 'Valid minimum quantity is required';
    // Maximum quantity is NOT mandatory
    if (!expiryDate) errors.expiry = 'Expiry date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!expiryDate) {
      setFormErrors({ expiry: 'Expiry date is required' });
      return;
    }

    try {
      const productData = {
        product_name: formData.product_name.trim(),
        product_code: formData.product_code.trim(),
        type: formData.type.trim(),
        hsn_id: formData.hsn_id.trim(),
        package_info: formData.package_info.trim(),
        unit_of_measure: formData.unit_of_measure.trim(),
        max_quantity: Number(formData.max_quantity),
        min_quantity: Number(formData.min_quantity),
        expiry: expiryDate.format('YYYY-MM-DD'),
        mrp: Number(formData.mrp),
        brand_name: formData.brand_name.trim(),
      };

      // Validate numeric fields
      if (isNaN(productData.max_quantity) || productData.max_quantity < 0) {
        setFormErrors({ max_quantity: 'Valid maximum quantity is required' });
        return;
      }
      if (isNaN(productData.min_quantity) || productData.min_quantity < 0) {
        setFormErrors({ min_quantity: 'Valid minimum quantity is required' });
        return;
      }
      if (isNaN(productData.mrp) || productData.mrp < 0) {
        setFormErrors({ mrp: 'Valid MRP is required' });
        return;
      }

      console.log('Submitting product data:', productData);
      await addProduct(productData).unwrap();

      // Reset form and close modal on success
      setFormData({
        product_name: '',
        product_code: '',
        type: '',
        brand_name: '',
        hsn_id: '',
        package_info: '',
        unit_of_measure: '',
        mrp: '',
        min_quantity: '',
        max_quantity: ''
      });
      setExpiryDate(null);
      setFormErrors({});

      // Notify parent component that a product was added
      if (onProductAdded) {
        onProductAdded();
      }

      onClose();
    } catch (err: any) {
      console.error('Error adding product:', err);
      // Error will be displayed via the error state from RTK Query
    }
  };

  const handleClose = () => {
    setFormData({
      product_name: '',
      product_code: '',
      type: '',
      brand_name: '',
      hsn_id: '',
      package_info: '',
      unit_of_measure: '',
      mrp: '',
      min_quantity: '',
      max_quantity: ''
    });
    setExpiryDate(null);
    setFormErrors({});
    onClose();
  };

  return (
    <>
      <style>
        {`
          .css-1rr4qq7 {
           margin:0 12px!important;
           }
        `}
      </style>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="new-product-modal-title"
        aria-describedby="new-product-modal-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{
          position: 'relative',
          width: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.WIDTH,
          maxWidth: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.MAX_WIDTH,
          bgcolor: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.BACKGROUND,
          borderRadius: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.BORDER_RADIUS,
          boxShadow: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.BOX_SHADOW,
          p: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.PADDING,
          display: 'flex',
          flexDirection: 'column' as const,
          gap: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.GAP,
          outline: 'none',
          maxHeight: NEW_PRODUCT_MODAL_CONSTANTS.MODAL.MAX_HEIGHT,
          overflowY: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          {/* Enhanced Header */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
            pb: 1.5,
            mb: 1
          }}>
            <Box>
              <Typography
                id="new-product-modal-title"
                variant="h5"
                component="h2"
                sx={{
                  fontFamily: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_FONT_FAMILY,
                  fontWeight: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_WEIGHT,
                  fontSize: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_SIZE,
                  color: NEW_PRODUCT_MODAL_CONSTANTS.HEADER.TITLE_COLOR,
                  margin: 0,
                  mb: 0.5,
                }}
              >
                {NEW_PRODUCT_MODAL_LABELS.TITLE}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#718096',
                  fontSize: '14px',
                  fontFamily: "'Lexend', sans-serif",
                }}
              >
                Enter the product details below to add a new product.
              </Typography>
            </Box>
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                color: '#718096',
                backgroundColor: '#f7fafc',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                '&:hover': {
                  backgroundColor: '#edf2f7',
                  color: '#2d3748',
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '12px',
                backgroundColor: '#fed7d7',
                color: '#c53030',
                border: '1px solid #feb2b2',
                '& .MuiAlert-icon': {
                  color: '#c53030',
                }
              }}
            >
              {extractErrorMessage(error, 'Failed to add product. Please try again.')}
            </Alert>
          )}

          {/* Enhanced Form Grid */}
          <Box sx={{ flex: 1 }}>

            <Grid
              container
              spacing={NEW_PRODUCT_MODAL_CONSTANTS.GRID.SPACING}
              rowSpacing={NEW_PRODUCT_MODAL_CONSTANTS.GRID.ROW_SPACING}
              sx={{ mb: 2 }}
            >
              {NEW_PRODUCT_MODAL_LABELS.FIELDS.map((field, idx) => (
                <Grid key={idx} item xs={12} sm={6} component="div">
                  {field.key === 'expiry' ? (
                    <Box sx={{ width: '100%' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 0.5,
                          color: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                          fontSize: '14px',
                          fontWeight: 500,
                          fontFamily: "'Lexend', sans-serif"
                        }}
                      >
                        {field.label}
                      </Typography>
                      <Box sx={{ width: '100%' }}>
                        <PharmaDatePicker
                          value={expiryDate}
                          onChange={(newValue) => {
                            setExpiryDate(newValue);
                            if (formErrors.expiry) {
                              setFormErrors(prev => ({ ...prev, expiry: '' }));
                            }
                          }}
                          minDate={dayjs().startOf('day')} // Only allow today and future dates
                          width="100%"
                          height={NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.HEIGHT}
                          error={!!formErrors.expiry}
                        />
                        {formErrors.expiry && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#e53e3e',
                              mt: 0.5,
                              ml: 1.5,
                              fontSize: '12px'
                            }}
                          >
                            {formErrors.expiry}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 0.5,
                          color: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                          fontSize: '14px',
                          fontWeight: 500,
                          fontFamily: "'Lexend', sans-serif"
                        }}
                      >
                        {field.label}
                      </Typography>
                      <StyledTextField
                        fullWidth
                        variant="outlined"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        type={field.type}
                        value={formData[field.key as keyof typeof formData]}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        error={!!formErrors[field.key]}
                        helperText={formErrors[field.key]}
                        InputProps={{
                          sx: {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: NEW_PRODUCT_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
                              borderWidth: '2px',
                            },
                          }
                        }}
                      />
                    </Box>
                  )}
                </Grid>
              ))}
            </Grid>

          </Box>

          {/* Enhanced Action Buttons */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            pt: 2,
            borderTop: '1px solid #e2e8f0',
            mt: 'auto'
          }}>
            <StandardButton
              variant="secondary"
              size="medium"
              onClick={handleClose}
              disabled={isLoading}
            >
              {NEW_PRODUCT_MODAL_LABELS.BUTTON_CANCEL}
            </StandardButton>
            <StandardButton
              variant="primary"
              size="medium"
              onClick={handleSubmit}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : undefined}
            >
              {isLoading ? 'Adding Product...' : NEW_PRODUCT_MODAL_LABELS.BUTTON_ADD}
            </StandardButton>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default NewProductModal;