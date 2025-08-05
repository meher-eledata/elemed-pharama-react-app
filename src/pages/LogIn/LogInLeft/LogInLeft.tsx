import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string>('');


  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validate()) {
      setSuccessMessage(`Otp send to ${email}`);
      console.log('Signing in with:', { email, password });
      setTimeout(() => {
        navigate('/otp');
      }, 1000); // 1-second delay

      navigate('/otp');
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <Box
      sx={{
        fontFamily: 'Lexend, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100%',
        mx: 'auto',
        alignItems: 'flex-start',
        marginBlock: 'auto',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: 'Lexend, sans-serif',
          fontWeight: 600,
          fontSize: '32px',
          lineHeight: '36px',
          color: '#1A212B',
          mb: '24px',
          // width: '400px',
          width: { xs: '100%', sm: '400px' },
          height: '36px',
          textAlign: 'left',
          alignSelf: 'flex-start',
        }}
      >
        Login
      </Typography>

      <Box
        component="form"
        noValidate
        onSubmit={handleSignIn}
        sx={{
          fontFamily: 'Lexend, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          // width: '400px',
          width: { xs: '100%', sm: '400px' },
        }}
      >
        {/* Email Field */}
        <Typography
          sx={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            lineHeight: '18px',
            color: '#728197',
            mb: '4px',
          }}
        >
          Email
        </Typography>
        <TextField
          variant="outlined"
          placeholder="jane.smith@co.com"
          type="email"
          fullWidth
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          // --- START FIX: Added error and helperText props ---
          error={!!errors.email}
          helperText={errors.email}
        // --- END FIX ---

        />

        {/* Password Field */}
        <Typography
          sx={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '18px',
            color: '#525E6F',
            mb: '4px',
          }}
        >
          Password
        </Typography>
        <TextField
          variant="outlined"
          placeholder="••••••••"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          size="small"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          // --- START FIX: Added error and helperText props ---
          error={!!errors.password}
          helperText={errors.password}
          // --- END FIX ---
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  sx={{
                    p: 0,
                    width: '24px',
                    height: '24px',
                    color: '#1A212B',
                  }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: '24px' }}
        />

        {/* Forgot Password */}
        <Box sx={{ mb: '32px', alignSelf: 'flex-start' }}>
          <Link to="/ForgotPassword" style={{ textDecoration: 'none' }}>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '24px',
                color: '#1A212B',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              Forgot Password?
            </Typography>
          </Link>
        </Box>

        {/* Login Button */}
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
            mb: '24px',
            '&:hover': {
              backgroundColor: '#4a13b4',
              boxShadow: 'none',
            },
          }}
        >
          Login
        </Button>

        {/* OR Separator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '400px',
            mb: '24px',
          }}
        >
          <Divider sx={{ flexGrow: 1, height: '1px', backgroundColor: '#CBD4E1' }} />
          <Typography
            sx={{
              fontFamily: 'Lexend, sans-serif',
              textAlign: 'center',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#728197',
              mx: '12px',
            }}
          >
            or
          </Typography>
          <Divider sx={{ flexGrow: 1, height: '1px', backgroundColor: '#CBD4E1' }} />
        </Box>

        {/* Sign Up Link */}
        <Link to="/create-password" style={{ textDecoration: 'none', color: 'inherit', alignSelf: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '400px',
              height: '20px',
              gap: '8px',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Lexend, sans-serif',
                fontWeight: 400,
                color: '#1A212B',
                fontSize: '14px',
                lineHeight: '20px',
              }}
            >
              Don't have an account?{' '}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Lexend, sans-serif',
                color: '#2B80EC',
                fontWeight: 400,
                fontSize: '14px',
                cursor: 'pointer',
                lineHeight: '20px',
                textDecoration: 'underline',
                textDecorationColor: '#2B80EC',
                textUnderlineOffset: '2px',
              }}
            >
              Sign up
            </Typography>
          </Box>
        </Link>
      </Box>
    </Box>
  );
};

export default LoginForm;