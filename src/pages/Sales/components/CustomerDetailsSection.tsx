import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
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
  customerNames: string[]; // Customer names from /sales/get-all-customer-names endpoint
  availablePhones?: string[]; // Phone numbers from /sales/get-customer-phones/ endpoint
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
  customerNames,
  availablePhones = [],
  onCustomerNameChange,
  onCustomerSelect,
  onCustomerMobileChange,
  onCustomerCityChange,
  onAddNewCustomer,
}) => {
  return (
    <CustomerDetailsColumn>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '8px',
        gap: '12px'
      }}>
        <Typography sx={{ 
          fontFamily: "'Lexend', sans-serif", 
          fontWeight: 600, 
          fontSize: SALES_RECEIPT_CONSTANTS.FONT_SIZE_SECTION, 
          color: SALES_RECEIPT_CONSTANTS.TEXT_PRIMARY,
          marginBottom: 0
        }}>
          {SALES_RECEIPT_LABELS.CUSTOMER_DETAILS_TITLE}
        </Typography>
        <StandardButton 
          onClick={onAddNewCustomer}
          variant="primary"
          size="small"
          startIcon={<AddIcon sx={{ color: '#FFFFFF', fontSize: '19.5px' }} />}
          sx={{
            width: '180px',
            height: '35px',
            fontSize: '12px',
            padding: '6px 16px',
            flexShrink: 0,
            marginLeft: '20px',
          }}
        >
          {SALES_RECEIPT_LABELS.ADD_NEW_CUSTOMER_BUTTON}
        </StandardButton>
      </Box>

      <SectionRow>
        <Autocomplete<string, false, boolean, true>
          freeSolo
          options={customerNames} // Customer names from /sales/get-all-customer-names endpoint
          getOptionLabel={(option) => option}
          value={customerName || ''}
          isOptionEqualToValue={(option, value) => option === value}
          onChange={(_, newValue) => {
            // Handle string (customer name) - this fires when selecting from dropdown
            const nameValue = typeof newValue === 'string' ? newValue : '';
            if (nameValue) {
              // Clear the selected customer first - let the hook fetch phone and set it properly
              onCustomerSelect(null);
              // Clear mobile to trigger phone fetch from API
              onCustomerMobileChange('');
              // Update the name - this will trigger useCustomerPhones hook to fetch phone from /sales/get-customer-phones/
              onCustomerNameChange(nameValue);
            } else {
              // User cleared the field
              onCustomerNameChange('');
              onCustomerSelect(null);
              onCustomerMobileChange('');
            }
          }}
          onInputChange={(_, newInputValue, reason) => {
            // Only update when user is typing (not when selecting from dropdown)
            // reason: 'input' = typing, 'reset' = cleared, 'clear' = clear button
            if (reason === 'input') {
              onCustomerNameChange(newInputValue);
              // If user types something different, clear selection
              if (selectedCustomer && newInputValue !== selectedCustomer.name) {
                onCustomerSelect(null);
                onCustomerMobileChange('');
              }
            }
          }}
          // Only show clear button when value is present
          disableClearable={!customerName}
          forcePopupIcon
          popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
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
                  borderRadius: '8px',
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
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  '&::placeholder': {
                    color: '#728197',
                    fontSize: '16px',
                    fontFamily: "'Lexend', sans-serif",
                    opacity: 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  '&.Mui-focused': {
                    color: '#5C17E5',
                  },
                },
              }}
            />
          )}
          renderOption={(props, option, index) => {
            const { key, ...otherProps } = props;
            // Use combination of option and index to ensure unique keys
            return (
              <li key={`${option}-${index}`} {...otherProps}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option}
                  </Typography>
                </Box>
              </li>
            );
          }}
        />
      </SectionRow>

      <SectionRow>
        {availablePhones.length > 0 ? (
          <Autocomplete
            freeSolo
            options={availablePhones}
            value={customerMobile || null}
            isOptionEqualToValue={(option, value) => option === value}
            onChange={(_, newValue) => {
              const phoneValue = typeof newValue === 'string' ? newValue : '';
              onCustomerMobileChange(phoneValue);
              // Create Customer object when both name and phone are selected
              if (customerName && phoneValue) {
                const customer: Customer = {
                  id: 0, // We'll need to get this from API later
                  name: customerName,
                  mobile: phoneValue,
                  city: customerCity || '',
                };
                onCustomerSelect(customer);
              } else {
                onCustomerSelect(null);
              }
            }}
            onInputChange={(_, newInputValue) => {
              onCustomerMobileChange(newInputValue);
              if (selectedCustomer && newInputValue !== selectedCustomer.mobile) {
                onCustomerSelect(null);
              }
            }}
            disableClearable={!customerMobile}
            forcePopupIcon
            popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
            sx={{ width: '165px' }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={SALES_RECEIPT_LABELS.MOBILE_NUMBER_LABEL}
                variant="outlined"
                placeholder={SALES_RECEIPT_LABELS.MOBILE_NUMBER_PLACEHOLDER}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '48px',
                    borderRadius: '8px',
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
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: '16px',
                    color: '#1A212B',
                    '&::placeholder': {
                      color: '#728197',
                      fontSize: '16px',
                      fontFamily: "'Lexend', sans-serif",
                      opacity: 1,
                    },
                  },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  '&.Mui-focused': {
                    color: '#5C17E5',
                  },
                },
                }}
              />
            )}
          />
        ) : (
          <PhoneNoField
            className="phone-no-field"
            label={SALES_RECEIPT_LABELS.MOBILE_NUMBER_LABEL}
            variant="outlined"
            placeholder={SALES_RECEIPT_LABELS.MOBILE_NUMBER_PLACEHOLDER}
            value={customerMobile}
            onChange={(e) => {
              const newMobile = e.target.value;
              onCustomerMobileChange(newMobile);
              // Only clear selected customer if the new value doesn't match the selected customer's mobile
              if (selectedCustomer && newMobile !== selectedCustomer.mobile) {
                onCustomerSelect(null);
              }
            }}
          />
        )}
        <Autocomplete
          options={cityOptions}
          value={customerCity ? customerCity : undefined}
          isOptionEqualToValue={(option, value) => option === (value || '')}
          onChange={(_, newValue) => {
            if (newValue) {
              onCustomerCityChange(newValue);
            } else {
              onCustomerCityChange('');
            }
          }}
          onInputChange={(_, newInputValue) => {
            onCustomerCityChange(newInputValue);
          }}
          // Only show clear button when value is selected
          {...(!customerCity ? { disableClearable: true } : {})}
          forcePopupIcon
          popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280', fontSize: '24px' }} />}
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
                  borderRadius: '8px',
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
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
                  '&::placeholder': {
                    color: '#728197',
                    fontSize: '16px',
                    fontFamily: "'Lexend', sans-serif",
                    opacity: 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: '16px',
                  color: '#1A212B',
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

