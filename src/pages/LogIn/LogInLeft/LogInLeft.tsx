// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Button,
//   TextField,
//   Typography,
//   IconButton,
//   InputAdornment,
//   Divider,
//   Alert,
//   Snackbar,
// } from '@mui/material';
// import { Link, useNavigate } from 'react-router-dom';
// import Visibility from '@mui/icons-material/Visibility';
// import VisibilityOff from '@mui/icons-material/VisibilityOff';
// import { useLoginMutation, setCredentials } from "../../../redux/slices/authSlice";
// import { useDispatch } from 'react-redux';

// const LoginForm: React.FC = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const [username, setUsername] = useState<string>('');
//   const [password, setPassword] = useState<string>('');
//   const [showPassword, setShowPassword] = useState<boolean>(false);
//   const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
//   const [snackbarOpen, setSnackbarOpen] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

//   const [login, { isLoading, isSuccess, isError, error, data }] = useLoginMutation();

//   useEffect(() => {
//     if (isSuccess && data) {
//       // Dispatching setCredentials to store user data (including token) in Redux and sessionStorage.
//       // Assuming 'data' contains the user object and token after successful login.
//       dispatch(setCredentials(data));
//       setSnackbarMessage('Login successful!');
//       setSnackbarSeverity('success');
//       setSnackbarOpen(true);
//       setTimeout(() => {
//         // Navigate to the '/inventory' page after a short delay
//         navigate('/inventory');
//       }, 1000);
//     } else if (isError) {
//       let errorMessage = 'Login failed. Please try again.';
//       if (error && 'status' in error) {
//         if (error.status === 401) {
//           errorMessage = 'Invalid username or password.';
//         } else if (error.status === 400 && (error.data as any)?.error) {
//           errorMessage = (error.data as { error?: string }).error || 'Bad Request: Unknown error.';
//         } else {
//           errorMessage = `Error: ${error.status}`;
//         }
//       } else if (error && 'message' in error) {
//         errorMessage = (error as { message: string }).message;
//       }
//       setSnackbarMessage(errorMessage);
//       setSnackbarSeverity('error');
//       setSnackbarOpen(true);
//       console.error('Login error (RTK):', error);
//     }
//   }, [isSuccess, isError, data, error, dispatch, navigate]);

//   const validate = () => {
//     const newErrors: { username?: string; password?: string } = {};

//     if (!username || !username.trim()) {
//       newErrors.username = 'Username is required';
//     }

//     if (!password || !password.trim()) {
//       newErrors.password = 'Password is required';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     if (!validate()) return;

//     const payload = {
//       username: username.trim(),
//       password: password.trim(),
//     };

//     console.log('Login payload ->', payload);

//     try {
//       // The useEffect will handle the navigation and state updates based on the success/error of this call.
//       await login(payload).unwrap();
//     } catch (err) {
//       // This catch block will primarily handle errors not caught by the useLoginMutation's 'error' state
//       // or for immediate feedback if 'unwrap' throws an error.
//       // The useEffect above will still process the 'isError' state.
//       console.error('Login failed (unwrap catch):', err);
//       const errMsg = (err as any)?.data?.error || (err as any)?.data?.message || 'Invalid user credentials';
//       setSnackbarMessage(errMsg);
//       setSnackbarSeverity('error');
//       setSnackbarOpen(true);
//     }
//   };

//   const handleClickShowPassword = () => setShowPassword((show) => !show);
//   const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
//     event.preventDefault();
//   };
//   const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
//     if (reason === 'clickaway') return;
//     setSnackbarOpen(false);
//   };

//   return (
//     <Box
//       sx={{
//         fontFamily: 'Lexend, sans-serif',
//         display: 'flex',
//         flexDirection: 'column',
//         width: '100%',
//         maxWidth: '100%',
//         mx: 'auto',
//         alignItems: 'flex-start',
//         marginBlock: 'auto',
//       }}
//     >
//       <Typography
//         variant="h4"
//         sx={{
//           fontFamily: 'Lexend, sans-serif',
//           fontWeight: 600,
//           fontSize: '32px',
//           lineHeight: '36px',
//           color: '#1A212B',
//           mb: '24px',
//           width: { xs: '100%', sm: '400px' },
//           height: '36px',
//           textAlign: 'left',
//           alignSelf: 'flex-start',
//         }}
//       >
//         Login
//       </Typography>

//       <Box
//         component="form"
//         noValidate
//         onSubmit={handleSignIn}
//         sx={{
//           fontFamily: 'Lexend, sans-serif',
//           display: 'flex',
//           flexDirection: 'column',
//           width: { xs: '100%', sm: '400px' },
//         }}
//       >
//         <Typography
//           sx={{
//             fontFamily: 'Lexend, sans-serif',
//             fontSize: '12px',
//             fontWeight: 600,
//             lineHeight: '18px',
//             color: '#728197',
//             mb: '4px',
//           }}
//         >
//           Username
//         </Typography>
//         <TextField
//           variant="outlined"
//           placeholder="Enter your username"
//           type="text"
//           fullWidth
//           size="small"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           error={!!errors.username}
//           helperText={errors.username}
//           autoComplete="off"
//           sx={{ mb: '24px' }}
//         />

//         <Typography
//           sx={{
//             fontFamily: 'Lexend, sans-serif',
//             fontSize: '12px',
//             fontWeight: 500,
//             lineHeight: '18px',
//             color: '#525E6F',
//             mb: '4px',
//           }}
//         >
//           Password
//         </Typography>

//         <TextField
//           variant="outlined"
//           placeholder="••••••••"
//           type={showPassword ? 'text' : 'password'}
//           fullWidth
//           size="small"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           error={!!errors.password}
//           helperText={errors.password}
//           autoComplete="new-password"
//           InputProps={{
//             endAdornment: (
//               <InputAdornment position="end">
//                 <IconButton
//                   aria-label="toggle password visibility"
//                   onClick={handleClickShowPassword}
//                   onMouseDown={handleMouseDownPassword}
//                   edge="end"
//                   sx={{
//                     p: 0,
//                     width: '24px',
//                     height: '24px',
//                     color: '#1A212B',
//                   }}
//                 >
//                   {showPassword ? <VisibilityOff /> : <Visibility />}
//                 </IconButton>
//               </InputAdornment>
//             ),
//           }}
//           sx={{ mb: '24px' }}
//         />

//         <Box sx={{ mb: '32px', alignSelf: 'flex-start' }}>
//           <Link to="/ForgotPassword" style={{ textDecoration: 'none' }}>
//             <Typography
//               variant="caption"
//               sx={{
//                 fontFamily: 'Lexend, sans-serif',
//                 fontSize: '16px',
//                 fontWeight: 400,
//                 lineHeight: '24px',
//                 color: '#1A212B',
//                 cursor: 'pointer',
//                 whiteSpace: 'nowrap',
//                 textAlign: 'left',
//               }}
//             >
//               Forgot Password?
//             </Typography>
//           </Link>
//         </Box>

//         <Button
//           type="submit"
//           variant="contained"
//           fullWidth
//           disabled={isLoading}
//           sx={{
//             backgroundColor: '#5C17E5',
//             borderRadius: '12px',
//             height: '56px',
//             fontSize: '16px',
//             fontWeight: 500,
//             textTransform: 'none',
//             fontFamily: 'Lexend, sans-serif',
//             boxShadow: 'none',
//             color: '#FFFFFF',
//             lineHeight: '24px',
//             padding: '16px 24px',
//             '&:hover': {
//               backgroundColor: '#4a13b4',
//               boxShadow: 'none',
//             },
//           }}
//         >
//           {isLoading ? 'Logging In...' : 'Login'}
//         </Button>

//         <Box
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             width: '400px',
//             mb: '24px',
//           }}
//         >
//           <Divider sx={{ flexGrow: 1, height: '1px', backgroundColor: '#CBD4E1' }} />
//           <Typography
//             sx={{
//               fontFamily: 'Lexend, sans-serif',
//               textAlign: 'center',
//               fontWeight: 400,
//               fontSize: '14px',
//               lineHeight: '20px',
//               color: '#728197',
//               mx: '12px',
//             }}
//           >
//             or
//           </Typography>
//           <Divider sx={{ flexGrow: 1, height: '1px', backgroundColor: '#CBD4E1' }} />
//         </Box>

//         <Link
//           to="/create-password"
//           style={{ textDecoration: 'none', color: 'inherit', alignSelf: 'center' }}
//         >
//           <Box
//             sx={{
//               display: 'flex',
//               justifyContent: 'center',
//               alignItems: 'center',
//               width: '400px',
//               height: '20px',
//               gap: '8px',
//             }}
//           >
//             <Typography
//               sx={{
//                 fontFamily: 'Lexend, sans-serif',
//                 fontWeight: 400,
//                 color: '#1A212B',
//                 fontSize: '14px',
//                 lineHeight: '20px',
//               }}
//             >
//               Don't have an account?{' '}
//             </Typography>
//             <Typography
//               sx={{
//                 fontFamily: 'Lexend, sans-serif',
//                 color: '#2B80EC',
//                 fontWeight: 400,
//                 fontSize: '14px',
//                 cursor: 'pointer',
//                 lineHeight: '20px',
//                 textDecoration: 'underline',
//                 textDecorationColor: '#2B80EC',
//                 textUnderlineOffset: '2px',
//               }}
//             >
//               Sign up
//             </Typography>
//           </Box>
//         </Link>
//       </Box>

//       <Snackbar
//         open={snackbarOpen}
//         autoHideDuration={6000}
//         onClose={handleSnackbarClose}
//         anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
//       >
//         <Alert
//           onClose={handleSnackbarClose}
//           severity={snackbarSeverity}
//           sx={{ width: '100%' }}
//         >
//           {snackbarMessage}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default LoginForm;

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
import { useLoginMutation, setCredentials } from "../../../redux/slices/authSlice";
import { useDispatch } from 'react-redux';

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
    if (isSuccess && data) {
      dispatch(setCredentials(data));
      setSnackbarMessage('Login successful!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/inventory');
      }, 1000);
    } else if (isError) {
      let errorMessage = 'Login failed. Please try again.';
      if (error && 'status' in error) {
        if (error.status === 401) {
          errorMessage = 'Invalid username or password.';
        } else if (error.status === 400 && (error.data as any)?.error) {
          errorMessage = (error.data as { error?: string }).error || 'Bad Request: Unknown error.';
        } else {
          errorMessage = `Error: ${error.status}`;
        }
      } else if (error && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error('Login error (RTK):', error);
    }
  }, [isSuccess, isError, data, error, dispatch, navigate]);

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username || !username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!password || !password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      username: username.trim(),
      password: password.trim(),
    };

    console.log('Login payload ->', payload);

    try {
      await login(payload).unwrap();
    } catch (err) {
      console.error('Login failed (unwrap catch):', err);
      const errMsg = (err as any)?.data?.error || (err as any)?.data?.message || 'Invalid user credentials';
      setSnackbarMessage(errMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
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
          width: { xs: '100%', sm: '400px' },
        }}
      >
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
          Username
        </Typography>
        <TextField
          variant="outlined"
          placeholder="Enter your username"
          type="text"
          fullWidth
          size="small"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={!!errors.username}
          helperText={errors.username}
          autoComplete="off"
          sx={{ mb: '24px' }}
        />

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
          error={!!errors.password}
          helperText={errors.password}
          autoComplete="new-password"
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

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
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
          {isLoading ? 'Logging In...' : 'Login'}
        </Button>

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

        <Link
          to="/create-password"
          style={{ textDecoration: 'none', color: 'inherit', alignSelf: 'center' }}
        >
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginForm;