import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Grid,
  IconButton,
  Stack,
  Alert,
} from '@mui/material';
import { StandardButton } from '../../Common';
import CloseIcon from '@mui/icons-material/Close';

interface SupplierData {
  supplierName: string;
  contactName: string;
  phoneNumber: string;
  emailId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  supplierCode: string;
  gstin: string;
  cstNumber: string;
  notes: string;
}

interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierData) => void;
}

const initialSupplierState: SupplierData = {
  supplierName: '',
  contactName: '',
  phoneNumber: '',
  emailId: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pin: '',
  supplierCode: '',
  gstin: '',
  cstNumber: '',
  notes: '',
};

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  boxShadow: 24,
  padding: 3,
  overflowY: 'hidden' as const,
  width: 900,
  maxHeight: '90vh',
  minHeight: 500,
  bgcolor: 'background.paper',
  borderRadius: '12px',
  border: '1px solid',
  borderColor: 'divider',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  p: 3,
};

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '11px',
    '& .MuiInputBase-input': {
      color: '#000000',
      fontSize: '14px',
      fontWeight: 400,
      fontFamily: "'Lexend', sans-serif",
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#B0B7C3',
      borderWidth: '1px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#B0B7C3',
      borderWidth: '1px',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#B0B7C3',
      borderWidth: '1px',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#B0B7C3',
    fontSize: '14px',
    '&.Mui-focused': {
      color: '#000000',
    },
    '&.MuiInputLabel-shrink': {
      color: '#000000',
    }
  },
};

const NewSupplierModal: React.FC<NewSupplierModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [supplierData, setSupplierData] = useState<SupplierData>(initialSupplierState);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setSupplierData(initialSupplierState);
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSupplierData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const missingFields: string[] = [];

    if (!supplierData.supplierName || !supplierData.supplierName.trim()) {
      missingFields.push('Supplier name');
    }
    if (!supplierData.contactName || !supplierData.contactName.trim()) {
      missingFields.push('Contact name');
    }
    if (!supplierData.phoneNumber || !supplierData.phoneNumber.trim()) {
      missingFields.push('Phone number');
    }
    if (!supplierData.emailId || !supplierData.emailId.trim()) {
      missingFields.push('Email id');
    }
    if (!supplierData.supplierCode || !supplierData.supplierCode.trim()) {
      missingFields.push('Supplier code');
    }
    if (!supplierData.gstin || !supplierData.gstin.trim()) {
      missingFields.push('GSTIN');
    }

    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      await onSubmit(supplierData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add supplier. Please try again.');
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="new-supplier-modal-title"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box sx={style} component="form" onSubmit={handleSubmit}>
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
              id="new-supplier-modal-title"
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
              New Supplier
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#718096',
                fontSize: '14px',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              Enter the supplier's details below to create a new supplier.
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

        <Box sx={{ flex: 1, overflow: 'auto', px: 4, pb: 3 }}>
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
                Contact details
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Supplier name *"
                  name="supplierName"
                  value={supplierData.supplierName}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Contact name *"
                  name="contactName"
                  value={supplierData.contactName}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Phone number *"
                  name="phoneNumber"
                  value={supplierData.phoneNumber}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Email id *"
                  name="emailId"
                  value={supplierData.emailId}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={4} sx={{ pr: 2 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 3 }}>
                Address
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Address"
                  name="address"
                  value={supplierData.address}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="City"
                  name="city"
                  value={supplierData.city}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="State"
                  name="state"
                  value={supplierData.state}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Country"
                  name="country"
                  value={supplierData.country}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="PIN"
                  name="pin"
                  value={supplierData.pin}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 3 }}>
                Business details
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Supplier code *"
                  name="supplierCode"
                  value={supplierData.supplierCode}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="GSTIN *"
                  name="gstin"
                  value={supplierData.gstin}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="CST number"
                  name="cstNumber"
                  value={supplierData.cstNumber}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  variant="outlined"
                  label="Notes"
                  placeholder="Notes"
                  name="notes"
                  value={supplierData.notes}
                  onChange={handleInputChange}
                  sx={inputStyle}
                />
              </Stack>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          pt: 3,
          borderTop: '1px solid #e2e8f0',
          mt: 'auto'
        }}>
          <StandardButton
            onClick={onClose}
            variant="secondary"
            size="medium"
          >
            Cancel
          </StandardButton>
          <StandardButton
            type="submit"
            variant="primary"
            size="medium"
          >
            Add
          </StandardButton>
        </Box>
      </Box>
    </Modal>
  );
};

export default NewSupplierModal;
