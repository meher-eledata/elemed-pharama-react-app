import React, { useState, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  TextField,
  styled,
  IconButton
} from '@mui/material';
import TickMarkIcon from '../../assets/TickMark.svg';
import PlusSymbol from '../../assets/PlusSymbol.svg';
import DownArrow from '../../assets/DownArrow.svg';
import DropDown from '../../assets/DropDown.svg';
import { ReusableTable, TableColumn, SearchAndFilterConfig } from '../../components/PharmaTable';
import DeleteNewIcon from '../../assets/DeleteNew.svg';
import NewBoxIcon from '../../assets/NewBox.svg';
import CustomerModal from '../../components/Modal/NewCustomer/CustomerModal';

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

// --- START: FIXED/NEW STYLED COMPONENTS FOR CUSTOMER/DOCTOR SECTION ---

const CustomerDoctorSection = styled(Box)({
  display: 'flex',
  gap: '40px', // Gap between the two main columns (Customer/Doctor)
  marginTop: '16px', // Reduced from 24px to move fields up
  position: 'relative',
  paddingBottom: '16px', // Add some padding for the bottom row spacing
  // Allow sections to wrap if screen is too small
  '@media (max-width: 1200px)': {
    flexDirection: 'column',
    gap: '24px',
  },
});

const CustomerDoctorDivider = styled(Divider)({
  position: 'absolute',
  top: '0',
  bottom: '0',
  left: '47%',
  transform: 'translateX(-50%)',
  height: '100%',
  borderColor: '#D1D5DB',
  borderStyle: 'dashed',
  borderWidth: '1px',
  zIndex: 1,
  '@media (max-width: 1200px)': {
    display: 'none', // Hide vertical divider on smaller screens
  },
});

const CustomerDetailsColumn = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px', // Restored original gap
  minWidth: '400px',
  flex: '1', // Take up available space
});

const DoctorInvoiceColumn = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px', // Restored original gap
  minWidth: '400px',
  flex: '1', // Take up available space
});

const SectionRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
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
    '&:hover': {
      border: '1px solid #5C17E5',
    },
    '&.Mui-focused fieldset': {
      border: 'none',
    },
    '&.Mui-focused': {
      border: '2px solid #5C17E5',
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Lexend', sans-serif",
    fontSize: '16px',
    color: '#1A212B !important', // Force the color to be applied
    '&.Mui-focused': {
      color: '#5C17E5 !important', // Purple color when focused
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
  width: '400px',
  height: '48px',
});

const PhoneNoField = styled(StyledTextField)({
  width: '180px', // Smaller width to match image
  height: '48px',
});

const CityField = styled(StyledTextField)({
  width: '200px', // Smaller width for City dropdown to match image
  height: '48px',
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
  width: '400px',
  height: '48px',
});

const HospitalIdField = styled(StyledTextField)({
  width: '180px', // Smaller width to match image
  height: '48px',
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
  // marginLeft: '98px', // Move the Add Loyalty button more to the right
})

const PlusIcon = styled('img')({
  width: '19.5px',
  height: '19.5px',
});

const DropdownIcon = styled('img')({
  width: '16.5px',
  height: '9px',
  position: 'absolute',
  right: '16px',
  top: '16px',
  pointerEvents: 'none',
});

const InvoiceDetails = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginLeft: 'auto', // Push to the right
  minWidth: '150px',
  alignItems: 'flex-start', 
});

const InvoiceText = styled(Typography)({
  fontFamily: "'Lexend', sans-serif",
  fontSize: '14px',
  fontWeight: 400,
  color: '#1A212B',
  lineHeight: '20px',
  '&:first-of-type': {
      fontWeight: 500, // Make the label bolder
  }
});
// --- END: FIXED/NEW STYLED COMPONENTS FOR CUSTOMER/DOCTOR SECTION ---

// --- START: FINANCIAL SUMMARY SECTION STYLED COMPONENTS ---

const FinancialSummaryContainer = styled(Box)({
  width: '100%', // Full width to match table
  height: 'auto', // Auto height to accommodate content
  backgroundColor: '#E0EDFF',
  borderRadius: '12px',
  padding: '10px', // Reduced padding
  marginTop: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0px', // No gap to allow custom spacing
});

const SummaryRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
});

const SummaryFieldsGroup = styled(Box)({
  display: 'flex',
  gap: '48px', // Much larger gap between different label-input pairs
  alignItems: 'flex-start',
});

const SummaryFieldRight = styled(Box)({
  display: 'flex',
  alignItems: 'center', // Changed from flex-start to center for better alignment
  gap: '4px', // Increased gap slightly for better spacing
  minHeight: '36px', // Ensure consistent height
});

const SummaryField = styled(Box)({
  display: 'flex',
  alignItems: 'center', // Changed from flex-start to center for better alignment
  gap: '4px', // Increased gap slightly for better spacing
  minHeight: '36px', // Ensure consistent height
});

const SummaryLabel = styled(Typography)({
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 500,
  fontSize: '12px',
  lineHeight: '18px',
  color: '#728197',
  textAlign: 'left',
  width: '80px', // Fixed width for perfect alignment
  whiteSpace: 'normal',
  display: 'flex',
  alignItems: 'center', // Center the text vertically within the label area
  justifyContent: 'flex-start', // Align text to the left within the label area
});

const SummaryInput = styled('input')({
  width: '72px',
  height: '36px',
  borderRadius: '12px',
  border: '1px solid #9AA8BC',
  backgroundColor: '#FFFFFF',
  padding: '12px 16px',
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#1A212B',
  textAlign: 'left',
  outline: 'none',
  boxSizing: 'border-box',
  '&:focus': {
    borderColor: '#5C17E5',
  },
  '&:read-only': {
    cursor: 'default',
  },
});

const SummaryInputLarge = styled('input')({
  width: '96px',
  height: '36px',
  borderRadius: '12px',
  border: '1px solid #9AA8BC',
  backgroundColor: '#FFFFFF',
  padding: '12px 16px',
  fontFamily: "'Lexend', sans-serif",
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#1A212B',
  textAlign: 'left',
  outline: 'none',
  boxSizing: 'border-box',
  '&:focus': {
    borderColor: '#5C17E5',
  },
  '&:read-only': {
    cursor: 'default',
  },
});

// --- END: FINANCIAL SUMMARY SECTION STYLED COMPONENTS ---

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

// Sales Receipt Item interface
interface SalesReceiptItem {
  id: string;
  productName: string;
  manufacturer: string;
  batch: string;
  expiryDate: string;
  quantity: string;
  unitPrice: string;
  mrp: string;
  discount: string;
  discountPercent: string;
  cgst: string;
  cgstPercent: string;
  sgst: string;
  sgstPercent: string;
  igst: string;
  igstPercent: string;
  amount: string;
}

const SalesReceipt: React.FC = () => {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cash'>('cash');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc'
  });
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilterKey, setCurrentFilterKey] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<{ [key: string]: string | null }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Sample data for the sales receipt table
  const [salesItems, setSalesItems] = useState<SalesReceiptItem[]>([
    {
      id: '1',
      productName: '2-0 Mersilk Syringe',
      manufacturer: 'CENTAUR PHARMACEU...',
      batch: '2897655790...',
      expiryDate: '09/25',
      quantity: '28 Caps...',
      unitPrice: '29.03',
      mrp: '29.03',
      discount: '00.00',
      discountPercent: '0.00',
      cgst: '50.00',
      cgstPercent: '9.00',
      sgst: '50.00',
      sgstPercent: '9.00',
      igst: '50.00',
      igstPercent: '0.00',
      amount: '50.00'
    },
    {
      id: '2',
      productName: '3-0 Mersilk 90cm NW 5003 SUTURE',
      manufacturer: 'CENTAUR PHARMACEU...',
      batch: '3289765764...',
      expiryDate: '09/25',
      quantity: '3 Caps...',
      unitPrice: '19.00',
      mrp: '29.03',
      discount: '2.00',
      discountPercent: '0.00',
      cgst: '5.00',
      cgstPercent: '9.00',
      sgst: '5.00',
      sgstPercent: '9.00',
      igst: '5.00',
      igstPercent: '0.00',
      amount: '5.00'
    }
  ]);

  const handlePaymentToggle = () => {
    setPaymentMethod(paymentMethod === 'cash' ? 'credit' : 'cash');
  };

  const handleDeleteItem = (itemId: string) => {
    setSalesItems(items => items.filter(item => item.id !== itemId));
  };

  const handleEditItem = (itemId: string) => {
    console.log('Edit item:', itemId);
  };

  const handleSort = (column: string) => {
    setSortConfig(prevConfig => ({
      key: column,
      direction: prevConfig.key === column && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentSearchTerm(event.target.value);
  };

  const handleShowFiltersToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterSelect = (key: string, value: string | null) => {
    setCurrentFilterKey(key);
    setCurrentFilter(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenCustomerModal = () => {
    setIsCustomerModalOpen(true);
  };

  const handleCloseCustomerModal = () => {
    setIsCustomerModalOpen(false);
  };

  const handleCustomerSubmit = (customerData: any) => {
    console.log('Customer data submitted:', customerData);
    // Here you can add logic to save the customer data
    // For now, just logging the data
  };

  // Table columns configuration
  const columns: TableColumn<SalesReceiptItem>[] = [
    {
      key: 'productName',
      header: 'Product Name',
      sortable: true,
      render: (item) => (
        <Box>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
            {item.productName}
          </Typography>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#728197' }}>
            Mfg: {item.manufacturer}
          </Typography>
        </Box>
      )
    },
    {
      key: 'batch',
      header: 'Batch',
      render: (item) => (
        <Box>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
            {item.batch}
          </Typography>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#728197' }}>
            Exp: {item.expiryDate}
          </Typography>
        </Box>
      )
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (item) => (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          {item.quantity}
        </Typography>
      )
    },
    {
      key: 'unitPrice',
      header: 'Unit/Price',
      render: (item) => (
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
            Rs. {item.unitPrice}
          </Typography>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#728197' }}>
            MRP: {item.mrp}
          </Typography>
        </Box>
      )
    },
    {
      key: 'discount',
      header: 'Dis',
      render: (item) => (
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
            Rs. {item.discount}
          </Typography>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#728197' }}>
            {item.discountPercent}%
          </Typography>
        </Box>
      )
    },
    {
      key: 'cgst',
      header: 'CGST',
      render: (item) => (
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
            {item.cgst}
          </Typography>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#728197' }}>
            {item.cgstPercent}%
          </Typography>
        </Box>
      )
    },
    {
      key: 'sgst',
      header: 'SGST',
      render: (item) => (
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
            {item.sgst}
          </Typography>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#728197' }}>
            {item.sgstPercent}%
          </Typography>
        </Box>
      )
    },
    {
      key: 'igst',
      header: 'IGST',
      render: (item) => (
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
            {item.igst}
          </Typography>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#728197' }}>
            {item.igstPercent}%
          </Typography>
        </Box>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item) => (
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
            {item.amount}
          </Typography>
        </Box>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (item) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <IconButton onClick={() => handleDeleteItem(item.id)} sx={{ padding: '4px' }}>
            <img src={DeleteNewIcon} alt="Delete" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton onClick={() => handleEditItem(item.id)} sx={{ padding: '4px' }}>
            <img src={NewBoxIcon} alt="Edit" style={{ width: '16px', height: '16px' }} />
          </IconButton>
        </Box>
      )
    }
  ];

  const searchAndFilterConfig: SearchAndFilterConfig = {
    filterOptions: []
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
      <CustomerDoctorSection>
        {/* Vertical divider separating the two main columns */}
        <CustomerDoctorDivider orientation="vertical" />

        {/* Customer Details Column */}
        <CustomerDetailsColumn>
          {/* Customer Row 1 */}
          <SectionRow>
            <CustomerNameField
              label="Customer Name"
              variant="outlined"
              placeholder="Customer Name"
            />
            <AddButton onClick={handleOpenCustomerModal}>
              <PlusIcon src={PlusSymbol} alt="Plus" />
              Add Customer
            </AddButton>
          </SectionRow>

          {/* Customer Row 2 */}
          <SectionRow>
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
          </SectionRow>
        </CustomerDetailsColumn>

        {/* Doctor and Invoice Column */}
        {/* <CustomerDoctorDivider orientation="vertical" /> */}
        <DoctorInvoiceColumn>
          {/* Doctor/Invoice Row 1 */}
          {/* <CustomerDoctorDivider orientation="vertical" /> */}
          <SectionRow>
            <DoctorNameField
              label="Doctor Name"
              variant="outlined"
              placeholder="Doctor Name"
            />
            {/* <CustomerDoctorDivider orientation="vertical" /> */}
            <InvoiceDetails>
              <InvoiceText>Invoice No :</InvoiceText>
              <InvoiceText>786889090556</InvoiceText>
            </InvoiceDetails>
          </SectionRow>

          {/* Doctor/Invoice Row 2 */}
          <SectionRow>
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
            <CustomerDoctorDivider orientation="vertical" />
            <InvoiceDetails>
              <InvoiceText>Invoice Date :</InvoiceText>
              <InvoiceText>15 Aug 2025</InvoiceText>
            </InvoiceDetails>
          </SectionRow>
        </DoctorInvoiceColumn>
      </CustomerDoctorSection>

      {/* Sales Receipt Table */}
      <Box sx={{ marginTop: '32px' }}>
        <ReusableTable
          columns={columns}
          data={salesItems}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          emptyMessage="No sales items found"
          searchAndFilterConfig={searchAndFilterConfig}
          currentSearchTerm={currentSearchTerm}
          onSearchChange={handleSearchChange}
          showFilters={showFilters}
          onShowFiltersToggle={handleShowFiltersToggle}
          currentFilterKey={currentFilterKey}
          onFilterSelect={handleFilterSelect}
          totalRows={salesItems.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSort}
          sortConfig={sortConfig}
          currentFilter={currentFilter}
        />
      </Box>

      {/* No. Of. Copies Dropdown */}
      <Box sx={{ marginTop: '24px', marginBottom: '24px' }}>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <StyledTextField
            label="No. Of. Copies"
            variant="outlined"
            placeholder=""
            sx={{ 
              width: '206px', 
              height: '40px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #9AA8BC',
                padding: '12px 40px 12px 16px',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  border: '1px solid #9AA8BC',
                },
              },
              '& .MuiInputLabel-root': {
                fontFamily: "'Lexend', sans-serif",
                fontSize: '14px',
                color: '#728197',
                '&.Mui-focused': {
                  color: '#728197',
                },
              },
              '& .MuiInputBase-input': {
                fontFamily: "'Lexend', sans-serif",
                fontSize: '14px',
                color: '#1A212B',
                padding: '0',
              },
            }}
          />
          <DropdownIcon src={DropDown} alt="Dropdown" />
        </Box>
      </Box>

      {/* Financial Summary Section */}
      <FinancialSummaryContainer>
        {/* First Row */}
        <SummaryRow>
          <SummaryFieldsGroup>
            <SummaryField>
              <SummaryLabel>Out Standing (Rs)</SummaryLabel>
              <SummaryInput value="0.0" readOnly />
            </SummaryField>
            <SummaryField>
              <SummaryLabel>Avl. Loyal Points</SummaryLabel>
              <SummaryInput value="0.0" readOnly />
            </SummaryField>
            <SummaryField>
              <SummaryLabel>Redeemable (Rs)</SummaryLabel>
              <SummaryInput value="0.0" readOnly />
            </SummaryField>
            <SummaryField>
              <SummaryLabel>Disc (Rs)</SummaryLabel>
              <SummaryInput value="0.0" readOnly />
            </SummaryField>
          </SummaryFieldsGroup>
          <SummaryFieldRight>
            <SummaryLabel>Sub Total (Rs)</SummaryLabel>
            <SummaryInputLarge value="0.0" readOnly />
          </SummaryFieldRight>
        </SummaryRow>

        {/* Horizontal Divider */}
        <Box sx={{ 
          width: '100%', 
          height: '1px', 
          backgroundColor: '#7281974D', 
          margin: '16px 0',
          opacity: 0.8
        }} />

        {/* Second Row */}
        <SummaryRow>
          <SummaryFieldsGroup>
            <SummaryField>
              <SummaryLabel>Tax (Rs)</SummaryLabel>
              <SummaryInput value="0.0" readOnly />
            </SummaryField>
            <SummaryField>
              <SummaryLabel>Loyalty Applied (Rs)</SummaryLabel>
              <SummaryInput value="0.0" readOnly />
            </SummaryField>
            <SummaryField>
              <SummaryLabel>Round Off (Rs)</SummaryLabel>
              <SummaryInput value="0.0" readOnly />
            </SummaryField>
            <SummaryField>
              <SummaryLabel>Disc (%)</SummaryLabel>
              <SummaryInput value="0.0" readOnly />
            </SummaryField>
          </SummaryFieldsGroup>
          <SummaryFieldRight>
            <SummaryLabel>Net Amount (Rs)</SummaryLabel>
            <SummaryInputLarge value="0.0" readOnly />
          </SummaryFieldRight>
        </SummaryRow>
      </FinancialSummaryContainer>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={handleCloseCustomerModal}
        onSubmit={handleCustomerSubmit}
      />
    </SalesReceiptContainer>
  );
};

export default SalesReceipt;