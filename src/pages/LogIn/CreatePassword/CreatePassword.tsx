
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
import { CREATE_PASSWORD_LABELS } from "../../../config/label/createPassword.labels";
import { CREATE_PASSWORD_CONSTANTS } from '../../../config/constants/createPassword.constants';
import './CreatePassword.scss';

const CreatePassword: React.FC = () => {
  const navigate = useNavigate();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const handleConfirmPasswordClick = () => {
    const { PASSWORD_REGEX } = CREATE_PASSWORD_CONSTANTS;

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

    setError(null);
    navigate('/');
  };

  return (
    <Box className="create-password-container">
      <Box className="create-password-form">
        <Typography variant="h4" className="title">
          {CREATE_PASSWORD_LABELS.TITLE}
        </Typography>
        <Typography className="description">
          {CREATE_PASSWORD_LABELS.DESCRIPTION}
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
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Typography className="password-info">
            {CREATE_PASSWORD_LABELS.PASSWORD_HINT}
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
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
        >
          {CREATE_PASSWORD_LABELS.BUTTON_TEXT}
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePassword;
