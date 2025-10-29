import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { StandardButton } from '../../../components/Common';
import { Customer } from '../../../redux/slices/salesApi';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../../config/constants/SalesReceipt.constants';
import {
  CustomerDetailsColumn,
  SectionRow,
  CustomerNameField,
  PhoneNoField,
  CityField,
} from '../SalesReceipt.styles';
import PlusSymbol from '../../../assets/PlusSymbol.svg';

// City options for dropdown
const cityOptions = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
  'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi'
];
// import DropDown from '../../../assets/DropDown.svg'; // Removed for standardization

interface CustomerDetailsSectionProps {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  selectedCustomer: Customer | null;
  mockCustomers: Customer[];
  onCustomerNameChange: (value: string) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onCustomerMobileChange: (value: string) => void;
  onCustomerCityChange: (value: string) => void;
  onAddNewCustomer: () => void;
}

const CustomerDetailsSection: React.FC<CustomerDetailsSectionProps> = ({
  customerName,
  customerMobile,
  customerCity,
  selectedCustomer,
  mockCustomers,
  onCustomerNameChange,
  onCustomerSelect,
  onCustomerMobileChange,
  onCustomerCityChange,
  onAddNewCustomer,
}) => {
  return (
    <CustomerDetailsColumn>
      <Box sx={{ position: 'relative', marginBottom: '8px' }}>
        <Typography sx={{ 
          fontFamily: "'Lexend', sans-serif", 
          fontWeight: 600, 
          fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_SECTION, 
          color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY
        }}>
          {SALES_RECEIPT_LABELS.CUSTOMER_DETAILS_TITLE}
        </Typography>
        <StandardButton 
          onClick={onAddNewCustomer}
          variant="primary"
          size="small"
          startIcon={<img src={PlusSymbol} alt="Plus" style={{ width: '19.5px', height: '19.5px' }} />}
          sx={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            width: '180px',
            height: '35px',
            fontSize: '12px',
            padding: '6px 16px',
          }}
        >
          {SALES_RECEIPT_LABELS.ADD_NEW_CUSTOMER_BUTTON}
        </StandardButton>
      </Box>

      <SectionRow>
        <Autocomplete<Customer, false, boolean, true>
          freeSolo
          options={mockCustomers}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
          value={selectedCustomer}
          onChange={(_, newValue) => {
            if (newValue && typeof newValue !== 'string') {
              onCustomerSelect(newValue);
            } else {
              onCustomerSelect(null);
            }
          }}
          inputValue={customerName}
          onInputChange={(_, newInputValue) => {
            onCustomerNameChange(newInputValue);
          }}
          // Only show clear button when value is selected
          {...(!selectedCustomer ? { disableClearable: true } : {})}
          forcePopupIcon
          sx={{ width: `${SALES_RECEIPT_CONSTANTS.CUSTOMER_NAME_WIDTH}px` }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={SALES_RECEIPT_LABELS.CUSTOMER_NAME_LABEL}
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.CUSTOMER_NAME_PLACEHOLDER}
              sx={{
                width: `${SALES_RECEIPT_CONSTANTS.CUSTOMER_NAME_WIDTH}px`,
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  '& fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontFamily: 'Lexend',
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#728197',
                  '&::placeholder': {
                    color: '#728197',
                    fontSize: '16px',
                    fontFamily: 'Lexend',
                    opacity: 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#728197',
                  fontFamily: 'Lexend',
                  fontSize: '14px',
                  '&.Mui-focused': {
                    color: '#5C17E5',
                  },
                },
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {typeof option === 'string' ? option : option.name}
                </Typography>
                {typeof option !== 'string' && (
                  <Typography variant="caption" sx={{ color: '#728197' }}>
                    {option.mobile} • {option.city}
                  </Typography>
                )}
              </Box>
            </li>
          )}
        />
      </SectionRow>

      <SectionRow>
        <PhoneNoField
          className="phone-no-field"
          label={SALES_RECEIPT_LABELS.MOBILE_NUMBER_LABEL}
          variant="outlined"
          placeholder={SALES_RECEIPT_LABELS.MOBILE_NUMBER_PLACEHOLDER}
          value={customerMobile}
          onChange={(e) => {
            onCustomerMobileChange(e.target.value);
            // If user manually edits, clear selected customer
            if (selectedCustomer) onCustomerSelect(null);
          }}
        />
        <Autocomplete
          options={cityOptions}
          value={customerCity}
          onChange={(_, newValue) => {
            if (newValue) {
              onCustomerCityChange(newValue);
            }
          }}
          onInputChange={(_, newInputValue) => {
            onCustomerCityChange(newInputValue);
          }}
          // Only show clear button when value is selected
          {...(!customerCity ? { disableClearable: true } : {})}
          sx={{ width: '165px' }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={SALES_RECEIPT_LABELS.CITY_LABEL}
              variant="outlined"
              placeholder={SALES_RECEIPT_LABELS.CITY_PLACEHOLDER}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  '& fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9AA8BC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 16px',
                  fontFamily: 'Lexend',
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#728197',
                  '&::placeholder': {
                    color: '#728197',
                    fontSize: '16px',
                    fontFamily: 'Lexend',
                    opacity: 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#728197',
                  fontFamily: 'Lexend',
                  fontSize: '14px',
                  '&.Mui-focused': {
                    color: '#5C17E5',
                  },
                },
              }}
            />
          )}
        />
      </SectionRow>
    </CustomerDetailsColumn>
  );
};

export default CustomerDetailsSection;

