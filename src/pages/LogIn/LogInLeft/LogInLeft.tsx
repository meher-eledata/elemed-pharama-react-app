import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useLoginMutation, setCredentials } from "../../../redux/slices/authSlice";
import { useDispatch } from "react-redux";

import { LOGIN_LABELS } from "../../../config/label/loginLabels";
import { LOGIN_CONSTANTS } from "../../../config/constants/loginConstants";
import { handleLoginEffect } from "../../../config/helpers/loginHandlers";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const [login, { isLoading, isSuccess, isError, error, data }] =
    useLoginMutation();

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
    if (!username.trim())
      newErrors.username = `${LOGIN_LABELS.USERNAME_LABEL} is required`;
    if (!password.trim())
      newErrors.password = `${LOGIN_LABELS.PASSWORD_LABEL} is required`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await login({
        username: username.trim(),
        password: password.trim(),
      }).unwrap();
      
      // Set credentials before navigating
      dispatch(setCredentials(response));
      
      const userRole = response?.user?.role;
      const roleLower = typeof userRole === 'string' ? userRole.toLowerCase() : '';
      if (roleLower === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const errMsg =
        (err as any)?.data?.error ||
        (err as any)?.data?.message ||
        LOGIN_LABELS.ERROR_INVALID_CREDENTIALS;
      setSnackbarMessage(errMsg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box
      sx={{
        fontFamily: "'Lexend', sans-serif",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        alignItems: "center",
        marginBlock: "auto",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: "'Lexend', sans-serif",
          fontWeight: 600,
          fontSize: "2rem", // 32px = 2rem
          lineHeight: "2.25rem", // 36px = 2.25rem
          color: "#1A212B",
          mb: "1.5rem", // 24px = 1.5rem
        }}
      >
        {LOGIN_LABELS.TITLE}
      </Typography>

      <Box
        component="form"
        noValidate
        onSubmit={handleSignIn}
        sx={{
          display: "flex",
          flexDirection: "column",
          width: { xs: "100%", sm: "400px" },
        }}
      >
        {/* Username Field */}
        <Typography
          sx={{
            fontSize: "0.75rem", // 12px = 0.75rem
            fontWeight: 400,
            mb: "0.25rem", // 4px = 0.25rem
            color: "#728197",
          }}
        >
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
          sx={{
            mb: "1.5rem", // 24px = 1.5rem
            "& .MuiInputBase-root": {
              color: "#1A212B",
              borderRadius: "0.75rem", // 12px = 0.75rem - rounded corners
              height: "3.0625rem", // 49px = 3.0625rem - custom height
              "& fieldset": {
                borderColor: "#9AA8BC",
              },
              "&:hover fieldset": {
                borderColor: "#9AA8BC",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#5C17E5",
                outline: "none",
              },
              "&.Mui-focused": {
                outline: "none",
              },
            },
            "& .MuiOutlinedInput-root": {
              "&.Mui-focused": {
                outline: "none",
              },
            },
          }}
        />

        {/* Password Field */}
        <Typography
          sx={{
            fontSize: "0.75rem", // 12px = 0.75rem
            fontWeight: 400,
            mb: "0.25rem", // 4px = 0.25rem
            color: "#728197",
          }}
        >
          {LOGIN_LABELS.PASSWORD_LABEL}
        </Typography>
        <TextField
          placeholder={LOGIN_LABELS.PASSWORD_PLACEHOLDER}
          type={showPassword ? "text" : "password"}
          fullWidth
          size={LOGIN_CONSTANTS.INPUT_SIZE}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errors.password}
          helperText={errors.password}
          autoComplete="new-password"
          sx={{
            mb: "1.5rem", // 24px = 1.5rem

            "& input::-ms-reveal, & input::-ms-clear": {
              display: "none",
            },
            "& input::-webkit-contacts-auto-fill-button, & input::-webkit-credentials-auto-fill-button":
              {
                display: "none",
              },
            "& .MuiInputBase-root": {
              color: "#1A212B",
              borderRadius: "0.75rem", // 12px = 0.75rem - rounded corners
              height: "3.0625rem", // 49px = 3.0625rem - custom height
              "& fieldset": {
                borderColor: "#9AA8BC",
              },
              "&:hover fieldset": {
                borderColor: "#9AA8BC",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#5C17E5",
                outline: "none",
              },
              "&.Mui-focused": {
                outline: "none",
              },
            },
            "& .MuiOutlinedInput-root": {
              "&.Mui-focused": {
                outline: "none",
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Forgot Password */}
        <Box sx={{ mb: "2rem", alignSelf: "flex-start" }}> {/* 32px = 2rem */}
          <Link to="/forgot-password" style={{ textDecoration: "none" }}>
            <Typography
              variant="caption"
              sx={{ fontSize: "1rem", cursor: "pointer" ,color:'#5C17E5'}} // 16px = 1rem
            >
              {LOGIN_LABELS.FORGOT_PASSWORD}
            </Typography>
          </Link>
        </Box>

        {/* Login Button */}
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          disableRipple
          sx={{
            height:'3.5rem', // 56px = 3.5rem
            textTransform: "none",
            bgcolor: "#5C17E5",
            borderRadius: "0.75rem", // 12px = 0.75rem
            fontSize:"1rem", // 16px = 1rem
            boxShadow:'none',
             "&:hover":{bgcolor: "#5C17E5",boxShadow:'none'}
          }}
        >
          {isLoading
            ? LOGIN_LABELS.LOGIN_BUTTON_LOADING
            : LOGIN_LABELS.LOGIN_BUTTON}
        </Button>

        {/* Divider */}
        {/* <Box sx={{ display: 'flex', alignItems: 'center', width: '400px', mb: '24px' }}>
          <Divider sx={{ flexGrow: 1 }} />
          <Typography sx={{ mx: '12px' }}>{LOGIN_LABELS.DIVIDER_TEXT}</Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>

      
        <Link to="/reset-password" style={{ textDecoration: 'none', alignSelf: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Typography>{LOGIN_LABELS.SIGNUP_QUESTION}</Typography>
            <Typography sx={{ color: '#2B80EC', textDecoration: 'underline' }}>
              {LOGIN_LABELS.SIGNUP_LINK}
            </Typography>
          </Box>
        </Link> */}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={LOGIN_CONSTANTS.SNACKBAR_AUTO_HIDE}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginForm;
