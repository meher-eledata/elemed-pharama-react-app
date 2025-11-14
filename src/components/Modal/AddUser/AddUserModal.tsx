import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { StandardButton } from '../../Common';
import styled from '@mui/system/styled';
import PasswordLinkConfirmationDialog from './PasswordLinkConfirmationDialog';
import { useCreateUserMutation, CreateUserRequest, IdentityDocumentType, UserRole } from '../../../redux/slices/adminSlice';

// Constants for styling
export const ADD_USER_MODAL_CONSTANTS = {
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
  GRID: {
    SPACING: 6,
    ROW_SPACING: 2,
  }
};

// Styled TextField component
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.HEIGHT,
    borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
    backgroundColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BG,
    fontSize: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FONT_SIZE,
    transition: 'all 0.2s ease-in-out',
    overflow: 'hidden',
    
    '& fieldset': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
      transition: 'border-color 0.2s ease-in-out',
    },
    
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
      transition: 'border-color 0.2s ease-in-out',
    },
    
    '&:hover fieldset': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
    },
    
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
    },
    
    '&.Mui-focused fieldset': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
    },
    
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
    },
    
    '&.Mui-error fieldset': {
      borderColor: '#e53e3e',
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
    },
    
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e53e3e',
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
    },
  },
  
  '& .css-1t8l2tu-MuiInputBase-input-MuiOutlinedInput-input': {
    borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS,
  },

  '& .MuiInputBase-input': {
    height: '100%',
    padding: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.INPUT_PADDING,
    boxSizing: 'border-box',
    fontFamily: 'Lexend, sans-serif',
    fontWeight: 500,
    color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.INPUT_COLOR,
    fontSize: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FONT_SIZE,
    
    '&::placeholder': {
      color: '#a0aec0',
      opacity: 1,
      fontWeight: 400,
    },
  },

  '& .MuiInputLabel-root': {
    fontSize: '14px',
    fontFamily: 'Lexend, sans-serif',
    fontWeight: 500,
    color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
    backgroundColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BG,
    padding: '0 4px',
    
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.85)',
      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      backgroundColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BG,
    },
    
    '&.Mui-focused': {
      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
    },
  },

  '& .MuiFormHelperText-root': {
    fontSize: '12px',
    fontFamily: 'Lexend, sans-serif',
    fontWeight: 400,
    marginLeft: '4px',
    marginTop: '4px',
  },
}));

// Styled FormControl for Select
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.HEIGHT,
    borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS + ' !important',
    backgroundColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BG,
    fontSize: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FONT_SIZE,
    overflow: 'hidden',
    
    '& fieldset': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS + ' !important',
    },
    
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS + ' !important',
    },
    
    '&:hover fieldset': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS + ' !important',
    },
    
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS + ' !important',
    },
    
    '&.Mui-focused fieldset': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS + ' !important',
    },
    
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      borderWidth: '2px',
      borderRadius: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BORDER_RADIUS + ' !important',
    },
  },

  '& .MuiInputLabel-root': {
    fontSize: '14px',
    fontFamily: 'Lexend, sans-serif',
    fontWeight: 500,
    color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
    backgroundColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BG,
    padding: '0 4px',
    
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.85)',
      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
      backgroundColor: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.BG,
    },
    
    '&.Mui-focused': {
      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.FOCUS_BORDER_COLOR,
    },
  },
}));

interface UserData {
  firstName: string;
  lastName: string;
  emailId: string;
  mobileNumber: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  identityDocument: string;
  idDocumentNumber: string;
  role: string;
}

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const initialUserState: UserData = {
  firstName: '',
  lastName: '',
  emailId: '',
  mobileNumber: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  identityDocument: '',
  idDocumentNumber: '',
  role: '',
};

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<UserData>(initialUserState);
  const [showAddressFields, setShowAddressFields] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // API hook
  const [createUser] = useCreateUserMutation();
  
  // Toast notification state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Helper function to show toast
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Transform UserData from modal to CreateUserRequest for API
  const transformUserDataToRequest = (userData: UserData): CreateUserRequest => {
    // Map identity document string to number: 0 = Aadhar Card, 1 = Driver's License
    const identityDocumentMap: Record<string, IdentityDocumentType> = {
      'Aadhar Card': 0,
      'Driving Licence': 1,
    };

    // Map role string to number: 0 = Admin, 1 = Pharmacist
    const roleMap: Record<string, UserRole> = {
      'Admin': 0,
      'Pharmacist': 1,
    };

    // Generate username from email (take part before @) or use firstname+lastname
    const username = userData.emailId.split('@')[0] || 
                     `${userData.firstName.toLowerCase()}_${userData.lastName.toLowerCase()}`;

    // Generate a temporary password (backend might send password link via email)
    const tempPassword = `Temp@${Math.random().toString(36).slice(-8)}`;

    return {
      username,
      email: userData.emailId,
      password: tempPassword,
      first_name: userData.firstName,
      last_name: userData.lastName,
      address_line1: userData.address_line1 || '',
      address_line2: userData.address_line2 || undefined,
      city: userData.city || '',
      state: userData.state || '',
      postal_code: userData.postal_code || '',
      country: userData.country || '',
      identity_document: identityDocumentMap[userData.identityDocument] ?? 0,
      identity_document_number: userData.idDocumentNumber,
      role: roleMap[userData.role] ?? 0,
    };
  };

  useEffect(() => {
    if (!open) {
      setFormData(initialUserState);
      setShowAddressFields(false);
    }
  }, [open]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear ID document number when identity document changes
    if (name === 'identityDocument') {
      setFormData(prev => ({ ...prev, idDocumentNumber: '' }));
    }
  };

  const getIdDocumentPlaceholder = () => {
    if (formData.identityDocument === 'Aadhar Card') {
      return 'Enter Aadhar Card Number';
    } else if (formData.identityDocument === 'Driving Licence') {
      return 'Please enter the driving licence number';
    }
    return 'Enter ID Document Number';
  };

  const handleSave = () => {
    setShowPasswordConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setIsCreatingUser(true);
    try {
      // Transform the modal data to API request format
      const requestData = transformUserDataToRequest(formData);
      
      // Call the API
      await createUser(requestData).unwrap();
      
      // Show success toast
      showToast('User created successfully!', 'success');
      
      // Close dialogs
      setShowPasswordConfirmation(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after a short delay to show toast
      setTimeout(() => {
        onClose();
        // Reset form
        setFormData(initialUserState);
      }, 1500);
      
    } catch (error: any) {
      // Show error toast
      const errorMessage = error?.data?.message || error?.message || 'Failed to create user. Please try again.';
      showToast(errorMessage, 'error');
      
      // Keep dialog open so user can retry
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCancelSave = () => {
    setShowPasswordConfirmation(false);
  };

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="add-user-modal-title"
      aria-describedby="add-user-modal-description"
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
        width: ADD_USER_MODAL_CONSTANTS.MODAL.WIDTH,
        maxWidth: ADD_USER_MODAL_CONSTANTS.MODAL.MAX_WIDTH,
        bgcolor: ADD_USER_MODAL_CONSTANTS.MODAL.BACKGROUND,
        borderRadius: ADD_USER_MODAL_CONSTANTS.MODAL.BORDER_RADIUS,
        boxShadow: ADD_USER_MODAL_CONSTANTS.MODAL.BOX_SHADOW,
        p: ADD_USER_MODAL_CONSTANTS.MODAL.PADDING,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: ADD_USER_MODAL_CONSTANTS.MODAL.GAP,
        outline: 'none',
        maxHeight: ADD_USER_MODAL_CONSTANTS.MODAL.MAX_HEIGHT,
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
              id="add-user-modal-title"
              variant="h5"
              component="h2"
              sx={{
                fontFamily: ADD_USER_MODAL_CONSTANTS.HEADER.TITLE_FONT_FAMILY,
                fontWeight: ADD_USER_MODAL_CONSTANTS.HEADER.TITLE_WEIGHT,
                fontSize: ADD_USER_MODAL_CONSTANTS.HEADER.TITLE_SIZE,
                color: ADD_USER_MODAL_CONSTANTS.HEADER.TITLE_COLOR,
                margin: 0,
                mb: 0.5,
              }}
            >
              Add New User
            </Typography>
            <Typography 
              variant="body2" 
              sx={{
                color: '#718096',
                fontSize: '14px',
                fontFamily: 'Lexend, sans-serif',
              }}
            >
              Enter the new user's details below to create an account.
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

        {/* Form Fields */}
        <Box sx={{ flex: 1 }}>
          <Grid 
            container 
            spacing={ADD_USER_MODAL_CONSTANTS.GRID.SPACING} 
            rowSpacing={ADD_USER_MODAL_CONSTANTS.GRID.ROW_SPACING}
            sx={{ mb: 2 }}
          >
            {/* First Name */}
            <Grid item xs={12} sm={6} component="div">
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.5, 
                  color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Lexend, sans-serif'
                }}
              >
                First Name
              </Typography>
              <StyledTextField 
                fullWidth 
                variant="outlined" 
                placeholder="Enter first name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} sm={6} component="div">
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.5, 
                  color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Lexend, sans-serif'
                }}
              >
                Last Name
              </Typography>
              <StyledTextField 
                fullWidth 
                variant="outlined" 
                placeholder="Enter last name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Email ID */}
            <Grid item xs={12} sm={6} component="div">
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.5, 
                  color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Lexend, sans-serif'
                }}
              >
                Email ID
              </Typography>
              <StyledTextField 
                fullWidth 
                variant="outlined" 
                placeholder="Enter email ID"
                name="emailId"
                value={formData.emailId}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Mobile Number */}
            <Grid item xs={12} sm={6} component="div">
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.5, 
                  color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Lexend, sans-serif'
                }}
              >
                Mobile Number
              </Typography>
              <StyledTextField 
                fullWidth 
                variant="outlined" 
                placeholder="Enter mobile number"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Address Field - Trigger */}
            <Grid item xs={12} component="div">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'Lexend, sans-serif'
                  }}
                >
                  Address (optional)
                </Typography>
                {!showAddressFields && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowAddressFields(true)}
                    sx={{
                      backgroundColor: '#5C17E5',
                      color: '#FFFFFF',
                      height: '32px',
                      minWidth: 'auto',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontFamily: 'Lexend, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#5C17E5',
                        boxShadow: 'none',
                      },
                      '&:focus': {
                        backgroundColor: '#5C17E5',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Add Address
                  </Button>
                )}
                {showAddressFields && (
                  <Button
                    variant="contained"
                    startIcon={<CloseIcon />}
                    onClick={() => setShowAddressFields(false)}
                    sx={{
                      backgroundColor: '#5C17E5',
                      color: '#FFFFFF',
                      height: '32px',
                      minWidth: 'auto',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontFamily: 'Lexend, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#5C17E5',
                        boxShadow: 'none',
                      },
                      '&:focus': {
                        backgroundColor: '#5C17E5',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Close
                  </Button>
                )}
              </Box>
            </Grid>

            {showAddressFields && (
              <>
                <Grid item xs={12} sm={6} component="div">
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5, 
                      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'Lexend, sans-serif'
                    }}
                  >
                    Street address, house/building number
                  </Typography>
                  <StyledTextField 
                    fullWidth 
                    variant="outlined" 
                    placeholder="Enter street address"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6} component="div">
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5, 
                      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'Lexend, sans-serif'
                    }}
                  >
                    Optional unit/suite/floor
                  </Typography>
                  <StyledTextField 
                    fullWidth 
                    variant="outlined" 
                    placeholder="Enter unit/suite/floor"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6} component="div">
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5, 
                      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'Lexend, sans-serif'
                    }}
                  >
                    City
                  </Typography>
                  <StyledTextField 
                    fullWidth 
                    variant="outlined" 
                    placeholder="Enter city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6} component="div">
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5, 
                      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'Lexend, sans-serif'
                    }}
                  >
                    State
                  </Typography>
                  <StyledTextField 
                    fullWidth 
                    variant="outlined" 
                    placeholder="Enter state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6} component="div">
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5, 
                      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'Lexend, sans-serif'
                    }}
                  >
                    Postal Code
                  </Typography>
                  <StyledTextField 
                    fullWidth 
                    variant="outlined" 
                    placeholder="Enter postal code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6} component="div">
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.5, 
                      color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'Lexend, sans-serif'
                    }}
                  >
                    Country
                  </Typography>
                  <StyledTextField 
                    fullWidth 
                    variant="outlined" 
                    placeholder="Enter country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </Grid>
              </>
            )}

            {/* Identity Document Dropdown */}
            <Grid item xs={12} sm={6} component="div">
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.5, 
                  color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Lexend, sans-serif'
                }}
              >
                Identity Document
              </Typography>
              <StyledFormControl fullWidth>
                <Select
                  name="identityDocument"
                  value={formData.identityDocument}
                  onChange={handleSelectChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    <em>Select Identity Document</em>
                  </MenuItem>
                  <MenuItem value="Aadhar Card">Aadhar Card</MenuItem>
                  <MenuItem value="Driving Licence">Driving Licence</MenuItem>
                </Select>
              </StyledFormControl>
            </Grid>

            {/* ID Document Number */}
            <Grid item xs={12} sm={6} component="div">
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.5, 
                  color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Lexend, sans-serif'
                }}
              >
                ID Document Number
              </Typography>
              <StyledTextField 
                fullWidth 
                variant="outlined" 
                placeholder={getIdDocumentPlaceholder()}
                name="idDocumentNumber"
                value={formData.idDocumentNumber}
                onChange={handleInputChange}
                disabled={!formData.identityDocument}
              />
            </Grid>

            {/* Role Dropdown */}
            <Grid item xs={12} sm={6} component="div">
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.5, 
                  color: ADD_USER_MODAL_CONSTANTS.TEXTFIELD.LABEL_COLOR,
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Lexend, sans-serif'
                }}
              >
                Role
              </Typography>
              <StyledFormControl fullWidth>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleSelectChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    <em>Select Role</em>
                  </MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Pharmacist">Pharmacist</MenuItem>
                </Select>
              </StyledFormControl>
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
            variant="secondary"
            size="medium"
            onClick={onClose}
          >
            Cancel
          </StandardButton>
          <StandardButton
            variant="primary"
            size="medium"
            onClick={handleSave}
          >
            Save
          </StandardButton>
        </Box>
      </Box>
    </Modal>
    <PasswordLinkConfirmationDialog
      open={showPasswordConfirmation}
      onClose={handleCancelSave}
      onConfirm={handleConfirmSave}
      isLoading={isCreatingUser}
    />
    
    {/* Toast Notification */}
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={4000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={() => setSnackbarOpen(false)} 
        severity={snackbarSeverity} 
        sx={{ width: '100%' }}
      >
        {snackbarMessage}
      </Alert>
    </Snackbar>
    </>
  );
};

export default AddUserModal;
