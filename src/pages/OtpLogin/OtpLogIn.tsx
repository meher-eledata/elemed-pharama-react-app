
// import React, { useState } from 'react';
// import {
//   Box,
//   Alert,
//   IconButton,
//   Typography,
//   Link,
//   Button,
//   TextField,
// } from '@mui/material';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import CloseIcon from '@mui/icons-material/Close';

// const OtpLogin: React.FC = () => {
//   const [showSuccess, setShowSuccess] = useState(true);
//   const [otp, setOtp] = useState('');
//   const [otpError, setOtpError] = useState('');
//   const [touched, setTouched] = useState(false);

//   const validateOtp = (value: string) => {
//     if (!value) return 'OTP is required';
//     if (!/^\d{6}$/.test(value)) return 'OTP must be exactly 6 digits';
//     return '';
//   };

//   return (
//     <Box
//       className="otp-container"
//       sx={{
//         display: 'flex',
//         flexDirection: 'column',
//         gap: '25px',
//       }}
//     >
//       {showSuccess && (
//         <Alert
//           icon={<CheckCircleIcon fontSize="inherit" />}
//           severity="success"
//           sx={{
//             bgcolor: '#e6f7ec',
//             color: '#1b5e20',
//             fontWeight: 600,
//             mb: 3,
//             px: 2,
//             py: 1,
//             borderRadius: 2,
//             alignItems: 'center',
//             display: 'flex',
//             justifyContent: 'space-between',
//             width: '100%',
//             maxWidth: 400,
//           }}
//           action={
//             <IconButton
//               size="small"
//               onClick={() => setShowSuccess(false)}
//               sx={{ color: '#1b5e20' }}
//             >
//               <CloseIcon fontSize="small" />
//             </IconButton>
//           }
//         >
//           OTP Sent Successfully
//         </Alert>
//       )}

//       <Typography
//         variant="h4"
//         sx={{
//           fontFamily: 'Lexend',
//           fontWeight: 600,
//           fontSize: '32px',
//           lineHeight: '36px',
//           color: '#1A212B',
//         }}
//       >
//         Enter Email OTP
//       </Typography>

//       <Typography
//         sx={{
//           fontFamily: 'Lexend',
//           fontWeight: 400,
//           fontSize: '14px',
//           lineHeight: '20px',
//           color: '#1A212B',
//         }}
//       >
//         It&apos;s a simple 2 step verification. Enter your 6 digit code sent to your registered email
//       </Typography>

//       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
//         <Typography
//           sx={{
//             fontFamily: 'Lexend',
//             fontWeight: 400,
//             fontSize: '14px',
//             lineHeight: '20px',
//             color: '#1A212B',
//           }}
//         >
//           Enter OTP
//         </Typography>

//         <TextField
//           variant="outlined"
//           value={otp}
//           onChange={(e) => {
//             const val = e.target.value;
//             if (/^\d{0,6}$/.test(val)) {
//               setOtp(val);
//               if (touched) setOtpError(validateOtp(val));
//             }
//           }}
//           onBlur={() => {
//             setTouched(true);
//             setOtpError(validateOtp(otp));
//           }}
//           error={!!otpError}
//           helperText={otpError}
//           fullWidth
//           sx={{
//             '& .MuiOutlinedInput-root': {
//               borderRadius: '12px',
//               height: '48px',
//               padding: '12px 16px',
//               '&.Mui-error .MuiOutlinedInput-notchedOutline': {
//                 borderColor: '#9AA8BC', // override default red border
//               },
//             },
//             '& .MuiOutlinedInput-notchedOutline': {
//               borderColor: '#9AA8BC',
//             },
//             '& .MuiInputBase-input': {
//               color: '#1A212B',
//               fontSize: '16px',
//               fontWeight: 400,
//             },
//             '& .MuiFormHelperText-root.Mui-error': {
//               color: '#E36414', // custom non-red error text
//               fontSize: '12px',
//               fontWeight: 400,
//             },
//           }}
//         />
//       </Box>

//       <Box
//         sx={{
//           width: '398px',
//           height: '24px',
//           display: 'flex',
//           alignItems: 'center',
//           gap: '4px',
//         }}
//       >
//         <Typography
//           variant="body2"
//           sx={{
//             fontFamily: 'Lexend',
//             fontWeight: 400,
//             fontSize: '16px',
//             lineHeight: '24px',
//             color: '#1A212B',
//           }}
//         >
//           Hoops! you didn’t receive OTP yet?
//         </Typography>
//         <Link
//           href="#"
//           underline="none"
//           sx={{
//             fontFamily: 'Lexend',
//             fontWeight: 400,
//             fontSize: '16px',
//             lineHeight: '24px',
//             color: '#4A00E8',
//           }}
//         >
//           Resend OTP
//         </Link>
//       </Box>

//       <Button
//         variant="contained"
//         disabled={!!validateOtp(otp)}
//         sx={{
//           width: '400px',
//           height: '56px',
//           backgroundColor: '#5C17E5',
//           borderRadius: '12px',
//           padding: '16px 24px',
//           textTransform: 'none',
//           fontFamily: 'Lexend',
//           fontWeight: 500,
//           fontSize: '16px',
//           lineHeight: '24px',
//           boxShadow: 'none',
//           '&:hover': {
//             backgroundColor: '#4A00E8',
//           },
//           '&.Mui-disabled': {
//             backgroundColor: '#ccc',
//             color: '#888',
//           },
//         }}
//       >
//         Login
//       </Button>

//       <Box
//         sx={{
//           width: '400px',
//           height: '20px',
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           gap: '4px',
//           mt: 2,
//         }}
//       >
//         <Typography
//           variant="body2"
//           sx={{
//             fontFamily: 'Lexend',
//             fontWeight: 400,
//             fontSize: '14px',
//             lineHeight: '20px',
//             color: '#1A212B',
//           }}
//         >
//           Already have an account?
//         </Typography>
//         <Link
//           href="#"
//           underline="none"
//           sx={{
//             fontFamily: 'Lexend',
//             fontWeight: 400,
//             fontSize: '14px',
//             lineHeight: '20px',
//             color: '#5C17E5',
//           }}
//         >
//           Sign In
//         </Link>
//       </Box>
//     </Box>
//   );
// };

// export default OtpLogin;
