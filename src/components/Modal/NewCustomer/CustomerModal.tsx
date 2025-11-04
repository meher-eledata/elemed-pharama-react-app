import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  Grid,
  Button,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Divider,
} from '@mui/material';
import { StandardButton } from '../../Common';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CloseIcon from '@mui/icons-material/Close';
import { CUSTOMER_MODAL_LABELS } from '../../../config/label/CustomerModal.labels';
import { CUSTOMER_MODAL_CONSTANTS } from '../../../config/constants/CustomerModal.constants';

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
      fontFamily: 'Lexend',
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCustomerData(initialCustomerState);
    }
  }, [isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(customerData);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} aria-labelledby={CUSTOMER_MODAL_LABELS.MODAL_ARIA_LABEL}>
      <Box sx={style} component="form" onSubmit={handleSubmit}>
        {/* Header */}
        <Box sx={{ flexShrink: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography id={CUSTOMER_MODAL_LABELS.MODAL_ARIA_LABEL} variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            {CUSTOMER_MODAL_LABELS.MODAL_TITLE}
          </Typography>
          <Button
            onClick={onClose}
            sx={{
              minWidth: 0,
              padding: 0,
              color: 'text.secondary',
              '&:hover': { background: 'none' }
            }}
          >
            <CloseIcon />
          </Button>
        </Stack>
        </Box>

        {/* Content Area - Scrollable */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
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
            </Stack>

            <Box sx={{ mt: 4 }}>
              <Typography sx={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                mb: 2
              }}>
                Gender
              </Typography>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  row
                  value={getCurrentGenderValue()}
                  onChange={handleGenderChange}
                  sx={{
                    gap: 4,
                    '& .MuiFormControlLabel-root': {
                      marginRight: 0,
                    }
                  }}
                >
                  <FormControlLabel
                    value={CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.MALE}
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR,
                          '&.Mui-checked': {
                            color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR,
                          },
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                          padding: '4px 9px',
                        }}
                      />
                    }
                    label={CUSTOMER_MODAL_LABELS.GENDER_MALE}
                    sx={{
                      margin: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '14px',
                        fontWeight: 400,
                        marginLeft: '8px',
                        fontFamily: 'Lexend',
                        color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
                      },
                    }}
                  />
                  <FormControlLabel
                    value={CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.FEMALE}
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR,
                          '&.Mui-checked': {
                            color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR,
                          },
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                          padding: '4px 9px',
                        }}
                      />
                    }
                    label={CUSTOMER_MODAL_LABELS.GENDER_FEMALE}
                    sx={{
                      margin: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '14px',
                        fontWeight: 400,
                        marginLeft: '8px',
                        fontFamily: 'Lexend',
                        color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
                      },
                    }}
                  />
                  <FormControlLabel
                    value={CUSTOMER_MODAL_CONSTANTS.GENDER_TYPES.OTHER}
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR,
                          '&.Mui-checked': {
                            color: CUSTOMER_MODAL_CONSTANTS.PRIMARY_COLOR,
                          },
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                          padding: '4px 9px',
                        }}
                      />
                    }
                    label={CUSTOMER_MODAL_LABELS.GENDER_OTHER}
                    sx={{
                      margin: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '14px',
                        fontWeight: 400,
                        marginLeft: '8px',
                        fontFamily: 'Lexend',
                        color: CUSTOMER_MODAL_CONSTANTS.INPUT_STYLE.TEXT_COLOR,
                      },
                    }}
                  />
                </RadioGroup>
              </FormControl>
            </Box>
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
                    fontFamily: 'Lexend',
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

        {/* Footer - Sticky Buttons */}
        <Box sx={{ 
          flexShrink: 0, 
          display: 'flex', 
          justifyContent: 'flex-end', 
          mt: 3, 
          pt: 2, 
          borderTop: '1px solid #e2e8f0',
          backgroundColor: 'background.paper'
        }}>
          <StandardButton
            onClick={onClose}
            variant="secondary"
            size="medium"
            sx={{ mr: 2 }}
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