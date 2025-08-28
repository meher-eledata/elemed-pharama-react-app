
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useLoginMutation } from "../../../redux/slices/authSlice";
import { useDispatch } from 'react-redux';

// Config imports
import { LOGIN_LABELS } from "../../../config/label/loginLabels"
import { LOGIN_CONSTANTS } from "../../../config/constants/loginConstants"
import { handleLoginEffect } from "../../../config/helpers/loginHandlers";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [login, { isLoading, isSuccess, isError, error, data }] = useLoginMutation();

  useEffect(() => {
    handleLoginEffect({
      isSuccess,
      isError,
      data,
      error,
      dispatch,
      navigate,
      setSnackbarMessage,
      setSnackbarSeverity,
      setSnackbarOpen,
    });
  }, [isSuccess, isError, data, error, dispatch, navigate]);

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = `${LOGIN_LABELS.USERNAME_LABEL} is required`;
    if (!password.trim()) newErrors.password = `${LOGIN_LABELS.PASSWORD_LABEL} is required`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login({ username: username.trim(), password: password.trim() }).unwrap();
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed (unwrap catch):', err);
      const errMsg =
        (err as any)?.data?.error ||
        (err as any)?.data?.message ||
        LOGIN_LABELS.ERROR_INVALID_CREDENTIALS;
      setSnackbarMessage(errMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
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
        }}
      >
        {LOGIN_LABELS.TITLE}
      </Typography>

      <Box
        component="form"
        noValidate
        onSubmit={handleSignIn}
        sx={{ display: 'flex', flexDirection: 'column', width: { xs: '100%', sm: '400px' } }}
      >
        {/* Username Field */}
        <Typography sx={{ fontSize: '12px', fontWeight: 400, mb: '4px' }}>
          {LOGIN_LABELS.USERNAME_LABEL}
        </Typography>
        <TextField
          placeholder={LOGIN_LABELS.USERNAME_PLACEHOLDER}
          type="text"
          fullWidth
          size={LOGIN_CONSTANTS.INPUT_SIZE}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={!!errors.username}
          helperText={errors.username}
          autoComplete="off"
          sx={{ mb: '24px' }}
        />

        {/* Password Field */}
        <Typography sx={{ fontSize: '12px', fontWeight: 400, mb: '4px' }}>
          {LOGIN_LABELS.PASSWORD_LABEL}
        </Typography>
        <TextField
          placeholder={LOGIN_LABELS.PASSWORD_PLACEHOLDER}
          type={showPassword ? 'text' : 'password'}
          fullWidth
          size={LOGIN_CONSTANTS.INPUT_SIZE}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errors.password}
          helperText={errors.password}
          autoComplete="new-password"
          sx={{
            mb: '24px',
            '& input::-ms-reveal, & input::-ms-clear': {
              display: 'none',
            },
            '& input::-webkit-contacts-auto-fill-button, & input::-webkit-credentials-auto-fill-button': {
              display: 'none',
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Forgot Password */}
        <Box sx={{ mb: '32px', alignSelf: 'flex-start' }}>
          <Link to="/Forgot-Password" style={{ textDecoration: 'none' }}>
            <Typography variant="caption" sx={{ fontSize: '16px', cursor: 'pointer' }}>
              {LOGIN_LABELS.FORGOT_PASSWORD}
            </Typography>
          </Link>
        </Box>

        {/* Login Button */}
        <Button type="submit" variant="contained" fullWidth disabled={isLoading}>
          {isLoading ? LOGIN_LABELS.LOGIN_BUTTON_LOADING : LOGIN_LABELS.LOGIN_BUTTON}
        </Button>

        {/* Divider */}
        <Box sx={{ display: 'flex', alignItems: 'center', width: '400px', mb: '24px' }}>
          <Divider sx={{ flexGrow: 1 }} />
          <Typography sx={{ mx: '12px' }}>{LOGIN_LABELS.DIVIDER_TEXT}</Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>

        {/* Signup Link */}
        <Link to="/create-password" style={{ textDecoration: 'none', alignSelf: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Typography>{LOGIN_LABELS.SIGNUP_QUESTION}</Typography>
            <Typography sx={{ color: '#2B80EC', textDecoration: 'underline' }}>
              {LOGIN_LABELS.SIGNUP_LINK}
            </Typography>
          </Box>
        </Link>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={LOGIN_CONSTANTS.SNACKBAR_AUTO_HIDE}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginForm;
