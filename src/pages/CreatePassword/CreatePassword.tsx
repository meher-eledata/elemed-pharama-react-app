
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import './CreatePassword.scss';

const CreatePassword: React.FC = () => {
  const navigate = useNavigate();

  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleClickShowNewPassword = () => {
    setShowNewPassword((prev) => !prev);
  };

  const handleMouseDownNewPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleMouseDownConfirmPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleConfirmPasswordClick = () => {
    // Regex for validation:
    const passwordRegex = /^(?=[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (!newPassword) {
      setError('Password is required.');
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setError(
        'Password must start with a capital letter, include at least one number, one special character, and be at least 8 characters long.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null); // All validations passed
    navigate('/');
  };

  return (
    <Box className="create-password-container">
      <Box className="create-password-form">
        <Typography variant="h4" className="title">
          Create New Password
        </Typography>
        <Typography className="description">
          Set a strong password to secure your account
        </Typography>

        {/* New Password Field */}
        <Box className="input-group">
          <Typography className="label">New Password</Typography>
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
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Typography className="password-info">
            *Minimum 8 characters, start with capital, include number & special character
          </Typography>
        </Box>

        {/* Confirm New Password Field */}
        <Box className="input-group">
          <Typography className="label confirm-password-label">
            Confirm New Password
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
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Error Message */}
        {error && (
          <Typography color="error" className="error-message">
            {error}
          </Typography>
        )}

        {/* Confirm Password Button */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          className="confirm-button"
          onClick={handleConfirmPasswordClick}
        >
          Confirm Password
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePassword;

