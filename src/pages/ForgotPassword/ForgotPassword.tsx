
import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Enter a valid email address';
    return '';
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validateEmail(email);
    setEmailError(error);
    setTouched(true);

    // Submit only if valid
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
        width: '400px',
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
        Forgot Password
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
        Don't worry. Please enter your Email and we'll send you a link to reset your password.
      </Typography>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
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
          Email ID
        </Typography>

        <TextField
          variant="outlined"
          type="email"
          fullWidth
          size="small"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) setEmailError(validateEmail(e.target.value));
          }}
          onBlur={() => {
            setTouched(true);
            setEmailError(validateEmail(email));
          }}
          error={false} // Prevent red border
          helperText={emailError}
          sx={{
            mb: '16px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              height: '48px',
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
            borderRadius: '12px',
            height: '56px',
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
          Reset My Password
        </Button>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
