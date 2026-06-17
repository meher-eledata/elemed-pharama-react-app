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
  // Decode token in case it's URL-encoded
  const rawToken = searchParams.get('token');
  const token = rawToken ? decodeURIComponent(rawToken) : null;
  
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

  type PasswordMatchState = 'match' | 'mismatch' | null;
  const [passwordMatchState, setPasswordMatchState] = useState<PasswordMatchState>(null);
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null);

  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();
  const [createPassword, { isLoading: isCreating }] = useCreatePasswordMutation();
  
  const isLoading = isResetting || isCreating;

  // Live password validation
  useEffect(() => {
    const { PASSWORD_REGEX } = CREATE_PASSWORD_CONSTANTS;
    
    if (!newPassword) {
      setPasswordValidationError(null);
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setPasswordValidationError(CREATE_PASSWORD_LABELS.ERROR_INVALID);
    } else {
      setPasswordValidationError(null);
    }
  }, [newPassword]);

  // Password match validation
  useEffect(() => {
    if (!newPassword && !confirmPassword) {
      setPasswordMatchState(null);
      return;
    }

    if (!confirmPassword) {
      setPasswordMatchState(null);
      return;
    }

    setPasswordMatchState(newPassword === confirmPassword ? 'match' : 'mismatch');
  }, [newPassword, confirmPassword]);

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

    // Validate password
    if (!newPassword) {
      setError(CREATE_PASSWORD_LABELS.ERROR_REQUIRED);
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError(CREATE_PASSWORD_LABELS.ERROR_INVALID);
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
          token: token || '',
          password: newPassword,
        }).unwrap();
      } else if (isCreatePassword) {
        await createPassword({
          token: token || '',
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
      console.error('Password reset/create error:', error);
      console.error('Error status:', error?.status);
      console.error('Error data:', error?.data);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let message = '';
      
      if (error?.data) {
        if (typeof error.data === 'string') {
          message = error.data;
        } else if (error.data?.error) {
          message = error.data.error;
        } else if (error.data?.message) {
          message = error.data.message;
        } else if (error.data?.detail) {
          message = error.data.detail;
        }
      }
      
      if (!message && error?.message) {
        message = error.message;
      }
      
      // Fallback message with more context
      if (!message) {
        if (error?.status === 400) {
          message = 'Invalid request. The token may be invalid or expired. Please request a new password reset link.';
        } else if (isResetPassword) {
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
          {passwordValidationError && (
            <Typography color="error" className="password-validation-error">
              {passwordValidationError}
            </Typography>
          )}
        </Box>

       
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
          {passwordMatchState && (
            <Typography
              className={`password-match-message ${
                passwordMatchState === 'match' ? 'match' : 'mismatch'
              }`}
            >
              {passwordMatchState === 'match'
                ? 'Passwords match'
                : 'Passwords do not match'}
            </Typography>
          )}
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
          disabled={
            isLoading ||
            !newPassword ||
            !!passwordValidationError ||
            newPassword !== confirmPassword ||
            !token
          }
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