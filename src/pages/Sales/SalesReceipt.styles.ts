import { styled } from '@mui/material';
import { Box, Typography, Button, Divider, TextField } from '@mui/material';
import { SALES_RECEIPT_CONSTANTS } from '../../config/constants/SalesReceipt.constants';

// Main Container
export const SalesReceiptContainer = styled(Box)({
  padding: '20px',
  backgroundColor: '#FFFFFF',
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100vw',
  overflowX: 'hidden',
  overflowY: 'visible',
  boxSizing: 'border-box',
  position: 'relative',
});

// Header Components
export const SalesReceiptHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '32px',
  width: '100%',
  '@media (max-width: 768px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
  },
});

export const LeftSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
});

export const SalesReceiptTitle = styled(Typography)({
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 600,
  fontSize: '36px',
  lineHeight: '40px',
  color: '#1A212B',
  margin: 0,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  marginTop: '-8px',
  '@media (max-width: 768px)': {
    fontSize: '28px',
    lineHeight: '32px',
  },
});

export const SectionButton = styled(Button)({
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '24px',
  backgroundColor: '#5C17E5',
  color: '#FFFFFF',
  borderRadius: '8px',
  padding: '8px 16px',
  textTransform: 'none',
  minWidth: '120px',
  height: '40px',
  '&:hover': {
    backgroundColor: '#4C14C7',
  },
});

export const HorizontalDivider = styled(Divider)({
  width: '100%',
  borderColor: '#D1D5DB',
  borderStyle: 'dashed',
  borderWidth: '1px',
  margin: '20px 0',
});

// Section Layout Components
export const CustomerDoctorSection = styled(Box)({
  display: 'flex',
  gap: '40px',
  marginTop: '24px',
  position: 'relative',
  paddingBottom: '24px',
  '@media (max-width: 1200px)': {
    flexDirection: 'column',
    gap: '32px',
  },
});

export const CustomerDetailsColumn = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  minWidth: '380px',
  flex: '1',
  position: 'relative',
});

export const DoctorInvoiceColumn = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  minWidth: '380px',
  flex: '1',
});

export const PaymentDetailsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  minWidth: '380px',
  flex: '1',
  marginLeft: '0px',
});

export const SectionRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'nowrap',
  justifyContent: 'flex-start',
  marginBottom: '0px',
});

// Text Field Components
export const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    height: '48px',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF !important',
    '& fieldset': {
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
    },
    '&:hover fieldset': {
      border: '1px solid #5C17E5',
      borderRadius: '8px',
    },
    '&:hover': {
      backgroundColor: '#FFFFFF !important',
    },
    '&.Mui-focused fieldset': {
      border: '2px solid #5C17E5',
      borderRadius: '8px',
    },
    '&.Mui-focused': {
      backgroundColor: '#FFFFFF !important',
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B !important',
    transform: 'translate(14px, 12px) scale(1)', // Center the label properly for 48px height
    '&.Mui-focused': {
      color: '#5C17E5 !important',
    },
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)', // Correct position when shrunk
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF !important',
    '&::placeholder': {
      color: '#728197',
      fontSize: '16px',
      fontFamily: "'Lexend', sans-serif",
      opacity: 1,
    },
  },
});

export const CustomerNameField = styled(StyledTextField)({
  width: '350px',
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B !important',
    '&.Mui-focused': {
      color: '#5C17E5 !important',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF !important',
    '&::placeholder': {
      color: '#728197',
      fontSize: '16px',
      fontFamily: "'Lexend', sans-serif",
      opacity: 1,
    },
  },
});

export const PhoneNoField = styled(StyledTextField)({
  width: '165px',
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B !important',
    '&.Mui-focused': {
      color: '#5C17E5 !important',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF !important',
    '&::placeholder': {
      color: '#728197',
      fontSize: '16px',
      fontFamily: "'Lexend', sans-serif",
      opacity: 1,
    },
  },
});

export const CityField = styled(StyledTextField)({
  width: '165px',
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B !important',
    '&.Mui-focused': {
      color: '#5C17E5 !important',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF !important',
    '&::placeholder': {
      color: '#728197',
      fontSize: '16px',
      fontFamily: "'Lexend', sans-serif",
      opacity: 1,
    },
  },
});

export const DoctorNameField = styled(StyledTextField)({
  width: '350px',
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B !important',
    '&.Mui-focused': {
      color: '#5C17E5 !important',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF !important',
    '&::placeholder': {
      color: '#728197',
      fontSize: '16px',
      fontFamily: "'Lexend', sans-serif",
      opacity: 1,
    },
  },
});

export const HospitalIdField = styled(StyledTextField)({
  width: '165px',
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B !important',
    '&.Mui-focused': {
      color: '#5C17E5 !important',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF !important',
    '&::placeholder': {
      color: '#728197',
      fontSize: '16px',
      fontFamily: "'Lexend', sans-serif",
      opacity: 1,
    },
  },
});

export const InsuranceField = styled(StyledTextField)({
  width: '275px',
  marginTop: "-11px",
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B !important',
    '&.Mui-focused': {
      color: '#5C17E5 !important',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF !important',
    '&::placeholder': {
      color: '#728197',
      fontSize: '16px',
      fontFamily: "'Lexend', sans-serif",
      opacity: 1,
    },
  },
});

// Button Components
export const AddButton = styled(Button)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: "'Lexend', sans-serif",
  fontSize: '12px',
  fontWeight: 500,
  color: '#FFFFFF',
  backgroundColor: '#5C17E5',
  border: 'none',
  padding: '12px 16px',
  borderRadius: '5px',
  textTransform: 'none',
  width: "180px",
  position: 'absolute',
  top: '0px',
  right: '0px',
  justifyContent: 'center',
  height: '35px',
  '&:hover': {
    backgroundColor: '#4C14C7',
  },
});

export const PlusIcon = styled('img')({
  width: '19.5px',
  height: '19.5px',
});

// Financial Summary Components
export const FinancialSummaryContainer = styled(Box)({
  width: '100%',
  height: 'auto',
  backgroundColor: SALES_RECEIPT_CONSTANTS.SUMMARY_BACKGROUND,
  borderRadius: SALES_RECEIPT_CONSTANTS.BORDER_RADIUS_MEDIUM,
  padding: '10px',
  marginTop: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0px',
});

export const SummaryRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
});

export const SummaryFieldsGroup = styled(Box)({
  display: 'flex',
  gap: SALES_RECEIPT_CONSTANTS.SUMMARY_FIELDS_GAP,
  alignItems: 'flex-start',
});

export const SummaryFieldRight = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: SALES_RECEIPT_CONSTANTS.SUMMARY_FIELD_GAP,
  minHeight: SALES_RECEIPT_CONSTANTS.SUMMARY_INPUT_HEIGHT,
});

export const SummaryField = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: SALES_RECEIPT_CONSTANTS.SUMMARY_FIELD_GAP,
  minHeight: SALES_RECEIPT_CONSTANTS.SUMMARY_INPUT_HEIGHT,
});

export const SummaryLabel = styled(Typography)({
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 500,
  fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_LABEL,
  lineHeight: '18px',
  color: SALES_RECEIPT_CONSTANTS.TEXT_SECONDARY,
  textAlign: 'left',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
});

export const SummaryInput = styled('input')({
  width: SALES_RECEIPT_CONSTANTS.SUMMARY_INPUT_WIDTH,
  height: SALES_RECEIPT_CONSTANTS.SUMMARY_INPUT_HEIGHT,
  borderRadius: SALES_RECEIPT_CONSTANTS.BORDER_RADIUS_MEDIUM,
  border: '1px solid #9AA8BC',
  backgroundColor: '#FFFFFF',
  padding: '12px 16px',
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 400,
  fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_INPUT,
  lineHeight: '24px',
  color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY,
  textAlign: 'left',
  outline: 'none',
  boxSizing: 'border-box',
  '&:focus': {
    borderColor: SALES_RECEIPT_CONSTANTS.PRIMARY_COLOR,
  },
  '&:read-only': {
    cursor: 'default',
  },
});

export const SummaryInputLarge = styled('input')({
  width: SALES_RECEIPT_CONSTANTS.SUMMARY_INPUT_LARGE_WIDTH,
  height: SALES_RECEIPT_CONSTANTS.SUMMARY_INPUT_HEIGHT,
  borderRadius: SALES_RECEIPT_CONSTANTS.BORDER_RADIUS_MEDIUM,
  border: '1px solid #9AA8BC',
  backgroundColor: '#FFFFFF',
  padding: '12px 16px',
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 400,
  fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_INPUT,
  lineHeight: '24px',
  color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY,
  textAlign: 'left',
  outline: 'none',
  boxSizing: 'border-box',
  '&:focus': {
    borderColor: SALES_RECEIPT_CONSTANTS.PRIMARY_COLOR,
  },
  '&:read-only': {
    cursor: 'default',
  },
});

// Action Buttons
export const SaveButton = styled(Button)({
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '24px',
  borderRadius: '12px',
  padding: '12px 16px',
  height: '48px',
  textTransform: 'none',
  minWidth: '71px',
  border: '2px solid #D1D5DB',
  color: '#374151',
  backgroundColor: '#FFFFFF',
  '&:hover': {
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
});

export const CancelButton = styled(Button)({
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '24px',
  borderRadius: '12px',
  padding: '12px 16px',
  height: '48px',
  textTransform: 'none',
  minWidth: '86px',
  border: '2px solid #D1D5DB',
  color: '#374151',
  backgroundColor: '#FFFFFF',
  '&:hover': {
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
});

