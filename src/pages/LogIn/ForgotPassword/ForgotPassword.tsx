import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { FORGOT_PASSWORD_LABELS } from '../../../config/label/forgotPassword.labels';
import { FORGOT_PASSWORD_CONSTANTS } from '../../../config/constants/forgotPassword.constants';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (value: string) => {
    if (!value.trim()) return FORGOT_PASSWORD_LABELS.REQUIRED_ERROR;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return FORGOT_PASSWORD_LABELS.INVALID_ERROR;
    return '';
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validateEmail(email);
    setEmailError(error);
    setTouched(true);

    if (!error) {
      console.log('Forgot password request for:', email);
      navigate('/create-password');
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
          {FORGOT_PASSWORD_LABELS.EMAIL_LABEL}
        </Typography>

        <TextField
          variant="outlined"
          type="email"
          fullWidth
          size={FORGOT_PASSWORD_CONSTANTS.INPUT_SIZE as 'small' | 'medium'}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) setEmailError(validateEmail(e.target.value));
          }}
          onBlur={() => {
            setTouched(true);
            setEmailError(validateEmail(email));
          }}
          placeholder={FORGOT_PASSWORD_LABELS.EMAIL_PLACEHOLDER}
          error={false}
          helperText={emailError}
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
              color: emailError ? '#E36414' : 'transparent',
              fontSize: '12px',
              fontWeight: 400,
              marginLeft: '0px',
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            backgroundColor: '#5C17E5',
            borderRadius: FORGOT_PASSWORD_CONSTANTS.BUTTON_RADIUS,
            height: FORGOT_PASSWORD_CONSTANTS.BUTTON_HEIGHT,
            fontSize: '16px',
            fontWeight: 500,
            textTransform: 'none',
            fontFamily: 'Lexend, sans-serif',
            boxShadow: 'none',
            color: '#FFFFFF',
            lineHeight: '24px',
            padding: '16px 24px',
            '&:hover': {
              backgroundColor: '#4a13b4',
              boxShadow: 'none',
            },
          }}
        >
          {FORGOT_PASSWORD_LABELS.BUTTON_TEXT}
        </Button>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
