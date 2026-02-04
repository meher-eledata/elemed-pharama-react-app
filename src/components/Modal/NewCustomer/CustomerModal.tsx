import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import { StandardButton } from '../../Common';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CloseIcon from '@mui/icons-material/Close';
import { CUSTOMER_MODAL_LABELS } from '../../../config/label/CustomerModal.labels';
import { CUSTOMER_MODAL_CONSTANTS } from '../../../config/constants/CustomerModal.constants';
import { validateCustomerData } from '../../../pages/Sales/SalesReceipt.handlers';

interface CustomerData {
  customerName: string;
  mobileNumber: string;
  emailId: string;
  gender: {
    male: boolean;
    female: boolean;
    other: boolean;
  };
  billingAddress: string;
  shippingAddress: string;
  shippingAddressSameAsBilling: boolean;
  gstin: string;
  pancardNumber: string;
  drugLicense: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerData) => void;
}

const initialCustomerState: CustomerData = CUSTOMER_MODAL_CONSTANTS.INITIAL_CUSTOMER_STATE;

const style = {
  ...CUSTOMER_MODAL_CONSTANTS.MODAL_STYLE,
  width: CUSTOMER_MODAL_CONSTANTS.MODAL_WIDTH,
  maxHeight: '90vh', // Use maxHeight instead of fixed height
  minHeight: CUSTOMER_MODAL_CONSTANTS.MODAL_HEIGHT,
  bgcolor: 'background.paper',
  borderRadius: CUSTOMER_MODAL_CONSTANTS.MODAL_BORDER_RADIUS,
  border: '1px solid',
  borderColor: 'divider',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  p: 3, // Add padding to the modal
};

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: CUSTOMER_MODAL_CONSTANTS.INPUT_BORDER_RADIUS,

    '& .MuiInputBase-input': {
      color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
      fontSize: '14px',
      fontWeight: 400,
      fontFamily: "'Lexend', sans-serif",
    },

    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.OUTLINE_COLOR,
      borderWidth: '1px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.OUTLINE_COLOR,
      borderWidth: '1px',
    },

    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.FOCUSED_COLOR,
      borderWidth: '1px',
    },
  },

  '& .MuiInputLabel-root': {
    color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.LABEL_COLOR,
    fontSize: '14px',
    '&.Mui-focused': {
      color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
    },
    '&.MuiInputLabel-shrink': {
      color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
    }
  },
};

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [customerData, setCustomerData] = useState<CustomerData>(initialCustomerState);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCustomerData(initialCustomerState);
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (e: any) => {
    const genderType = e.target.value;
    setCustomerData(prev => ({
      ...prev,
      gender: {
        male: genderType === CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.MALE,
        female: genderType === CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.FEMALE,
        other: genderType === CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.OTHER,
      }
    }));
  };

  const getCurrentGenderValue = () => {
    if (customerData.gender.male) return CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.MALE;
    if (customerData.gender.female) return CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.FEMALE;
    if (customerData.gender.other) return CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.OTHER;
    return '';
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomerData(prev => ({ ...prev, shippingAddressSameAsBilling: e.target.checked }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate all required fields before submitting
    const missingFields: string[] = [];

    if (!customerData.customerName || !customerData.customerName.trim()) {
      missingFields.push('Customer name');
    }
    if (!customerData.mobileNumber || !customerData.mobileNumber.trim()) {
      missingFields.push('Mobile number');
    }

    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate customer data (format validation for optional fields)
    const validation = validateCustomerData(customerData);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Validation failed. Please check your input.');
      return;
    }

    try {
      await onSubmit(customerData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add customer. Please try again.');
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby={CUSTOMER_MODAL_LABELS.MODAL_ARIA_LABEL}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box sx={style} component="form" onSubmit={handleSubmit}>
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
              id={CUSTOMER_MODAL_LABELS.MODAL_ARIA_LABEL}
              variant="h5"
              component="h2"
              sx={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 600,
                fontSize: '22px',
                color: '#1a202c',
                margin: 0,
                mb: 0.5,
              }}
            >
              {CUSTOMER_MODAL_LABELS.MODAL_TITLE}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#718096',
                fontSize: '14px',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              Enter the customer's details below to create a new customer.
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
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

        {/* Content Area - Scrollable */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: '8px',
                '& .MuiAlert-message': {
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '14px',
                }
              }}
              onClose={() => setErrorMessage('')}
            >
              {errorMessage}
            </Alert>
          )}
          <Grid container spacing={5}>
            <Grid item xs={12} md={4}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 3 }}>
                {CUSTOMER_MODAL_LABELS.PERSONAL_DETAILS_HEADER}
              </Typography>

              <Stack spacing={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={CUSTOMER_MODAL_LABELS.CUSTOMER_NAME_PLACEHOLDER}
                  name="customerName"
                  value={customerData.customerName}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />

                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={CUSTOMER_MODAL_LABELS.MOBILE_NUMBER_PLACEHOLDER}
                  name="mobileNumber"
                  value={customerData.mobileNumber}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />

                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={CUSTOMER_MODAL_LABELS.EMAIL_ID_PLACEHOLDER}
                  name="emailId"
                  value={customerData.emailId}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />

                <FormControl fullWidth sx={inputStyle}>
                  <InputLabel
                    id="gender-select-label"
                    sx={{
                      color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.LABEL_COLOR,
                      fontSize: '14px',
                      '&.Mui-focused': {
                        color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
                      },
                      '&.MuiInputLabel-shrink': {
                        color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
                      }
                    }}
                  >
                    Gender
                  </InputLabel>
                  <Select
                    labelId="gender-select-label"
                    id="gender-select"
                    value={getCurrentGenderValue()}
                    label="Gender"
                    onChange={handleGenderChange}
                    sx={{
                      borderRadius: CUSTOMER_MODAL_CONSTANTS.INPUT_BORDER_RADIUS,
                      fontSize: '14px',
                      fontFamily: "'Lexend', sans-serif",
                      color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.OUTLINE_COLOR,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.OUTLINE_COLOR,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.FOCUSED_COLOR,
                      },
                      '& .MuiSelect-icon': {
                        color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: CUSTOMER_MODAL_CONSTANTS.INPUT_BORDER_RADIUS,
                          fontFamily: "'Lexend', sans-serif",
                          '& .MuiMenuItem-root': {
                            fontSize: '14px',
                            fontFamily: "'Lexend', sans-serif",
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                            },
                            '&.Mui-selected': {
                              backgroundColor: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR + '15',
                              color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR,
                              '&:hover': {
                                backgroundColor: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR + '25',
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value={CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.MALE}>
                      {CUSTOMER_MODAL_LABELS.GENDER_MALE}
                    </MenuItem>
                    <MenuItem value={CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.FEMALE}>
                      {CUSTOMER_MODAL_LABELS.GENDER_FEMALE}
                    </MenuItem>
                    <MenuItem value={CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.OTHER}>
                      {CUSTOMER_MODAL_LABELS.GENDER_OTHER}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 3 }}>
                {CUSTOMER_MODAL_LABELS.ADDRESS_DETAILS_HEADER}
              </Typography>

              <Stack spacing={3}>
                <TextField
                  fullWidth
                  multiline
                  rows={CUSTOMER_MODAL_CONSTANTS.ADDRESS_FIELD_ROWS}
                  variant="outlined"
                  placeholder={CUSTOMER_MODAL_LABELS.BILLING_ADDRESS_PLACEHOLDER}
                  name="billingAddress"
                  value={customerData.billingAddress}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={CUSTOMER_MODAL_CONSTANTS.ADDRESS_FIELD_ROWS}
                  variant="outlined"
                  placeholder={CUSTOMER_MODAL_LABELS.SHIPPING_ADDRESS_PLACEHOLDER}
                  name="shippingAddress"
                  value={customerData.shippingAddressSameAsBilling ? customerData.billingAddress : customerData.shippingAddress}
                  onChange={handleInputChange}
                  disabled={customerData.shippingAddressSameAsBilling}
                  sx={inputStyle}
                />
              </Stack>

              {/* Shipping address checkbox - moved outside Stack for better spacing control */}
              <Box sx={{ mt: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={customerData.shippingAddressSameAsBilling}
                      onChange={handleCheckboxChange}
                      name="shippingAddressSameAsBilling"
                      icon={<CheckBoxOutlineBlankIcon sx={{ color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR }} />}
                      checkedIcon={<CheckBoxIcon />}
                      sx={{
                        color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR,
                        '&.Mui-checked': { color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR },
                      }}
                    />
                  }
                  label={CUSTOMER_MODAL_LABELS.SHIPPING_SAME_AS_BILLING}
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      whiteSpace: 'nowrap',
                      fontSize: CUSTOMER_MODAL_CONSTANTS.CHECKBOX_LABEL_FONT_SIZE,
                      fontFamily: "'Lexend', sans-serif",
                      fontWeight: 400,
                      color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
                    }
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 3 }}>
                {CUSTOMER_MODAL_LABELS.COMMERCIAL_SALE_HEADER}
              </Typography>

              <Stack spacing={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={CUSTOMER_MODAL_LABELS.GSTIN_PLACEHOLDER}
                  name="gstin"
                  value={customerData.gstin}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />

                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={CUSTOMER_MODAL_LABELS.PANCARD_NUMBER_PLACEHOLDER}
                  name="pancardNumber"
                  value={customerData.pancardNumber}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />

                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={CUSTOMER_MODAL_LABELS.DRUG_LICENSE_PLACEHOLDER}
                  name="drugLicense"
                  value={customerData.drugLicense}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
              </Stack>
            </Grid>
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
            onClick={onClose}
            variant="secondary"
            size="medium"
          >
            {CUSTOMER_MODAL_LABELS.CANCEL_BUTTON}
          </StandardButton>
          <StandardButton
            type="submit"
            variant="primary"
            size="medium"
          >
            {CUSTOMER_MODAL_LABELS.ADD_BUTTON}
          </StandardButton>
        </Box>
      </Box>
    </Modal>
  );
};

export default CustomerModal;