import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  TextField,
  styled
} from '@mui/material';
import TickMarkIcon from '../../assets/TickMark.svg';
import PlusSymbol from '../../assets/PlusSymbol.svg';
import DownArrow from '../../assets/DownArrow.svg';

// Styled components
const SalesReceiptContainer = styled(Box)({
  padding: '20px',
  backgroundColor: '#FFFFFF',
  minHeight: '100vh',
});

const SalesReceiptHeader = styled(Box)({
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

const LeftSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
});

const RightSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexShrink: 0,
});

const SalesReceiptTitle = styled(Typography)({
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 600,
  fontSize: '36px',
  lineHeight: '40px',
  color: '#1A212B',
  margin: 0,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  marginTop: '-8px', // Move text up to align with other elements
  '@media (max-width: 768px)': {
    fontSize: '28px',
    lineHeight: '32px',
  },
});

const PaymentToggleContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
});

const PaymentLabels = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginLeft: '8px',
});

const PaymentLabel = styled(Typography)<{ active?: boolean }>(({ active }) => ({
  fontFamily: "'Lexend', sans-serif",
  fontWeight: active ? 700 : 400,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#1A212B', // Both labels are dark gray/black
}));

const HeaderDivider = styled(Divider)({
  flexShrink: 0,
  borderColor: '#E5E7EB',
  borderStyle: 'dashed',
  borderWidth: '1px',
  height: '40px',
  margin: '0 24px',
  '@media (max-width: 768px)': {
    display: 'none',
  },
});

const HorizontalDivider = styled(Divider)({
  width: '100%',
  borderColor: '#D1D5DB',
  borderStyle: 'dashed',
  borderWidth: '1px',
  margin: '20px 0',
});

// Customer and Doctor Details Section
const CustomerDoctorSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '0px',
  marginTop: '24px',
});

const InputRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    '& fieldset': {
      border: 'none',
    },
    '&:hover fieldset': {
      border: 'none',
    },
    '&.Mui-focused fieldset': {
      border: '1px solid #D1D5DB', // Keep same border color when focused
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B !important', // Force the color to be applied
    '&.Mui-focused': {
      color: '#1A212B !important', // Keep same color when focused
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B',
    padding: '12px 16px',
  },
});

const CustomerNameField = styled(StyledTextField)({
  width: '440px',
  height: '62px',
});

const PhoneNoField = styled(StyledTextField)({
  width: '212px',
  height: '40px',
});

const CityField = styled(StyledTextField)({
  width: '206px',
  height: '40px',
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#728197 !important', // Different color for City fields
    '&.Mui-focused': {
      color: '#728197 !important', // Keep same color when focused
    },
  },
});

const DoctorNameField = styled(StyledTextField)({
  width: '440px',
  height: '62px',
  marginLeft: '16px',
});

const HospitalIdField = styled(StyledTextField)({
  width: '212px',
  height: '40px',
  marginLeft: '31px',
});

const AddButton = styled(Button)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: "'Lexend', sans-serif",
  fontSize: '16px',
  fontWeight: 500,
  color: '#1A212B',
  backgroundColor: 'transparent',
  border: 'none',
  padding: '12px 16px',
  borderRadius: '12px',
  textTransform: 'none',
  minWidth: '150px', // Fixed width to match both buttons
  justifyContent: 'flex-start',
  '&:hover': {
    backgroundColor: '#F3F4F6',
  },
});

const AddLoyaltyButton = styled(AddButton)({
  marginLeft: '8px', // Move Add Loyalty button to the right
});

const PlusIcon = styled('img')({
  width: '19.5px',
  height: '19.5px',
});

const DropdownIcon = styled('img')({
  width: '16.5px',
  height: '9px',
  position: 'absolute',
  right: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
});

const InvoiceDetails = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginLeft: 'auto',
});

const InvoiceText = styled(Typography)({
  fontFamily: "'Lexend', sans-serif",
  fontSize: '14px',
  fontWeight: 400,
  color: '#1A212B',
  lineHeight: '20px',
});

const VerticalDivider = styled(Box)({
  position: 'absolute',
  left: 'calc(50% - 50px)', // Move a little bit back to the left
  top: '0',
  bottom: '0',
  width: '1px',
  borderLeft: '1px dashed #D1D5DB',
  zIndex: 1,
});

const ActionButtons = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexShrink: 0,
  '@media (max-width: 768px)': {
    width: '100%',
    justifyContent: 'flex-end',
  },
  '@media (max-width: 480px)': {
    flexDirection: 'column',
    width: '100%',
    gap: '8px',
  },
});

const StyledButton = styled(Button)({
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '24px',
  borderRadius: '12px',
  padding: '12px 16px',
  height: '48px',
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
  '@media (max-width: 480px)': {
    width: '100%',
    minWidth: 'unset',
  },
});

const SaveButton = styled(StyledButton)({
  minWidth: '71px',
  border: '2px solid #D1D5DB',
  color: '#374151',
  backgroundColor: '#FFFFFF',
  '&:hover': {
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
});

const CancelButton = styled(StyledButton)({
  minWidth: '86px',
  border: '2px solid #D1D5DB',
  color: '#374151',
  backgroundColor: '#FFFFFF',
  '&:hover': {
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
});

const PrintButton = styled(StyledButton)({
  minWidth: '106px',
  backgroundColor: '#5C17E5',
  color: '#FFFFFF',
  border: 'none',
  '&:hover': {
    backgroundColor: '#4C14C7',
  },
  '& .MuiButton-startIcon': {
    marginRight: '8px',
    '& .MuiSvgIcon-root': {
      fontSize: '20px',
    },
  },
});

// Custom Toggle Component
const CustomToggle = styled(Box)<{ active: boolean }>(({ active }) => ({
  position: 'relative',
  width: '36px',
  height: '20px',
  backgroundColor: '#5C17E5', // Always purple background
  borderRadius: '10px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: '2px',
  transition: 'all 0.2s ease-in-out',
}));

const ToggleThumb = styled(Box)<{ active: boolean }>(({ active }) => ({
  position: 'absolute',
  width: '16px',
  height: '16px',
  backgroundColor: '#FFFFFF',
  borderRadius: '50%',
  transition: 'all 0.2s ease-in-out',
  left: active ? 'calc(100% - 18px)' : '2px', // Always on right for Cash
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const SalesReceipt: React.FC = () => {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cash'>('cash');

  const handlePaymentToggle = () => {
    setPaymentMethod(paymentMethod === 'cash' ? 'credit' : 'cash');
  };

  return (
    <SalesReceiptContainer>
      <SalesReceiptHeader>
        {/* Left Section - Title, Divider, and Toggle */}
        <LeftSection>
          <SalesReceiptTitle variant="h1">
            Sale Receipt
          </SalesReceiptTitle>
          
          <HeaderDivider orientation="vertical" flexItem />

          <PaymentToggleContainer>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PaymentLabel 
                variant="body1" 
                active={paymentMethod === 'credit'}
              >
                Credit
              </PaymentLabel>
              <CustomToggle 
                active={paymentMethod === 'cash'} 
                onClick={handlePaymentToggle}
              >
                <ToggleThumb active={paymentMethod === 'cash'} />
              </CustomToggle>
              <PaymentLabel 
                variant="body1" 
                active={paymentMethod === 'cash'}
              >
                Cash
              </PaymentLabel>
            </Box>
          </PaymentToggleContainer>
        </LeftSection>

        {/* Right Section - Action Buttons */}
        <RightSection>
          <SaveButton variant="outlined">
            Save
          </SaveButton>

          <CancelButton variant="outlined">
            Cancel
          </CancelButton>

          <PrintButton 
            variant="contained"
            startIcon={<img src={TickMarkIcon} alt="Tick Mark" style={{ width: '20px', height: '20px' }} />}
          >
            Print
          </PrintButton>
        </RightSection>
      </SalesReceiptHeader>

      {/* Horizontal Dashed Divider */}
      <HorizontalDivider />

      {/* Customer and Doctor Details Section */}
      <CustomerDoctorSection sx={{ position: 'relative' }}>
        {/* Single Vertical Divider spanning both rows */}
        <VerticalDivider />
        
        {/* First Row */}
        <InputRow>
          <CustomerNameField
            label="Customer Name"
            variant="outlined"
            placeholder="Customer Name"
          />
          <AddButton>
            <PlusIcon src={PlusSymbol} alt="Plus" />
            Add Customer
          </AddButton>
          <DoctorNameField
            label="Doctor Name"
            variant="outlined"
            placeholder="Doctor Name"
          />
          <InvoiceDetails>
            <InvoiceText>Invoice No :</InvoiceText>
            <InvoiceText>786889090556</InvoiceText>
          </InvoiceDetails>
        </InputRow>

        {/* Second Row */}
        <InputRow>
          <PhoneNoField
            label="Phone No"
            variant="outlined"
            placeholder="Phone No"
          />
          <Box sx={{ position: 'relative' }}>
            <CityField
              label="City"
              variant="outlined"
              placeholder="City"
            />
            <DropdownIcon src={DownArrow} alt="Dropdown" />
          </Box>
          <AddLoyaltyButton>
            <PlusIcon src={PlusSymbol} alt="Plus" />
            Add Loyalty
          </AddLoyaltyButton>
          <HospitalIdField
            label="Hospital ID"
            variant="outlined"
            placeholder="Hospital ID"
          />
          <Box sx={{ position: 'relative' }}>
            <CityField
              label="City"
              variant="outlined"
              placeholder="City"
            />
            <DropdownIcon src={DownArrow} alt="Dropdown" />
          </Box>
          <InvoiceDetails>
            <InvoiceText>Invoice Date :</InvoiceText>
            <InvoiceText>15 Aug 2025</InvoiceText>
          </InvoiceDetails>
        </InputRow>
      </CustomerDoctorSection>
    </SalesReceiptContainer>
  );
};

export default SalesReceipt;
