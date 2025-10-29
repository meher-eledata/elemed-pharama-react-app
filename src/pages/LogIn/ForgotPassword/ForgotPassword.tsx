
import React, { useState } from 'react';
import { Box, TextField, Typography, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { StandardButton } from '../../../components/Common';
import { FORGOT_PASSWORD_LABELS } from '../../../config/label/forgotPassword.labels';
import { FORGOT_PASSWORD_CONSTANTS } from '../../../config/constants/forgotPassword.constants';
import { usePasswordRecoveryMutation } from '../../../redux/slices/authSlice';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [touched, setTouched] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [passwordRecovery, { isLoading }] = usePasswordRecoveryMutation();

  const validateUsername = (value: string) => {
    if (!value.trim()) return FORGOT_PASSWORD_LABELS.REQUIRED_ERROR;
    if (value.trim().length < 3) return FORGOT_PASSWORD_LABELS.INVALID_ERROR;
    return '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validateUsername(username);
    setUsernameError(error);
    setTouched(true);

    if (!error) {
      try {
        const result = await passwordRecovery({ username: username.trim() }).unwrap();
        setShowSuccess(true);
        setErrorMessage('');
        // Optionally navigate after a delay
        setTimeout(() => {
          navigate('/create-password');
        }, 2000);
      } catch (error: any) {
        setErrorMessage(error?.data?.message || FORGOT_PASSWORD_LABELS.ERROR_MESSAGE);
        setShowError(true);
      }
    }
  };

  return (
    <Box
      sx={{
        fontFamily: 'Lexend, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: FORGOT_PASSWORD_CONSTANTS.MAX_WIDTH,
        mx: 'auto',
        marginBlock: 'auto',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          fontSize: '32px',
          lineHeight: '36px',
          color: '#1A212B',
          mb: '40px',
          textAlign: 'left',
          width: '100%',
        }}
      >
        {FORGOT_PASSWORD_LABELS.TITLE}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '20px',
          color: '#1A212B',
          mb: '16px',
          width: '100%',
          textAlign: 'left',
        }}
      >
        {FORGOT_PASSWORD_LABELS.DESCRIPTION}
      </Typography>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '12px',
            lineHeight: '18px',
            color: '#525E6F',
            mb: '4px',
            textAlign: 'left',
          }}
        >
          {FORGOT_PASSWORD_LABELS.USERNAME_LABEL}
        </Typography>

        <TextField
          variant="outlined"
          type="text"
          fullWidth
          size={FORGOT_PASSWORD_CONSTANTS.INPUT_SIZE as 'small' | 'medium'}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (touched) setUsernameError(validateUsername(e.target.value));
          }}
          onBlur={() => {
            setTouched(true);
            setUsernameError(validateUsername(username));
          }}
          placeholder={FORGOT_PASSWORD_LABELS.USERNAME_PLACEHOLDER}
          error={!!usernameError}
          helperText={usernameError}
          sx={{
            mb: '16px',
            '& .MuiOutlinedInput-root': {
              borderRadius: FORGOT_PASSWORD_CONSTANTS.INPUT_RADIUS,
              backgroundColor: '#FFFFFF',
              height: FORGOT_PASSWORD_CONSTANTS.INPUT_HEIGHT,
              padding: '0 16px',
              fontFamily: 'Lexend, sans-serif',
              '& fieldset': {
                borderColor: '#9AA8BC !important',
              },
              '&:hover fieldset': {
                borderColor: '#9AA8BC !important',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#000 !important',
              },
              '& input': {
                padding: '12px 0',
                fontSize: '16px',
                fontWeight: 400,
                color: '#1A212B',
              },
              // Autofill override fix
              '& input:-webkit-autofill': {
                WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset',
                WebkitTextFillColor: '#1A212B',
                caretColor: '#1A212B',
                transition: 'background-color 5000s ease-in-out 0s',
              },
            },
            '& .MuiFormHelperText-root': {
              color: usernameError ? '#E36414' : 'transparent',
              fontSize: '12px',
              fontWeight: 400,
              marginLeft: '0px',
            },
          }}
        />

        <StandardButton
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? FORGOT_PASSWORD_LABELS.LOADING_MESSAGE : FORGOT_PASSWORD_LABELS.BUTTON_TEXT}
        </StandardButton>
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
          {FORGOT_PASSWORD_LABELS.SUCCESS_MESSAGE}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={4000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgotPassword;

