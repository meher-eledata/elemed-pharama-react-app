import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { CREATE_PASSWORD_LABELS } from "../../../config/label/createPassword.labels";
import { CREATE_PASSWORD_CONSTANTS } from '../../../config/constants/createPassword.constants';
import { useResetPasswordMutation, useCreatePasswordMutation } from '../../../redux/slices/authSlice';
import './CreatePassword.scss';

const CreatePassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // Determine if this is reset password or create password flow
  const isResetPassword = location.pathname === '/reset-password';
  const isCreatePassword = location.pathname === '/create-password' || 
                           location.pathname === '/Create-password' || 
                           location.pathname === '/accept-invite';

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();
  const [createPassword, { isLoading: isCreating }] = useCreatePasswordMutation();
  
  const isLoading = isResetting || isCreating;

  // Check if token is present in URL
  useEffect(() => {
    if (!token) {
      if (isResetPassword) {
        setError('Invalid or missing reset token. Please request a new password reset link.');
      } else if (isCreatePassword) {
        setError('Invalid or missing token. Please contact your administrator for a new password setup link.');
      } else {
        setError('Invalid or missing token. Please request a new link.');
      }
    }
  }, [token, isResetPassword, isCreatePassword]);

  const handleClickShowNewPassword = () => setShowNewPassword((prev) => !prev);
  const handleMouseDownNewPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((prev) => !prev);
  const handleMouseDownConfirmPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleConfirmPasswordClick = async () => {
    const { PASSWORD_REGEX } = CREATE_PASSWORD_CONSTANTS;

    // Clear previous errors
    setError(null);
    setErrorMessage('');

    // Validate token
    if (!token) {
      if (isResetPassword) {
        setError('Invalid or missing reset token. Please request a new password reset link.');
      } else if (isCreatePassword) {
        setError('Invalid or missing token. Please contact your administrator for a new password setup link.');
      } else {
        setError('Invalid or missing token. Please request a new link.');
      }
      return;
    }

    // Validate password
    if (!newPassword) {
      setError(CREATE_PASSWORD_LABELS.ERROR_REQUIRED);
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('Password must be at least 6 characters, include one uppercase letter, and one number or special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(CREATE_PASSWORD_LABELS.ERROR_MISMATCH);
      return;
    }

    // Call appropriate API based on the flow
    try {
      if (isResetPassword) {
        await resetPassword({
          token,
          password: newPassword,
        }).unwrap();
      } else if (isCreatePassword) {
        await createPassword({
          token,
          password: newPassword,
        }).unwrap();
      } else {
        throw new Error('Invalid route');
      }

      setShowSuccess(true);
      setError(null);
      
      // Navigate to login page after successful password operation
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      let message = error?.data?.message || error?.message;
      if (!message) {
        if (isResetPassword) {
          message = 'Failed to reset password. Please try again.';
        } else if (isCreatePassword) {
          message = 'Failed to create password. Please try again.';
        } else {
          message = 'Failed to process request. Please try again.';
        }
      }
      setErrorMessage(message);
      setShowErrorSnackbar(true);
      setError(message);
    }
  };

  // Get appropriate labels based on flow
  const getTitle = () => {
    if (isResetPassword) {
      return 'Reset Your Password';
    } else if (isCreatePassword) {
      return 'Create Your Password';
    }
    return CREATE_PASSWORD_LABELS.TITLE;
  };

  const getDescription = () => {
    if (isResetPassword) {
      return 'Enter your new password to reset your account password';
    } else if (isCreatePassword) {
      return 'Set up a strong password to secure your new account';
    }
    return CREATE_PASSWORD_LABELS.DESCRIPTION;
  };

  return (
    <Box className="create-password-container">
      <Box className="create-password-form">
        <Typography variant="h4" className="title">
          {getTitle()}
        </Typography>
        <Typography className="description">
          {getDescription()}
        </Typography>

        {/* New Password */}
        <Box className="input-group">
          <Typography className="label">
            {CREATE_PASSWORD_LABELS.NEW_PASSWORD_LABEL}
          </Typography>
          <TextField
            fullWidth
            type={showNewPassword ? 'text' : 'password'}
            className="text-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowNewPassword}
                    onMouseDown={handleMouseDownNewPassword}
                    edge="end"
                  >
                    {showNewPassword ?   <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Typography className="password-info">
            *Minimum 6 characters, one uppercase letter, and one number or special character
          </Typography>
        </Box>

        {/* Confirm Password */}
        <Box className="input-group">
          <Typography className="label confirm-password-label">
            {CREATE_PASSWORD_LABELS.CONFIRM_PASSWORD_LABEL}
          </Typography>
          <TextField
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            className="text-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowConfirmPassword}
                    onMouseDown={handleMouseDownConfirmPassword}
                    edge="end"
                  >
                    {showConfirmPassword ?   <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Error */}
        {error && (
          <Typography color="error" className="error-message">
            {error}
          </Typography>
        )}

        {/* Submit */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          className="confirm-button"
          onClick={handleConfirmPasswordClick}
          disabled={isLoading || !token}
        >
          {isLoading 
            ? (isResetPassword ? 'Resetting Password...' : 'Submitting Password...') 
            : (isCreatePassword ? 'Submit Password' : CREATE_PASSWORD_LABELS.BUTTON_TEXT)}
        </Button>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {isResetPassword 
            ? 'Password reset successfully! Redirecting to login...' 
            : 'Password created successfully! Redirecting to login...'}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowErrorSnackbar(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreatePassword;