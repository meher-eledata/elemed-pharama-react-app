import React, { useState, ChangeEvent, FormEvent } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Button,
  Checkbox,
  Stack,
} from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CloseIcon from '@mui/icons-material/Close';

// --- INTERFACES ---
interface CustomerData {
  customerName: string;
  hospitalID: string;
  id: string;
  gender: 'Male' | 'Female' | '';
  phoneNumber: string;
  emailId: string;
  gstin: string;
  tin: string;
  pancardNumber: string;
  billingAddress: string;
  shippingAddressSameAsBilling: boolean;
  drugLicence: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerData) => void;
}

// --- INITIAL STATE ---
const initialCustomerState: CustomerData = {
  customerName: '',
  hospitalID: '',
  id: '',
  gender: 'Female',
  phoneNumber: '',
  emailId: '',
  gstin: '',
  tin: '',
  pancardNumber: '',
  billingAddress: '',
  shippingAddressSameAsBilling: true,
  drugLicence: '',
};

// --- STYLING ---
const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 657,
  height: 537,
  bgcolor: 'background.paper',
  borderRadius: '24px',
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
};

// ✅ Shared style for all input fields (FIXED: Label color is now black on focus)
const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '11px',
    
    // Set text color for the input value to ALWAYS be black
    '& .MuiInputBase-input': {
      color: '#000000', 
    },

    // Target the border (fieldset) when not focused
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#B0B7C3', 
    },
    // Hover state border
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#B0B7C3', 
    },

    // Styles when the TextField is focused:
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#5C17E5', // Border color is purple
    },
  },
  
  // Label color control
  '& .MuiInputLabel-root': {
    color: '#B0B7C3', // Default label color (gray)
    '&.Mui-focused': {
      // 🚀 CHANGED TO BLACK
      color: '#000000', 
    },
    '&.MuiInputLabel-shrink': {
      // 🚀 CHANGED TO BLACK
        color: '#000000', 
    }
  },
};

// --- COMPONENT ---
const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [customerData, setCustomerData] = useState<CustomerData>(initialCustomerState);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'Male' | 'Female';
    setCustomerData(prev => ({ ...prev, gender: value }));
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
    <Modal open={isOpen} onClose={onClose} aria-labelledby="add-new-customer-modal-title">
      <Box sx={style} component="form" onSubmit={handleSubmit}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography id="add-new-customer-modal-title" variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            Add New Customer
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

        {/* Form (Reduced Spacing) */}
        <Grid container spacing={1}>
          {/* Row 1 */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="Customer Name"
              name="customerName"
              value={customerData.customerName}
              onChange={handleInputChange}
              size="small"
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="Hospital ID"
              name="hospitalID"
              value={customerData.hospitalID}
              onChange={handleInputChange}
              size="small"
              sx={inputStyle}
            />
          </Grid>

          {/* Row 2 - Gender (Radio Button Style and Alignment) */}
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset" sx={{ ml: 1, my: 0.5 }}>
              <RadioGroup
                row
                name="gender"
                value={customerData.gender}
                onChange={handleGenderChange}
              >
                <FormControlLabel
                  value="Male"
                  control={
                    <Radio
                      size="small"
                      sx={{
                        color: '#B0B7C3', 
                        '&.Mui-checked': { color: '#5C17E5' },
                      }}
                    />
                  }
                  label="Male"
                />
                <FormControlLabel
                  value="Female"
                  control={
                    <Radio
                      size="small"
                      sx={{
                        color: '#B0B7C3',
                        '&.Mui-checked': { color: '#5C17E5' },
                      }}
                    />
                  }
                  label="Female"
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="ID"
              name="id"
              value={customerData.id}
              onChange={handleInputChange}
              size="small"
              sx={inputStyle}
            />
          </Grid>

          {/* Rows 3-6 (Using inputStyle for all fields) */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth variant="outlined" label="Phone Number" name="phoneNumber" type="tel" value={customerData.phoneNumber} onChange={handleInputChange} size="small" sx={inputStyle} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth variant="outlined" label="Email Id" name="emailId" type="email" value={customerData.emailId} onChange={handleInputChange} size="small" sx={inputStyle} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth variant="outlined" label="GSTIN" name="gstin" value={customerData.gstin} onChange={handleInputChange} size="small" sx={inputStyle} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth variant="outlined" label="TIN" name="tin" value={customerData.tin} onChange={handleInputChange} size="small" sx={inputStyle} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth variant="outlined" label="Pancard Number" name="pancardNumber" value={customerData.pancardNumber} onChange={handleInputChange} size="small" sx={inputStyle} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth multiline rows={4} variant="outlined" label="Billing Address" name="billingAddress" value={customerData.billingAddress} onChange={handleInputChange} size="small" sx={inputStyle} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth variant="outlined" label="Drug Licence" name="drugLicence" value={customerData.drugLicence} onChange={handleInputChange} size="small" sx={inputStyle} />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={customerData.shippingAddressSameAsBilling}
                  onChange={handleCheckboxChange}
                  name="shippingAddressSameAsBilling"
                  icon={<CheckBoxOutlineBlankIcon sx={{ color: '#5C17E5' }} />}
                  checkedIcon={<CheckBoxIcon />}
                  sx={{
                    color: '#5C17E5',
                    '&.Mui-checked': { color: '#5C17E5' },
                  }}
                />
              }
              label="Shipping address as same as billing Address"
            />
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end',  mt: 3 }}>
          <Button 
            onClick={onClose}  
            sx={{ 
              mr: 2,
              color:'#000000',
              '&:hover': {
                color: '#000000',
                backgroundColor: 'transparent',
              },
              '&:active': {
                color: '#000000',
              },
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="contained" sx={{ backgroundColor: '#5C17E5', '&:hover': { backgroundColor: '#4A13C0' } }}>
            Add
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CustomerModal;